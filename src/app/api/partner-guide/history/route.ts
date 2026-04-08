import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/partner-guide/history — List all partner guide versions
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요해요.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!user.coupleId) {
    return NextResponse.json([]);
  }

  // Find partner
  const couple = await prisma.couple.findUnique({
    where: { id: user.coupleId },
    include: { members: { select: { id: true } } },
  });

  if (!couple) {
    return NextResponse.json([]);
  }

  const partner = couple.members.find((m) => m.id !== user.id);
  if (!partner) {
    return NextResponse.json([]);
  }

  const guides = await prisma.partnerGuide.findMany({
    where: { userId: partner.id, coupleId: user.coupleId },
    orderBy: { version: "desc" },
    select: { id: true, version: true, createdAt: true },
  });

  return NextResponse.json(
    guides.map((g) => ({
      id: g.id,
      version: g.version,
      createdAt: g.createdAt.toISOString(),
    })),
  );
}
