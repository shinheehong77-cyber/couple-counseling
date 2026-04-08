import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/analytics/survey-scores
export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";

    // Completed survey sessions with their answers
    const surveySessions = await prisma.surveySession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "asc" },
      select: {
        id: true,
        version: true,
        completedAt: true,
        answers: {
          select: {
            id: true,
            questionId: true,
            answer: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const result = surveySessions.map((ss) => ({
      surveySessionId: ss.id,
      version: ss.version,
      completedAt: ss.completedAt,
      answers: ss.answers,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/analytics/survey-scores error:", error);
    return NextResponse.json(
      { error: "설문 점수를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
