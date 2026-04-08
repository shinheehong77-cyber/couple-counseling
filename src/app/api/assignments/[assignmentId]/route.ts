import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ assignmentId: string }> };

// GET /api/assignments/[assignmentId]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";
    const { assignmentId } = await params;

    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, userId },
      include: {
        session: {
          select: { id: true, counselorName: true, counselingMode: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "과제를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("GET /api/assignments/[id] error:", error);
    return NextResponse.json(
      { error: "과제를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

// PATCH /api/assignments/[assignmentId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? "demo-user";
    const { assignmentId } = await params;

    const existing = await prisma.assignment.findFirst({
      where: { id: assignmentId, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "과제를 찾을 수 없어요." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { completedAt, response, title, description, dueDate } = body as {
      completedAt?: string;
      response?: string;
      title?: string;
      description?: string;
      dueDate?: string;
    };

    const data: Record<string, unknown> = {};
    if (completedAt !== undefined)
      data.completedAt = completedAt ? new Date(completedAt) : null;
    if (response !== undefined) data.response = response;
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (dueDate !== undefined)
      data.dueDate = dueDate ? new Date(dueDate) : null;

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/assignments/[id] error:", error);
    return NextResponse.json(
      { error: "과제를 수정하는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
