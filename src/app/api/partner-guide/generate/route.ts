import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { GeneratePartnerGuideRequest, GeneratePartnerGuideResponse } from "@/types/partner-guide";
import type { PartnerGuideData } from "@/types/partner-guide";
import type { SessionInsight } from "@/types/session";

const anthropic = new Anthropic();
const ANTHROPIC_MODEL = (process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6").trim();

const GUIDE_SYSTEM_PROMPT = `당신은 부부상담 전문가입니다. 상담 세션에서 추출된 파트너의 인사이트를 바탕으로, 상대방이 파트너를 더 잘 이해할 수 있도록 따뜻하고 실용적인 가이드를 작성합니다.

### 규칙
- 한국어 해요체(-요) 사용
- "AI", "챗봇", "시스템" 등의 단어 절대 사용 금지
- 상담 중 나온 직접 인용, 불만, 비난은 절대 포함하지 않음
- 점수나 수치를 직접 노출하지 않음
- 부정적 표현보다 건설적이고 따뜻한 표현 사용
- 파트너가 읽었을 때 상처받지 않도록 신중하게 작성

### 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "guideData": {
    "aboutUserId": "<userId>",
    "aboutUserName": "<userName>",
    "communicationStyle": {
      "summary": "2-3문장으로 파트너의 소통 스타일을 따뜻하게 설명"
    },
    "recommendations": {
      "doList": ["이렇게 하면 좋아요 항목 3개"],
      "avoidList": ["이런 건 피해주세요 항목 2-3개"]
    },
    "coreNeed": "파트너가 가장 원하는 것을 한 문장으로"
  },
  "guideText": "파트너를 이해하기 위한 따뜻한 서술형 가이드 (200-400자). 상대방이 읽는 것이므로 '당신의 파트너는...' 형식으로 작성하세요."
}`;

// POST /api/partner-guide/generate — Generate partner guide from session insight
// Called internally after session completion (PATCH /api/sessions)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요해요.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: GeneratePartnerGuideRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요.", code: "INVALID_BODY" }, { status: 400 });
  }

  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId가 필요해요.", code: "MISSING_SESSION_ID" }, { status: 400 });
  }

  // Load session with insightJson
  const session = await prisma.session.findUnique({
    where: { id: body.sessionId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!session) {
    return NextResponse.json({ error: "세션을 찾을 수 없어요.", code: "SESSION_NOT_FOUND" }, { status: 404 });
  }

  if (!session.insightJson) {
    return NextResponse.json(
      { error: "세션에 인사이트가 아직 없어요. 상담이 완료된 후 생성할 수 있어요.", code: "NO_INSIGHT" },
      { status: 400 },
    );
  }

  // Guide is only for coupled users
  if (!user.coupleId) {
    return NextResponse.json(
      { error: "파트너와 연결된 후에 가이드를 생성할 수 있어요.", code: "NO_COUPLE" },
      { status: 400 },
    );
  }

  // Parse insightJson
  let insight: SessionInsight;
  try {
    insight = JSON.parse(session.insightJson) as SessionInsight;
  } catch {
    return NextResponse.json(
      { error: "인사이트 데이터를 읽을 수 없어요.", code: "INSIGHT_PARSE_ERROR" },
      { status: 500 },
    );
  }

  // Check if guide already exists for this session
  const existingGuide = await prisma.partnerGuide.findUnique({
    where: { sessionId: body.sessionId },
  });

  if (existingGuide) {
    const response: GeneratePartnerGuideResponse = {
      id: existingGuide.id,
      version: existingGuide.version,
      createdAt: existingGuide.createdAt.toISOString(),
    };
    return NextResponse.json(response);
  }

  // Call Anthropic API to generate the guide
  const userPrompt = `다음은 "${session.user.name}"님의 상담 세션에서 추출된 인사이트입니다. 이 정보를 바탕으로 파트너가 이 사람을 더 잘 이해할 수 있는 가이드를 작성해주세요.

aboutUserId: ${session.user.id}
aboutUserName: ${session.user.name}

소통 스타일: ${insight.communicationStyle}
감정적 욕구: ${insight.emotionalNeeds.join(", ")}
트리거 패턴: ${insight.triggerPatterns.join(", ")}
강점 영역: ${insight.strengthAreas.join(", ")}
갈등 스타일: ${insight.conflictStyle}
주요 갈등: ${insight.keyConflicts.join(", ")}`;

  let guideData: PartnerGuideData;
  let guideText: string;

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: GUIDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "가이드 생성에 실패했어요. 다시 시도해주세요.", code: "AI_ERROR" },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(content.text);
    guideData = parsed.guideData;
    guideText = parsed.guideText;
  } catch (error) {
    console.error("Partner guide generation error:", error);
    return NextResponse.json(
      { error: "가이드 생성 중 문제가 발생했어요. 다시 시도해주세요.", code: "GENERATION_FAILED" },
      { status: 500 },
    );
  }

  // Calculate version
  const existingCount = await prisma.partnerGuide.count({
    where: { userId: session.user.id, coupleId: user.coupleId },
  });
  const version = existingCount + 1;

  // Create the guide
  const guide = await prisma.partnerGuide.create({
    data: {
      sessionId: body.sessionId,
      userId: session.user.id,
      coupleId: user.coupleId,
      version,
      guideJson: JSON.stringify(guideData),
      guideText,
    },
  });

  const result: GeneratePartnerGuideResponse = {
    id: guide.id,
    version: guide.version,
    createdAt: guide.createdAt.toISOString(),
  };

  return NextResponse.json(result);
}
