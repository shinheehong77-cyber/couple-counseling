/**
 * 로컬 전사 경로 확인:
 * 가짜 마이크(톤 버스트 WAV) → 브라우저 VAD/16kHz WAV 인코딩 → /stt-local → whisper.cpp 형식 서버(대역)
 * → 발화 저장 → 카드. 실제 Whisper 모델 대신 같은 /inference 계약을 따르는 대역 서버를 쓴다.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = 4198;
const STT_PORT = 4197;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "concall-local-"));

// 1) 가짜 마이크 입력: 말소리처럼 켜졌다 꺼지는 톤
function writeBurstWav(file: string) {
  const rate = 44100;
  const parts: number[] = [];
  const silence = (s: number) => { for (let i = 0; i < s * rate; i++) parts.push(0); };
  const burst = (s: number, f: number) => {
    for (let i = 0; i < s * rate; i++) {
      const env = Math.min(1, i / 2000, (s * rate - i) / 2000);
      parts.push(0.35 * env * (Math.sin((2 * Math.PI * f * i) / rate) + 0.5 * Math.sin((2 * Math.PI * f * 2.7 * i) / rate)) * (0.7 + 0.3 * Math.sin(i / 900)));
    }
  };
  for (let k = 0; k < 4; k++) { silence(0.8); burst(1.6, 180 + k * 40); silence(1.2); }
  silence(0.5); burst(6.5, 260); silence(1.5); // 긴 발화 → 말하는 도중 미리보기 자막
  const buf = Buffer.alloc(44 + parts.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + parts.length * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(parts.length * 2, 40);
  parts.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  fs.writeFileSync(file, buf);
}
const fakeMic = path.join(tmp, "mic.wav");
writeBurstWav(fakeMic);

// 2) whisper.cpp /inference 대역
const lines = [
  "3분기 매출은 1,240억 원으로 전년 대비 38% 성장했습니다.",
  "HBM용 TC 본더 출하가 늘었고 올해 수주는 30대 초중반으로 보고 있습니다.",
  "시청해주셔서 감사합니다.", // 환각 문구 → 걸러져야 함
  "4분기 가이던스는 매출 1,100억에서 1,200억 사이입니다.",
];
const received: { rate: number; bytes: number; fields: string[] }[] = [];
const stt = http.createServer((req, res) => {
  if (req.method === "GET") return res.end("ok");
  const chunks: Buffer[] = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const riff = body.indexOf("RIFF");
    const fields = [...body.toString("latin1").matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
    received.push({ rate: riff >= 0 ? body.readUInt32LE(riff + 24) : -1, bytes: body.length, fields });
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ text: lines[(received.length - 1) % lines.length] }));
  });
});
await new Promise<void>((r) => stt.listen(STT_PORT, "127.0.0.1", r));

const server = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: path.join(tmp, "data"), COPILOT_MOCK: "1", LIVE_MIN_INTERVAL_MS: "2000", LIVE_MIN_NEW_CHARS: "40", KB_DIRS: "", LOCAL_STT_URL: `http://127.0.0.1:${STT_PORT}` },
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise<void>((resolve) => server.stdout!.on("data", (d) => String(d).includes("콘콜 코파일럿") && resolve()));

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${fakeMic}`, "--autoplay-policy=no-user-gesture-required"],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e: Error) => console.error("[pageerror]", e.message));
  let previews = 0;
  page.on("request", (r: { url(): string }) => { if (r.url().includes("preview=1")) previews++; });
  await page.goto(`http://127.0.0.1:${PORT}/#/`);
  await page.waitForSelector("text=로컬 전사 켜짐");
  await page.check("input[name=mode][value=local]");
  await page.uncheck("input[name=system]");
  await page.fill("#f-title", "로컬 전사 테스트");
  await page.click("#setup button[type=submit]");

  await page.waitForFunction(() => document.querySelectorAll(".seg[data-t]").length >= 4, null, { timeout: 40000 });
  await page.waitForFunction(() => document.querySelectorAll(".icard").length >= 1, null, { timeout: 15000 });
  const segs = await page.$$eval(".seg[data-t] .txt", (els: Element[]) => els.map((e) => e.textContent));
  const who = await page.$$eval(".seg[data-t] .who", (els: Element[]) => [...new Set(els.map((e) => e.textContent))]);
  console.log("segments:", segs.length, "speakers:", who.join(","));
  console.log("stt requests:", received.length, "sample rates:", [...new Set(received.map((r) => r.rate))].join(","), "fields:", received[0]?.fields.join(","));
  if (received.some((r) => r.rate !== 16000)) throw new Error("WAV 가 16kHz 가 아님");
  if (!received[0]?.fields.includes("file") || !received[0]?.fields.includes("language")) throw new Error("whisper.cpp 요청 필드 누락");
  if (segs.some((t: string | null) => t?.includes("시청해주셔서"))) throw new Error("환각 문구가 걸러지지 않음");
  if (!who.includes("마이크")) throw new Error("화자 라벨 이상");
  console.log("preview requests:", previews);
  if (previews < 1) throw new Error("긴 발화에서 미리보기 자막 요청이 없음");
  await page.click("#end");
  await page.waitForSelector("#summary:not([hidden])", { timeout: 15000 });
  const call = (await (await fetch(`http://127.0.0.1:${PORT}/api/calls`)).json())[0];
  const audio = await fetch(`http://127.0.0.1:${PORT}/api/calls/${call.id}/audio`);
  console.log("recording bytes:", (await audio.arrayBuffer()).byteLength);
  console.log("LOCAL E2E OK");
} finally {
  await browser.close();
  server.kill();
  stt.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
