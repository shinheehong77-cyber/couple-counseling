import assert from "node:assert/strict";
import test from "node:test";
import { cleanTranscript } from "../server/local-stt.ts";

test("cleanTranscript: Whisper 환각 문구를 버린다", () => {
  assert.equal(cleanTranscript("시청해주셔서 감사합니다."), "");
  assert.equal(cleanTranscript(" Thank you for watching! "), "");
  assert.equal(cleanTranscript("[BLANK_AUDIO]"), "");
  assert.equal(cleanTranscript("(음악)"), "");
  assert.equal(cleanTranscript("..."), "");
});

test("cleanTranscript: 정상 문장과 숫자는 그대로 둔다", () => {
  assert.equal(cleanTranscript("4분기 매출은 1,100억에서 1,200억 사이입니다."), "4분기 매출은 1,100억에서 1,200억 사이입니다.");
  assert.equal(cleanTranscript("capacity is 1000000 wafers"), "capacity is 1000000 wafers");
});

test("cleanTranscript: 같은 말 반복을 줄인다", () => {
  assert.equal(cleanTranscript("네 네 네 네 네 네 맞습니다"), "네 맞습니다");
});
