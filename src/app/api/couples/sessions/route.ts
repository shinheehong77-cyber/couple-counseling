import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/couples/sessions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 }
      );
    }

    if (!user.coupleId) {
      return NextResponse.json(
        { error: "커플 연결이 필요해요." },
        { status: 400 }
      );
    }

    const sessions = await prisma.session.findMany({
      where: { coupleId: user.coupleId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: { take: 1, orderBy: { createdAt: "desc" } },
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/couples/sessions error:", error);
    return NextResponse.json(
      { error: "커플 세션 목록을 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

// POST /api/couples/sessions
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 }
      );
    }

    if (!user.coupleId) {
      return NextResponse.json(
        { error: "커플 연결이 필요해요." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { counselingMode } = body as { counselingMode?: string };

    const mode = counselingMode === "voice" ? "voice" : "chat";

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { counselorProfile: true },
    });

    const counselorName =
      dbUser?.counselorProfile?.displayName ?? "김지수 상담사";

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        coupleId: user.coupleId,
        counselingMode: mode,
        counselorName,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST /api/couples/sessions error:", error);
    return NextResponse.json(
      { error: "커플 세션을 생성하는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
