import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ surveyId: string }> };

// GET /api/survey/:surveyId — 설문 상세
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { surveyId } = await params;
  const survey = await prisma.surveySession.findUnique({
    where: { id: surveyId },
    include: { answers: true },
  });

  if (!survey || survey.userId !== user.id) {
    return NextResponse.json({ error: "찾을 수 없음" }, { status: 404 });
  }

  return NextResponse.json(survey);
}

// POST /api/survey/:surveyId — 답변 제출 (배열)
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { surveyId } = await params;
  const survey = await prisma.surveySession.findUnique({ where: { id: surveyId } });

  if (!survey || survey.userId !== user.id) {
    return NextResponse.json({ error: "찾을 수 없음" }, { status: 404 });
  }

  const { answers, complete } = await req.json() as {
    answers: { questionId: string; answer: unknown }[];
    complete?: boolean;
  };

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "answers 배열 필수" }, { status: 400 });
  }

  // Upsert answers (delete old answers for same questionIds, re-insert)
  const questionIds = answers.map((a) => a.questionId);
  await prisma.surveyAnswer.deleteMany({
    where: { surveySessionId: surveyId, questionId: { in: questionIds } },
  });

  await prisma.surveyAnswer.createMany({
    data: answers.map((a) => ({
      surveySessionId: surveyId,
      questionId: a.questionId,
      answer: typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer),
    })),
  });

  const updated = await prisma.surveySession.update({
    where: { id: surveyId },
    data: complete ? { completedAt: new Date() } : {},
    include: { answers: true },
  });

  return NextResponse.json(updated);
}
