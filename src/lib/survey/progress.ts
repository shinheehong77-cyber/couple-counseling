import { briefSurveyFull } from "@/lib/survey/data/brief";
import { comprehensiveSurveyFull } from "@/lib/survey/data/comprehensive";
import {
  CATEGORY_LABELS,
  DOMAIN_CATEGORY,
  DOMAIN_LABELS,
  type SurveyCategory,
  type SurveyQuestion,
  type SurveyVersion,
} from "@/lib/survey/types";

export interface SurveySectionSummary {
  key: SurveyCategory;
  label: string;
  totalQuestions: number;
  answeredQuestions: number;
  completed: boolean;
  domains: string[];
}

export interface SurveyProgressSummary {
  version: SurveyVersion;
  totalQuestions: number;
  answeredQuestions: number;
  progressPercent: number;
  currentQuestionIndex: number;
  currentQuestionId: string | null;
  resumeQuestionId: string | null;
  sections: SurveySectionSummary[];
}

interface BuildSurveyProgressInput {
  version: SurveyVersion;
  answeredQuestionIds: string[];
}

function getSurveyQuestions(version: SurveyVersion): SurveyQuestion[] {
  return version === "comprehensive" ? comprehensiveSurveyFull : briefSurveyFull;
}

export function buildSurveyProgress(
  input: BuildSurveyProgressInput
): SurveyProgressSummary {
  const questions = getSurveyQuestions(input.version);
  const answeredSet = new Set(input.answeredQuestionIds);

  const sectionsMap = new Map<SurveyCategory, SurveySectionSummary>();
  const sectionDomainSet = new Map<SurveyCategory, Set<string>>();

  for (const question of questions) {
    const key = DOMAIN_CATEGORY[question.domain];
    if (!sectionsMap.has(key)) {
      sectionsMap.set(key, {
        key,
        label: CATEGORY_LABELS[key],
        totalQuestions: 0,
        answeredQuestions: 0,
        completed: false,
        domains: [],
      });
      sectionDomainSet.set(key, new Set());
    }

    const section = sectionsMap.get(key)!;
    const domains = sectionDomainSet.get(key)!;

    section.totalQuestions += 1;
    if (answeredSet.has(question.id)) {
      section.answeredQuestions += 1;
    }

    domains.add(DOMAIN_LABELS[question.domain]);
  }

  const sections = Array.from(sectionsMap.values()).map((section) => {
    const domains = sectionDomainSet.get(section.key);
    const completed = section.totalQuestions > 0 && section.answeredQuestions >= section.totalQuestions;

    return {
      ...section,
      completed,
      domains: domains ? Array.from(domains) : [],
    };
  });

  const answeredQuestions = questions.filter((q) => answeredSet.has(q.id)).length;
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions === 0
    ? 0
    : Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100));

  const currentQuestionIndex = questions.findIndex((q) => !answeredSet.has(q.id));
  const hasPendingQuestion = currentQuestionIndex !== -1;
  const normalizedCurrentIndex = hasPendingQuestion ? currentQuestionIndex : totalQuestions;
  const resumeQuestionId = hasPendingQuestion ? questions[currentQuestionIndex]?.id ?? null : null;

  return {
    version: input.version,
    totalQuestions,
    answeredQuestions,
    progressPercent,
    currentQuestionIndex: normalizedCurrentIndex,
    currentQuestionId: hasPendingQuestion ? questions[currentQuestionIndex].id : null,
    resumeQuestionId,
    sections,
  };
}

export function parseSurveyVersion(rawVersion: string | null | undefined): SurveyVersion {
  return rawVersion === "comprehensive" ? "comprehensive" : "brief";
}
