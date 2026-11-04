// 로컬 전사: 말소리 구간(VAD)을 잘라 16kHz WAV로 만들어 로컬 서버에 보낸다.
// 서버는 같은 컴퓨터에서 도는 whisper.cpp(또는 OpenAI 호환 로컬 서버)로 전사한다 → 오디오가 밖으로 나가지 않는다.

const TARGET_RATE = 16000;

export function encodeWav(samples, rate = TARGET_RATE) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE");
  w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

function downsample(input, fromRate) {
  if (fromRate === TARGET_RATE) return input;
  const ratio = fromRate / TARGET_RATE;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

/**
 * 에너지 기반 VAD + 발화 단위 자르기.
 * - 주변 소음 수준을 따라가며 그보다 충분히 큰 소리를 말소리로 본다.
 * - 0.7초 쉬면 발화 끝, 15초 넘으면 다음 짧은 쉼에서 강제로 자른다.
 */
export async function createLocal(stream, { label, callId, startedAt, handlers }) {
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule("/pcm-worklet.js");
  const src = ctx.createMediaStreamSource(stream);
  const tap = new AudioWorkletNode(ctx, "pcm-tap");
  const sink = ctx.createGain();
  sink.gain.value = 0;
  src.connect(tap).connect(sink).connect(ctx.destination);

  const rate = ctx.sampleRate;
  const frameMs = (1536 / rate) * 1000;
  let noise = 0.004;
  let speaking = false;
  let chunk = [];
  let chunkStartWall = 0;
  let silenceMs = 0;
  let speechMs = 0;
  let paused = false;
  let stopped = false;
  const preroll = [];
  let inflight = 0;
  let warned = false;

  const send = (frames, wallStart, voicedMs) => {
    if (voicedMs < 400) return; // 짧은 잡음은 버림
    const total = frames.reduce((n, f) => n + f.length, 0);
    const pcm = new Float32Array(total);
    let o = 0;
    for (const f of frames) { pcm.set(f, o); o += f.length; }
    const wav = encodeWav(downsample(pcm, rate));
    inflight++;
    handlers.onPartial(label, label, "…전사 중");
    fetch(`/api/calls/${callId}/stt-local?speaker=${encodeURIComponent(label)}&t=${Math.max(0, wallStart - startedAt)}`, { method: "POST", body: wav })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || `로컬 전사 실패 (${r.status})`);
      })
      .catch((err) => {
        if (!warned) handlers.onError(err.message);
        warned = true;
      })
      .finally(() => {
        inflight--;
        if (!inflight && !speaking) handlers.onPartial(label, label, "");
      });
  };

  const flush = () => {
    if (chunk.length) send(chunk, chunkStartWall, speechMs);
    chunk = [];
    speaking = false;
    silenceMs = 0;
    speechMs = 0;
  };

  tap.port.onmessage = (e) => {
    if (paused || stopped) return;
    const frame = e.data;
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    const isSpeech = rms > Math.max(0.008, noise * 3);
    if (!isSpeech) noise = noise * 0.98 + rms * 0.02;

    if (!speaking) {
      preroll.push(frame);
      if (preroll.length > Math.ceil(300 / frameMs)) preroll.shift();
      if (isSpeech) {
        speaking = true;
        chunkStartWall = Date.now() - preroll.length * frameMs;
        chunk = preroll.splice(0);
        speechMs = frameMs;
        handlers.onPartial(label, label, "…말하는 중");
      }
      return;
    }
    chunk.push(frame);
    const durMs = chunk.length * frameMs;
    if (isSpeech) { speechMs += frameMs; silenceMs = 0; } else silenceMs += frameMs;
    const pauseLimit = durMs > 10_000 ? 200 : 700;
    if (silenceMs >= pauseLimit || durMs >= 20_000) flush();
  };

  return {
    pause() { paused = true; flush(); },
    resume() { paused = false; },
    async stop() {
      flush();
      stopped = true;
      src.disconnect();
      tap.disconnect();
      await ctx.close().catch(() => {});
    },
  };
}
