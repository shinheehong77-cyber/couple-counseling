import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AIContextPayload } from "@/lib/survey/types";

// POST /api/sessions — create a new counseling session
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, aiContextJson } = body as {
    userId: string;
    aiContextJson?: AIContextPayload;
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

  const session = await prisma.session.create({
    data: {
      userId,
      counselorName,
      surveyContextJson: aiContextJson ? JSON.stringify(aiContextJson) : null,
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
