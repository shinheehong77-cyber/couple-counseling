/**
 * Assignment generation from AI counseling responses.
 * Parses structured assignment tags embedded in AI output
 * and provides prompts to guide assignment creation.
 */

export interface ParsedAssignment {
  title: string;
  description: string;
  type: string;
}

const ASSIGNMENT_REGEX =
  /<!-- ASSIGNMENT:(\{[^}]*\}) -->/g;

/**
 * Parse <!-- ASSIGNMENT:{...} --> tags from AI response content.
 * Returns an array of parsed assignments (may be empty if none found).
 */
export function parseAssignmentsFromResponse(
  content: string,
): ParsedAssignment[] {
  const assignments: ParsedAssignment[] = [];
  const matches = content.matchAll(ASSIGNMENT_REGEX);

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.title && parsed.description && parsed.type) {
        assignments.push({
          title: parsed.title,
          description: parsed.description,
          type: parsed.type,
        });
      }
    } catch {
      // Skip malformed JSON silently
    }
  }

  return assignments;
}

const ASSIGNMENT_TYPES = [
  "journaling",
  "communication_exercise",
  "reflection",
  "gratitude",
  "active_listening",
] as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

const CONFLICT_ASSIGNMENT_HINTS: Record<string, string> = {
  communication:
    "소통 패턴 관찰, 나-전달법 연습, 경청 실습 등 의사소통 개선 과제를 제안하세요.",
  finance:
    "재정 대화 연습, 공동 예산 계획, 돈에 대한 감정 일기 등 재정 갈등 관련 과제를 제안하세요.",
  parenting:
    "공동 양육 대화, 육아 역할 분담 계획, 아이 관점 이해하기 등 육아 관련 과제를 제안하세요.",
  infidelity:
    "신뢰 행동 일기, 감정 기록, 안전감 확인 대화 등 신뢰 재건 관련 과제를 제안하세요.",
  inlaw:
    "경계 설정 대화, 가족 관계 감정 일기, 배우자 지지 표현 등 가족 관계 과제를 제안하세요.",
  intimacy:
    "감정적 연결 대화, 애정 표현 연습, 함께하는 시간 계획 등 친밀감 회복 과제를 제안하세요.",
};

/**
 * Generate system prompt addition for assignment suggestions.
 * Only activates after 5+ messages to allow rapport building first.
 */
export function getAssignmentPrompt(
  messageCount: number,
  conflictType: string | null,
): string {
  if (messageCount < 5) return "";

  const conflictHint = conflictType
    ? CONFLICT_ASSIGNMENT_HINTS[conflictType] || ""
    : "";

  return `
### 과제 제안
대화가 충분히 진행되었으므로, 적절한 시점에 실천 과제를 1개 제안하세요.
과제는 다음 형식으로 응답 끝에 포함합니다 (사용자에게는 보이지 않는 메타데이터):
<!-- ASSIGNMENT:{"title":"과제 제목","description":"구체적인 실천 방법","type":"과제유형"} -->

과제 유형: journaling, communication_exercise, reflection, gratitude, active_listening
${conflictHint}

규칙:
- 대화 맥락에 맞는 구체적이고 실천 가능한 과제를 제안하세요.
- 한 응답에 최대 1개만 제안합니다.
- 과제 제목과 설명은 한국어로 작성합니다.
- 사용자가 부담을 느끼지 않도록 작고 구체적인 과제를 제안하세요.`;
}
