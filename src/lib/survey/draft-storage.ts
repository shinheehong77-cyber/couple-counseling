import type { QuestionResponse, SurveyVersion } from "./types";

const SURVEY_DRAFT_KEY_PREFIX = "survey_draft_v1";

export interface PersistedSurveyResponse {
  questionId: string;
  response: QuestionResponse;
  answeredAt: string;
}

export interface PersistedSurveyDraft {
  version: SurveyVersion;
  currentIndex: number;
  responses: PersistedSurveyResponse[];
  updatedAt: string;
}

function getDraftKey(version: SurveyVersion): string {
  return `${SURVEY_DRAFT_KEY_PREFIX}_${version}`;
}

export function hasSurveyDraft(version: SurveyVersion): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(getDraftKey(version));
}

export function readSurveyDraft(version: SurveyVersion): PersistedSurveyDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(getDraftKey(version));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedSurveyDraft;
    if (!parsed || !Array.isArray(parsed.responses)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSurveyDraft(version: SurveyVersion, draft: PersistedSurveyDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getDraftKey(version), JSON.stringify(draft));
}

export function clearSurveyDraft(version: SurveyVersion): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getDraftKey(version));
}
