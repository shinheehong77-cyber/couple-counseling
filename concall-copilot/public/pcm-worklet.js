// 오디오 스레드에서 PCM 프레임을 메인 스레드로 넘긴다 (약 32ms 단위로 묶어서).
class PcmTap extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(1536);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === this.buf.length) {
          this.port.postMessage(this.buf.slice(0));
          this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("pcm-tap", PcmTap);
