import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics/funnel-events";
import type { OnboardingRequest, OnboardingResponse } from "@/types/user";

// POST /api/onboarding — Set userMode and mark onboarding complete
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요해요.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: OnboardingRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요.", code: "INVALID_BODY" }, { status: 400 });
  }

  if (body.userMode !== "solo" && body.userMode !== "couple") {
    return NextResponse.json(
      { error: "userMode는 'solo' 또는 'couple'이어야 해요.", code: "INVALID_USER_MODE" },
      { status: 400 },
    );
  }

  const now = new Date();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { userMode: body.userMode, onboardedAt: now },
  });

  await logFunnelEvent({
    eventName: FUNNEL_EVENTS.ONBOARDING_COMPLETED,
    userId: user.id,
    payload: { userMode: body.userMode },
  });

  const response: OnboardingResponse = {
    userMode: updated.userMode as OnboardingResponse["userMode"],
    onboardedAt: now.toISOString(),
  };

  return NextResponse.json(response);
}
