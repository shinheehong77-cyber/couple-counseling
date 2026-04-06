/**
 * 부부상담 사전 설문 타입 정의
 * 이론적 기반: EFT (Emotionally Focused Therapy) + Gottman Method
 */

// ─────────────────────────────────────────────
// 질문 타입
// ─────────────────────────────────────────────

export type QuestionType =
  | 'Likert'        // 리커트 척도 (1~5)
  | 'VisualSlider'  // 시각적 슬라이더 (0~100)
  | 'Checklist'     // 복수 선택
  | 'FreeText'      // 자유 서술
  | 'YesNo';        // 예/아니오

// ─────────────────────────────────────────────
// 설문 영역 (도메인)
// ─────────────────────────────────────────────

export type SurveyDomain =
  | 'communication'  // 의사소통 패턴
  | 'conflict'       // 갈등 해결 방식
  | 'intimacy'       // 정서적 친밀감
  | 'trust'          // 신뢰/안전감
  | 'values'         // 가치관/목표 일치도
  | 'satisfaction';  // 일상 생활 만족도

export const DOMAIN_LABELS: Record<SurveyDomain, string> = {
  communication: '의사소통',
  conflict: '갈등 해결',
  intimacy: '정서적 친밀감',
  trust: '신뢰 / 안전감',
  values: '가치관 & 목표',
  satisfaction: '관계 만족도',
};

// ─────────────────────────────────────────────
// 설문 버전
// ─────────────────────────────────────────────

export type SurveyVersion = 'brief' | 'comprehensive';

// ─────────────────────────────────────────────
// 공통 질문 기반 인터페이스
// ─────────────────────────────────────────────

interface BaseQuestion {
  id: string;
  domain: SurveyDomain;
  version: SurveyVersion | 'both'; // 'both' = brief + comprehensive 모두 포함
  text: string;           // 질문 텍스트 (한국어)
  weight: number;         // 점수 가중치 (0~1, 도메인 내 합산 기준)
  reverse?: boolean;      // 역방향 점수 여부 (점수가 높을수록 부정적인 경우)
  riskFlag?: RiskFlag;    // 위험 플래그 (해당 시)
  helpText?: string;      // 응답자에게 보여줄 보조 설명
}

// ─────────────────────────────────────────────
// 위험 플래그
// ─────────────────────────────────────────────

export type RiskFlag =
  | 'violence'         // 신체적/언어적 폭력
  | 'infidelity'       // 외도/불신
  | 'crisis'           // 관계 위기 (이혼 고려 등)
  | 'mental_health'    // 정신건강 위기
  | 'substance_abuse'; // 물질 남용

// ─────────────────────────────────────────────
// 질문 타입별 구체 인터페이스
// ─────────────────────────────────────────────

export interface LikertQuestion extends BaseQuestion {
  type: 'Likert';
  scale: 5; // 항상 5점 척도
  labels: [string, string, string, string, string]; // 1~5 레이블
}

export interface VisualSliderQuestion extends BaseQuestion {
  type: 'VisualSlider';
  min: number;   // 최솟값 (보통 0)
  max: number;   // 최댓값 (보통 100)
  minLabel: string;
  maxLabel: string;
  step?: number; // 기본 1
}

export interface ChecklistQuestion extends BaseQuestion {
  type: 'Checklist';
  options: ChecklistOption[];
  maxSelections?: number; // 미설정 시 제한 없음
  minSelections?: number; // 최소 선택 수
}

export interface ChecklistOption {
  value: string;
  label: string;
  riskFlag?: RiskFlag;
  scoreImpact?: number; // 해당 항목 선택 시 추가 점수 영향 (양수 = 긍정, 음수 = 부정)
}

export interface FreeTextQuestion extends BaseQuestion {
  type: 'FreeText';
  placeholder?: string;
  maxLength?: number;
  analyzedByAI?: boolean; // AI가 감정/주제 분석 여부
}

export interface YesNoQuestion extends BaseQuestion {
  type: 'YesNo';
  yesLabel?: string;  // 기본: "예"
  noLabel?: string;   // 기본: "아니요"
  yesScore: number;   // yes 선택 시 점수 (0~100)
  noScore: number;    // no 선택 시 점수 (0~100)
}

export type SurveyQuestion =
  | LikertQuestion
  | VisualSliderQuestion
  | ChecklistQuestion
  | FreeTextQuestion
  | YesNoQuestion;

// ─────────────────────────────────────────────
// 설문 응답 타입
// ─────────────────────────────────────────────

export type QuestionResponse =
  | { type: 'Likert'; value: 1 | 2 | 3 | 4 | 5 }
  | { type: 'VisualSlider'; value: number }
  | { type: 'Checklist'; values: string[] }
  | { type: 'FreeText'; text: string }
  | { type: 'YesNo'; value: 'yes' | 'no' };

export interface SurveyResponse {
  questionId: string;
  response: QuestionResponse;
  answeredAt: Date;
}

// ─────────────────────────────────────────────
// 점수 결과 타입
// ─────────────────────────────────────────────

export interface DomainScore {
  domain: SurveyDomain;
  score: number;       // 0~100
  level: ScoreLevel;
  answeredCount: number;
  totalCount: number;
}

export type ScoreLevel = 'critical' | 'low' | 'moderate' | 'good' | 'excellent';

export const SCORE_LEVEL_LABELS: Record<ScoreLevel, string> = {
  critical: '즉각적 도움이 필요',
  low: '개선이 필요',
  moderate: '보통',
  good: '양호',
  excellent: '매우 건강함',
};

export interface SurveyResult {
  version: SurveyVersion;
  totalScore: number;
  totalLevel: ScoreLevel;
  domainScores: DomainScore[];
  riskFlags: Array<{ flag: RiskFlag; questionId: string }>;
  completedAt: Date;
  aiContextPayload: AIContextPayload; // AI 상담 프롬프트 주입용 컨텍스트
}

// ─────────────────────────────────────────────
// AI 프롬프트 주입용 컨텍스트
// ─────────────────────────────────────────────

export interface AIContextPayload {
  surveyVersion: SurveyVersion;
  totalScore: number;
  totalLevel: ScoreLevel;
  strengths: SurveyDomain[];       // 점수 70 이상 영역
  concerns: SurveyDomain[];        // 점수 50 미만 영역
  criticalDomain?: SurveyDomain;   // 가장 낮은 점수 영역
  hasRiskFlags: boolean;
  riskFlagTypes: RiskFlag[];
  freeTextSummaries?: Record<string, string>; // questionId → 응답 텍스트
  recommendedApproach: CounselingApproach;
}

export type CounselingApproach =
  | 'eft_attachment'     // EFT 애착 중심 (정서적 단절이 주요 문제)
  | 'gottman_conflict'   // Gottman 갈등 관리 중심
  | 'communication'      // 의사소통 기술 훈련
  | 'trust_rebuild'      // 신뢰 재건 중심
  | 'values_alignment'   // 가치관 조율 중심
  | 'crisis_support';    // 위기 개입 (즉각적 지원 필요)
