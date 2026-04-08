import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ programId: string; milestoneId: string }>;
};

// PATCH /api/program/[programId]/milestone/[milestoneId]
export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";
    const { programId, milestoneId } = await params;

    // Verify program ownership
    const program = await prisma.program.findFirst({
      where: { id: programId, userId },
    });

    if (!program) {
      return NextResponse.json(
        { error: "프로그램을 찾을 수 없어요." },
        { status: 404 }
      );
    }

    // Find milestone and its week
    const milestone = await prisma.programMilestone.findFirst({
      where: { id: milestoneId, week: { programId } },
      include: { week: true },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "마일스톤을 찾을 수 없어요." },
        { status: 404 }
      );
    }

    // Mark milestone complete
    const updated = await prisma.programMilestone.update({
      where: { id: milestoneId },
      data: { completedAt: new Date() },
    });

    // Recalculate week progress
    const allMilestones = await prisma.programMilestone.findMany({
      where: { weekId: milestone.weekId },
    });

    const total = allMilestones.length;
    const completed = allMilestones.filter(
      (m) => m.completedAt || m.id === milestoneId
    ).length;
    const progress = total > 0 ? completed / total : 0;

    const isWeekCompleted = progress >= 1.0;

    await prisma.programWeek.update({
      where: { id: milestone.weekId },
      data: {
        progress,
        status: isWeekCompleted ? "completed" : milestone.week.status,
        completedAt: isWeekCompleted ? new Date() : milestone.week.completedAt,
      },
    });

    // Unlock next week if progress >= 70%
    if (progress >= 0.7) {
      const nextWeek = await prisma.programWeek.findUnique({
        where: {
          programId_weekNumber: {
            programId,
            weekNumber: milestone.week.weekNumber + 1,
          },
        },
      });

      if (nextWeek && nextWeek.status === "locked") {
        await prisma.programWeek.update({
          where: { id: nextWeek.id },
          data: { status: "active", unlockedAt: new Date() },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/program/[id]/milestone/[id] error:", error);
    return NextResponse.json(
      { error: "마일스톤을 완료하는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
