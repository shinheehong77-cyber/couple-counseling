/**
 * Partner Guide types.
 * Generated from SessionInsight after a counseling session ends.
 * Shows the partner warm, filtered insights about their spouse's communication style.
 */

import type { SessionInsight } from "./session";

/** Structured guide data stored in PartnerGuide.guideJson */
export interface PartnerGuideData {
  aboutUserId: string;
  aboutUserName: string;
  communicationStyle: {
    summary: string;        // 2-3 sentence description of communication style
  };
  recommendations: {
    doList: string[];       // "이렇게 하면 좋아요" items (3 recommended)
    avoidList: string[];    // "이런 건 피해주세요" items (2-3 recommended)
  };
  coreNeed: string;         // Single sentence: "파트너가 가장 원하는 것"
}

/** Internal: includes source insight (never exposed to partner) */
export interface PartnerGuideDataInternal extends PartnerGuideData {
  generatedFromInsight: SessionInsight;
}

/** GET /api/partner-guide response */
export interface PartnerGuideResponse {
  id: string;
  version: number;
  guide: PartnerGuideData;
  guideText: string;        // AI-generated narrative for rendering
  createdAt: string;
  aboutUserName: string;
}

/** GET /api/partner-guide response when no guide exists yet */
export interface PartnerGuideEmptyResponse {
  guide: null;
  message: string;
}

/** POST /api/partner-guide/generate request (internal use) */
export interface GeneratePartnerGuideRequest {
  sessionId: string;
}

/** POST /api/partner-guide/generate response */
export interface GeneratePartnerGuideResponse {
  id: string;
  version: number;
  createdAt: string;
}
