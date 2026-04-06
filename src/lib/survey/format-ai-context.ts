import type { AIContextPayload, SurveyDomain, CounselingApproach } from "./types";

const DOMAIN_LABELS: Record<SurveyDomain, string> = {
  communication: "의사소통",
  conflict: "갈등 해결",
  intimacy: "정서적 친밀감",
  trust: "신뢰 / 안전감",
  values: "가치관 & 목표",
  satisfaction: "관계 만족도",
  attachment_style: "애착 유형",
  emotional_regulation: "감정 조절",
  self_awareness: "자기 인식",
};

const LEVEL_LABELS: Record<string, string> = {
  critical: "즉각적 도움 필요",
  low: "개선 필요",
  moderate: "보통",
  good: "양호",
  excellent: "매우 건강함",
};

const APPROACH_LABELS: Record<CounselingApproach, string> = {
  eft_attachment: "EFT 애착 중심 (감정적 단절 회복)",
  gottman_conflict: "Gottman 갈등 관리",
  communication: "의사소통 기술 훈련",
  trust_rebuild: "신뢰 재건",
  values_alignment: "가치관 조율",
  crisis_support: "위기 개입 및 즉각적 지원",
};

/**
 * AIContextPayload를 AI 시스템 프롬프트에 삽입할 텍스트로 변환합니다.
 * 이 함수는 서버(API route)에서만 사용됩니다.
 */
export function formatSurveyContextForPrompt(payload: AIContextPayload): string {
  const lines: string[] = [
    "## 사전 설문 결과 (상담 시작 전 작성)",
    "",
    `- **전체 관계 건강도**: ${LEVEL_LABELS[payload.totalLevel] ?? payload.totalLevel} (${payload.totalScore}/100점)`,
  ];

  if (payload.strengths.length > 0) {
    lines.push(
      `- **강점 영역**: ${payload.strengths.map((d) => DOMAIN_LABELS[d] ?? d).join(", ")}`
    );
  }

  if (payload.concerns.length > 0) {
    lines.push(
      `- **우려 영역**: ${payload.concerns.map((d) => DOMAIN_LABELS[d] ?? d).join(", ")}`
    );
  }

  if (payload.criticalDomain) {
    lines.push(
      `- **핵심 집중 영역**: ${DOMAIN_LABELS[payload.criticalDomain] ?? payload.criticalDomain}`
    );
  }

  lines.push(
    `- **권장 상담 접근법**: ${APPROACH_LABELS[payload.recommendedApproach] ?? payload.recommendedApproach}`
  );

  if (payload.hasRiskFlags && payload.riskFlagTypes.length > 0) {
    const flagLabels: Record<string, string> = {
      violence: "폭력/학대",
      infidelity: "외도/불신",
      crisis: "관계 위기 (이혼 고려)",
      mental_health: "정신건강 위기",
      substance_abuse: "물질 남용",
    };
    lines.push(
      `- **⚠️ 위험 신호**: ${payload.riskFlagTypes.map((f) => flagLabels[f] ?? f).join(", ")}`
    );
  }

  if (payload.freeTextSummaries && Object.keys(payload.freeTextSummaries).length > 0) {
    lines.push("", "**자유 서술 응답:**");
    for (const [, text] of Object.entries(payload.freeTextSummaries)) {
      if (text.trim()) {
        lines.push(`> "${text.trim()}"`);
      }
    }
  }

  lines.push(
    "",
    "이 정보를 바탕으로 상담을 시작하세요. 하지만 설문 결과를 직접 언급하거나 수치를 말하지 마세요.",
    "대신 이 맥락을 자연스럽게 상담에 반영하여 핵심 문제에 집중하세요."
  );

  return lines.join("\n");
}
