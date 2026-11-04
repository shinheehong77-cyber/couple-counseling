/**
 * 콜 하나의 실시간 분석 루프.
 * 클라이언트는 확정된 발화(segment)를 올리기만 하고, 언제 분석할지는 서버가 정한다.
 * 결과 카드는 SSE 로 브라우저에 밀어준다.
 */
import type { ServerResponse } from "node:http";
import { config, llmEnabled } from "./config.ts";
import { kb } from "./kb.ts";
import * as llm from "./llm.ts";
import { mockCards } from "./mock.ts";
import { store } from "./store.ts";
import type { CallMeta, Card, Segment, Source } from "./types.ts";
import { clip, newId } from "./util.ts";

type Listener = ServerResponse;

class CallSession {
  listeners = new Set<Listener>();
  analyzedUpTo = 0; // segments[0..analyzedUpTo) 은 이미 분석됨
  running = false;
  lastRunAt = 0;
  timer: NodeJS.Timeout | null = null;
  webChecksInFlight = 0;
  lastWebCheckAt = 0;
  seenTitles = new Set<string>();

  constructor(public id: string) {
    for (const c of store.getCards(id)) this.seenTitles.add(c.title);
  }

  emit(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.listeners) res.write(payload);
  }

  saveCard(card: Card): void {
    store.upsertCard(this.id, card);
    this.emit("card", card);
  }
}

const sessions = new Map<string, CallSession>();

function session(id: string): CallSession {
  let s = sessions.get(id);
  if (!s) {
    s = new CallSession(id);
    s.analyzedUpTo = 0;
    sessions.set(id, s);
  }
  return s;
}

export function subscribe(callId: string, res: ServerResponse): void {
  const s = session(callId);
  s.listeners.add(res);
  res.on("close", () => s.listeners.delete(res));
}

export function addSegments(callId: string, segs: Segment[]): void {
  store.appendSegments(callId, segs);
  const s = session(callId);
  s.emit("segments", segs);
  schedule(callId);
}

/** 새 발화가 충분히 쌓였거나 일정 시간이 지나면 분석 라운드를 돈다. */
function schedule(callId: string, force = false): void {
  const s = session(callId);
  if (s.running) return; // 끝나면 다시 schedule 됨
  const segs = store.getSegments(callId);
  const fresh = segs.slice(s.analyzedUpTo);
  if (!fresh.length) return;
  const newChars = fresh.reduce((n, x) => n + x.text.length, 0);
  const since = Date.now() - s.lastRunAt;
  if (force || (newChars >= config.liveMinNewChars && since >= config.liveMinIntervalMs / 2) || since >= config.liveMinIntervalMs) {
    if (s.timer) clearTimeout(s.timer);
    s.timer = null;
    void runRound(callId);
  } else if (!s.timer) {
    s.timer = setTimeout(() => {
      s.timer = null;
      schedule(callId, true);
    }, Math.max(1000, config.liveMinIntervalMs - since));
  }
}

async function runRound(callId: string): Promise<void> {
  const s = session(callId);
  const call = store.getCall(callId);
  if (!call) return;
  s.running = true;
  s.lastRunAt = Date.now();
  const segs = store.getSegments(callId);
  const earlier = segs.slice(0, s.analyzedUpTo);
  const fresh = segs.slice(s.analyzedUpTo);
  s.analyzedUpTo = segs.length;
  s.emit("status", { analyzing: true });

  try {
    const recentText = segs.slice(-12).map((x) => x.text).join(" ");
    const kbHits = kb.search(`${call.counterparty} ${recentText}`, 5);
    const nowT = fresh[fresh.length - 1]?.t ?? 0;

    const out = llmEnabled()
      ? await llm.liveCards({ call, earlier, fresh, kbHits, existing: store.getCards(callId) })
      : mockCards(fresh, kbHits, s.seenTitles);

    for (const c of out) {
      if (s.seenTitles.has(c.title) && llmEnabled()) continue;
      s.seenTitles.add(c.title);
      const sources: Source[] = c.kb_doc_ids
        .map((id) => kbHits.find((h) => h.docId === id))
        .filter((h): h is NonNullable<typeof h> => Boolean(h))
        .map((h) => ({ title: h.title, docId: h.docId }));
      const card: Card = {
        id: newId("c_"),
        type: c.type,
        title: c.title,
        body: c.body,
        quote: c.quote || undefined,
        priority: (Math.min(3, Math.max(1, c.priority)) as 1 | 2 | 3),
        sources,
        createdAt: Date.now(),
        t: nowT,
        origin: llmEnabled() ? "live" : "mock",
      };
      s.saveCard(card);
      if (c.web_query && llmEnabled()) maybeWebCheck(callId, call, card, c.web_query);
    }
  } catch (err) {
    console.error("[live] 분석 실패:", (err as Error).message);
    s.emit("status", { error: "실시간 분석이 잠시 멈췄어요. 계속 시도할게요." });
  } finally {
    s.running = false;
    s.emit("status", { analyzing: false });
    // 분석 중 들어온 발화가 있으면 이어서
    if (store.getSegments(callId).length > s.analyzedUpTo) schedule(callId);
  }
}

/** 웹 확인은 비용·지연이 크므로 동시에 1건, 최소 20초 간격으로 제한. */
function maybeWebCheck(callId: string, call: CallMeta, origin: Card, query: string): void {
  const s = session(callId);
  if (s.webChecksInFlight >= 1 || Date.now() - s.lastWebCheckAt < 20_000) return;
  s.webChecksInFlight++;
  s.lastWebCheckAt = Date.now();
  const pending: Card = {
    id: newId("c_"),
    type: "web",
    title: `웹 확인: ${clip(origin.title, 22)}`,
    body: `“${query}” 확인 중…`,
    quote: origin.quote,
    priority: origin.priority,
    createdAt: Date.now(),
    t: origin.t,
    status: "pending",
    origin: "web",
  };
  s.saveCard(pending);
  llm
    .webCheck({ call, quote: origin.quote || origin.body, query, context: store.getSegments(callId).slice(-10) })
    .then((r) => s.saveCard({ ...pending, body: r.text || "확인 가능한 공개 정보를 찾지 못했어요.", sources: r.sources, status: "done" }))
    .catch((err) => {
      console.error("[web] 실패:", (err as Error).message);
      s.saveCard({ ...pending, body: "웹 확인에 실패했어요.", status: "error" });
    })
    .finally(() => {
      s.webChecksInFlight--;
    });
}

export async function askQuestion(callId: string, question: string): Promise<Card> {
  const s = session(callId);
  const call = store.getCall(callId);
  if (!call) throw new Error("call not found");
  const transcript = store.getSegments(callId);
  const card: Card = {
    id: newId("c_"),
    type: "answer",
    title: question,
    body: "답을 찾는 중…",
    priority: 1,
    createdAt: Date.now(),
    t: transcript[transcript.length - 1]?.t,
    status: "pending",
    origin: "ask",
  };
  s.saveCard(card);
  const kbHits = kb.search(`${question} ${transcript.slice(-6).map((x) => x.text).join(" ")}`, 6);
  try {
    if (!llmEnabled()) {
      const body = kbHits.length
        ? `오프라인 모드라 내 자료 검색 결과만 보여드려요.\n\n` + kbHits.slice(0, 3).map((h) => `• ${h.title}: ${clip(h.text.replace(/\s+/g, " "), 160)}`).join("\n")
        : "오프라인 모드예요. ANTHROPIC_API_KEY 를 설정하면 대화·내 자료·웹을 함께 보고 답해요.";
      const done: Card = { ...card, body, status: "done", sources: kbHits.slice(0, 3).map((h) => ({ title: h.title, docId: h.docId })) };
      s.saveCard(done);
      return done;
    }
    const r = await llm.ask({ call, question, transcript, kbHits });
    const done: Card = { ...card, body: r.text, sources: r.sources, status: "done" };
    s.saveCard(done);
    return done;
  } catch (err) {
    const failed: Card = { ...card, body: `답을 가져오지 못했어요: ${(err as Error).message}`, status: "error" };
    s.saveCard(failed);
    return failed;
  }
}

export async function preBrief(callId: string): Promise<Card> {
  const s = session(callId);
  const call = store.getCall(callId);
  if (!call) throw new Error("call not found");
  const card: Card = {
    id: newId("c_"),
    type: "brief",
    title: "사전 브리핑",
    body: "최근 이슈와 내 자료를 정리하는 중…",
    priority: 2,
    createdAt: Date.now(),
    t: 0,
    status: "pending",
    origin: "brief",
  };
  s.saveCard(card);
  const kbHits = kb.search(`${call.counterparty} ${call.title} ${call.purpose} ${call.hypotheses}`, 8);
  try {
    if (!llmEnabled()) {
      const body =
        (kbHits.length
          ? "## 내 자료에서 기억할 것\n" + kbHits.slice(0, 4).map((h) => `- **${h.title}**: ${clip(h.text.replace(/\s+/g, " "), 200)}`).join("\n")
          : "관련된 내 자료가 없어요.") + "\n\n_오프라인 모드: 웹 최신 이슈는 ANTHROPIC_API_KEY 설정 후 포함돼요._";
      const done: Card = { ...card, body, status: "done", sources: kbHits.slice(0, 4).map((h) => ({ title: h.title, docId: h.docId })) };
      s.saveCard(done);
      return done;
    }
    const r = await llm.brief({ call, kbHits });
    const done: Card = { ...card, body: r.text, sources: r.sources, status: "done" };
    s.saveCard(done);
    return done;
  } catch (err) {
    const failed: Card = { ...card, body: `브리핑을 만들지 못했어요: ${(err as Error).message}`, status: "error" };
    s.saveCard(failed);
    return failed;
  }
}

/** 콜 종료: 남은 분석 마무리 → 콜 메모 생성 → 내 자료로 저장(다음 콜에서 참조됨). */
export async function endCall(callId: string): Promise<string> {
  const call = store.updateCall(callId, { endedAt: Date.now() });
  if (!call) throw new Error("call not found");
  const s = session(callId);
  if (s.timer) clearTimeout(s.timer);
  s.emit("status", { summarizing: true });
  const transcript = store.getSegments(callId);
  const cards = store.getCards(callId);
  const kbHits = kb.search(`${call.counterparty} ${call.title} ${call.hypotheses}`, 6);

  let summary: string;
  if (llmEnabled() && transcript.length) {
    summary = await llm.summarize({ call, transcript, cards, kbHits });
  } else {
    summary = offlineSummary(call, transcript, cards);
  }
  store.saveSummary(callId, summary);
  store.updateCall(callId, { summaryReady: true });

  const date = new Date(call.startedAt).toISOString().slice(0, 10);
  const transcriptText = transcript.map((x) => `${x.speaker}: ${x.text}`).join("\n");
  kb.addText(`[콜] ${date} ${call.title}`, `${summary}\n\n---\n전체 대화\n${transcriptText}`, "call", `call:${callId}`);

  s.emit("status", { summarizing: false, summaryReady: true });
  return summary;
}

function offlineSummary(call: CallMeta, transcript: Segment[], cards: Card[]): string {
  const theirs = transcript.filter((x) => x.speaker !== "나");
  const byType = (t: Card["type"]) => cards.filter((c) => c.type === t);
  return [
    `# ${call.title} — 콜 메모 (오프라인 정리)`,
    `- 상대: ${call.counterparty || "-"} / 발화 ${transcript.length}건 (상대 ${theirs.length}건)`,
    "",
    "## 숫자·가이던스",
    ...(byType("number").map((c) => `- ${c.body}`) || []),
    "",
    "## 후속 질문",
    ...byType("question").map((c) => `- ${c.title}`),
    "",
    "## 내 자료 연결",
    ...byType("kb").map((c) => `- ${c.title}: ${c.body}`),
    "",
    "_ANTHROPIC_API_KEY 를 설정하면 결론·판단 포인트·가설 점검까지 포함한 메모를 만들어요._",
  ].join("\n");
}

export async function createCall(input: Partial<CallMeta>): Promise<CallMeta> {
  const meta: CallMeta = {
    id: newId("call_"),
    title: (input.title || "").trim() || `콜 ${new Date().toLocaleString("ko-KR")}`,
    counterparty: (input.counterparty || "").trim(),
    participants: (input.participants || "").trim(),
    purpose: (input.purpose || "").trim(),
    hypotheses: (input.hypotheses || "").trim(),
    languages: input.languages?.length ? input.languages : ["ko", "en"],
    startedAt: Date.now(),
  };
  store.createCall(meta);
  return meta;
}
