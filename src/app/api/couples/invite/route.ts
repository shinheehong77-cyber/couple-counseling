import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // remove ambiguous chars
  let code = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) {
    code += chars[b % chars.length];
  }
  return code;
}

// POST /api/couples/invite — 초대코드 생성 (커플 생성)
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  if (user.coupleId) {
    // Return existing invite code
    const couple = await prisma.couple.findUnique({ where: { id: user.coupleId } });
    return NextResponse.json({ inviteCode: couple?.inviteCode, coupleId: user.coupleId });
  }

  // Create new couple with unique invite code
  let inviteCode: string;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const exists = await prisma.couple.findUnique({ where: { inviteCode } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const couple = await prisma.couple.create({
    data: {
      inviteCode,
      members: { connect: { id: user.id } },
    },
  });

  // Link user to couple
  await prisma.user.update({
    where: { id: user.id },
    data: { coupleId: couple.id },
  });

  return NextResponse.json({ inviteCode: couple.inviteCode, coupleId: couple.id }, { status: 201 });
}
