import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { detectCrisis } from "@/lib/crisis-detection";
import { SYSTEM_PROMPT, getConflictTypePrompt } from "@/lib/counseling-prompts";
import { checkRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, message } = body;

  if (!sessionId || !message) {
    return new Response(JSON.stringify({ error: "sessionId and message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting per session
  const rateLimit = checkRateLimit(sessionId);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "잠시 후 다시 시도해주세요.", retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Get session with history
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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

    return new Response(JSON.stringify({ content: crisis.response, crisis: crisis.level }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build message history for Claude
  const systemParts = [SYSTEM_PROMPT];
  if (session.conflictType) {
    systemParts.push(getConflictTypePrompt(session.conflictType));
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
          model: "claude-sonnet-4-20250514",
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
        let cleanResponse = fullResponse.replace(/<!-- EMOTION:.*? -->/g, "").trim();

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
