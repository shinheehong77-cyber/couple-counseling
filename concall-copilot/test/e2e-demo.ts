/**
 * 브라우저로 전체 흐름 확인 (오프라인 모드):
 * 데모 자료 넣기 → 데모 콜 재생 → 실시간 카드 → 질문 → 종료 & 메모 → 지난 콜/내 자료 확인
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = 4199;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "concall-e2e-"));
const outDir = path.resolve(process.env.SHOT_DIR ?? "test-results");
fs.mkdirSync(outDir, { recursive: true });

const server = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, COPILOT_MOCK: "1", LIVE_MIN_INTERVAL_MS: "3000", LIVE_MIN_NEW_CHARS: "60", KB_DIRS: "" },
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise<void>((resolve) => server.stdout!.on("data", (d) => String(d).includes("콘콜 코파일럿") && resolve()));

const browser = await chromium.launch();
const fail = (msg: string) => { throw new Error(msg); };
try {
  const page = await browser.newPage({ viewport: { width: 1380, height: 860 }, deviceScaleFactor: 2 });
  page.on("pageerror", (e: Error) => console.error("[pageerror]", e.message));
  await page.goto(`http://127.0.0.1:${PORT}/?demoSpeed=4#/`);

  await page.click("#seed");
  await page.waitForSelector("text=내 자료 2건");
  await page.click("#prefill-demo");
  await page.screenshot({ path: path.join(outDir, "1-setup.png") });
  await page.click("#setup button[type=submit]");

  await page.waitForSelector(".seg[data-t]", { timeout: 15000 });
  await page.waitForFunction(() => document.querySelectorAll(".icard").length >= 4, null, { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll(".seg[data-t]").length >= 12, null, { timeout: 40000 });
  await page.waitForTimeout(3500);

  // 📌 표시 · 메모 · 피드백
  await page.click("#mark");
  await page.waitForSelector(".icard.t-bookmark", { timeout: 5000 });
  await page.fill("#ask input", "CFO가 수주 얘기할 때 말끝을 흐림");
  await page.click("#ask button[value=note]");
  await page.waitForSelector(".seg.note", { timeout: 5000 });
  const firstTech = page.locator(".icard.t-tech").first();
  await firstTech.locator("[data-fb=down]").click();
  await page.waitForSelector(".icard.t-tech.fb-down", { timeout: 5000 });

  await page.fill("#ask input", "하이브리드 본딩 일정이 지난번 메모랑 달라?");
  await page.click("#ask button");
  await page.waitForSelector(".icard.t-answer:not(.pending)", { timeout: 10000 });
  await page.screenshot({ path: path.join(outDir, "2-live.png") });

  const kinds = await page.$$eval(".icard .kind", (els: Element[]) => [...new Set(els.map((e: Element) => e.textContent))]);
  console.log("card kinds:", kinds.join(", "));
  for (const k of ["숫자", "기술", "내 자료", "질문", "답변", "📌 표시"]) if (!kinds.includes(k)) fail(`missing card kind ${k}`);

  await page.click("#end");
  await page.waitForSelector("#summary:not([hidden])", { timeout: 15000 });
  await page.screenshot({ path: path.join(outDir, "3-summary.png") });
  const summaryText = await page.textContent("#summary");
  if (!summaryText?.includes("내가 표시한 순간") || !summaryText.includes("말끝을 흐림")) fail("콜 메모에 표시/메모가 빠짐");
  const prefs = JSON.parse(fs.readFileSync(path.join(dataDir, "prefs.json"), "utf8"));
  if (prefs.feedback?.[0]?.value !== "down") fail("피드백이 저장되지 않음");

  await page.goto(`http://127.0.0.1:${PORT}/#/kb`);
  await page.waitForSelector("text=콜 메모");
  await page.goto(`http://127.0.0.1:${PORT}/#/calls`);
  await page.waitForSelector(".item .tag:text('메모')");

  const narrow = await browser.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2 });
  const calls = await (await fetch(`http://127.0.0.1:${PORT}/api/calls`)).json();
  await narrow.goto(`http://127.0.0.1:${PORT}/#/call/${calls[0].id}`);
  await narrow.waitForSelector(".icard");
  await narrow.screenshot({ path: path.join(outDir, "4-narrow.png") });
  console.log("E2E OK — screenshots in", outDir);
} finally {
  await browser.close();
  server.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
