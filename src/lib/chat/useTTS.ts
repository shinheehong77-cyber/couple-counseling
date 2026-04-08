import { useState, useCallback, useRef } from "react";

let currentAudio: HTMLAudioElement | null = null;

function cancelCurrentTts() {
  if (typeof window === "undefined") return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  window.speechSynthesis?.cancel();
}

/** TTS 음성 재생 (Web Speech API fallback) */
function speakWithWebSpeech(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  // 이전 음성 중지
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.9; // 약간 느리게 — 편안한 상담 톤
  utterance.pitch = 1.0;

  // 한국어 음성 선택 (가능한 경우)
  const voices = window.speechSynthesis.getVoices();
  const koVoice = voices.find(
    (v) => v.lang === "ko-KR" && v.name.includes("여")
  ) ?? voices.find((v) => v.lang.startsWith("ko"));
  if (koVoice) utterance.voice = koVoice;

  window.speechSynthesis.speak(utterance);
}

/** TTS 음성 재생 (Google Cloud TTS 우선, 실패 시 Web Speech API 폴백) */
async function speakText(text: string) {
  if (typeof window === "undefined") return;

  cancelCurrentTts();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`TTS request failed: ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("audio/")) {
      throw new Error("Invalid TTS content type");
    }

    const audioBlob = await res.blob();
    if (!audioBlob.size) {
      throw new Error("Empty TTS audio");
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null;
      URL.revokeObjectURL(audioUrl);
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;
    await audio.play();
  } catch {
    speakWithWebSpeech(text);
  }
}

interface UseTTSOptions {
  initialEnabled?: boolean;
}

export function useTTS({ initialEnabled = false }: UseTTSOptions = {}) {
  const [ttsEnabled, setTtsEnabled] = useState(initialEnabled);
  const ttsEnabledRef = useRef(initialEnabled);

  const toggle = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      ttsEnabledRef.current = next;
      if (!next) cancelCurrentTts();
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => {
    void speakText(text);
  }, []);

  const cancel = useCallback(() => {
    cancelCurrentTts();
  }, []);

  return { ttsEnabled, toggle, speak, cancel };
}
