import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/assignments?status=pending|completed
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    const userId = user.id;

    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = { userId };

    if (status === "completed") {
      where.completedAt = { not: null };
    } else if (status === "pending") {
      where.completedAt = null;
    }

    const orderBy =
      status === "completed"
        ? { completedAt: "desc" as const }
        : { dueDate: "asc" as const };

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy,
      include: {
        session: {
          select: { id: true, counselorName: true, counselingMode: true },
        },
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("GET /api/assignments error:", error);
    return NextResponse.json(
      { error: "과제 목록을 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

// POST /api/assignments
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const { sessionId, title, description, type, dueDate } = body as {
      sessionId: string;
      title: string;
      description?: string;
      type?: string;
      dueDate?: string;
    };

    if (!sessionId || !title) {
      return NextResponse.json(
        { error: "sessionId와 title은 필수예요." },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        sessionId,
        userId,
        title,
        description: description ?? null,
        type: type ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST /api/assignments error:", error);
    return NextResponse.json(
      { error: "과제를 생성하는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
