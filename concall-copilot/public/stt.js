// 실시간 음성인식 제공자들. 공통 인터페이스:
//   const s = await createX(..., { onPartial(key, speaker, text), onFinal({speaker, text, t, lang}), onError(msg) })
//   s.pause(); s.resume(); await s.stop();

const SONIOX_URL = "wss://stt-rt.soniox.com/transcribe-websocket";

/**
 * Soniox: 한/영 혼용(code-switching), 화자 분리, 발화 끝 감지 지원.
 * 브라우저 → Soniox 직결 (서버가 발급한 1회용 임시 키 사용).
 */
export async function createSoniox(stream, { label, diarize, languages, context, startedAt, handlers }) {
  const res = await fetch("/api/stt/soniox-key", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "음성인식 키 발급 실패");

  const ws = new WebSocket(SONIOX_URL, ["soniox-api-key", data.apiKey]);
  let final = []; // 확정 토큰(아직 발화로 묶이지 않은 것)
  let paused = false;
  let closed = false;
  let flushTimer = null;
  let firstMs = null;

  const speakerName = (spk) => {
    if (!diarize) return label;
    if (!spk) return label;
    return spk === "1" ? label : `${label} ${spk}`;
  };

  const flush = () => {
    clearTimeout(flushTimer);
    if (!final.length) return;
    // 화자가 바뀌는 지점마다 발화를 나눈다
    let cur = null;
    for (const tok of final) {
      const spk = speakerName(tok.speaker);
      if (!cur || cur.speaker !== spk) {
        if (cur && cur.text.trim()) handlers.onFinal(cur);
        cur = { speaker: spk, text: "", t: tok.wallMs - startedAt, lang: tok.language };
      }
      cur.text += tok.text;
    }
    if (cur && cur.text.trim()) handlers.onFinal({ ...cur, text: cur.text.trim() });
    final = [];
    handlers.onPartial(label, null, "");
  };

  const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? { mimeType: "audio/webm;codecs=opus" } : undefined);
  recorder.ondataavailable = async (e) => {
    if (paused || ws.readyState !== WebSocket.OPEN || !e.data.size) return;
    ws.send(await e.data.arrayBuffer());
  };

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        model: "stt-rt-v5",
        audio_format: "auto",
        language_hints: languages,
        enable_language_identification: true,
        enable_speaker_diarization: diarize,
        enable_endpoint_detection: true,
        context,
      }),
    );
    recorder.start(250);
  };

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.error_code) {
      handlers.onError(`음성인식 오류: ${msg.error_message || msg.error_type}`);
      return;
    }
    let partial = "";
    let endpoint = false;
    for (const tok of msg.tokens || []) {
      if (tok.text === "<end>" || tok.text === "<fin>") {
        endpoint = true;
        continue;
      }
      if (tok.translation_status === "translation") continue;
      if (tok.is_final) {
        if (firstMs === null) firstMs = Date.now() - (tok.start_ms ?? 0);
        final.push({ ...tok, wallMs: firstMs + (tok.start_ms ?? 0) });
      } else partial += tok.text;
    }
    const pending = final.map((t) => t.text).join("") + partial;
    handlers.onPartial(label, null, pending);
    const finalLen = final.reduce((n, t) => n + t.text.length, 0);
    if (endpoint || finalLen > 280) flush();
    else if (final.length) {
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 2500); // 발화 끝 신호가 없어도 2.5초 조용하면 확정
    }
    if (msg.finished) flush();
  };

  ws.onerror = () => handlers.onError("음성인식 연결에 문제가 생겼어요.");
  ws.onclose = () => {
    if (!closed) handlers.onError("음성인식 연결이 끊겼어요. 일시정지 후 다시 시작해 주세요.");
  };

  const keepalive = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN && paused) ws.send(JSON.stringify({ type: "keepalive" }));
  }, 15000);

  return {
    pause() { paused = true; flush(); },
    resume() { paused = false; },
    async stop() {
      closed = true;
      clearInterval(keepalive);
      if (recorder.state !== "inactive") recorder.stop();
      flush();
      if (ws.readyState === WebSocket.OPEN) ws.send("");
      setTimeout(() => ws.close(), 1500);
    },
  };
}

/** 브라우저 내장 인식 (Chrome). 마이크만, 한 언어만. 키가 없을 때의 대안. */
export function createWebSpeech({ label, lang, startedAt, handlers }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) throw new Error("이 브라우저는 내장 음성인식을 지원하지 않아요. Chrome 을 사용하거나 Soniox 키를 설정해 주세요.");
  const rec = new SR();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  let stopped = false;
  let paused = false;
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) handlers.onFinal({ speaker: label, text: r[0].transcript.trim(), t: Date.now() - startedAt, lang });
      else interim += r[0].transcript;
    }
    handlers.onPartial(label, null, interim);
  };
  rec.onerror = (e) => {
    if (e.error !== "no-speech" && e.error !== "aborted") handlers.onError(`내장 음성인식 오류: ${e.error}`);
  };
  rec.onend = () => { if (!stopped && !paused) rec.start(); };
  rec.start();
  return {
    pause() { paused = true; rec.stop(); },
    resume() { paused = false; rec.start(); },
    async stop() { stopped = true; rec.stop(); },
  };
}

/** 데모: 가상의 콜 대본을 실제 통화처럼 흘려보낸다 (키·마이크 없이 전체 흐름 체험). */
export async function createDemo({ startedAt, handlers, speed = 1 }) {
  const script = await (await fetch("/api/demo/script")).json();
  let paused = false;
  let stopped = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms / speed));
  (async () => {
    for (const line of script.lines) {
      await sleep(line.delay);
      while (paused && !stopped) await sleep(300);
      if (stopped) return;
      // 말하는 듯이 부분 자막을 보여준 뒤 확정
      const words = line.text.split(" ");
      for (let i = 1; i < words.length; i += 3) {
        if (stopped) return;
        handlers.onPartial(line.speaker, line.speaker, words.slice(0, i).join(" "));
        await sleep(160);
      }
      handlers.onPartial(line.speaker, line.speaker, "");
      handlers.onFinal({ speaker: line.speaker, text: line.text, t: Date.now() - startedAt });
    }
    handlers.onDone?.();
  })();
  return {
    script,
    pause() { paused = true; },
    resume() { paused = false; },
    async stop() { stopped = true; },
  };
}
