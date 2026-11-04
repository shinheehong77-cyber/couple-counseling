import fs from "node:fs";
import path from "node:path";
import { config } from "./config.ts";
import type { CallMeta, Card, Segment } from "./types.ts";

const callsDir = () => path.join(config.dataDir, "calls");
const callDir = (id: string) => {
  if (!/^[a-z0-9_-]+$/i.test(id)) throw new Error("bad call id");
  return path.join(callsDir(), id);
};

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

export const store = {
  createCall(meta: CallMeta): void {
    fs.mkdirSync(callDir(meta.id), { recursive: true });
    writeJson(path.join(callDir(meta.id), "meta.json"), meta);
  },

  getCall(id: string): CallMeta | null {
    return readJson<CallMeta | null>(path.join(callDir(id), "meta.json"), null);
  },

  updateCall(id: string, patch: Partial<CallMeta>): CallMeta | null {
    const cur = this.getCall(id);
    if (!cur) return null;
    const next = { ...cur, ...patch, id: cur.id };
    writeJson(path.join(callDir(id), "meta.json"), next);
    return next;
  },

  listCalls(): CallMeta[] {
    if (!fs.existsSync(callsDir())) return [];
    return fs
      .readdirSync(callsDir())
      .map((id) => this.getCall(id))
      .filter((m): m is CallMeta => m !== null)
      .sort((a, b) => b.startedAt - a.startedAt);
  },

  appendSegments(id: string, segs: Segment[]): void {
    if (!segs.length) return;
    fs.appendFileSync(
      path.join(callDir(id), "segments.jsonl"),
      segs.map((s) => JSON.stringify(s)).join("\n") + "\n",
    );
  },

  getSegments(id: string): Segment[] {
    const file = path.join(callDir(id), "segments.jsonl");
    if (!fs.existsSync(file)) return [];
    return fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Segment);
  },

  getCards(id: string): Card[] {
    return readJson<Card[]>(path.join(callDir(id), "cards.json"), []);
  },

  upsertCard(id: string, card: Card): void {
    const cards = this.getCards(id);
    const i = cards.findIndex((c) => c.id === card.id);
    if (i >= 0) cards[i] = card;
    else cards.push(card);
    writeJson(path.join(callDir(id), "cards.json"), cards);
  },

  appendAudio(id: string, chunk: Buffer): void {
    fs.appendFileSync(path.join(callDir(id), "audio.webm"), chunk);
  },

  audioPath(id: string): string {
    return path.join(callDir(id), "audio.webm");
  },

  saveSummary(id: string, markdown: string): void {
    fs.writeFileSync(path.join(callDir(id), "summary.md"), markdown);
  },

  getSummary(id: string): string | null {
    const f = path.join(callDir(id), "summary.md");
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
  },
};

export { readJson, writeJson };
