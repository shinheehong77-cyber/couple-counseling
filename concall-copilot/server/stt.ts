/** 음성인식 제공자 설정. 브라우저가 Soniox 에 직접 붙도록 임시 키를 발급한다 (장기 키는 서버에만). */
import { config } from "./config.ts";

export async function sonioxTemporaryKey(): Promise<{ apiKey: string; expiresAt?: string }> {
  if (!config.sonioxKey) throw new Error("SONIOX_API_KEY 가 설정되지 않았어요.");
  const res = await fetch("https://api.soniox.com/v1/auth/temporary-api-key", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.sonioxKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      usage_type: "transcribe_websocket",
      expires_in_seconds: 120,
      single_use: true,
      max_session_duration_seconds: 4 * 60 * 60,
      client_reference_id: "concall-copilot",
    }),
  });
  if (!res.ok) throw new Error(`Soniox 임시 키 발급 실패 (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { api_key?: string; key?: string; expires_at?: string };
  const apiKey = data.api_key ?? data.key;
  if (!apiKey) throw new Error("Soniox 응답에 키가 없어요.");
  return { apiKey, expiresAt: data.expires_at };
}
