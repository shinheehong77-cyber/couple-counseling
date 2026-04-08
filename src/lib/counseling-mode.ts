export type CounselingMode = "chat" | "voice";

const COUNSELING_MODE_STORAGE_KEY = "counseling_selected_mode";

export function getCounselingChatPath(mode: CounselingMode): string {
  return mode === "voice" ? "/chat?mode=voice" : "/chat";
}

export function persistSelectedCounselingMode(mode: CounselingMode): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(COUNSELING_MODE_STORAGE_KEY, mode);
}

export function readSelectedCounselingMode(): CounselingMode | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(COUNSELING_MODE_STORAGE_KEY);
  if (raw === "chat" || raw === "voice") return raw;
  return null;
}
