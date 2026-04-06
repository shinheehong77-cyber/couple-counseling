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
    // 간접 자살 사고 키워드 (KDS-152)
    "없는 게 나을", "짐이 되", "안 깨면 좋겠",
    "죽는 게 나을", "살아있는 게 힘들",
    "태어나지 말았어야", "내가 없어지면",
    "더 이상 버틸 수 없", "살아서 뭐하나",
    "내가 없으면 나을", "눈 감고 싶다",
    "다 끝내고 싶", "사라져 버리고 싶",
    "세상에 나 혼자", "이렇게 살 바에",
  ],
  domesticViolence: [
    "때렸다", "맞았다", "폭력", "폭행",
    "목을 졸랐다", "물건을 던졌다", "밀쳤다",
    "무서워서 집에 못 간다", "도망가고 싶다",
    "아이를 때린다", "아이에게 손을 댄다",
    "성폭력", "강제로", "동의 없이",
    "감금", "못 나가게 한다", "핸드폰을 뺏었다",
    // 해요체/합쇼체 활용형 (KDS-152)
    "때렸어요", "맞았어요", "밀쳤어요",
    "목을 졸랐어요", "물건을 던졌어요",
    "때렸습니다", "맞았습니다", "밀쳤습니다",
    "때려요", "맞아요", "때리고 있어요",
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

// 간접 자살 사고 정규식 패턴 (KDS-152)
const INDIRECT_SELF_HARM_REGEX: RegExp[] = [
  /없는\s*게\s*나(을|았을|으면)/,       // "없는 게 나을 것 같아" 등
  /짐(이|만)\s*되(고|는|어|니까)/,       // "짐이 되고 싶지 않아" 등
  /안\s*깨(면|었으면)\s*좋겠/,           // "안 깨면 좋겠다" 등
  /이렇게\s*살\s*바(에|엔|에야)/,        // "이렇게 살 바에" 등
];

// DV 해요체/합쇼체 정규식 패턴 (KDS-152)
const DV_CONJUGATION_REGEX: RegExp[] = [
  /(때리|때렸|맞았|밀쳤)(어요|습니다|어|었어)/,
  /목을?\s*조르?(았어요|습니다|고\s*있어요)/,
  /물건을?\s*던(졌어요|집니다|지고\s*있어요)/,
  /(폭행|폭력)(했어요|당했어요|을\s*당했습니다)/,
];

function matchPatterns(text: string, patterns: string[]): string[] {
  return patterns.filter((p) => text.includes(p));
}

function matchRegexPatterns(text: string, regexes: RegExp[]): string[] {
  return regexes
    .filter((r) => r.test(text))
    .map((r) => r.source);
}

export function detectCrisis(text: string): CrisisResult {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");

  // Check CRITICAL first
  const selfHarmMatches = matchPatterns(normalized, CRITICAL_PATTERNS.selfHarm);
  const selfHarmRegexMatches = matchRegexPatterns(normalized, INDIRECT_SELF_HARM_REGEX);
  const allSelfHarmMatches = [...selfHarmMatches, ...selfHarmRegexMatches];
  if (allSelfHarmMatches.length > 0) {
    return {
      level: "CRITICAL",
      matched: allSelfHarmMatches,
      response: CRITICAL_SELF_HARM_RESPONSE,
    };
  }

  const violenceMatches = matchPatterns(normalized, CRITICAL_PATTERNS.domesticViolence);
  const violenceRegexMatches = matchRegexPatterns(normalized, DV_CONJUGATION_REGEX);
  const allViolenceMatches = [...violenceMatches, ...violenceRegexMatches];
  if (allViolenceMatches.length > 0) {
    return {
      level: "CRITICAL",
      matched: allViolenceMatches,
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
