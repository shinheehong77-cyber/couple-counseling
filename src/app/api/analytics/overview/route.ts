import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/analytics/overview
export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";

    // Total sessions
    const totalSessions = await prisma.session.count({ where: { userId } });

    // Total messages (across user's sessions)
    const totalMessages = await prisma.message.count({
      where: { session: { userId } },
    });

    // Assignment stats
    const totalAssignments = await prisma.assignment.count({
      where: { userId },
    });
    const completedAssignments = await prisma.assignment.count({
      where: { userId, completedAt: { not: null } },
    });
    const assignmentCompletionRate =
      totalAssignments > 0 ? completedAssignments / totalAssignments : 0;

    // Sessions by month (last 6 months) — use string date grouping for SQLite
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentSessions = await prisma.session.findMany({
      where: { userId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const sessionsByMonth: Record<string, number> = {};
    for (const s of recentSessions) {
      const key = s.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      sessionsByMonth[key] = (sessionsByMonth[key] ?? 0) + 1;
    }

    return NextResponse.json({
      totalSessions,
      totalMessages,
      totalAssignments,
      completedAssignments,
      assignmentCompletionRate,
      sessionsByMonth,
    });
  } catch (error) {
    console.error("GET /api/analytics/overview error:", error);
    return NextResponse.json(
      { error: "통계를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
