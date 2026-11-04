export type Speaker = string; // "나", "상대", "상대 2" ...

export interface Segment {
  id: string;
  speaker: Speaker;
  text: string;
  /** ms since call start */
  t: number;
  lang?: string;
}

export type CardType =
  | "judgment" // 판단 포인트: 리스크·모순·주의할 점
  | "question" // 지금 물어볼 질문
  | "tech" // 기술/용어 해석
  | "number" // 숫자·가이던스 포착
  | "kb" // 내 자료와의 연결/불일치
  | "web" // 웹 확인 결과
  | "answer" // 내가 직접 물어본 것에 대한 답
  | "brief" // 사전 브리핑
  | "bookmark"; // 내가 📌 표시한 순간

export interface Source {
  title: string;
  url?: string;
  /** knowledge-base doc id */
  docId?: string;
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  body: string;
  /** transcript excerpt that triggered the card */
  quote?: string;
  priority: 1 | 2 | 3; // 1 = 지금 바로 봐야 함
  sources?: Source[];
  createdAt: number;
  /** ms since call start when created (for timeline) */
  t?: number;
  status?: "pending" | "done" | "error";
  origin: "live" | "web" | "ask" | "brief" | "mock" | "user";
  /** 사용자 피드백 (👍/👎) — 이후 카드 생성에 반영 */
  feedback?: "up" | "down";
}

export interface CallMeta {
  id: string;
  title: string;
  counterparty: string;
  participants: string;
  purpose: string;
  hypotheses: string;
  languages: string[];
  startedAt: number;
  endedAt?: number;
  hasAudio?: boolean;
  summaryReady?: boolean;
}

export interface KbDoc {
  id: string;
  title: string;
  kind: "note" | "file" | "call";
  source?: string; // file path or call id
  addedAt: number;
  chars: number;
}

export interface KbChunk {
  docId: string;
  title: string;
  idx: number;
  text: string;
}

export interface KbHit extends KbChunk {
  score: number;
}
