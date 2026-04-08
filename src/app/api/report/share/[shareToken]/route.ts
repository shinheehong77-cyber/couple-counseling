import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ shareToken: string }> };

// GET /api/report/share/[shareToken] — public, no auth required
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { shareToken } = await params;

    const report = await prisma.assessmentReport.findUnique({
      where: { shareToken },
    });

    if (!report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/report/share/[token] error:", error);
    return NextResponse.json(
      { error: "리포트를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
