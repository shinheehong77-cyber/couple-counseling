/**
 * User mode and onboarding types.
 * Used across auth APIs, onboarding flow, and dashboard rendering.
 */

/** User's chosen service mode — controls UI framing, not feature access */
export type UserMode = "solo" | "couple";

/** Auth session response shape (GET /api/auth/session) */
export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  coupleId: string | null;
  userMode: UserMode;
  onboardedAt: string | null;
}

/** POST /api/onboarding request body */
export interface OnboardingRequest {
  userMode: UserMode;
}

/** POST /api/onboarding response */
export interface OnboardingResponse {
  userMode: UserMode;
  onboardedAt: string;
}
