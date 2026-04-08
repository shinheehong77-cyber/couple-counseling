import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

// POST /api/report/generate
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { initialSurveyId, finalSurveyId, programId } = body as {
      initialSurveyId: string;
      finalSurveyId: string;
      programId?: string;
    };

    if (!initialSurveyId || !finalSurveyId) {
      return NextResponse.json(
        { error: "초기 설문과 최종 설문 ID가 필요해요." },
        { status: 400 }
      );
    }

    // Load both survey sessions with answers
    const [initialSurvey, finalSurvey] = await Promise.all([
      prisma.surveySession.findUnique({
        where: { id: initialSurveyId },
        include: { answers: true },
      }),
      prisma.surveySession.findUnique({
        where: { id: finalSurveyId },
        include: { answers: true },
      }),
    ]);

    if (!initialSurvey || !finalSurvey) {
      return NextResponse.json(
        { error: "설문 데이터를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    // Build report JSON with score comparisons
    const initialAnswers: Record<string, unknown> = {};
    for (const a of initialSurvey.answers) {
      initialAnswers[a.questionId] = JSON.parse(a.answer);
    }

    const finalAnswers: Record<string, unknown> = {};
    for (const a of finalSurvey.answers) {
      finalAnswers[a.questionId] = JSON.parse(a.answer);
    }

    const reportJson = JSON.stringify({
      initialSurveyId,
      finalSurveyId,
      initialVersion: initialSurvey.version,
      finalVersion: finalSurvey.version,
      initialCompletedAt: initialSurvey.completedAt,
      finalCompletedAt: finalSurvey.completedAt,
      initialAnswers,
      finalAnswers,
    });

    // Generate AI insights
    let aiInsights: string | null = null;
    try {
      const anthropic = new Anthropic();
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system:
          "당신은 커플 관계 전문 상담사입니다. 두 설문 결과를 비교 분석하여 관계 개선에 대한 인사이트를 한국어로 작성해주세요. 따뜻하고 격려하는 톤으로, 구체적인 변화 포인트와 앞으로의 제안을 포함해주세요. 존댓말(-요 형태)을 사용해주세요.",
        messages: [
          {
            role: "user",
            content: `초기 설문 답변: ${JSON.stringify(initialAnswers)}\n\n최종 설문 답변: ${JSON.stringify(finalAnswers)}\n\n위 두 설문 결과를 비교하여 관계 변화에 대한 분석과 앞으로의 제안을 작성해주세요.`,
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (textBlock && textBlock.type === "text") {
        aiInsights = textBlock.text;
      }
    } catch (aiError) {
      console.error("AI insights generation failed:", aiError);
      // Continue without AI insights — not a fatal error
    }

    const shareToken = crypto.randomUUID();

    const report = await prisma.assessmentReport.create({
      data: {
        userId: user.id,
        programId: programId ?? null,
        initialSurveyId,
        finalSurveyId,
        reportJson,
        aiInsights,
        shareToken,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("POST /api/report/generate error:", error);
    return NextResponse.json(
      { error: "리포트를 생성하는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
