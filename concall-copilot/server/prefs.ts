/**
 * 카드 피드백(👍/👎)을 콜을 넘어 기억해 두고, 실시간 분석 프롬프트에 요약해 넣는다.
 * → 쓸모없다고 한 유형·내용은 줄이고, 유용하다고 한 것은 더 띄운다.
 */
import path from "node:path";
import { config } from "./config.ts";
import { readJson, writeJson } from "./store.ts";
import type { Card } from "./types.ts";

export interface FeedbackEntry {
  type: Card["type"];
  title: string;
  value: "up" | "down";
  at: number;
}

const file = () => path.join(config.dataDir, "prefs.json");
const MAX = 200;

export function loadFeedback(): FeedbackEntry[] {
  return readJson<{ feedback?: FeedbackEntry[] }>(file(), {}).feedback ?? [];
}

export function recordFeedback(card: Card, value: "up" | "down" | null): void {
  const list = loadFeedback().filter((f) => !(f.title === card.title && f.type === card.type));
  if (value) list.push({ type: card.type, title: card.title, value, at: Date.now() });
  writeJson(file(), { feedback: list.slice(-MAX) });
}

const TYPE_KO: Record<string, string> = {
  judgment: "판단", question: "질문", tech: "기술", number: "숫자", kb: "내 자료", web: "웹 확인", answer: "답변", brief: "브리핑", bookmark: "표시",
};

/** 프롬프트에 넣을 짧은 요약. 피드백이 없으면 빈 문자열. */
export function feedbackSummary(entries: FeedbackEntry[] = loadFeedback()): string {
  const live = entries.filter((e) => ["judgment", "question", "tech", "number", "kb"].includes(e.type));
  if (!live.length) return "";
  const byType = new Map<string, { up: number; down: number }>();
  for (const e of live) {
    const c = byType.get(e.type) ?? { up: 0, down: 0 };
    c[e.value]++;
    byType.set(e.type, c);
  }
  const counts = [...byType.entries()].map(([t, c]) => `${TYPE_KO[t] ?? t} 👍${c.up} 👎${c.down}`).join(", ");
  const recent = (v: "up" | "down") =>
    live.filter((e) => e.value === v).slice(-6).map((e) => `  - [${TYPE_KO[e.type] ?? e.type}] ${e.title}`).join("\n");
  const ups = recent("up");
  const downs = recent("down");
  return [
    `유형별 반응: ${counts}`,
    ups && `유용하다고 한 카드(이런 결을 더):\n${ups}`,
    downs && `불필요하다고 한 카드(이런 결은 줄이기):\n${downs}`,
  ]
    .filter(Boolean)
    .join("\n");
}
