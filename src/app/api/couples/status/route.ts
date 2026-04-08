import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/couples/status
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
      return NextResponse.json({
        coupled: false,
        coupleId: null,
        partnerName: null,
        inviteCode: null,
      });
    }

    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      include: { members: { select: { id: true, name: true } } },
    });

    if (!couple) {
      return NextResponse.json({
        coupled: false,
        coupleId: null,
        partnerName: null,
        inviteCode: null,
      });
    }

    const partner = couple.members.find((m) => m.id !== user.id);

    return NextResponse.json({
      coupled: true,
      coupleId: couple.id,
      partnerName: partner?.name ?? null,
      inviteCode: couple.inviteCode,
    });
  } catch (error) {
    console.error("GET /api/couples/status error:", error);
    return NextResponse.json(
      { error: "커플 상태를 불러오는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
