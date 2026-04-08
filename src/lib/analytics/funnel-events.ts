import { prisma } from "@/lib/prisma";

export const FUNNEL_EVENTS = {
  ONBOARDING_COMPLETED: "onboarding_completed",
  MODE_SELECTED: "mode_selected",
  SURVEY_STARTED: "survey_started",
  SECTION_COMPLETED: "section_completed",
  SURVEY_RESUMED: "survey_resumed",
  SURVEY_DROPPED: "survey_dropped",
  ASSIGNMENT_CREATED: "assignment_created",
  ASSIGNMENT_COMPLETED: "assignment_completed",
  PROGRAM_STARTED: "program_started",
  PROGRAM_WEEK_COMPLETED: "program_week_completed",
  PROGRAM_COMPLETED: "program_completed",
  REPORT_GENERATED: "report_generated",
  COUPLE_PAIRED: "couple_paired",
} as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];

interface LogFunnelEventInput {
  eventName: FunnelEventName;
  stage?: string;
  userId?: string;
  surveySessionId?: string;
  sessionId?: string;
  payload?: unknown;
}

export async function logFunnelEvent(input: LogFunnelEventInput): Promise<void> {
  await prisma.funnelEvent.create({
    data: {
      eventName: input.eventName,
      stage: input.stage,
      userId: input.userId,
      surveySessionId: input.surveySessionId,
      sessionId: input.sessionId,
      payloadJson: input.payload ? JSON.stringify(input.payload) : null,
    },
  });
}
