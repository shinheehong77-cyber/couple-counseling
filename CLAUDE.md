# 마주 (MAJU) — Agent Hub

## Tech Stack
- Next.js 16.2 + React 19 + TypeScript 5 + Tailwind CSS v4
- Prisma 7.6 + SQLite (LibSQL/Turso)
- Anthropic Claude API (@anthropic-ai/sdk 0.81)
- shadcn/ui (Radix) + Lucide icons

## Core Rules
1. Before any task, read @PRODUCT_PLAN.md and @ARCHITECTURE.md
2. Before any UI work, read @DESIGN_SYSTEM.md — warm editorial aesthetic is non-negotiable
3. Follow @/Users/shinhee/WORKFLOW.md layer separation rules during parallel work
4. Never modify files outside your assigned layer
5. Korean language UI throughout (존댓말 해요체 -요 form)
6. Never use "AI", "챗봇", "시스템" in user-facing text
7. Mobile-first: 모든 UI는 375px 기준, 터치 타겟 44px 이상

## 디자인 코딩 규칙 (절대 준수)
- **인라인 style={{}} 사용 금지** — globals.css에 시맨틱 CSS 클래스 정의 후 className 사용
- **Tailwind 유틸리티 클래스 사용 금지** — 디자인 시스템 CSS 클래스만 사용
- **Raw px/rem/hex 값 금지** — 반드시 디자인 토큰 사용 (--space-4, --text-sm, --accent-primary 등)
- 새 컴포넌트 추가 시: globals.css에 클래스 정의 → JSX에서 className 적용
- 하단 네비 있는 페이지는 bottom padding calc(80px + var(--space-4)) 필수
- 한국어: word-break: keep-all 전역

## 상담 서비스 규칙
- 과제는 반드시 세션 종료 시에만 제안 (상담 중간 금지)
- 추천 선택지(Suggestions)는 사용자가 할만한 대답 (상담사 질문 X)
- 음성/TTS 기능 현재 비활성 (제거됨)
- Gottman 4 Horsemen 실시간 감지 + 부드러운 교정
- 위기 감지 3단계: WATCH → WARNING → CRITICAL

## References
- @PRODUCT_PLAN.md — product vision, page structure, dev phases, task library
- @CLINICAL_PROTOCOL.md — clinical methodology, session structure, assessment tools
- @ARCHITECTURE.md — DB schema, API routes, page structure, shared types
- @DESIGN_SYSTEM.md — visual design, colors, fonts, components
- @AGENTS.md — agent-specific rules
- @/Users/shinhee/WORKFLOW.md — parallel work protocol
