import { prisma } from "@/lib/prisma";

export interface ReportData {
  initialScores: Record<string, number>;
  finalScores: Record<string, number>;
  deltas: Record<string, number>;
  emotionJourney: Array<{
    emotion: string;
    intensity: number;
    date: string;
  }>;
  assignmentStats: {
    total: number;
    completed: number;
    completionRate: number;
  };
  programProgress?: number;
}

/**
 * Compute simple domain scores from survey answers.
 * Groups answers by domain prefix (first part of questionId before "_")
 * and averages the numeric values.
 */
function computeDomainScores(
  answers: Array<{ questionId: string; answer: unknown }>,
): Record<string, number> {
  const domainTotals: Record<string, { sum: number; count: number }> = {};

  for (const { questionId, answer } of answers) {
    const domain = questionId.split("_")[0];
    const parsed = typeof answer === "string" ? JSON.parse(answer) : answer;

    let numericValue: number | null = null;
    if (typeof parsed === "number") {
      numericValue = parsed;
    } else if (parsed && typeof parsed.value === "number") {
      numericValue = parsed.value;
    }

    if (numericValue === null) continue;

    if (!domainTotals[domain]) {
      domainTotals[domain] = { sum: 0, count: 0 };
    }
    domainTotals[domain].sum += numericValue;
    domainTotals[domain].count += 1;
  }

  const scores: Record<string, number> = {};
  for (const [domain, { sum, count }] of Object.entries(domainTotals)) {
    scores[domain] = Math.round((sum / count) * 100) / 100;
  }
  return scores;
}

/**
 * Generate structured report data comparing two survey sessions.
 * Loads surveys, computes domain scores, calculates deltas,
 * and gathers emotion/assignment statistics.
 */
export async function generateReportData(
  userId: string,
  initialSurveyId: string,
  finalSurveyId: string,
  programId?: string,
): Promise<ReportData> {
  // Load both survey sessions with answers
  const [initialSurvey, finalSurvey] = await Promise.all([
    prisma.surveySession.findUniqueOrThrow({
      where: { id: initialSurveyId },
      include: { answers: true },
    }),
    prisma.surveySession.findUniqueOrThrow({
      where: { id: finalSurveyId },
      include: { answers: true },
    }),
  ]);

  // Compute domain scores
  const initialScores = computeDomainScores(
    initialSurvey.answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
    })),
  );
  const finalScores = computeDomainScores(
    finalSurvey.answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
    })),
  );

  // Calculate deltas
  const allDomains = new Set([
    ...Object.keys(initialScores),
    ...Object.keys(finalScores),
  ]);
  const deltas: Record<string, number> = {};
  for (const domain of allDomains) {
    const initial = initialScores[domain] ?? 0;
    const final = finalScores[domain] ?? 0;
    deltas[domain] = Math.round((final - initial) * 100) / 100;
  }

  // Load emotion states between survey dates
  const startDate = initialSurvey.createdAt;
  const endDate = finalSurvey.completedAt ?? finalSurvey.createdAt;

  const emotionStates = await prisma.emotionState.findMany({
    where: {
      session: { userId },
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { createdAt: "asc" },
  });

  const emotionJourney = emotionStates.map((e) => ({
    emotion: e.emotion,
    intensity: e.intensity,
    date: e.createdAt.toISOString().split("T")[0],
  }));

  // Load assignment stats
  const assignments = await prisma.assignment.findMany({
    where: { userId },
  });
  const completedAssignments = assignments.filter(
    (a) => a.completedAt !== null,
  );
  const assignmentStats = {
    total: assignments.length,
    completed: completedAssignments.length,
    completionRate:
      assignments.length > 0
        ? Math.round(
            (completedAssignments.length / assignments.length) * 100,
          ) / 100
        : 0,
  };

  // Load program progress if applicable
  let programProgress: number | undefined;
  if (programId) {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { weeks: true },
    });
    if (program?.weeks) {
      const totalProgress = program.weeks.reduce(
        (sum, w) => sum + w.progress,
        0,
      );
      programProgress =
        program.weeks.length > 0
          ? Math.round((totalProgress / program.weeks.length) * 100) / 100
          : 0;
    }
  }

  return {
    initialScores,
    finalScores,
    deltas,
    emotionJourney,
    assignmentStats,
    programProgress,
  };
}
