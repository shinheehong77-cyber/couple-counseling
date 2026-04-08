import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { detectCrisis } from "@/lib/crisis-detection";
import { SYSTEM_PROMPT, getConflictTypePrompt, getSoloModePrompt } from "@/lib/counseling-prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatSurveyContextForPrompt } from "@/lib/survey/format-ai-context";
import { buildSessionHistoryContext } from "@/lib/session-history";
import type { AIContextPayload } from "@/lib/survey/types";

const anthropic = new Anthropic();
const ANTHROPIC_MODEL = (process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6").trim();

// GET /api/chat?sessionId=xxx — Load messages for an existing session
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          where: { role: { in: ["user", "assistant"] } },
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      counselorName: session.counselorName,
      status: session.status,
      messages: session.messages,
    });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "메시지를 불러오지 못했어요." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, message } = body;

  if (!sessionId || !message) {
    return NextResponse.json({ error: "sessionId and message required" }, { status: 400 });
  }

  // Rate limiting per session
  const rateLimit = checkRateLimit(sessionId);
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요.", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // Get session with history and user info
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
      user: { select: { userMode: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Crisis detection on user message
  const crisis = detectCrisis(message);
  const crisisMetadata = crisis.level
    ? JSON.stringify({ crisisLevel: crisis.level, matched: crisis.matched })
    : null;

  // Save user message
  await prisma.message.create({
    data: {
      sessionId,
      role: "user",
      content: message,
      metadata: crisisMetadata,
    },
  });

  // Update session crisis tracking
  if (crisis.level === "CRITICAL") {
    await prisma.session.update({
      where: { id: sessionId },
      data: { crisisLevel: "CRITICAL", status: "crisis" },
    });
  } else if (crisis.level === "WARNING") {
    await prisma.session.update({
      where: { id: sessionId },
      data: { crisisLevel: "WARNING" },
    });
  } else if (crisis.level === "WATCH") {
    const newWatchCount = session.watchCount + 1;
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        watchCount: newWatchCount,
        // Auto-escalate: 3+ WATCH in same session → WARNING
        crisisLevel: newWatchCount >= 3 ? "WARNING" : "WATCH",
      },
    });
  }

  // If CRITICAL, return crisis response immediately (no AI call)
  if (crisis.level === "CRITICAL" && crisis.response) {
    await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: crisis.response,
        metadata: JSON.stringify({ crisisIntervention: true }),
      },
    });

    return NextResponse.json({ content: crisis.response, crisis: crisis.level });
  }

  // Build message history for Claude
  const systemParts = [SYSTEM_PROMPT];

  // Inject survey context if available
  if (session.surveyContextJson) {
    try {
      const surveyPayload = JSON.parse(session.surveyContextJson) as AIContextPayload;
      systemParts.push(formatSurveyContextForPrompt(surveyPayload));
    } catch {
      // malformed survey JSON, skip
    }
  }

  // Inject past counseling history for continuity
  if (session.userId) {
    const historyContext = await buildSessionHistoryContext(session.userId, sessionId);
    if (historyContext) {
      systemParts.push(historyContext);
    }
  }

  if (session.conflictType) {
    systemParts.push(getConflictTypePrompt(session.conflictType));
  }

  // Solo mode: adjust counselor framing for self-understanding focus
  if (session.user?.userMode === "solo") {
    systemParts.push(getSoloModePrompt());
  }

  if (crisis.level === "WARNING" && crisis.response) {
    systemParts.push(
      `주의: 사용자가 위험 신호를 보이고 있습니다. 응답에 자연스럽게 전문가 의뢰를 포함하세요.`
    );
  }
  systemParts.push(`상담사 이름: ${session.counselorName}`);

  const messages: Anthropic.MessageParam[] = session.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: message });

  // Stream response from Claude
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const claudeStream = anthropic.messages.stream({
          model: ANTHROPIC_MODEL,
          max_tokens: 1024,
          system: systemParts.join("\n\n"),
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }

        // Parse emotion metadata from response
        const emotionMatch = fullResponse.match(
          /<!-- EMOTION:({.*?}) -->/
        );
        const cleanResponse = fullResponse
          .replace(/<!-- EMOTION:.*? -->/g, "")
          .replace(/<!-- ASSIGNMENT:.*? -->/g, "")
          .replace(/<!-- SUGGESTIONS:.*? -->/g, "")
          .replace(/<!-- STAGE:\d+ -->/g, "")
          .replace(/<!-- SESSION_COMPLETE:.*? -->/g, "")
          .trim();

        if (emotionMatch) {
          try {
            const emotionData = JSON.parse(emotionMatch[1]);
            await prisma.emotionState.create({
              data: {
                sessionId,
                emotion: emotionData.emotion,
                intensity: emotionData.intensity,
                source: emotionData.source,
              },
            });
          } catch {
            // emotion parse failed, continue
          }
        }

        // Extract and save ALL assignment metadata
        const assignmentMatches = [...fullResponse.matchAll(/<!-- ASSIGNMENT:({.*?}) -->/g)];
        for (const match of assignmentMatches) {
          try {
            const assignmentData = JSON.parse(match[1]);
            await prisma.assignment.create({
              data: {
                sessionId: sessionId,
                userId: session.userId,
                title: assignmentData.title || "상담 과제",
                description: assignmentData.description || null,
                type: assignmentData.type || null,
                dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate) : null,
              },
            });
          } catch {
            // Assignment parse failed, continue
          }
        }

        // Save assistant message
        await prisma.message.create({
          data: {
            sessionId,
            role: "assistant",
            content: cleanResponse,
            metadata: emotionMatch ? emotionMatch[1] : null,
          },
        });

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
