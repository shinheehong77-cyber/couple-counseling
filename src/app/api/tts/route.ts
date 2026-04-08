import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const DEFAULT_VOICE = "ko-KR-Wavenet-A";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "google_tts_not_configured" }, { status: 503 });
  }

  try {
    const ttsRes = await fetch(`${GOOGLE_TTS_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ko-KR", name: DEFAULT_VOICE },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.92, pitch: 0.0 },
      }),
      cache: "no-store",
    });

    if (!ttsRes.ok) {
      const details = await ttsRes.text();
      return NextResponse.json(
        { error: "google_tts_failed", status: ttsRes.status, details: details.slice(0, 500) },
        { status: 502 }
      );
    }

    const ttsJson = (await ttsRes.json()) as { audioContent?: string };
    if (!ttsJson.audioContent) {
      return NextResponse.json({ error: "google_tts_empty_audio" }, { status: 502 });
    }

    const audioBytes = Buffer.from(ttsJson.audioContent, "base64");
    return new Response(audioBytes, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json({ error: "google_tts_exception", message }, { status: 502 });
  }
}
