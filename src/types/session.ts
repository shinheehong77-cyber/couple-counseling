/**
 * Counseling session types.
 * SessionInsight is extracted at session end and used to generate PartnerGuide.
 */

/** Structured insight extracted from a completed counseling session */
export interface SessionInsight {
  userId: string;
  communicationStyle: string;   // e.g. "감정 정리 후 대화형", "즉각 표현형"
  emotionalNeeds: string[];     // e.g. ["인정받고 싶음", "안전한 공간 필요"]
  triggerPatterns: string[];    // e.g. ["무시당한다고 느낄 때", "결정에서 배제될 때"]
  strengthAreas: string[];      // e.g. ["감사 표현", "경청"]
  conflictStyle: string;        // "회피형" | "대립형" | "타협형"
  keyConflicts: string[];       // e.g. ["소통", "가사분담"]
  readyForCoupleSession: boolean;
}

/** Metadata tags extracted from AI counselor responses */
export interface SuggestionMeta {
  suggestions: string[];  // 2-3 user response suggestions
}

export interface SessionCompleteMeta {
  complete: boolean;
}

export interface StageMeta {
  stage: number; // 1-4
}

export interface AssignmentMeta {
  title: string;
  description?: string;
  type?: string;
}

export interface EmotionMeta {
  emotion: string;
  intensity: number;
  source?: string;
}
