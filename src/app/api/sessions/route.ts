import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AIContextPayload } from "@/lib/survey/types";
import { FUNNEL_EVENTS, logFunnelEvent } from "@/lib/analytics/funnel-events";
import {
  ASSIGNMENT_POOL,
  type ConflictLevel,
} from "@/lib/assignment-pool";

type CounselingMode = "chat" | "voice";

function parseCounselingMode(rawMode: string | undefined): CounselingMode {
  return rawMode === "voice" ? "voice" : "chat";
}

// POST /api/sessions — create a new counseling session
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, aiContextJson, counselingMode, surveySessionId } = body as {
    userId: string;
    aiContextJson?: AIContextPayload;
    counselingMode?: string;
    surveySessionId?: string;
  };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { counselorProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const counselorName = user.counselorProfile?.displayName ?? "김지수 상담사";
  const mode = parseCounselingMode(counselingMode);

  const session = await prisma.session.create({
    data: {
      userId,
      counselorName,
      counselingMode: mode,
      startedFromSurveyId: surveySessionId,
      surveyContextJson: aiContextJson ? JSON.stringify(aiContextJson) : null,
    },
  });

  await logFunnelEvent({
    eventName: FUNNEL_EVENTS.MODE_SELECTED,
    stage: "session",
    userId,
    surveySessionId,
    sessionId: session.id,
    payload: {
      mode,
      sessionId: session.id,
      linkedSurveySessionId: surveySessionId ?? null,
    },
  });

  return NextResponse.json(session);
}

// GET /api/sessions?userId=xxx — list sessions for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(sessions);
}

// ── Conflict type → assignment pool category mapping ──
const CONFLICT_CATEGORY_MAP: Record<string, string[]> = {
  communication: ["communication"],
  finance: ["conflict_management", "communication"],
  parenting: ["conflict_management", "communication"],
  infidelity: ["trust_repair", "emotional_connection"],
  inlaw: ["conflict_management", "communication"],
  intimacy: ["emotional_connection", "relationship_building"],
};

/**
 * Pick N assignments from the pool, preferring categories relevant to the
 * session's conflict type. Falls back to "moderate" difficulty communication
 * assignments when no conflict type is set.
 */
function pickDefaultAssignments(
  conflictType: string | null,
  count: number,
): typeof ASSIGNMENT_POOL {
  const level: ConflictLevel = "moderate";
  const preferredCategories = conflictType
    ? CONFLICT_CATEGORY_MAP[conflictType] ?? ["communication"]
    : ["communication"];

  // Filter pool by conflict level
  const levelFiltered = ASSIGNMENT_POOL.filter((a) =>
    a.conflictLevel.includes(level),
  );

  // Prefer assignments matching the conflict category
  const preferred = levelFiltered.filter((a) =>
    preferredCategories.includes(a.category),
  );

  // Mix: pick from preferred first, fill remainder from general pool
  const shuffled = [...preferred].sort(() => Math.random() - 0.5);
  const fallback = levelFiltered
    .filter((a) => !preferredCategories.includes(a.category))
    .sort(() => Math.random() - 0.5);

  const picked = [...shuffled.slice(0, count)];
  if (picked.length < count) {
    picked.push(...fallback.slice(0, count - picked.length));
  }

  // Ensure a mix of daily + weekly when possible
  const hasDaily = picked.some((a) => a.isDaily);
  const hasWeekly = picked.some((a) => !a.isDaily);
  if (picked.length >= 2 && hasDaily && !hasWeekly) {
    const weeklyCandidate = [...shuffled, ...fallback].find(
      (a) => !a.isDaily && !picked.includes(a),
    );
    if (weeklyCandidate) picked[picked.length - 1] = weeklyCandidate;
  }

  return picked.slice(0, count);
}

// PATCH /api/sessions — end (complete) a session and auto-generate assignments
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { sessionId, status } = body as {
    sessionId: string;
    status?: string;
  };

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { assignments: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const newStatus = status === "completed" ? "completed" : status ?? "completed";

  // Update session status
  const updatedSession = await prisma.session.update({
    where: { id: sessionId },
    data: { status: newStatus },
  });

  // Auto-generate assignments if session is completed and has none
  let createdAssignments: { id: string; title: string }[] = [];
  if (newStatus === "completed" && session.assignments.length === 0) {
    const picks = pickDefaultAssignments(session.conflictType, 3);

    const now = new Date();
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week

    createdAssignments = await Promise.all(
      picks.map((tpl) =>
        prisma.assignment.create({
          data: {
            sessionId,
            userId: session.userId,
            title: tpl.title,
            description: tpl.description,
            type: tpl.type,
            dueDate,
          },
          select: { id: true, title: true },
        }),
      ),
    );
  }

  return NextResponse.json({
    ...updatedSession,
    assignmentsCreated: createdAssignments,
  });
}
