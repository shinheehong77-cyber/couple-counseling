/**
 * 간략 설문 (Brief Survey) — 5~10분
 * 총 18문항: 핵심 관계 상태 빠른 파악
 * 이론적 기반: Gottman Sound Relationship House + EFT 핵심 차원
 */

import type { SurveyQuestion } from '../types';
import { LIKERT_AGREEMENT, LIKERT_FREQUENCY } from './constants';

export const briefSurvey: SurveyQuestion[] = [
  // ────────────────────────────────────────
  // 의사소통 패턴 (3문항)
  // ────────────────────────────────────────
  {
    id: 'B_COM_01',
    domain: 'communication',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너와 중요한 주제(돈, 미래, 감정 등)에 대해 편하게 이야기할 수 있다.',
    weight: 0.40,
    labels: LIKERT_AGREEMENT,
    helpText: '일상적인 대화가 아닌, 중요한 문제에 관한 대화를 떠올려 보세요.',
  },
  {
    id: 'B_COM_02',
    domain: 'communication',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '내 감정과 생각을 파트너에게 솔직하게 표현하는 편이다.',
    weight: 0.30,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_COM_03',
    domain: 'communication',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너가 내 말을 충분히 들어준다고 느낀다.',
    weight: 0.30,
    labels: LIKERT_AGREEMENT,
  },

  // ────────────────────────────────────────
  // 갈등 해결 방식 (3문항)
  // ────────────────────────────────────────
  {
    id: 'B_CON_01',
    domain: 'conflict',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '의견이 충돌할 때 서로를 존중하면서 해결하는 편이다.',
    weight: 0.40,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_CON_02',
    domain: 'conflict',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '다툼 이후 비교적 빠르게 화해하고 회복한다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_CON_03',
    domain: 'conflict',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너와 다툴 때 감정이 지나치게 격해지거나 말을 상처줄 때가 있다.',
    weight: 0.25,
    reverse: true, // 높을수록 부정적
    labels: LIKERT_AGREEMENT,
  },

  // ────────────────────────────────────────
  // 정서적 친밀감 (3문항)
  // ────────────────────────────────────────
  {
    id: 'B_INT_01',
    domain: 'intimacy',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너와 정서적으로 깊이 연결되어 있다고 느낀다.',
    weight: 0.40,
    labels: LIKERT_AGREEMENT,
    helpText: 'EFT 이론에서 "정서적 연결"은 관계 건강의 핵심입니다.',
  },
  {
    id: 'B_INT_02',
    domain: 'intimacy',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너와 함께하는 시간의 질에 만족한다.',
    weight: 0.30,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_INT_03',
    domain: 'intimacy',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너가 나를 진정으로 이해해 준다고 느낀다.',
    weight: 0.30,
    labels: LIKERT_AGREEMENT,
  },

  // ────────────────────────────────────────
  // 신뢰 / 안전감 (3문항)
  // ────────────────────────────────────────
  {
    id: 'B_TRU_01',
    domain: 'trust',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너를 믿는다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_TRU_02',
    domain: 'trust',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너와의 관계에서 심리적으로 안전하다고 느낀다.',
    weight: 0.40,
    labels: LIKERT_AGREEMENT,
    helpText: '판단받거나 공격받을 걱정 없이 솔직할 수 있는지 생각해 보세요.',
  },
  {
    id: 'B_TRU_03',
    domain: 'trust',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너가 나에게 솔직하다고 생각한다.',
    weight: 0.25,
    labels: LIKERT_AGREEMENT,
  },

  // ────────────────────────────────────────
  // 가치관 / 목표 일치도 (3문항)
  // ────────────────────────────────────────
  {
    id: 'B_VAL_01',
    domain: 'values',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '우리는 인생에서 중요한 가치관이 비슷하다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_VAL_02',
    domain: 'values',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '미래 목표(자녀, 거주지, 경제 등)에 대해 파트너와 의견이 잘 맞는다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_VAL_03',
    domain: 'values',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '파트너와 경제적 가치관 및 생활 방식이 잘 맞는다.',
    weight: 0.30,
    labels: LIKERT_AGREEMENT,
  },

  // ────────────────────────────────────────
  // 일상 생활 만족도 (3문항)
  // ────────────────────────────────────────
  {
    id: 'B_SAT_01',
    domain: 'satisfaction',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '전반적으로 현재 우리 관계에 만족한다.',
    weight: 0.40,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_SAT_02',
    domain: 'satisfaction',
    version: 'both',
    type: 'VisualSlider',
    min: 0,
    max: 100,
    minLabel: '매우 불행함',
    maxLabel: '매우 행복함',
    text: '지금 이 순간 우리 관계가 얼마나 행복하다고 느끼나요?',
    weight: 0.40,
    helpText: '슬라이더를 이용해 현재 감정을 직관적으로 표시해 주세요.',
  },
  {
    id: 'B_SAT_03',
    domain: 'satisfaction',
    version: 'both',
    type: 'YesNo',
    text: '상담을 통해 우리 관계를 개선할 의지가 있다.',
    weight: 0.20,
    yesLabel: '네, 의지가 있어요',
    noLabel: '잘 모르겠어요',
    yesScore: 100,
    noScore: 30,
    helpText: '"아니요"라고 느끼더라도 솔직한 응답이 더 효과적인 상담을 도와드립니다.',
  },
];

// ────────────────────────────────────────
// 개인 성격/성향 — 애착 유형 (3문항)
// ────────────────────────────────────────

export const briefPersonalitySurvey: SurveyQuestion[] = [
  {
    id: 'B_ATT_01',
    domain: 'attachment_style',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '가까운 사람에게 의지하는 것이 편하다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
    helpText: '애착 이론에서 "안전 애착"의 핵심 지표입니다.',
  },
  {
    id: 'B_ATT_02',
    domain: 'attachment_style',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '상대방이 나를 떠날까 봐 불안한 마음이 자주 든다.',
    weight: 0.35,
    reverse: true,
    labels: LIKERT_FREQUENCY,
    helpText: '불안 애착 성향을 측정합니다.',
  },
  {
    id: 'B_ATT_03',
    domain: 'attachment_style',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '감정적으로 가까워지는 것이 불편하거나 부담스럽다.',
    weight: 0.30,
    reverse: true,
    labels: LIKERT_AGREEMENT,
    helpText: '회피 애착 성향을 측정합니다.',
  },

  // ────────────────────────────────────────
  // 개인 성격/성향 — 감정 조절 (3문항)
  // ────────────────────────────────────────

  {
    id: 'B_EMO_01',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '화가 나거나 속상할 때 감정을 스스로 조절할 수 있다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_EMO_02',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '스트레스 상황에서 충동적인 말이나 행동을 하는 편이다.',
    weight: 0.35,
    reverse: true,
    labels: LIKERT_FREQUENCY,
  },
  {
    id: 'B_EMO_03',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '부정적인 감정이 오래 지속되지 않고 비교적 빠르게 회복한다.',
    weight: 0.30,
    labels: LIKERT_AGREEMENT,
  },

  // ────────────────────────────────────────
  // 개인 성격/성향 — 자기 인식 (3문항)
  // ────────────────────────────────────────

  {
    id: 'B_SEL_01',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '내가 어떤 상황에서 어떤 감정을 느끼는지 잘 알고 있다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_SEL_02',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '갈등 상황에서 나의 역할이나 기여를 돌아볼 수 있다.',
    weight: 0.35,
    labels: LIKERT_AGREEMENT,
  },
  {
    id: 'B_SEL_03',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '내 감정을 말로 표현하는 것이 어렵다.',
    weight: 0.30,
    reverse: true,
    labels: LIKERT_AGREEMENT,
    helpText: '감정 표현 불능증(알렉시시미아) 경향을 측정합니다.',
  },

  // ────────────────────────────────────────
  // 개인 성격/성향 — 성격 특성 (3문항)
  // ────────────────────────────────────────

  {
    id: 'B_PER_01',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '나는 다른 사람의 감정을 잘 읽고 공감하는 편이다.',
    weight: 0.33,
    labels: LIKERT_AGREEMENT,
    helpText: '공감 능력을 측정합니다.',
  },
  {
    id: 'B_PER_02',
    domain: 'self_awareness',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '새로운 상황이나 변화에 적응하는 것이 비교적 쉬운 편이다.',
    weight: 0.33,
    labels: LIKERT_AGREEMENT,
    helpText: '유연성을 측정합니다.',
  },
  {
    id: 'B_PER_03',
    domain: 'emotional_regulation',
    version: 'both',
    type: 'Likert',
    scale: 5,
    text: '스트레스를 받으면 혼자 있고 싶어지는 편이다.',
    weight: 0.34,
    labels: LIKERT_FREQUENCY,
    helpText: '내향/외향 성향을 측정합니다.',
  },
];

/** 간략 설문 전체 (관계 + 성격/성향) */
export const briefSurveyFull: SurveyQuestion[] = [...briefSurvey, ...briefPersonalitySurvey];

export const BRIEF_SURVEY_META = {
  version: 'brief' as const,
  totalQuestions: briefSurveyFull.length,
  estimatedMinutes: { min: 7, max: 12 },
  description: '관계 상태와 개인 성향을 빠르게 파악하는 설문입니다.',
  domains: [
    'communication', 'conflict', 'intimacy', 'trust', 'values', 'satisfaction',
    'attachment_style', 'emotional_regulation', 'self_awareness',
  ] as const,
};
