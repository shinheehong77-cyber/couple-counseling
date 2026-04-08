import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ programId: string; weekNumber: string }>;
};

// GET /api/program/[programId]/week/[weekNumber]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";
    const { programId, weekNumber } = await params;

    const program = await prisma.program.findFirst({
      where: { id: programId, userId },
    });

    if (!program) {
      return NextResponse.json(
        { error: "프로그램을 찾을 수 없어요." },
        { status: 404 }
      );
    }

    const week = await prisma.programWeek.findUnique({
      where: {
        programId_weekNumber: {
          programId,
          weekNumber: parseInt(weekNumber, 10),
        },
      },
      include: {
        milestones: { orderBy: { ordinal: "asc" } },
      },
    });

    if (!week) {
      return NextResponse.json(
        { error: "해당 주차를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    return NextResponse.json(week);
  } catch (error) {
    console.error("GET /api/program/[id]/week/[n] error:", error);
    return NextResponse.json(
      { error: "주차 정보를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

// PATCH /api/program/[programId]/week/[weekNumber]
export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";
    const { programId, weekNumber } = await params;
    const weekNum = parseInt(weekNumber, 10);

    const program = await prisma.program.findFirst({
      where: { id: programId, userId },
    });

    if (!program) {
      return NextResponse.json(
        { error: "프로그램을 찾을 수 없어요." },
        { status: 404 }
      );
    }

    const week = await prisma.programWeek.findUnique({
      where: {
        programId_weekNumber: { programId, weekNumber: weekNum },
      },
      include: { milestones: true },
    });

    if (!week) {
      return NextResponse.json(
        { error: "해당 주차를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    // Recalculate progress
    const total = week.milestones.length;
    const completed = week.milestones.filter((m) => m.completedAt).length;
    const progress = total > 0 ? completed / total : 0;

    const isCompleted = progress >= 1.0;

    const updatedWeek = await prisma.programWeek.update({
      where: { id: week.id },
      data: {
        progress,
        status: isCompleted ? "completed" : week.status,
        completedAt: isCompleted ? new Date() : week.completedAt,
      },
      include: { milestones: { orderBy: { ordinal: "asc" } } },
    });

    // Unlock next week if progress >= 70%
    if (progress >= 0.7 && weekNum < 4) {
      const nextWeek = await prisma.programWeek.findUnique({
        where: {
          programId_weekNumber: { programId, weekNumber: weekNum + 1 },
        },
      });

      if (nextWeek && nextWeek.status === "locked") {
        await prisma.programWeek.update({
          where: { id: nextWeek.id },
          data: { status: "active", unlockedAt: new Date() },
        });
      }
    }

    return NextResponse.json(updatedWeek);
  } catch (error) {
    console.error("PATCH /api/program/[id]/week/[n] error:", error);
    return NextResponse.json(
      { error: "주차 정보를 수정하는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
