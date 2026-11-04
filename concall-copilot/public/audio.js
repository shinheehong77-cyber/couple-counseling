// 오디오 캡처 + 녹음.
// - 마이크(내 목소리)와 시스템/탭 오디오(상대 목소리)를 따로 받는다 → 화자 구분이 공짜로 된다.
// - 둘을 섞은 스트림은 MediaRecorder 로 녹음해 5초마다 서버에 이어 붙인다.

export async function startCapture({ mic = true, system = true } = {}) {
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  const sources = {};
  const cleanups = [];

  if (mic) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    sources.mic = stream;
    cleanups.push(() => stream.getTracks().forEach((t) => t.stop()));
  }

  if (system) {
    // Chrome: 화면/탭 공유 창에서 "탭 오디오 공유" 또는 "시스템 오디오 공유"를 켜야 소리가 들어온다.
    const display = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, suppressLocalAudioPlayback: false },
      systemAudio: "include",
      selfBrowserSurface: "exclude",
    });
    display.getVideoTracks().forEach((t) => t.stop());
    const audioTracks = display.getAudioTracks();
    if (!audioTracks.length) {
      cleanups.forEach((f) => f());
      throw new Error("공유 창에서 '오디오 공유'를 켜지 않았어요. 회의 탭(또는 전체 화면)을 고르고 오디오 공유를 체크해 주세요.");
    }
    const stream = new MediaStream(audioTracks);
    sources.system = stream;
    cleanups.push(() => stream.getTracks().forEach((t) => t.stop()));
  }

  const analysers = {};
  for (const [name, stream] of Object.entries(sources)) {
    const node = ctx.createMediaStreamSource(stream);
    node.connect(dest);
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    node.connect(an);
    analysers[name] = an;
  }

  const level = (name) => {
    const an = analysers[name];
    if (!an) return 0;
    const buf = new Uint8Array(an.fftSize);
    an.getByteTimeDomainData(buf);
    let peak = 0;
    for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
    return Math.min(1, peak / 64);
  };

  return {
    sources,
    mix: dest.stream,
    level,
    async stop() {
      cleanups.forEach((f) => f());
      await ctx.close().catch(() => {});
    },
  };
}

/** 섞인 스트림을 녹음하고 조각을 순서대로 서버에 올린다. */
export function startRecorder(stream, callId, onError) {
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
  const rec = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 48000 } : undefined);
  let queue = Promise.resolve();
  rec.ondataavailable = (e) => {
    if (!e.data || !e.data.size) return;
    const blob = e.data;
    queue = queue.then(() =>
      fetch(`/api/calls/${callId}/audio`, { method: "POST", body: blob }).then((r) => {
        if (!r.ok) throw new Error(`녹음 저장 실패 (${r.status})`);
      }).catch((err) => onError?.(err)),
    );
  };
  rec.start(5000);
  return {
    pause: () => rec.state === "recording" && rec.pause(),
    resume: () => rec.state === "paused" && rec.resume(),
    stop: () =>
      new Promise((resolve) => {
        if (rec.state === "inactive") return resolve();
        rec.addEventListener("stop", () => queue.then(resolve), { once: true });
        rec.stop();
      }),
  };
}
