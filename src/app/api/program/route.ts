import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const WEEK_THEMES = [
  "communication_basics",
  "conflict_intimacy",
  "trust_values",
  "integration_growth",
] as const;

const WEEK_MILESTONES: {
  title: string;
  type: string;
}[][] = [
  // Week 1
  [
    { title: "첫 번째 상담 세션", type: "counseling_session" },
    { title: "소통 패턴 일기", type: "assignment" },
    { title: "감사 표현 연습", type: "assignment" },
    { title: "경청 실습", type: "assignment" },
    { title: "1주차 체크인", type: "check_in_survey" },
  ],
  // Week 2
  [
    { title: "갈등 해결 상담", type: "counseling_session" },
    { title: "감정 일기 작성", type: "assignment" },
    { title: "갈등 상황 재구성", type: "assignment" },
    { title: "친밀감 대화", type: "assignment" },
    { title: "2주차 체크인", type: "check_in_survey" },
  ],
  // Week 3
  [
    { title: "신뢰 회복 상담", type: "counseling_session" },
    { title: "신뢰 행동 실천", type: "assignment" },
    { title: "가치관 대화", type: "assignment" },
    { title: "용서 편지", type: "assignment" },
    { title: "3주차 체크인", type: "check_in_survey" },
  ],
  // Week 4
  [
    { title: "통합 상담 세션", type: "counseling_session" },
    { title: "관계 비전 작성", type: "assignment" },
    { title: "액션플랜 수립", type: "assignment" },
    { title: "감사 편지", type: "assignment" },
    { title: "최종 체크인", type: "check_in_survey" },
  ],
];

// GET /api/program
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(null);
    }

    const program = await prisma.program.findFirst({
      where: { userId: user.id, status: "active" },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: {
            milestones: { orderBy: { ordinal: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error("GET /api/program error:", error);
    return NextResponse.json(null);
  }
}

// POST /api/program
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 }
      );
    }
    const userId = user.id;

    // Check for existing active program
    const existing = await prisma.program.findFirst({
      where: { userId, status: "active" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 진행 중인 프로그램이 있어요." },
        { status: 409 }
      );
    }

    const program = await prisma.program.create({
      data: {
        userId,
        status: "active",
        currentWeek: 1,
        weeks: {
          create: WEEK_THEMES.map((theme, i) => ({
            weekNumber: i + 1,
            theme,
            status: i === 0 ? "active" : "locked",
            progress: 0,
            unlockedAt: i === 0 ? new Date() : null,
            milestones: {
              create: WEEK_MILESTONES[i].map((m, j) => ({
                title: m.title,
                type: m.type,
                ordinal: j + 1,
              })),
            },
          })),
        },
      },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: {
            milestones: { orderBy: { ordinal: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("POST /api/program error:", error);
    return NextResponse.json(
      { error: "프로그램을 생성하는 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
