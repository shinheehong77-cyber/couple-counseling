/**
 * Shared types barrel export.
 * All cross-layer types are defined here for contract-first development.
 */

export type { UserMode, AuthUserResponse, OnboardingRequest, OnboardingResponse } from "./user";
export type {
  SessionInsight,
  SuggestionMeta,
  SessionCompleteMeta,
  StageMeta,
  AssignmentMeta,
  EmotionMeta,
} from "./session";
export type {
  PartnerGuideData,
  PartnerGuideDataInternal,
  PartnerGuideResponse,
  PartnerGuideEmptyResponse,
  GeneratePartnerGuideRequest,
  GeneratePartnerGuideResponse,
} from "./partner-guide";
export type { AssignmentResponse, SharedAssignmentView } from "./assignment";
