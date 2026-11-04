/**
 * 내 자료(Knowledge Base): 메모·리서치 노트·파일·지난 콜 메모를 색인하고
 * 지금 오가는 대화와 관련된 대목을 찾아준다.
 *
 * 임베딩 API 없이 동작하도록 BM25 + 한글 2-gram 토크나이저를 사용한다.
 * (한국어는 조사가 붙어 단어 단위 매칭이 약하므로 음절 bigram 을 함께 색인)
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.ts";
import { readJson, writeJson } from "./store.ts";
import type { KbChunk, KbDoc, KbHit } from "./types.ts";
import { newId } from "./util.ts";

const HANGUL = /[가-힣]/;
const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are", "was", "were", "be", "we", "you",
  "it", "that", "this", "with", "as", "at", "by", "our", "so", "um", "uh", "yeah", "i", "they", "have", "has",
  "그리고", "그래서", "근데", "이제", "저희", "그", "이", "저", "것", "수", "좀", "네", "예", "아", "음", "뭐",
]);

export function tokenize(text: string): string[] {
  const out: string[] = [];
  const words = text.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}.%]+/u);
  for (let w of words) {
    w = w.replace(/^\.+|\.+$/g, "");
    if (!w || STOP.has(w)) continue;
    if (HANGUL.test(w)) {
      if (w.length <= 2) {
        out.push(w);
      } else {
        for (let i = 0; i < w.length - 1; i++) out.push(w.slice(i, i + 2));
      }
    } else if (w.length > 1 || /\d/.test(w)) {
      out.push(w);
    }
  }
  return out;
}

export function chunkText(text: string, size = 700, overlap = 120): string[] {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= size) return clean ? [clean] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(clean.length, start + size);
    if (end < clean.length) {
      const para = clean.lastIndexOf("\n", end);
      const sent = Math.max(clean.lastIndexOf(". ", end), clean.lastIndexOf("다. ", end));
      const cut = para > start + size * 0.5 ? para : sent > start + size * 0.5 ? sent + 1 : end;
      end = cut;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks.filter(Boolean);
}

interface IndexedChunk extends KbChunk {
  tf: Map<string, number>;
  len: number;
}

/** In-memory BM25 index. */
export class Bm25Index {
  private chunks: IndexedChunk[] = [];
  private df = new Map<string, number>();
  private avgLen = 0;
  private k1 = 1.4;
  private b = 0.7;

  add(chunk: KbChunk): void {
    const toks = tokenize(chunk.title + " " + chunk.text);
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    this.chunks.push({ ...chunk, tf, len: toks.length });
    this.avgLen = this.chunks.reduce((s, c) => s + c.len, 0) / this.chunks.length;
  }

  removeDoc(docId: string): void {
    const keep: IndexedChunk[] = [];
    for (const c of this.chunks) {
      if (c.docId === docId) {
        for (const t of c.tf.keys()) this.df.set(t, (this.df.get(t) ?? 1) - 1);
      } else keep.push(c);
    }
    this.chunks = keep;
    this.avgLen = keep.length ? keep.reduce((s, c) => s + c.len, 0) / keep.length : 0;
  }

  get size(): number {
    return this.chunks.length;
  }

  search(query: string, k = 5, opts: { excludeDocIds?: string[] } = {}): KbHit[] {
    const qTokens = [...new Set(tokenize(query))];
    if (!qTokens.length || !this.chunks.length) return [];
    const N = this.chunks.length;
    const scored: KbHit[] = [];
    for (const c of this.chunks) {
      if (opts.excludeDocIds?.includes(c.docId)) continue;
      let score = 0;
      let matched = 0;
      for (const q of qTokens) {
        const f = c.tf.get(q);
        if (!f) continue;
        matched++;
        const df = this.df.get(q) ?? 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        score += idf * ((f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * c.len) / (this.avgLen || 1))));
      }
      // 여러 단서가 함께 맞는 대목을 우대 (한 단어만 겹치는 우연한 매칭 억제)
      if (matched >= 2) {
        scored.push({ docId: c.docId, title: c.title, idx: c.idx, text: c.text, score: score * (matched / qTokens.length + 0.5) });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    // 같은 문서에서 너무 많이 나오지 않도록 문서당 2개 제한
    const perDoc = new Map<string, number>();
    const out: KbHit[] = [];
    for (const h of scored) {
      const n = perDoc.get(h.docId) ?? 0;
      if (n >= 2) continue;
      perDoc.set(h.docId, n + 1);
      out.push(h);
      if (out.length >= k) break;
    }
    return out;
  }
}

const TEXT_EXT = new Set([".md", ".markdown", ".txt", ".csv", ".json", ".tsv"]);
const SUPPORTED_EXT = new Set([...TEXT_EXT, ".pdf"]);

async function extractText(filename: string, buf: Buffer): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await pdfText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  return buf.toString("utf8");
}

class KnowledgeBase {
  private index = new Bm25Index();
  private docs: KbDoc[] = [];
  private dir = () => path.join(config.dataDir, "kb");
  private textFile = (id: string) => path.join(this.dir(), "text", `${id}.txt`);

  async init(): Promise<void> {
    this.index = new Bm25Index();
    this.docs = readJson<KbDoc[]>(path.join(this.dir(), "docs.json"), []);
    for (const d of this.docs) {
      const text = fs.existsSync(this.textFile(d.id)) ? fs.readFileSync(this.textFile(d.id), "utf8") : "";
      this.indexDoc(d, text);
    }
    await this.syncFolders();
  }

  private persist(): void {
    writeJson(path.join(this.dir(), "docs.json"), this.docs);
  }

  private indexDoc(doc: KbDoc, text: string): void {
    chunkText(text).forEach((t, idx) => this.index.add({ docId: doc.id, title: doc.title, idx, text: t }));
  }

  list(): KbDoc[] {
    return [...this.docs].sort((a, b) => b.addedAt - a.addedAt);
  }

  getText(id: string): string | null {
    const f = this.textFile(id);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
  }

  addText(title: string, text: string, kind: KbDoc["kind"] = "note", source?: string): KbDoc {
    // 같은 출처(파일 경로/콜 id)는 덮어쓰기
    if (source) {
      const prev = this.docs.find((d) => d.source === source);
      if (prev) this.remove(prev.id);
    }
    const doc: KbDoc = { id: newId("kb_"), title: title.trim() || "제목 없음", kind, source, addedAt: Date.now(), chars: text.length };
    fs.mkdirSync(path.dirname(this.textFile(doc.id)), { recursive: true });
    fs.writeFileSync(this.textFile(doc.id), text);
    this.docs.push(doc);
    this.indexDoc(doc, text);
    this.persist();
    return doc;
  }

  async addFile(filename: string, buf: Buffer, source?: string): Promise<KbDoc> {
    const ext = path.extname(filename).toLowerCase();
    if (!SUPPORTED_EXT.has(ext)) throw new Error(`지원하지 않는 형식이에요: ${ext} (md, txt, csv, json, pdf 가능)`);
    const text = await extractText(filename, buf);
    return this.addText(path.basename(filename), text, "file", source ?? `upload:${filename}`);
  }

  remove(id: string): boolean {
    const i = this.docs.findIndex((d) => d.id === id);
    if (i < 0) return false;
    this.docs.splice(i, 1);
    this.index.removeDoc(id);
    fs.rmSync(this.textFile(id), { force: true });
    this.persist();
    return true;
  }

  /** KB_DIRS 폴더의 파일을 (수정 시각 기준으로) 다시 색인. */
  async syncFolders(): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;
    for (const root of config.kbDirs) {
      if (!fs.existsSync(root)) continue;
      const walk = (dir: string): string[] =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
          if (e.name.startsWith(".")) return [];
          const p = path.join(dir, e.name);
          return e.isDirectory() ? walk(p) : SUPPORTED_EXT.has(path.extname(e.name).toLowerCase()) ? [p] : [];
        });
      for (const file of walk(root)) {
        const stat = fs.statSync(file);
        const source = `file:${file}`;
        const prev = this.docs.find((d) => d.source === source);
        if (prev && prev.addedAt >= stat.mtimeMs) {
          skipped++;
          continue;
        }
        try {
          const text = await extractText(file, fs.readFileSync(file));
          this.addText(path.relative(root, file), text, "file", source);
          added++;
        } catch (err) {
          console.warn(`[kb] ${file} 색인 실패:`, (err as Error).message);
        }
      }
    }
    return { added, skipped };
  }

  search(query: string, k = 5, opts?: { excludeDocIds?: string[] }): KbHit[] {
    return this.index.search(query, k, opts);
  }

  get chunkCount(): number {
    return this.index.size;
  }
}

export const kb = new KnowledgeBase();
