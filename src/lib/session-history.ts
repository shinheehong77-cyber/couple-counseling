import { prisma } from "@/lib/prisma";

interface PastSessionSummary {
  sessionId: string;
  date: string;
  conflictType: string | null;
  status: string;
  messageCount: number;
  emotionSummary: string[];
  lastTopics: string[];
  surveyScore: number | null;
}

/**
 * 사용자의 과거 상담 세션을 요약하여 새 세션의 시스템 프롬프트에 주입할 수 있는 텍스트를 생성합니다.
 * 최근 5개 세션까지 포함합니다.
 */
export async function buildSessionHistoryContext(userId: string, excludeSessionId?: string): Promise<string | null> {
  const pastSessions = await prisma.session.findMany({
    where: {
      userId,
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 10,
        where: { role: { in: ["user", "assistant"] } },
      },
      emotionStates: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (pastSessions.length === 0) return null;

  const summaries: PastSessionSummary[] = pastSessions.map((session) => {
    // Extract main topics from user messages
    const userMessages = session.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);
    const lastTopics = userMessages.slice(0, 3).map((msg) =>
      msg.length > 80 ? msg.slice(0, 80) + "…" : msg
    );

    // Emotion summary
    const emotionSummary = [...new Set(
      session.emotionStates.map((e) => `${e.emotion}(${(e.intensity * 100).toFixed(0)}%)`)
    )].slice(0, 4);

    // Survey score from context
    let surveyScore: number | null = null;
    if (session.surveyContextJson) {
      try {
        const ctx = JSON.parse(session.surveyContextJson);
        surveyScore = ctx.totalScore ?? null;
      } catch {
        // skip
      }
    }

    return {
      sessionId: session.id,
      date: session.createdAt.toISOString().split("T")[0],
      conflictType: session.conflictType,
      status: session.status,
      messageCount: session.messages.length,
      emotionSummary,
      lastTopics,
      surveyScore,
    };
  });

  const lines: string[] = [
    "## 과거 상담 이력 (최근 세션 요약)",
    "",
    `이 사용자는 총 ${pastSessions.length}회의 상담을 진행했습니다.`,
    "",
  ];

  for (const s of summaries) {
    const conflictLabel = s.conflictType
      ? CONFLICT_LABELS[s.conflictType] ?? s.conflictType
      : "미지정";

    lines.push(`### ${s.date} 상담`);
    lines.push(`- 주제: ${conflictLabel}`);
    lines.push(`- 상태: ${STATUS_LABELS[s.status] ?? s.status}`);
    if (s.surveyScore !== null) {
      lines.push(`- 당시 관계 점수: ${s.surveyScore}/100`);
    }
    if (s.emotionSummary.length > 0) {
      lines.push(`- 감정 기록: ${s.emotionSummary.join(", ")}`);
    }
    if (s.lastTopics.length > 0) {
      lines.push(`- 주요 대화 내용:`);
      for (const topic of s.lastTopics) {
        lines.push(`  > "${topic}"`);
      }
    }
    lines.push("");
  }

  lines.push(
    "이 과거 상담 이력을 바탕으로 사용자의 변화와 진전을 인식하고,",
    "이전에 다루었던 주제와의 연결성을 자연스럽게 반영하세요.",
    "단, 과거 기록을 직접 언급하지 말고, 대화 흐름 속에서 맥락적으로 활용하세요.",
    "사용자가 이전 상담에서 진전을 보인 부분은 격려하고,",
    "반복되는 패턴이 있다면 부드럽게 인식을 도와주세요."
  );

  return lines.join("\n");
}

const CONFLICT_LABELS: Record<string, string> = {
  communication: "의사소통",
  finance: "재정/금전",
  parenting: "육아/양육",
  infidelity: "외도/신뢰",
  inlaw: "시댁/처가",
  intimacy: "친밀감",
};

const STATUS_LABELS: Record<string, string> = {
  active: "진행 중",
  completed: "완료",
  crisis: "위기 개입",
};
