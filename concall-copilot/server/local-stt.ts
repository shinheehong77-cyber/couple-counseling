/**
 * 로컬 전사 엔진 연결.
 * - whispercpp: whisper.cpp 의 whisper-server (/inference, multipart)
 * - openai:     OpenAI 호환 로컬 서버 (/v1/audio/transcriptions — speaches, mlx 기반 서버 등)
 * 오디오는 이 컴퓨터 밖으로 나가지 않는다.
 */
import { config } from "./config.ts";

// Whisper 가 무음·잡음에서 지어내는 대표 문구 (유튜브 자막 학습의 흔적)
const HALLUCINATIONS = [
  /시청(해)?\s*주셔서\s*감사합니다/,
  /구독(과|이랑)?\s*좋아요/,
  /^(mbc|kbs|sbs|ytn)\s*뉴스/i,
  /자막\s*(제공|제작)/,
  /thank(s| you) for watching/i,
  /subtitles? (by|provided)/i,
  /^\s*[\[(](음악|박수|웃음|music|blank_audio|silence|inaudible)[\])]\s*$/i,
  /^[\s.,!?…~\-]*$/,
];

export function cleanTranscript(text: string): string {
  let t = text.replace(/\[BLANK_AUDIO\]|\(\s*\)|\[\s*\]/gi, " ").replace(/\s+/g, " ").trim();
  // 같은 구절 반복("네 네 네 네 …") 정리
  t = t.replace(/(\S+)(?:\s+\1){4,}/g, "$1");
  if (HALLUCINATIONS.some((re) => re.test(t))) return "";
  return t;
}

export async function localSttHealthy(): Promise<boolean> {
  if (!config.localSttUrl) return false;
  try {
    const res = await fetch(new URL("/", config.localSttUrl), { signal: AbortSignal.timeout(800) });
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function transcribeLocal(wav: Buffer, opts: { languages: string[]; prompt?: string }): Promise<string> {
  const language = opts.languages.length === 1 ? opts.languages[0] : "auto";
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "chunk.wav");
  form.append("response_format", "json");
  form.append("temperature", "0.0");
  if (opts.prompt) form.append("prompt", opts.prompt.slice(-600));

  let url: URL;
  if (config.localSttApi === "openai") {
    url = new URL("/v1/audio/transcriptions", config.localSttUrl);
    form.append("model", config.localSttModel);
    if (language !== "auto") form.append("language", language);
  } else {
    url = new URL("/inference", config.localSttUrl);
    form.append("language", language);
    form.append("temperature_inc", "0.2");
    form.append("no_timestamps", "true");
  }

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
  } catch {
    throw Object.assign(new Error(`로컬 전사 엔진(${config.localSttUrl})에 연결할 수 없어요. 'npm run stt' 로 먼저 켜주세요.`), { status: 503 });
  }
  if (!res.ok) throw Object.assign(new Error(`로컬 전사 실패 (${res.status}): ${(await res.text()).slice(0, 200)}`), { status: 502 });
  const data = (await res.json()) as { text?: string };
  return cleanTranscript(data.text ?? "");
}
