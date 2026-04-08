import Anthropic from "@anthropic-ai/sdk";
import type { ReportData } from "./generate";

/**
 * Generate AI-written narrative insights from report data.
 * Returns a comprehensive Korean-language analysis covering
 * summary, domain analysis, emotion journey, and action plan.
 */
export async function generateAIInsights(
  reportData: ReportData,
): Promise<string> {
  const client = new Anthropic();

  const domainLabels: Record<string, string> = {
    communication: "의사소통",
    conflict: "갈등 해결",
    intimacy: "정서적 친밀감",
    trust: "신뢰/안전감",
    values: "가치관/목표",
    satisfaction: "관계 만족도",
    attachment_style: "애착 유형",
    emotional_regulation: "감정 조절",
    self_awareness: "자기 인식",
  };

  const scoreSummary = Object.entries(reportData.deltas)
    .map(([domain, delta]) => {
      const label = domainLabels[domain] || domain;
      const initial = reportData.initialScores[domain] ?? 0;
      const final = reportData.finalScores[domain] ?? 0;
      const direction = delta > 0 ? "향상" : delta < 0 ? "하락" : "유지";
      return `- ${label}: ${initial} → ${final} (${direction}, ${delta > 0 ? "+" : ""}${delta})`;
    })
    .join("\n");

  const emotionSummary =
    reportData.emotionJourney.length > 0
      ? reportData.emotionJourney
          .map((e) => `${e.date}: ${e.emotion} (강도 ${e.intensity})`)
          .join("\n")
      : "감정 기록 없음";

  const userPrompt = `다음은 커플 상담 프로그램 참여자의 사전/사후 평가 데이터입니다.

## 영역별 점수 변화
${scoreSummary}

## 감정 여정
${emotionSummary}

## 과제 수행
- 전체 과제: ${reportData.assignmentStats.total}개
- 완료: ${reportData.assignmentStats.completed}개
- 완료율: ${Math.round(reportData.assignmentStats.completionRate * 100)}%
${reportData.programProgress !== undefined ? `\n## 프로그램 진행률: ${Math.round(reportData.programProgress * 100)}%` : ""}

위 데이터를 바탕으로 종합 리포트를 작성해주세요.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: `당신은 관계 개선 분석가입니다. 커플 상담 프로그램의 사전/사후 데이터를 분석하여
한국어로 종합 리포트를 작성합니다.

리포트 구성:
1. **전체 요약** — 2~3문장으로 전체적인 변화를 요약합니다.
2. **영역별 분석** — 각 영역의 변화 방향과 의미를 해석합니다. 향상된 영역은 격려하고, 하락한 영역은 원인과 개선 방향을 제시합니다.
3. **감정 여정** — 기간 동안 관찰된 감정 패턴을 분석합니다.
4. **향후 액션플랜** — 3~5개의 구체적이고 실천 가능한 권고사항을 제시합니다.

톤: 따뜻하고 격려하는 톤, 존댓말(-요 체) 사용. "치료", "진단" 등의 의학 용어는 사용하지 않습니다.`,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}
