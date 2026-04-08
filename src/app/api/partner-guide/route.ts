import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { PartnerGuideResponse, PartnerGuideEmptyResponse, PartnerGuideData } from "@/types/partner-guide";

// GET /api/partner-guide — Get the latest partner guide about my partner
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요해요.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!user.coupleId) {
    const empty: PartnerGuideEmptyResponse = {
      guide: null,
      message: "파트너와 연결되지 않았어요. 먼저 초대 코드를 공유해보세요.",
    };
    return NextResponse.json(empty);
  }

  // Find partner in the same couple
  const couple = await prisma.couple.findUnique({
    where: { id: user.coupleId },
    include: { members: { select: { id: true, name: true } } },
  });

  if (!couple) {
    const empty: PartnerGuideEmptyResponse = {
      guide: null,
      message: "커플 정보를 찾을 수 없어요.",
    };
    return NextResponse.json(empty);
  }

  const partner = couple.members.find((m) => m.id !== user.id);
  if (!partner) {
    const empty: PartnerGuideEmptyResponse = {
      guide: null,
      message: "파트너가 아직 참여하지 않았어요.",
    };
    return NextResponse.json(empty);
  }

  // Get the latest partner guide about the partner
  const latestGuide = await prisma.partnerGuide.findFirst({
    where: { userId: partner.id, coupleId: user.coupleId },
    orderBy: { version: "desc" },
  });

  if (!latestGuide) {
    const empty: PartnerGuideEmptyResponse = {
      guide: null,
      message: "파트너가 아직 상담을 시작하지 않았어요. 상담이 완료되면 가이드가 생성돼요.",
    };
    return NextResponse.json(empty);
  }

  let guideData: PartnerGuideData;
  try {
    guideData = JSON.parse(latestGuide.guideJson) as PartnerGuideData;
  } catch {
    return NextResponse.json(
      { error: "가이드 데이터를 읽을 수 없어요.", code: "PARSE_ERROR" },
      { status: 500 },
    );
  }

  const response: PartnerGuideResponse = {
    id: latestGuide.id,
    version: latestGuide.version,
    guide: guideData,
    guideText: latestGuide.guideText,
    createdAt: latestGuide.createdAt.toISOString(),
    aboutUserName: partner.name,
  };

  return NextResponse.json(response);
}
