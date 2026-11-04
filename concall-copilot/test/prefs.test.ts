import assert from "node:assert/strict";
import test from "node:test";
import { feedbackSummary, type FeedbackEntry } from "../server/prefs.ts";

test("feedbackSummary: 피드백이 없으면 빈 문자열", () => {
  assert.equal(feedbackSummary([]), "");
});

test("feedbackSummary: 유형별 집계와 최근 👍/👎 제목", () => {
  const e = (type: FeedbackEntry["type"], title: string, value: "up" | "down"): FeedbackEntry => ({ type, title, value, at: 0 });
  const out = feedbackSummary([
    e("tech", "용어: TSV", "down"),
    e("tech", "용어: EUV", "down"),
    e("judgment", "수주 목표 하향", "up"),
    e("answer", "내가 물은 것", "up"), // 실시간 카드가 아니므로 제외
  ]);
  assert.match(out, /기술 👍0 👎2/);
  assert.match(out, /판단 👍1 👎0/);
  assert.match(out, /불필요하다고 한 카드[\s\S]*용어: TSV/);
  assert.ok(!out.includes("내가 물은 것"));
});
