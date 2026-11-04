import crypto from "node:crypto";

export const newId = (prefix = ""): string =>
  prefix + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");

export const clip = (s: string, n: number): string => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
