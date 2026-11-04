import fs from "node:fs";
import path from "node:path";

/** Minimal .env loader so the app runs with zero extra dependencies. */
function loadDotEnv(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(path.resolve(process.cwd(), ".env"));

const env = (k: string, d = ""): string => (process.env[k] ?? d).trim();

export const config = {
  port: Number(env("PORT", "4100")),
  dataDir: path.resolve(env("DATA_DIR", "./data")),
  anthropicKey: env("ANTHROPIC_API_KEY"),
  liveModel: env("LIVE_MODEL", "claude-opus-5-5"),
  deepModel: env("DEEP_MODEL", "claude-opus-5-5"),
  sonioxKey: env("SONIOX_API_KEY"),
  /** 로컬 전사 서버 (whisper.cpp whisper-server 기본 포트를 8178 로 띄우는 것을 권장) */
  localSttUrl: env("LOCAL_STT_URL", "http://127.0.0.1:8178"),
  localSttApi: env("LOCAL_STT_API", "whispercpp") as "whispercpp" | "openai",
  localSttModel: env("LOCAL_STT_MODEL", "whisper-1"),
  kbDirs: env("KB_DIRS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /** Force offline heuristics even if a key is present (tests, demos). */
  forceMock: env("COPILOT_MOCK") === "1",
  /** Seconds of quiet / words of new speech before a live analysis round. */
  liveMinIntervalMs: Number(env("LIVE_MIN_INTERVAL_MS", "12000")),
  liveMinNewChars: Number(env("LIVE_MIN_NEW_CHARS", "120")),
};

export const llmEnabled = (): boolean => Boolean(config.anthropicKey) && !config.forceMock;
