import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, llmEnabled } from "./config.ts";
import * as engine from "./engine.ts";
import { kb } from "./kb.ts";
import { store } from "./store.ts";
import { localSttHealthy, transcribeLocal } from "./local-stt.ts";
import { sonioxTemporaryKey } from "./stt.ts";
import type { Segment } from "./types.ts";
import { newId } from "./util.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, "../public");
const samplesDir = path.resolve(here, "../samples");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webm": "audio/webm",
};

function send(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readBody(req: http.IncomingMessage, limit = 30 * 1024 * 1024): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw Object.assign(new Error("요청이 너무 커요"), { status: 413 });
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  const buf = await readBody(req, 2 * 1024 * 1024);
  return (buf.length ? JSON.parse(buf.toString("utf8")) : {}) as T;
}

function serveStatic(res: http.ServerResponse, urlPath: string): void {
  const rel = urlPath === "/" ? "index.html" : decodeURIComponent(urlPath).replace(/^\/+/, "");
  const file = path.resolve(publicDir, rel);
  if (!file.startsWith(publicDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(file).pipe(res);
}

function serveAudio(req: http.IncomingMessage, res: http.ServerResponse, file: string): void {
  if (!fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  const size = fs.statSync(file).size;
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, {
      "Content-Type": "audio/webm",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "audio/webm", "Content-Length": size, "Accept-Ranges": "bytes" });
    fs.createReadStream(file).pipe(res);
  }
}

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, params: string[], url: URL) => Promise<void> | void;
const routes: [string, RegExp, Handler][] = [];
const route = (method: string, pattern: string, handler: Handler) =>
  routes.push([method, new RegExp("^" + pattern.replace(/:\w+/g, "([^/]+)") + "$"), handler]);

// ── status ──
route("GET", "/api/status", async (_req, res) =>
  send(res, 200, {
    llm: llmEnabled(),
    models: { live: config.liveModel, deep: config.deepModel },
    stt: { soniox: Boolean(config.sonioxKey), local: await localSttHealthy(), localUrl: config.localSttUrl },
    kb: { docs: kb.list().length, chunks: kb.chunkCount, folders: config.kbDirs },
  }),
);

// ── calls ──
route("GET", "/api/calls", (_req, res) => send(res, 200, store.listCalls()));

route("POST", "/api/calls", async (req, res) => send(res, 200, await engine.createCall(await readJsonBody(req))));

route("GET", "/api/calls/:id", (_req, res, [id]) => {
  const call = store.getCall(id);
  if (!call) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  send(res, 200, { call, segments: store.getSegments(id), cards: store.getCards(id), summary: store.getSummary(id) });
});

route("GET", "/api/calls/:id/events", (req, res, [id]) => {
  if (!store.getCall(id)) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.write(`event: hello\ndata: {}\n\n`);
  const ping = setInterval(() => res.write(`: ping\n\n`), 20_000);
  req.on("close", () => clearInterval(ping));
  engine.subscribe(id, res);
});

route("POST", "/api/calls/:id/segments", async (req, res, [id]) => {
  if (!store.getCall(id)) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  const body = await readJsonBody<{ segments: Partial<Segment>[] }>(req);
  const segs: Segment[] = (body.segments ?? [])
    .filter((s) => typeof s.text === "string" && s.text.trim())
    .map((s) => ({ id: s.id || newId("s_"), speaker: String(s.speaker || "상대").slice(0, 20), text: String(s.text).trim(), t: Number(s.t) || 0, lang: s.lang }));
  engine.addSegments(id, segs);
  send(res, 200, { ok: true, count: segs.length });
});

route("POST", "/api/calls/:id/audio", async (req, res, [id]) => {
  if (!store.getCall(id)) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  const buf = await readBody(req, 20 * 1024 * 1024);
  store.appendAudio(id, buf);
  const call = store.getCall(id);
  if (call && !call.hasAudio) store.updateCall(id, { hasAudio: true });
  send(res, 200, { ok: true });
});

route("GET", "/api/calls/:id/audio", (req, res, [id]) => serveAudio(req, res, store.audioPath(id)));

route("POST", "/api/calls/:id/ask", async (req, res, [id]) => {
  const { question } = await readJsonBody<{ question?: string }>(req);
  if (!question?.trim()) return send(res, 400, { error: "질문을 입력해 주세요" });
  send(res, 200, await engine.askQuestion(id, question.trim()));
});

route("POST", "/api/calls/:id/bookmark", async (req, res, [id]) => {
  if (!store.getCall(id)) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  const { t, note } = await readJsonBody<{ t?: number; note?: string }>(req);
  send(res, 200, engine.bookmark(id, Number(t) || 0, note));
});

route("POST", "/api/calls/:id/note", async (req, res, [id]) => {
  if (!store.getCall(id)) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  const { text, t } = await readJsonBody<{ text?: string; t?: number }>(req);
  if (!text?.trim()) return send(res, 400, { error: "메모를 입력해 주세요" });
  engine.addNote(id, text, Number(t) || 0);
  send(res, 200, { ok: true });
});

route("POST", "/api/calls/:id/cards/:cid/feedback", async (req, res, [id, cid]) => {
  const { value } = await readJsonBody<{ value?: "up" | "down" | null }>(req);
  const card = engine.setFeedback(id, cid, value === "up" || value === "down" ? value : null);
  if (!card) return send(res, 404, { error: "카드를 찾을 수 없어요" });
  send(res, 200, card);
});

route("POST", "/api/calls/:id/brief", async (_req, res, [id]) => send(res, 200, await engine.preBrief(id)));

route("POST", "/api/calls/:id/end", async (_req, res, [id]) => send(res, 200, { summary: await engine.endCall(id) }));

route("GET", "/api/calls/:id/export.md", (_req, res, [id]) => {
  const call = store.getCall(id);
  if (!call) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  const segs = store.getSegments(id);
  const md = [
    store.getSummary(id) ?? `# ${call.title}`,
    "\n---\n## 전체 대화\n",
    ...segs.map((s) => `- **${s.speaker}**: ${s.text}`),
    "\n## 통화 중 카드\n",
    ...store.getCards(id).map((c) => `- [${c.type}] **${c.title}** — ${c.body.replace(/\n/g, " ")}`),
  ].join("\n");
  res.writeHead(200, {
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(call.title)}.md"`,
  });
  res.end(md);
});

// ── speech-to-text ──
// 로컬 전사: 브라우저가 자른 발화 WAV → 로컬 whisper → 발화로 저장 (오디오는 외부로 나가지 않음)
route("POST", "/api/calls/:id/stt-local", async (req, res, [id], url) => {
  const call = store.getCall(id);
  if (!call) return send(res, 404, { error: "콜을 찾을 수 없어요" });
  const wav = await readBody(req, 10 * 1024 * 1024);
  const recent = store.getSegments(id).slice(-3).map((s) => s.text).join(" ");
  const prompt = [call.counterparty, call.title, recent].filter(Boolean).join(". ");
  const text = await transcribeLocal(wav, { languages: call.languages, prompt });
  // 미리보기(말하는 도중 자막)는 저장하지 않는다
  if (url.searchParams.get("preview") === "1") return send(res, 200, { text, preview: true });
  if (text) {
    engine.addSegments(id, [
      { id: newId("s_"), speaker: (url.searchParams.get("speaker") || "상대").slice(0, 20), text, t: Number(url.searchParams.get("t")) || 0 },
    ]);
  }
  send(res, 200, { text });
});

route("POST", "/api/stt/soniox-key", async (_req, res) => send(res, 200, await sonioxTemporaryKey()));

// ── knowledge base ──
route("GET", "/api/kb", (_req, res) => send(res, 200, kb.list()));
route("GET", "/api/kb/search", (_req, res, _p, url) => send(res, 200, kb.search(url.searchParams.get("q") ?? "", 8)));
route("POST", "/api/kb/note", async (req, res) => {
  const { title, text } = await readJsonBody<{ title?: string; text?: string }>(req);
  if (!text?.trim()) return send(res, 400, { error: "내용을 입력해 주세요" });
  send(res, 200, kb.addText(title ?? "", text, "note"));
});
route("POST", "/api/kb/upload", async (req, res, _p, url) => {
  const name = url.searchParams.get("name") ?? "upload.txt";
  send(res, 200, await kb.addFile(name, await readBody(req)));
});
route("POST", "/api/kb/sync", async (_req, res) => send(res, 200, await kb.syncFolders()));
route("GET", "/api/kb/:id", (_req, res, [id]) => {
  const text = kb.getText(id);
  if (text === null) return send(res, 404, { error: "자료를 찾을 수 없어요" });
  send(res, 200, { doc: kb.list().find((d) => d.id === id), text });
});
route("DELETE", "/api/kb/:id", (_req, res, [id]) => send(res, kb.remove(id) ? 200 : 404, { ok: true }));

// ── demo ──
route("GET", "/api/demo/script", (_req, res) =>
  send(res, 200, JSON.parse(fs.readFileSync(path.join(samplesDir, "demo-call.json"), "utf8"))),
);
route("POST", "/api/demo/seed", (_req, res) => {
  const dir = path.join(samplesDir, "kb");
  const added = [];
  for (const f of fs.readdirSync(dir)) {
    added.push(kb.addText(f.replace(/\.md$/, ""), fs.readFileSync(path.join(dir, f), "utf8"), "note", `sample:${f}`));
  }
  send(res, 200, { added: added.length });
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      for (const [method, re, handler] of routes) {
        const m = url.pathname.match(re);
        if (m && req.method === method) {
          await handler(req, res, m.slice(1).map(decodeURIComponent), url);
          return;
        }
      }
      return send(res, 404, { error: "없는 경로예요" });
    }
    serveStatic(res, url.pathname);
  } catch (err) {
    const e = err as Error & { status?: number };
    console.error(`[http] ${req.method} ${url.pathname}:`, e.message);
    if (!res.headersSent) send(res, e.status ?? 500, { error: e.message });
    else res.end();
  }
});

await kb.init();
// 개인 통화 녹음이 담기므로 기본은 이 컴퓨터에서만 접속 가능
const host = process.env.HOST ?? "127.0.0.1";
server.listen(config.port, host, () => {
  console.log(`\n  콘콜 코파일럿 → http://localhost:${config.port}`);
  console.log(`  Claude 분석: ${llmEnabled() ? `켜짐 (${config.liveModel})` : "오프라인 모드 (ANTHROPIC_API_KEY 없음)"}`);
  console.log(`  음성인식: ${config.sonioxKey ? "Soniox" : "브라우저 내장 / 데모"}`);
  console.log(`  내 자료: 문서 ${kb.list().length}개, 조각 ${kb.chunkCount}개\n`);
});
