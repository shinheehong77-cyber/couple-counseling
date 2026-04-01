// Crisis detection 3-tier system per KDS-96 protocol

export type CrisisLevel = "CRITICAL" | "WARNING" | "WATCH" | null;

export interface CrisisResult {
  level: CrisisLevel;
  matched: string[];
  response: string | null;
}

// Level 1: CRITICAL — immediate response required
const CRITICAL_PATTERNS = {
  selfHarm: [
    "죽고 싶다", "살고 싶지 않다", "없어지고 싶다",
    "자살", "자해", "극단적 선택",
    "삶이 의미 없다", "모든 게 끝났다",
    "유서", "마지막", "이별 편지",
    "약을 먹겠다", "뛰어내리겠다",
  ],
  domesticViolence: [
    "때렸다", "맞았다", "폭력", "폭행",
    "목을 졸랐다", "물건을 던졌다", "밀쳤다",
    "무서워서 집에 못 간다", "도망가고 싶다",
    "아이를 때린다", "아이에게 손을 댄다",
    "성폭력", "강제로", "동의 없이",
    "감금", "못 나가게 한다", "핸드폰을 뺏었다",
  ],
};

// Level 2: WARNING — recommend professional help
const WARNING_PATTERNS = [
  "이혼하겠다", // when repeated/threatening
  "살 수가 없다", "견딜 수 없다",
  "아이를 데리고 나가겠다",
  "재산을 다 가져가겠다",
  "알코올", "술을 많이", "약물", "마약",
  "경찰을 부를 거야", "고소할 거야",
];

// Level 3: WATCH — internal monitoring
const WATCH_PATTERNS = [
  "무기력", "우울", "의욕이 없",
  "잠을 못", "밤새", "불면",
  "밥을 못", "식욕이 없",
  "아무도 없다", "혼자", "외롭",
  "눈물이 멈추지 않", "자꾸 울",
];

const CRITICAL_SELF_HARM_RESPONSE = `지금 말씀하신 내용이 많이 걱정됩니다.
혹시 스스로를 해치고 싶은 마음이 있으신가요?

지금 바로 도움을 받으실 수 있어요:

자살예방상담전화: 1393 (24시간)
정신건강위기상담전화: 1577-0199
생명의전화: 1588-9191

카카오톡에서 '마음이음'을 검색하시면 채팅 상담도 가능합니다.

당신의 안전이 가장 중요합니다.`;

const CRITICAL_VIOLENCE_RESPONSE = `지금 안전하신가요?
말씀하신 상황은 매우 심각합니다.

지금 바로 도움을 받으실 수 있어요:

여성긴급전화: 1366 (24시간)
경찰: 112
아동학대신고: 112

안전한 장소로 이동이 필요하시면 1366에 전화하시면 긴급 보호시설을 안내받으실 수 있습니다.

전문가의 도움을 먼저 받으시길 강력히 권합니다.`;

const WARNING_RESPONSE = `말씀하신 상황이 많이 힘드시겠어요.
이런 감정이 지속되신다면, 전문 상담을 받아보시는 것이 좋겠어요.

한국가족상담협회: 1644-6621
정신건강복지센터: 1577-0199

전문가와 함께하면 더 안전하고 효과적으로 문제를 다룰 수 있어요.
저도 계속 함께할 수 있지만, 전문 상담을 병행하시는 것을 권해드립니다.`;

function matchPatterns(text: string, patterns: string[]): string[] {
  return patterns.filter((p) => text.includes(p));
}

export function detectCrisis(text: string): CrisisResult {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");

  // Check CRITICAL first
  const selfHarmMatches = matchPatterns(normalized, CRITICAL_PATTERNS.selfHarm);
  if (selfHarmMatches.length > 0) {
    return {
      level: "CRITICAL",
      matched: selfHarmMatches,
      response: CRITICAL_SELF_HARM_RESPONSE,
    };
  }

  const violenceMatches = matchPatterns(normalized, CRITICAL_PATTERNS.domesticViolence);
  if (violenceMatches.length > 0) {
    return {
      level: "CRITICAL",
      matched: violenceMatches,
      response: CRITICAL_VIOLENCE_RESPONSE,
    };
  }

  // Check WARNING
  const warningMatches = matchPatterns(normalized, WARNING_PATTERNS);
  if (warningMatches.length > 0) {
    return {
      level: "WARNING",
      matched: warningMatches,
      response: WARNING_RESPONSE,
    };
  }

  // Check WATCH
  const watchMatches = matchPatterns(normalized, WATCH_PATTERNS);
  if (watchMatches.length > 0) {
    return {
      level: "WATCH",
      matched: watchMatches,
      response: null, // no user-facing response for WATCH
    };
  }

  return { level: null, matched: [], response: null };
}
