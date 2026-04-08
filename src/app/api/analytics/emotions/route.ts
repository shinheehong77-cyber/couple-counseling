import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/analytics/emotions
export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";

    // All emotion states for user's sessions
    const emotionStates = await prisma.emotionState.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        emotion: true,
        intensity: true,
        source: true,
        context: true,
        createdAt: true,
      },
    });

    // Emotion frequency counts
    const frequencyMap: Record<string, number> = {};
    for (const es of emotionStates) {
      frequencyMap[es.emotion] = (frequencyMap[es.emotion] ?? 0) + 1;
    }

    const emotionFrequency = Object.entries(frequencyMap).map(
      ([emotion, count]) => ({ emotion, count })
    );

    // Recent emotion states (last 50)
    const recentEmotions = emotionStates.slice(0, 50);

    return NextResponse.json({
      emotionFrequency,
      recentEmotions,
    });
  } catch (error) {
    console.error("GET /api/analytics/emotions error:", error);
    return NextResponse.json(
      { error: "감정 데이터를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
