import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { GeneratePartnerGuideRequest, GeneratePartnerGuideResponse } from "@/types/partner-guide";
import type { SessionInsight } from "@/types/session";

// POST /api/partner-guide/generate — Generate partner guide from session insight
// Called internally after session completion (PATCH /api/sessions)
export async function POST(req: NextRequest) {
  // TODO: implement
  // 1. getCurrentUser() — 401 if not authenticated
  // 2. Parse body as GeneratePartnerGuideRequest { sessionId }
  // 3. Load session with insightJson — 404 if not found or no insight
  // 4. Check user.coupleId — 400 if no couple (guide only for coupled users)
  // 5. Parse insightJson as SessionInsight
  // 6. Call Anthropic API with partner guide generation prompt:
  //    - Input: SessionInsight
  //    - Output: PartnerGuideData (structured) + guideText (narrative)
  //    - Privacy filters: no direct quotes, no complaints, no scores, no sensitive info
  // 7. Calculate version: count existing guides for same userId+coupleId + 1
  // 8. prisma.partnerGuide.create({ sessionId, userId, coupleId, version, guideJson, guideText })
  // 9. Return GeneratePartnerGuideResponse
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
