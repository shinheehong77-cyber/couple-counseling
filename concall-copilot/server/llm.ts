/**
 * Claude 호출부. 모든 호출은 공식 @anthropic-ai/sdk 사용.
 * - live: 구조화 출력(JSON)으로 카드 생성, effort low (지연 최소화)
 * - web/ask/brief: web_search 서버 도구 사용
 * - summary: 콜 종료 메모, effort high
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { config } from "./config.ts";
import { ASK_SYSTEM, BRIEF_SYSTEM, LIVE_SYSTEM, SUMMARY_SYSTEM, WEB_SYSTEM } from "./prompts.ts";
import type { CallMeta, Card, KbHit, Segment, Source } from "./types.ts";
import { clip, formatClock } from "./util.ts";

let client: Anthropic | null = null;
const getClient = (): Anthropic => (client ??= new Anthropic({ apiKey: config.anthropicKey }));

// 안전 분류기가 요청을 거절하면 서버 측에서 권장 대체 모델로 재시도
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const WEB_SEARCH = (maxUses: number) =>
  ({ type: "web_search_20260209", name: "web_search", max_uses: maxUses }) as const;

export function formatSegments(segs: Segment[]): string {
  return segs.map((s) => `[${formatClock(s.t)}] ${s.speaker}: ${s.text}`).join("\n");
}

export function formatCallInfo(call: CallMeta): string {
  return [
    `제목: ${call.title}`,
    call.counterparty && `상대(회사/기관): ${call.counterparty}`,
    call.participants && `참석자: ${call.participants}`,
    call.purpose && `콜 목적: ${call.purpose}`,
    call.hypotheses && `내 가설/확인할 것:\n${call.hypotheses}`,
    `언어: ${call.languages.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatKb(hits: KbHit[]): string {
  if (!hits.length) return "(관련 자료 없음)";
  return hits.map((h) => `<doc id="${h.docId}" title="${h.title}">\n${clip(h.text, 900)}\n</doc>`).join("\n");
}

// ── live cards ──────────────────────────────────────────────

// enum 은 SDK 변환 시 설명으로만 들어가므로 문자열로 받고 서버에서 정규화한다
const LiveCard = z.object({
  type: z.string().describe("judgment | question | tech | number | kb"),
  title: z.string(),
  body: z.string(),
  quote: z.string(),
  priority: z.number().describe("1 | 2 | 3"),
  kb_doc_ids: z.array(z.string()),
  web_query: z.string(),
});
const LiveOutput = z.object({ cards: z.array(LiveCard) });
export interface LiveCardOut {
  type: "judgment" | "question" | "tech" | "number" | "kb";
  title: string;
  body: string;
  quote: string;
  priority: number;
  kb_doc_ids: string[];
  web_query: string;
}
const LIVE_TYPES = new Set(["judgment", "question", "tech", "number", "kb"]);

export async function liveCards(input: {
  call: CallMeta;
  earlier: Segment[];
  fresh: Segment[];
  kbHits: KbHit[];
  existing: Card[];
}): Promise<LiveCardOut[]> {
  const existingList = input.existing.length
    ? input.existing.slice(-30).map((c) => `- [${c.type}] ${c.title}`).join("\n")
    : "(아직 없음)";

  const msg = await getClient().beta.messages.parse({
    model: config.liveModel,
    max_tokens: 4000,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(LiveOutput) },
    system: LIVE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            // 콜 정보 + 이전 대화: 라운드마다 뒤에만 붙으므로 캐시가 잘 맞는다
            type: "text",
            text: `[콜 정보]\n${formatCallInfo(input.call)}\n\n[지금까지의 대화]\n${formatSegments(input.earlier) || "(없음)"}`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text:
              `[새 발언 — 이번에 분석할 부분]\n${formatSegments(input.fresh)}\n\n` +
              `[내 자료 중 관련 대목]\n${formatKb(input.kbHits)}\n\n` +
              `[이미 띄운 카드]\n${existingList}\n\n` +
              `새 발언을 기준으로 지금 사용자에게 필요한 카드를 만드세요. 지연 민감: 바로 답하세요.`,
          },
        ],
      },
    ],
  });
  if (msg.stop_reason === "refusal") return [];
  return (msg.parsed_output?.cards ?? [])
    .filter((c) => c.title.trim())
    .map((c) => ({
      ...c,
      type: (LIVE_TYPES.has(c.type) ? c.type : "judgment") as LiveCardOut["type"],
      priority: Math.round(c.priority) || 2,
    }));
}

// ── web / ask / brief: free text + web search ───────────────

type BetaMessageParam = Anthropic.Beta.Messages.BetaMessageParam;

interface ResearchResult {
  text: string;
  sources: Source[];
}

async function research(opts: {
  system: string;
  user: string;
  maxSearches: number;
  effort: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<ResearchResult> {
  const messages: BetaMessageParam[] = [{ role: "user", content: opts.user }];
  const sources = new Map<string, Source>();
  let text = "";

  // pause_turn 이면 같은 요청을 이어서 보낸다 (서버 도구 루프)
  for (let i = 0; i < 4; i++) {
    const stream = getClient().beta.messages.stream({
      model: config.deepModel,
      max_tokens: opts.maxTokens ?? 8000,
      ...FALLBACK,
      output_config: { effort: opts.effort },
      system: opts.system,
      tools: opts.maxSearches > 0 ? [WEB_SEARCH(opts.maxSearches)] : undefined,
      messages,
    });
    const msg = await stream.finalMessage();
    for (const block of msg.content) {
      if (block.type === "text") {
        text += block.text;
        for (const c of block.citations ?? []) {
          if (c.type === "web_search_result_location" && !sources.has(c.url)) {
            sources.set(c.url, { title: c.title ?? c.url, url: c.url });
          }
        }
      } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const r of block.content) {
          if (r.type === "web_search_result" && !sources.has(r.url) && sources.size < 12) {
            sources.set(r.url, { title: r.title, url: r.url });
          }
        }
      }
    }
    if (msg.stop_reason === "refusal") {
      text ||= "이 질문은 답하기 어려워요. 표현을 바꿔서 다시 물어봐 주세요.";
      break;
    }
    if (msg.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: msg.content });
  }
  // 인용된 출처를 앞쪽으로: citation 으로 들어온 것이 먼저 set 되었으므로 그대로 사용
  return { text: text.trim(), sources: [...sources.values()].slice(0, 6) };
}

export function webCheck(input: { call: CallMeta; quote: string; query: string; context: Segment[] }): Promise<ResearchResult> {
  return research({
    system: WEB_SYSTEM,
    user:
      `[콜 정보]\n${formatCallInfo(input.call)}\n\n[최근 대화]\n${formatSegments(input.context)}\n\n` +
      `[확인할 발언]\n${input.quote}\n\n[검색 방향]\n${input.query}`,
    maxSearches: 3,
    effort: "low",
  });
}

export function ask(input: { call: CallMeta; question: string; transcript: Segment[]; kbHits: KbHit[] }): Promise<ResearchResult> {
  return research({
    system: ASK_SYSTEM,
    user:
      `[콜 정보]\n${formatCallInfo(input.call)}\n\n[지금까지의 대화]\n${formatSegments(input.transcript) || "(아직 없음)"}\n\n` +
      `[내 자료 중 관련 대목]\n${formatKb(input.kbHits)}\n\n[질문]\n${input.question}`,
    maxSearches: 4,
    effort: "medium",
  });
}

export function brief(input: { call: CallMeta; kbHits: KbHit[] }): Promise<ResearchResult> {
  return research({
    system: BRIEF_SYSTEM,
    user: `[콜 정보]\n${formatCallInfo(input.call)}\n\n[내 자료 중 관련 대목]\n${formatKb(input.kbHits)}\n\n오늘 날짜: ${new Date().toISOString().slice(0, 10)}`,
    maxSearches: 5,
    effort: "medium",
  });
}

export async function summarize(input: { call: CallMeta; transcript: Segment[]; cards: Card[]; kbHits: KbHit[] }): Promise<string> {
  const cards = input.cards.map((c) => `- [${c.type}] ${c.title}: ${c.body}`).join("\n") || "(없음)";
  const res = await research({
    system: SUMMARY_SYSTEM,
    user:
      `[콜 정보]\n${formatCallInfo(input.call)}\n\n[전체 대화]\n${formatSegments(input.transcript)}\n\n` +
      `[통화 중 띄웠던 카드]\n${cards}\n\n[내 자료 중 관련 대목]\n${formatKb(input.kbHits)}`,
    maxSearches: 0,
    effort: "high",
    maxTokens: 16000,
  });
  return res.text;
}
