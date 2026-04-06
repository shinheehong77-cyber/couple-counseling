import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/survey — 설문 세션 생성
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const survey = await prisma.surveySession.create({
    data: {
      userId: user.id,
      coupleId: user.coupleId ?? undefined,
    },
  });

  return NextResponse.json(survey, { status: 201 });
}

// GET /api/survey — 내 설문 목록
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const surveys = await prisma.surveySession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { answers: true },
  });

  return NextResponse.json(surveys);
}
