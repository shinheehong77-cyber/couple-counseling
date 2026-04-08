/**
 * 임상 기반 심리 평가 도구 (Clinical Assessment Tools)
 *
 * 검증된 심리측정 도구를 기반으로 한 설문:
 *   - PHQ-9 (Patient Health Questionnaire-9): 우울 증상 선별
 *   - GAD-7 (Generalized Anxiety Disorder-7): 불안 증상 선별
 *   - RAS (Relationship Assessment Scale): 관계 만족도
 *
 * 참고: 이 도구들은 진단 목적이 아닌 선별(screening) 목적으로 사용됩니다.
 * 실제 진단은 전문 상담사/정신건강의학과 전문의에게 의뢰해야 합니다.
 */

import type { SurveyQuestion } from '../types';
import { LIKERT_AGREEMENT } from './constants';

const LIKERT_PHQ: [string, string, string, string] = [
  '전혀 없었다',
  '며칠간 있었다',
  '1주일 이상 있었다',
  '거의 매일 있었다',
];

const LIKERT_GAD: [string, string, string, string] = [
  '전혀 없었다',
  '며칠간 있었다',
  '1주일 이상 있었다',
  '거의 매일 있었다',
];

// ═══════════════════════════════════════════
// PHQ-9: 우울 증상 선별 (Patient Health Questionnaire-9)
// Kroenke, Spitzer & Williams (2001)
// 지난 2주간 경험한 증상 빈도 평가
// 점수: 0-4 정상, 5-9 경미, 10-14 중등도, 15-19 중등도-심각, 20-27 심각
// ═══════════════════════════════════════════

export const phq9Survey: SurveyQuestion[] = [
  {
    id: 'PHQ_01',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 일이나 활동을 할 때 흥미나 즐거움을 느끼기 어려웠다.',
    weight: 0.12,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    riskFlag: 'mental_health',
    helpText: 'PHQ-9 문항 1: 무쾌감증(Anhedonia) — 우울증의 핵심 증상입니다.',
  },
  {
    id: 'PHQ_02',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다.',
    weight: 0.12,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    riskFlag: 'mental_health',
    helpText: 'PHQ-9 문항 2: 우울한 기분 — 우울증의 핵심 증상입니다.',
  },
  {
    id: 'PHQ_03',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 잠들기 어렵거나, 자주 깨거나, 너무 많이 잤다.',
    weight: 0.10,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    helpText: 'PHQ-9 문항 3: 수면 장애.',
  },
  {
    id: 'PHQ_04',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 피곤하거나 기력이 없다고 느꼈다.',
    weight: 0.10,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    helpText: 'PHQ-9 문항 4: 피로/에너지 저하.',
  },
  {
    id: 'PHQ_05',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 식욕이 줄었거나, 과식을 했다.',
    weight: 0.10,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    helpText: 'PHQ-9 문항 5: 식욕 변화.',
  },
  {
    id: 'PHQ_06',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 내가 실패자라고 느끼거나, 자신이나 가족을 실망시켰다고 느꼈다.',
    weight: 0.12,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    riskFlag: 'mental_health',
    helpText: 'PHQ-9 문항 6: 부정적 자기 평가.',
  },
  {
    id: 'PHQ_07',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 신문을 읽거나 TV를 볼 때 집중하기 어려웠다.',
    weight: 0.10,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    helpText: 'PHQ-9 문항 7: 집중력 저하.',
  },
  {
    id: 'PHQ_08',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 다른 사람이 알아챌 정도로 느리게 움직이거나, 반대로 안절부절못했다.',
    weight: 0.12,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    helpText: 'PHQ-9 문항 8: 정신운동 변화.',
  },
  {
    id: 'PHQ_09',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 차라리 죽는 게 낫겠다는 생각이 들거나, 자해 충동이 있었다.',
    weight: 0.12,
    reverse: true,
    labels: [...LIKERT_PHQ, '해당 없음'] as [string, string, string, string, string],
    riskFlag: 'mental_health',
    helpText: 'PHQ-9 문항 9: 자살/자해 사고. 이 응답은 안전 평가를 위해 중요합니다.',
  },
];

// ═══════════════════════════════════════════
// GAD-7: 불안 증상 선별 (Generalized Anxiety Disorder-7)
// Spitzer, Kroenke, Williams & Löwe (2006)
// 지난 2주간 경험한 증상 빈도 평가
// 점수: 0-4 정상, 5-9 경미, 10-14 중등도, 15-21 심각
// ═══════════════════════════════════════════

export const gad7Survey: SurveyQuestion[] = [
  {
    id: 'GAD_01',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 초조하거나 불안하거나 조마조마하게 느꼈다.',
    weight: 0.15,
    reverse: true,
    labels: [...LIKERT_GAD, '해당 없음'] as [string, string, string, string, string],
    helpText: 'GAD-7 문항 1: 불안감.',
  },
  {
    id: 'GAD_02',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 걱정을 멈추거나 조절할 수 없었다.',
    weight: 0.15,
    reverse: true,
    labels: [...LIKERT_GAD, '해당 없음'] as [string, string, string, string, string],
    helpText: 'GAD-7 문항 2: 통제 불능 걱정.',
  },
  {
    id: 'GAD_03',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 여러 가지 일들에 대해 지나치게 걱정했다.',
    weight: 0.14,
    reverse: true,
    labels: [...LIKERT_GAD, '해당 없음'] as [string, string, string, string, string],
    helpText: 'GAD-7 문항 3: 과도한 걱정.',
  },
  {
    id: 'GAD_04',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 편하게 쉬기가 어려웠다.',
    weight: 0.14,
    reverse: true,
    labels: [...LIKERT_GAD, '해당 없음'] as [string, string, string, string, string],
    helpText: 'GAD-7 문항 4: 이완 곤란.',
  },
  {
    id: 'GAD_05',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 가만히 있기 힘들 정도로 안절부절못했다.',
    weight: 0.14,
    reverse: true,
    labels: [...LIKERT_GAD, '해당 없음'] as [string, string, string, string, string],
    helpText: 'GAD-7 문항 5: 안절부절못함.',
  },
  {
    id: 'GAD_06',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 쉽게 짜증이 나거나 화가 났다.',
    weight: 0.14,
    reverse: true,
    labels: [...LIKERT_GAD, '해당 없음'] as [string, string, string, string, string],
    helpText: 'GAD-7 문항 6: 과민/짜증.',
  },
  {
    id: 'GAD_07',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '지난 2주간, 무언가 끔찍한 일이 일어날 것 같은 두려움이 있었다.',
    weight: 0.14,
    reverse: true,
    labels: [...LIKERT_GAD, '해당 없음'] as [string, string, string, string, string],
    helpText: 'GAD-7 문항 7: 공포감.',
  },
];

// ═══════════════════════════════════════════
// RAS: 관계 만족도 척도 (Relationship Assessment Scale)
// Hendrick (1988) — 7문항, 5점 리커트 척도
// ═══════════════════════════════════════════

export const rasSurvey: SurveyQuestion[] = [
  {
    id: 'RAS_01',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너가 내 요구(needs)를 잘 충족시켜 준다고 느낀다.',
    weight: 0.15,
    labels: LIKERT_AGREEMENT,
    helpText: 'RAS 문항 1: 욕구 충족.',
  },
  {
    id: 'RAS_02',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '전반적으로 우리 관계에 만족한다.',
    weight: 0.15,
    labels: LIKERT_AGREEMENT,
    helpText: 'RAS 문항 2: 전반적 만족도.',
  },
  {
    id: 'RAS_03',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '다른 사람들의 관계와 비교했을 때, 우리 관계가 좋은 편이라고 느낀다.',
    weight: 0.14,
    labels: LIKERT_AGREEMENT,
    helpText: 'RAS 문항 3: 상대적 만족도.',
  },
  {
    id: 'RAS_04',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너를 만나지 않았으면 하고 바란 적이 있다.',
    weight: 0.14,
    reverse: true,
    labels: LIKERT_AGREEMENT,
    helpText: 'RAS 문항 4: 관계 후회 (역채점).',
  },
  {
    id: 'RAS_05',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '우리 관계가 처음 기대했던 것을 잘 충족시켜 주고 있다.',
    weight: 0.14,
    labels: LIKERT_AGREEMENT,
    helpText: 'RAS 문항 5: 기대 충족.',
  },
  {
    id: 'RAS_06',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너를 깊이 사랑하고 있다.',
    weight: 0.14,
    labels: LIKERT_AGREEMENT,
    helpText: 'RAS 문항 6: 사랑의 깊이.',
  },
  {
    id: 'RAS_07',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '우리 관계에 문제가 많다고 느낀다.',
    weight: 0.14,
    reverse: true,
    labels: LIKERT_AGREEMENT,
    helpText: 'RAS 문�� 7: 관계 문제 (역채점).',
  },
];

export const CLINICAL_SURVEY_META = {
  phq9: {
    name: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    description: '우울 증상 선별 도구 (Kroenke et al., 2001)',
    totalQuestions: phq9Survey.length,
    estimatedMinutes: { min: 3, max: 5 },
    disclaimer: '이 도구는 진단용이 아닌 선별 목적입니다. 높은 점수가 나오면 전문가 상담을 권장합니다.',
  },
  gad7: {
    name: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder-7',
    description: '범불안 증상 선별 도구 (Spitzer et al., 2006)',
    totalQuestions: gad7Survey.length,
    estimatedMinutes: { min: 2, max: 4 },
    disclaimer: '이 도구는 진단용이 아닌 선별 목적입니다. 높은 점수가 나오면 전문가 상담을 권장합니다.',
  },
  ras: {
    name: 'RAS',
    fullName: 'Relationship Assessment Scale',
    description: '관계 만족도 척도 (Hendrick, 1988)',
    totalQuestions: rasSurvey.length,
    estimatedMinutes: { min: 2, max: 3 },
    disclaimer: '학술적으로 검증된 관계 만족도 측정 도구입니다.',
  },
};
