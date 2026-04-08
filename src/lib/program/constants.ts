/**
 * 4-Week Structured Counseling Program Definitions.
 * Each week has a theme with specific milestones (sessions, assignments, check-ins).
 */

export interface WeekDefinition {
  weekNumber: number;
  theme: string;
  title: string;
  description: string;
  milestones: Array<{
    type: "counseling_session" | "assignment" | "check_in_survey";
    title: string;
    description?: string;
    ordinal: number;
  }>;
}

export const PROGRAM_WEEKS: WeekDefinition[] = [
  {
    weekNumber: 1,
    theme: "communication_basics",
    title: "소통의 기초",
    description: "의사소통 패턴을 이해하고 건강한 대화법을 연습합니다",
    milestones: [
      {
        type: "counseling_session",
        title: "첫 번째 상담 세션",
        ordinal: 1,
      },
      {
        type: "assignment",
        title: "소통 패턴 일기",
        description: "하루 동안의 대화 패턴을 관찰하고 기록하세요",
        ordinal: 2,
      },
      {
        type: "assignment",
        title: "감사 표현 연습",
        description: "파트너에게 구체적인 감사를 3가지 표현하세요",
        ordinal: 3,
      },
      {
        type: "assignment",
        title: "경청 실습",
        description: "파트너의 이야기를 5분간 끊지 않고 들어보세요",
        ordinal: 4,
      },
      {
        type: "check_in_survey",
        title: "1주차 체크인",
        ordinal: 5,
      },
    ],
  },
  {
    weekNumber: 2,
    theme: "conflict_intimacy",
    title: "갈등과 친밀감",
    description: "갈등을 건설적으로 해결하고 친밀감을 회복합니다",
    milestones: [
      {
        type: "counseling_session",
        title: "갈등 해결 상담",
        ordinal: 1,
      },
      {
        type: "assignment",
        title: "감정 일기 작성",
        description:
          "갈등 상황에서 느끼는 감정을 솔직하게 기록하세요",
        ordinal: 2,
      },
      {
        type: "assignment",
        title: "갈등 상황 재구성",
        description:
          "최근 갈등을 파트너 관점에서 다시 써보세요",
        ordinal: 3,
      },
      {
        type: "assignment",
        title: "친밀감 대화",
        description:
          "서로에게 '요즘 가장 좋았던 순간'을 나눠보세요",
        ordinal: 4,
      },
      {
        type: "check_in_survey",
        title: "2주차 체크인",
        ordinal: 5,
      },
    ],
  },
  {
    weekNumber: 3,
    theme: "trust_values",
    title: "신뢰와 가치관",
    description: "신뢰를 재건하고 공유 가치관을 발견합니다",
    milestones: [
      {
        type: "counseling_session",
        title: "신뢰 회복 상담",
        ordinal: 1,
      },
      {
        type: "assignment",
        title: "신뢰 행동 실천",
        description:
          "파트너가 안심할 수 있는 작은 행동을 매일 실천하세요",
        ordinal: 2,
      },
      {
        type: "assignment",
        title: "가치관 대화",
        description:
          "5년 후 우리의 모습에 대해 함께 이야기하세요",
        ordinal: 3,
      },
      {
        type: "assignment",
        title: "용서 편지",
        description:
          "파트너에게 (보내지 않아도 되는) 용서의 편지를 써보세요",
        ordinal: 4,
      },
      {
        type: "check_in_survey",
        title: "3주차 체크인",
        ordinal: 5,
      },
    ],
  },
  {
    weekNumber: 4,
    theme: "integration_growth",
    title: "통합과 성장",
    description: "배운 것을 통합하고 미래 계획을 수립합니다",
    milestones: [
      {
        type: "counseling_session",
        title: "통합 상담 세션",
        ordinal: 1,
      },
      {
        type: "assignment",
        title: "관계 비전 작성",
        description:
          "함께 만들고 싶은 관계의 모습을 구체적으로 써보세요",
        ordinal: 2,
      },
      {
        type: "assignment",
        title: "액션플랜 수립",
        description:
          "앞으로 3개월간 실천할 구체적 계획을 세우세요",
        ordinal: 3,
      },
      {
        type: "assignment",
        title: "감사 편지",
        description:
          "프로그램을 함께한 파트너에게 감사 편지를 써보세요",
        ordinal: 4,
      },
      {
        type: "check_in_survey",
        title: "최종 체크인",
        ordinal: 5,
      },
    ],
  },
];
