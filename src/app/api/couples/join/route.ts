import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/couples/join — 초대코드로 커플 연결
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { inviteCode } = await req.json();
  if (!inviteCode) {
    return NextResponse.json({ error: "inviteCode 필수" }, { status: 400 });
  }

  const couple = await prisma.couple.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: { members: true },
  });

  if (!couple) {
    return NextResponse.json({ error: "유효하지 않은 초대코드" }, { status: 404 });
  }

  if (couple.members.length >= 2) {
    return NextResponse.json({ error: "이미 커플이 연결되어 있습니다" }, { status: 409 });
  }

  if (couple.members.some((m) => m.id === user.id)) {
    return NextResponse.json({ error: "이미 이 커플에 속해 있습니다" }, { status: 409 });
  }

  // Join couple
  await prisma.couple.update({
    where: { id: couple.id },
    data: { members: { connect: { id: user.id } } },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { coupleId: couple.id },
  });

  return NextResponse.json({ coupleId: couple.id, message: "커플 연결 완료" });
}
