/**
 * 설문 점수 계산 로직
 * - Likert: (value-1)/4 * 100 (reverse 적용)
 * - VisualSlider: value/max * 100
 * - YesNo: yesScore / noScore 그대로 사용
 * - Checklist: 선택 항목의 scoreImpact 합산 (50 기준)
 * - FreeText: 점수 없음 (AI 분석용)
 */

import type {
  SurveyQuestion,
  QuestionResponse,
  SurveyResponse,
  DomainScore,
  SurveyDomain,
  SurveyResult,
  SurveyVersion,
  ScoreLevel,
  AIContextPayload,
  CounselingApproach,
} from './types';

// ─────────────────────────────────────────────
// 영역별 가중치 (총합 = 1.0)
// 이론적 근거: 의사소통·갈등이 관계 예후에 가장 강한 예측력 (Gottman, 1994)
// ─────────────────────────────────────────────

export const DOMAIN_WEIGHTS: Record<SurveyDomain, number> = {
  communication: 0.22,
  conflict: 0.22,
  intimacy: 0.20,
  trust: 0.20,
  values: 0.10,
  satisfaction: 0.06,
};

// ─────────────────────────────────────────────
// 점수 수준별 해석 가이드
// ─────────────────────────────────────────────

export const SCORE_INTERPRETATION: Record<ScoreLevel, {
  label: string;
  description: string;
  counselingFocus: string;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
}> = {
  critical: {
    label: '즉각적 도움이 필요',
    description: '관계가 심각한 위기 상태에 있습니다. 전문적 도움이 시급합니다.',
    counselingFocus: '위기 안정화, 안전 확보, 기본 신뢰 재건',
    urgency: 'immediate',
  },
  low: {
    label: '개선이 필요',
    description: '여러 영역에서 어려움이 있으며, 체계적인 상담이 도움이 됩니다.',
    counselingFocus: '핵심 문제 영역 집중 개입, 기술 훈련',
    urgency: 'high',
  },
  moderate: {
    label: '보통',
    description: '일부 영역에 개선이 필요합니다. 상담을 통해 관계를 강화할 수 있습니다.',
    counselingFocus: '취약 영역 강화, 강점 활용',
    urgency: 'medium',
  },
  good: {
    label: '양호',
    description: '전반적으로 건강한 관계입니다. 특정 영역을 더욱 발전시킬 수 있습니다.',
    counselingFocus: '성장 및 예방적 접근, 심화 연결',
    urgency: 'low',
  },
  excellent: {
    label: '매우 건강함',
    description: '매우 건강하고 탄탄한 관계입니다. 이 강점을 유지하고 심화할 수 있습니다.',
    counselingFocus: '관계 심화, 새로운 공동 목표 설정',
    urgency: 'low',
  },
};

/** 단일 응답의 0~100 원시 점수 계산 */
function rawScore(question: SurveyQuestion, response: QuestionResponse): number | null {
  switch (question.type) {
    case 'Likert': {
      if (response.type !== 'Likert') return null;
      const normalized = ((response.value - 1) / 4) * 100;
      return question.reverse ? 100 - normalized : normalized;
    }
    case 'VisualSlider': {
      if (response.type !== 'VisualSlider') return null;
      const range = question.max - question.min;
      return ((response.value - question.min) / range) * 100;
    }
    case 'YesNo': {
      if (response.type !== 'YesNo') return null;
      return response.value === 'yes' ? question.yesScore : question.noScore;
    }
    case 'Checklist': {
      if (response.type !== 'Checklist') return null;
      // base = 50, 각 선택된 항목의 scoreImpact 합산
      let score = 50;
      for (const val of response.values) {
        const opt = question.options.find((o) => o.value === val);
        if (opt?.scoreImpact !== undefined) score += opt.scoreImpact;
      }
      return Math.max(0, Math.min(100, score));
    }
    case 'FreeText':
      return null; // 점수 없음
  }
}

/** 점수 수준 결정 */
export function scoreToLevel(score: number): ScoreLevel {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'moderate';
  if (score >= 25) return 'low';
  return 'critical';
}

/** 도메인별 점수 계산 */
export function calcDomainScores(
  questions: SurveyQuestion[],
  responses: SurveyResponse[]
): DomainScore[] {
  const responseMap = new Map<string, SurveyResponse>(responses.map((r) => [r.questionId, r]));

  const domainMap = new Map<
    SurveyDomain,
    { weightedSum: number; totalWeight: number; answered: number; total: number }
  >();

  for (const q of questions) {
    const entry = domainMap.get(q.domain) ?? {
      weightedSum: 0,
      totalWeight: 0,
      answered: 0,
      total: 0,
    };
    entry.total++;

    const surveyResponse = responseMap.get(q.id);
    if (surveyResponse) {
      const score = rawScore(q, surveyResponse.response);
      if (score !== null) {
        entry.weightedSum += score * q.weight;
        entry.totalWeight += q.weight;
        entry.answered++;
      }
    }

    domainMap.set(q.domain, entry);
  }

  const results: DomainScore[] = [];
  for (const [domain, { weightedSum, totalWeight, answered, total }] of domainMap) {
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    results.push({
      domain,
      score: Math.round(score),
      level: scoreToLevel(score),
      answeredCount: answered,
      totalCount: total,
    });
  }

  return results;
}

/** 위험 플래그 추출 */
function extractRiskFlags(
  questions: SurveyQuestion[],
  responses: SurveyResponse[]
): Array<{ flag: import('./types').RiskFlag; questionId: string }> {
  const responseMap = new Map<string, SurveyResponse>(responses.map((r) => [r.questionId, r]));
  const flags: Array<{ flag: import('./types').RiskFlag; questionId: string }> = [];

  for (const q of questions) {
    const sr = responseMap.get(q.id);
    if (!sr) continue;

    // 질문 자체에 riskFlag가 있고 특정 조건에서 트리거
    if (q.riskFlag) {
      const score = rawScore(q, sr.response);
      // 점수가 낮을수록 위험 (≤ 30)
      if (score !== null && score <= 30) {
        flags.push({ flag: q.riskFlag, questionId: q.id });
      }
    }

    // Checklist 옵션의 riskFlag
    if (q.type === 'Checklist' && sr.response.type === 'Checklist') {
      for (const val of sr.response.values) {
        const opt = q.options.find((o) => o.value === val);
        if (opt?.riskFlag) {
          flags.push({ flag: opt.riskFlag, questionId: q.id });
        }
      }
    }
  }

  return flags;
}

/** 권장 상담 접근법 결정 */
function determineApproach(domainScores: DomainScore[], hasRiskFlags: boolean): CounselingApproach {
  if (hasRiskFlags) return 'crisis_support';

  const lowest = domainScores.reduce((min, d) => (d.score < min.score ? d : min), domainScores[0]);
  if (!lowest) return 'communication';

  switch (lowest.domain) {
    case 'trust':
      return 'trust_rebuild';
    case 'intimacy':
      return 'eft_attachment';
    case 'conflict':
      return 'gottman_conflict';
    case 'communication':
      return 'communication';
    case 'values':
      return 'values_alignment';
    default:
      return 'communication';
  }
}

/** AI 컨텍스트 페이로드 생성 */
function buildAIContext(
  version: SurveyVersion,
  totalScore: number,
  totalLevel: ScoreLevel,
  domainScores: DomainScore[],
  riskFlags: Array<{ flag: import('./types').RiskFlag; questionId: string }>,
  responses: SurveyResponse[],
  questions: SurveyQuestion[]
): AIContextPayload {
  const strengths = domainScores.filter((d) => d.score >= 70).map((d) => d.domain);
  const concerns = domainScores.filter((d) => d.score < 50).map((d) => d.domain);
  const criticalDomain = domainScores.length
    ? domainScores.reduce((min, d) => (d.score < min.score ? d : min)).domain
    : undefined;

  const freeTextSummaries: Record<string, string> = {};
  for (const r of responses) {
    if (r.response.type === 'FreeText' && r.response.text) {
      freeTextSummaries[r.questionId] = r.response.text;
    }
  }

  const hasRiskFlags = riskFlags.length > 0;
  const riskFlagTypes = [...new Set(riskFlags.map((f) => f.flag))];

  return {
    surveyVersion: version,
    totalScore,
    totalLevel,
    strengths,
    concerns,
    criticalDomain,
    hasRiskFlags,
    riskFlagTypes,
    freeTextSummaries: Object.keys(freeTextSummaries).length ? freeTextSummaries : undefined,
    recommendedApproach: determineApproach(domainScores, hasRiskFlags),
  };
}

/** 전체 설문 결과 계산 (영역 가중치 적용) */
export function calcSurveyResult(
  version: SurveyVersion,
  questions: SurveyQuestion[],
  responses: SurveyResponse[]
): SurveyResult {
  const domainScores = calcDomainScores(questions, responses);

  // 영역 가중치 적용 총점
  let weightedSum = 0;
  let totalWeight = 0;
  for (const ds of domainScores) {
    const w = DOMAIN_WEIGHTS[ds.domain] ?? 1;
    weightedSum += ds.score * w;
    totalWeight += w;
  }
  const totalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const totalLevel = scoreToLevel(totalScore);
  const riskFlags = extractRiskFlags(questions, responses);

  return {
    version,
    totalScore,
    totalLevel,
    domainScores,
    riskFlags,
    completedAt: new Date(),
    aiContextPayload: buildAIContext(
      version,
      totalScore,
      totalLevel,
      domainScores,
      riskFlags,
      responses,
      questions
    ),
  };
}

/** AI 상담 프롬프트에 주입할 컨텍스트 문자열 생성 */
export function buildAIPromptContext(result: SurveyResult): string {
  const { aiContextPayload: ctx } = result;
  const interp = SCORE_INTERPRETATION[ctx.totalLevel];

  const domainLines = result.domainScores
    .map((ds) => {
      const w = (DOMAIN_WEIGHTS[ds.domain] * 100).toFixed(0);
      return `  - ${ds.domain} (가중치 ${w}%): ${ds.score}점 (${ds.level})`;
    })
    .join('\n');

  const riskLine = ctx.hasRiskFlags
    ? `⚠️ 위험 플래그 감지: ${ctx.riskFlagTypes.join(', ')}`
    : '위험 플래그 없음';

  const freeTextLines = ctx.freeTextSummaries
    ? Object.entries(ctx.freeTextSummaries)
        .map(([qId, text]) => `  [${qId}] "${text}"`)
        .join('\n')
    : '  (없음)';

  return `
[사전 설문 결과 — AI 상담 컨텍스트]

설문 버전: ${ctx.surveyVersion === 'brief' ? '간략 (5~10분)' : '포괄적 (30~60분)'}
총점: ${ctx.totalScore}/100 → ${interp.label}
상태 설명: ${interp.description}
상담 집중 방향: ${interp.counselingFocus}

영역별 점수:
${domainLines}

강점 영역: ${ctx.strengths.length > 0 ? ctx.strengths.join(', ') : '없음'}
취약 영역: ${ctx.concerns.length > 0 ? ctx.concerns.join(', ') : '없음'}
${ctx.criticalDomain ? `최우선 개입 영역: ${ctx.criticalDomain}` : ''}

${riskLine}
권장 상담 접근법: ${ctx.recommendedApproach}

내담자 자유 서술 응답:
${freeTextLines}

---
위 정보를 바탕으로 공감적이고 안전한 상담을 진행해 주세요.
상담 시 내담자의 감정을 먼저 반영하고, 판단 없이 수용적인 태도를 유지하세요.
${ctx.hasRiskFlags ? '⚠️ 위험 플래그가 있습니다. 안전 확인 및 위기 개입을 최우선으로 하세요.' : ''}
`.trim();
}
