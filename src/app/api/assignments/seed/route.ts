import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const WEEKLY_ASSIGNMENTS: Record<number, Array<{title: string; description: string; type: string; isDaily: boolean}>> = {
  1: [
    { title: "감사 표현하기", description: "파트너에게 감사한 점 1가지를 직접 말로 표현하세요", type: "gratitude", isDaily: true },
    { title: "15분 대화하기", description: "하루 중 15분을 정해 서로의 하루를 공유하세요", type: "communication_exercise", isDaily: true },
    { title: "경청 연습", description: "파트너가 말할 때 끝까지 듣고 요약해서 되돌려주세요", type: "active_listening", isDaily: true },
    { title: "함께 식사하기", description: "이번 주 중 1회 둘만의 식사 시간을 가지세요", type: "quality_time", isDaily: false },
    { title: "갈등일지 작성", description: "갈등이 생겼을 때 상황/감정/원인을 기록하세요", type: "reflection", isDaily: false },
  ],
  2: [
    { title: "긍정적 말 한마디", description: "파트너의 장점이나 노력을 인정하는 말을 해주세요", type: "affirmation", isDaily: true },
    { title: "비폭력 대화 연습", description: "'나는 ~할 때 ~한 감정이 들어요' 형식으로 대화하세요", type: "communication_exercise", isDaily: true },
    { title: "감정 체크인", description: "오늘 나의 감정 상태를 파트너에게 솔직히 공유하세요", type: "reflection", isDaily: true },
    { title: "관계 비전 공유", description: "서로가 원하는 관계의 모습을 이야기하세요", type: "reflection", isDaily: false },
    { title: "데이트 계획", description: "함께 즐길 수 있는 활동을 계획하고 실행하세요", type: "quality_time", isDaily: false },
  ],
  3: [
    { title: "감사 표현하기", description: "파트너에게 감사한 점 1가지를 직접 말로 표현하세요", type: "gratitude", isDaily: true },
    { title: "15분 대화하기", description: "하루 중 15분을 정해 서로의 하루를 공유하세요", type: "communication_exercise", isDaily: true },
    { title: "스킨십", description: "의미 있는 신체 접촉을 1회 이상 하세요 (포옹, 손잡기 등)", type: "intimacy", isDaily: true },
    { title: "함께 산책하기", description: "30분 이상 함께 걸으며 대화하세요", type: "quality_time", isDaily: false },
    { title: "서로에게 편지 쓰기", description: "파트너에게 솔직한 마음을 담은 편지를 써주세요", type: "reflection", isDaily: false },
  ],
  4: [
    { title: "긍정적 말 한마디", description: "파트너의 장점이나 노력을 인정하는 말을 해주세요", type: "affirmation", isDaily: true },
    { title: "감정 체크인", description: "오늘 나의 감정 상태를 파트너에게 솔직히 공유하세요", type: "reflection", isDaily: true },
    { title: "감사 표현하기", description: "파트너에게 감사한 점 1가지를 직접 말로 표현하세요", type: "gratitude", isDaily: true },
    { title: "관계 선언문 작성", description: "두 사람이 함께 지켜갈 관계 약속을 작성하세요", type: "reflection", isDaily: false },
    { title: "4주 회고", description: "프로그램을 통해 변화한 점과 앞으로의 계획을 정리하세요", type: "reflection", isDaily: false },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const { weekNumber, sessionId } = body as { weekNumber: number; sessionId?: string };

    if (!weekNumber || weekNumber < 1 || weekNumber > 4) {
      return NextResponse.json({ error: "유효하지 않은 주차입니다." }, { status: 400 });
    }

    const templates = WEEKLY_ASSIGNMENTS[weekNumber] ?? [];
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find or create a dummy session for seeded assignments
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      // Find user's most recent session
      const recentSession = await prisma.session.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      targetSessionId = recentSession?.id;
    }

    if (!targetSessionId) {
      // Create a system session for assignment tracking
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          counselingMode: "chat",
          counselorName: "상담사",
          status: "active",
          onboardingDone: true,
        },
      });
      targetSessionId = session.id;
    }

    const created = [];
    for (const t of templates) {
      const assignment = await prisma.assignment.create({
        data: {
          sessionId: targetSessionId,
          userId: user.id,
          title: t.title,
          description: t.description,
          type: t.type,
          dueDate: t.isDaily ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : weekEnd,
        },
      });
      created.push(assignment);
    }

    return NextResponse.json({ created: created.length, assignments: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/assignments/seed error:", error);
    return NextResponse.json({ error: "과제 생성 중 오류가 발생했어요." }, { status: 500 });
  }
}
