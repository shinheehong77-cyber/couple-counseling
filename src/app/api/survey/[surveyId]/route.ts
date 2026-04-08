import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildSurveyProgress, parseSurveyVersion } from "@/lib/survey/progress";
import { FUNNEL_EVENTS, logFunnelEvent } from "@/lib/analytics/funnel-events";

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

  const version = parseSurveyVersion(survey.version);
  const progress = buildSurveyProgress({
    version,
    answeredQuestionIds: survey.answers.map((answer) => answer.questionId),
  });

  return NextResponse.json({
    ...survey,
    progress,
  });
}

// POST /api/survey/:surveyId — 답변 제출 (배열)
export async function POST(req: NextRequest, { params }: Params) {
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

  const { answers, complete, currentQuestionId, resumed, dropped } = await req.json() as {
    answers?: { questionId: string; answer: unknown }[];
    complete?: boolean;
    currentQuestionId?: string;
    resumed?: boolean;
    dropped?: boolean;
  };

  if (!Array.isArray(answers) && !resumed && !dropped) {
    return NextResponse.json({ error: "answers 배열 또는 resumed/dropped 이벤트 필요" }, { status: 400 });
  }

  if (Array.isArray(answers) && answers.length > 0) {
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
  }

  const nextAnswers = await prisma.surveyAnswer.findMany({
    where: { surveySessionId: surveyId },
    select: { questionId: true },
  });

  const version = parseSurveyVersion(survey.version);
  const previousProgress = buildSurveyProgress({
    version,
    answeredQuestionIds: survey.answers.map((answer) => answer.questionId),
  });
  const nextProgress = buildSurveyProgress({
    version,
    answeredQuestionIds: nextAnswers.map((answer) => answer.questionId),
  });

  const previousCompletedSections = new Set(
    previousProgress.sections.filter((section) => section.completed).map((section) => section.key)
  );
  const newlyCompletedSections = nextProgress.sections.filter(
    (section) => section.completed && !previousCompletedSections.has(section.key)
  );

  const lastAnsweredQuestionId = Array.isArray(answers) && answers.length > 0
    ? answers[answers.length - 1].questionId
    : survey.lastAnsweredQuestionId;

  const updated = await prisma.surveySession.update({
    where: { id: surveyId },
    data: {
      ...(complete ? { completedAt: new Date() } : {}),
      lastActivityAt: new Date(),
      lastAnsweredQuestionId,
      resumeQuestionId: complete ? null : currentQuestionId ?? nextProgress.resumeQuestionId,
      sectionProgressJson: JSON.stringify(nextProgress.sections),
    },
    include: { answers: true },
  });

  await Promise.all([
    ...newlyCompletedSections.map((section) =>
      logFunnelEvent({
        eventName: FUNNEL_EVENTS.SECTION_COMPLETED,
        stage: section.key,
        userId: user.id,
        surveySessionId: surveyId,
        payload: {
          sectionKey: section.key,
          sectionLabel: section.label,
          answeredQuestions: section.answeredQuestions,
          totalQuestions: section.totalQuestions,
          version,
        },
      })
    ),
    ...(resumed
      ? [
          logFunnelEvent({
            eventName: FUNNEL_EVENTS.SURVEY_RESUMED,
            stage: "survey",
            userId: user.id,
            surveySessionId: surveyId,
            payload: {
              currentQuestionId: currentQuestionId ?? nextProgress.currentQuestionId,
              resumeQuestionId: updated.resumeQuestionId,
              progressPercent: nextProgress.progressPercent,
              version,
            },
          }),
        ]
      : []),
    ...(dropped
      ? [
          logFunnelEvent({
            eventName: FUNNEL_EVENTS.SURVEY_DROPPED,
            stage: "survey",
            userId: user.id,
            surveySessionId: surveyId,
            payload: {
              currentQuestionId: currentQuestionId ?? nextProgress.currentQuestionId,
              progressPercent: nextProgress.progressPercent,
              version,
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    ...updated,
    progress: nextProgress,
  });
}
