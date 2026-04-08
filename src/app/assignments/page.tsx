"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, CheckCircle2, Clock, Send, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  type?: string;
  dueDate?: string;
  completedAt?: string;
  response?: string;
}

const TYPE_LABELS: Record<string, string> = {
  journaling: "일기",
  communication_exercise: "소통 연습",
  reflection: "성찰",
  gratitude: "감사",
  active_listening: "경청",
  quality_time: "함께하기",
  intimacy: "친밀감",
  affirmation: "격려",
};

function TypeBadge({ type }: { type?: string }) {
  const label = type ? TYPE_LABELS[type] ?? type : "과제";
  return (
    <span
      className="inline-block rounded-md px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: "var(--accent-soft)",
        color: "var(--accent-primary)",
      }}
    >
      {label}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function AssignmentsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = useCallback(async (status: "pending" | "completed") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assignments?status=${status}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssignments(data.assignments ?? data ?? []);
    } catch {
      setError("과제를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !authUser) return;
    void fetchAssignments(tab);
  }, [tab, fetchAssignments, authLoading, authUser]);

  async function handleComplete(id: string) {
    if (!response.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          response,
        }),
      });
      if (!res.ok) throw new Error();
      setActiveId(null);
      setResponse("");
      void fetchAssignments(tab);
    } catch {
      setError("과제 완료 처리에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto max-w-[680px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList size={24} style={{ color: "var(--accent-primary)" }} />
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)" }}
            >
              상담 과제
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            상담에서 받은 과제를 확인하고 완료해 보세요.
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-lg p-1 mb-6"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {(["pending", "completed"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors min-h-[44px]"
              style={{
                backgroundColor: tab === t ? "var(--bg-elevated)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              {t === "pending" ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock size={16} /> 대기 중
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> 완료
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {(authLoading || (!authUser) || loading) ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl p-6 animate-pulse"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="h-4 rounded w-1/3 mb-3"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                />
                <div
                  className="h-3 rounded w-2/3"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--state-gentle-error)",
            }}
          >
            <p>{error}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <ClipboardList
              size={40}
              className="mx-auto mb-4"
              style={{ color: "var(--text-tertiary)" }}
            />
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
              상담을 진행하면 대화 내용에 맞는 과제가 자동으로 생성됩니다. 먼저 상담을 시작해보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="rounded-xl p-6 transition-colors"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3
                    className="font-medium"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-lg)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {a.title}
                  </h3>
                  <TypeBadge type={a.type} />
                </div>

                {a.description && (
                  <p
                    className="mb-3"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--text-base)",
                      lineHeight: 1.7,
                    }}
                  >
                    {a.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-3">
                  {a.dueDate && (
                    <span
                      className="flex items-center gap-1 text-sm"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Clock size={14} />
                      {formatDate(a.dueDate)}까지
                    </span>
                  )}
                  {a.completedAt && (
                    <span
                      className="flex items-center gap-1 text-sm"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      <CheckCircle2 size={14} />
                      {formatDate(a.completedAt)} 완료
                    </span>
                  )}
                </div>

                {/* Completed response */}
                {a.completedAt && a.response && (
                  <div
                    className="rounded-lg p-4 mt-3"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <p
                      className="text-sm mb-1 font-medium"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      나의 응답
                    </p>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--text-base)",
                        lineHeight: 1.7,
                      }}
                    >
                      {a.response}
                    </p>
                  </div>
                )}

                {/* Pending: complete button or response form */}
                {tab === "pending" && !a.completedAt && (
                  <>
                    {activeId === a.id ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="과제에 대한 생각을 자유롭게 적어주세요..."
                          rows={4}
                          className="w-full rounded-lg px-4 py-3 text-base resize-none outline-none transition-colors"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-subtle)",
                            fontFamily: "var(--font-body)",
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = "var(--border-strong)")
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = "var(--border-subtle)")
                          }
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(null);
                              setResponse("");
                            }}
                            className="flex items-center gap-1 rounded-lg px-4 py-2 min-h-[44px] text-sm font-medium transition-colors"
                            style={{
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <X size={16} /> 취소
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleComplete(a.id)}
                            disabled={submitting || !response.trim()}
                            className="flex items-center gap-1 rounded-lg px-6 py-2 min-h-[44px] text-sm font-medium transition-opacity disabled:opacity-50"
                            style={{
                              backgroundColor: "var(--accent-primary)",
                              color: "var(--bg-base)",
                            }}
                          >
                            <Send size={16} />
                            {submitting ? "제출 중..." : "제출하기"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(a.id);
                          setResponse("");
                        }}
                        className="mt-3 rounded-lg px-6 py-3 min-h-[44px] text-sm font-medium transition-opacity"
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          color: "var(--bg-base)",
                        }}
                      >
                        완료하기
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
