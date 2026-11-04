import assert from "node:assert/strict";
import test from "node:test";
import { Bm25Index, chunkText, tokenize } from "../server/kb.ts";
import { mockCards } from "../server/mock.ts";

test("tokenize: 한글은 2-gram, 영문은 단어, 숫자 보존", () => {
  const t = tokenize("하이브리드 본딩 HBM 40대 수주");
  assert.ok(t.includes("하이"));
  assert.ok(t.includes("본딩"));
  assert.ok(t.includes("hbm"));
  assert.ok(t.includes("40대") || t.includes("40"));
});

test("chunkText: 긴 문서를 겹치게 나눈다", () => {
  const text = Array.from({ length: 60 }, (_, i) => `문장 ${i}번은 테스트용 내용입니다.`).join(" ");
  const chunks = chunkText(text, 200, 40);
  assert.ok(chunks.length > 3);
  assert.ok(chunks.every((c) => c.length <= 220));
});

test("BM25: 조사가 붙은 한국어 질의도 관련 문서를 찾는다", () => {
  const idx = new Bm25Index();
  idx.add({ docId: "a", title: "한결테크 콜 메모", idx: 0, text: "2026년 TC 본더 수주 목표 연 40대. 하이브리드 본딩 장비는 2027년 하반기 고객 평가 예정." });
  idx.add({ docId: "b", title: "날씨", idx: 0, text: "오늘은 맑고 바람이 조금 불었다. 저녁에는 비 소식이 있다." });
  const hits = idx.search("하이브리드 본딩이 들어오면 수주는 어떻게 되나요");
  assert.equal(hits[0]?.docId, "a");
  assert.ok(!hits.some((h) => h.docId === "b"));
  idx.removeDoc("a");
  assert.equal(idx.search("하이브리드 본딩").length, 0);
});

test("mockCards: 숫자·용어·질문 카드를 만들고 중복을 피한다", () => {
  const seen = new Set<string>();
  const segs = [{ id: "1", speaker: "상대", t: 1000, text: "올해 수주는 30대 초중반으로 보고 있고 HBM 증설은 견조합니다. 가이던스는 유지합니다." }];
  const first = mockCards(segs, [], seen);
  const types = first.map((c) => c.type);
  assert.ok(types.includes("number"));
  assert.ok(types.includes("tech"));
  assert.ok(types.includes("question"));
  const again = mockCards(segs, [], seen);
  const firstTitles = new Set(first.map((c) => c.title));
  assert.ok(again.every((c) => !firstTitles.has(c.title)), "같은 카드를 다시 만들지 않는다");
});
