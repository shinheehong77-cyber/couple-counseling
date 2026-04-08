import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildSurveyProgress, parseSurveyVersion } from "@/lib/survey/progress";
import { FUNNEL_EVENTS, logFunnelEvent } from "@/lib/analytics/funnel-events";

// POST /api/survey — 설문 세션 생성
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const version = parseSurveyVersion((body as { version?: string }).version);
  const initialProgress = buildSurveyProgress({
    version,
    answeredQuestionIds: [],
  });

  const survey = await prisma.surveySession.create({
    data: {
      userId: user.id,
      coupleId: user.coupleId ?? undefined,
      version,
      sectionProgressJson: JSON.stringify(initialProgress.sections),
      lastActivityAt: new Date(),
      resumeQuestionId: initialProgress.resumeQuestionId,
    },
    include: { answers: true },
  });

  await logFunnelEvent({
    eventName: FUNNEL_EVENTS.SURVEY_STARTED,
    stage: "survey",
    userId: user.id,
    surveySessionId: survey.id,
    payload: {
      version,
      totalQuestions: initialProgress.totalQuestions,
      sections: initialProgress.sections.map((section) => ({
        key: section.key,
        totalQuestions: section.totalQuestions,
      })),
    },
  });

  return NextResponse.json(
    {
      ...survey,
      progress: initialProgress,
    },
    { status: 201 }
  );
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

  return NextResponse.json(
    surveys.map((survey) => {
      const version = parseSurveyVersion(survey.version);
      const progress = buildSurveyProgress({
        version,
        answeredQuestionIds: survey.answers.map((answer) => answer.questionId),
      });
      return {
        ...survey,
        progress,
      };
    })
  );
}
