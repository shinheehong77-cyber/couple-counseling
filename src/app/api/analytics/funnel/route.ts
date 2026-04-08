import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/analytics/funnel
export async function GET() {
  try {
    const events = await prisma.funnelEvent.findMany({
      select: { eventName: true },
    });

    const countMap: Record<string, number> = {};
    for (const e of events) {
      countMap[e.eventName] = (countMap[e.eventName] ?? 0) + 1;
    }

    const result = Object.entries(countMap).map(([eventName, count]) => ({
      eventName,
      count,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/analytics/funnel error:", error);
    return NextResponse.json(
      { error: "퍼널 데이터를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
