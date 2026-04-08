import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ reportId: string }> };

// GET /api/report/[reportId]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 }
      );
    }

    const { reportId } = await params;

    const report = await prisma.assessmentReport.findFirst({
      where: { id: reportId, userId: user.id },
    });

    if (!report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/report/[id] error:", error);
    return NextResponse.json(
      { error: "리포트를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
