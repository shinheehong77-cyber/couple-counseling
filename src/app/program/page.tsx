"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Lock, Play, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

interface ProgramWeek {
  id: string;
  weekNumber: number;
  theme: string;
  status: "locked" | "active" | "completed";
  progress: number;
}

interface Program {
  id: string;
  status: string;
  currentWeek: number;
  startedAt: string;
  completedAt?: string;
  weeks: ProgramWeek[];
  overallProgress?: number;
}

const WEEK_THEMES: Record<number, { name: string; description: string }> = {
  1: { name: "소통의 기초", description: "의사소통 패턴을 이해하고 건강한 대화법을 연습합니다" },
  2: { name: "갈등과 친밀감", description: "갈등을 건설적으로 해결하고 친밀감을 회복합니다" },
  3: { name: "신뢰와 가치관", description: "신뢰를 재건하고 공유 가치관을 발견합니다" },
  4: { name: "통합과 성장", description: "배운 것을 통합하고 미래 계획을 수립합니다" },
};

const STATUS_LABELS: Record<string, string> = {
  locked: "잠김",
  active: "진행중",
  completed: "완료",
};

function ProgressBar({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const height = size === "sm" ? "h-2" : "h-3";
  return (
    <div
      className={`w-full ${height} rounded-full overflow-hidden`}
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      <div
        className={`${height} rounded-full transition-all duration-500`}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: "var(--accent-primary)",
        }}
      />
    </div>
  );
}

export default function ProgramPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const fetchProgram = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/program");
      if (res.status === 404) {
        setProgram(null);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProgram(data.program ?? data);
    } catch {
      setError("프로그램 정보를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !authUser) return;
    void fetchProgram();
  }, [fetchProgram, authLoading, authUser]);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/program", { method: "POST" });
      if (!res.ok) throw new Error();
      void fetchProgram();
    } catch {
      setError("프로그램을 시작하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setStarting(false);
    }
  }

  const skeletonUI = (
    <div
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto max-w-[680px] space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-6 animate-pulse"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="h-5 rounded w-1/3 mb-3"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            />
            <div
              className="h-3 rounded w-full"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  if (authLoading) return skeletonUI;
  if (!authUser) return skeletonUI;
  if (loading) return skeletonUI;

  // No program — intro page
  if (!program) {
    return (
      <div
        className="min-h-screen px-4 py-8 md:px-8"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <div className="mx-auto max-w-[680px]">
          <div className="text-center py-12">
            <BookOpen
              size={48}
              className="mx-auto mb-6"
              style={{ color: "var(--accent-primary)" }}
            />
            <h1
              className="font-semibold mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                lineHeight: 1.3,
              }}
            >
              4주 관계 개선 프로그램
            </h1>
            <p
              className="mb-8 mx-auto max-w-md"
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-base)",
                lineHeight: 1.7,
              }}
            >
              매주 다른 주제로 관계를 탐색하고, 상담과 과제를 통해 함께 성장해 가는
              구조화된 프로그램이에요.
            </p>

            {/* Week previews */}
            <div className="text-left space-y-4 mb-10">
              {[1, 2, 3, 4].map((week) => {
                const theme = WEEK_THEMES[week];
                return (
                  <div
                    key={week}
                    className="rounded-xl p-5 flex items-start gap-4"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold shrink-0"
                      style={{
                        backgroundColor: "var(--accent-soft)",
                        color: "var(--accent-primary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {week}
                    </span>
                    <div>
                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {theme.name}
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}
                      >
                        {theme.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="mb-4 text-sm" style={{ color: "var(--state-gentle-error)" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={starting}
              className="inline-flex items-center gap-2 rounded-lg px-8 py-4 min-h-[44px] text-base font-medium transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "var(--bg-base)",
              }}
            >
              <Play size={18} />
              {starting ? "시작 중..." : "프로그램 시작하기"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Has program — show progress
  const overallProgress =
    program.overallProgress ??
    (program.weeks?.length
      ? Math.round(
          (program.weeks.reduce((sum, w) => sum + (w.progress ?? 0), 0) /
            program.weeks.length) *
            100
        )
      : 0);

  return (
    <div
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto max-w-[680px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={24} style={{ color: "var(--accent-primary)" }} />
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)" }}
            >
              4주 프로그램
            </h1>
          </div>
          <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
            전체 진행률
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={overallProgress} />
            </div>
            <span
              className="text-sm font-medium shrink-0"
              style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}
            >
              {overallProgress}%
            </span>
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl p-4 mb-6 text-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--state-gentle-error)",
            }}
          >
            {error}
          </div>
        )}

        {/* Week cards */}
        <div className="space-y-4">
          {(program.weeks ?? [1, 2, 3, 4].map((n) => ({
            id: String(n),
            weekNumber: n,
            theme: WEEK_THEMES[n]?.name ?? "",
            status: n === program.currentWeek ? "active" : n < program.currentWeek ? "completed" : "locked",
            progress: 0,
          } as ProgramWeek))).map((week) => {
            const theme = WEEK_THEMES[week.weekNumber];
            const isActive = week.status === "active";
            const isLocked = week.status === "locked";
            const isCompleted = week.status === "completed";
            const weekProgress = Math.round((week.progress ?? 0) * 100);

            return (
              <button
                key={week.id}
                type="button"
                disabled={isLocked}
                onClick={() =>
                  !isLocked && router.push(`/program/week/${week.weekNumber}`)
                }
                className="w-full text-left rounded-xl p-6 transition-colors"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: isActive
                    ? "2px solid var(--accent-primary)"
                    : "1px solid var(--border-subtle)",
                  opacity: isLocked ? 0.5 : 1,
                  cursor: isLocked ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold shrink-0"
                      style={{
                        backgroundColor: isActive
                          ? "var(--accent-primary)"
                          : "var(--accent-soft)",
                        color: isActive ? "var(--bg-base)" : "var(--accent-primary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {week.weekNumber}
                    </span>
                    <div>
                      <p
                        className="font-medium"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "var(--text-lg)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {week.weekNumber}주: {theme?.name ?? week.theme}
                      </p>
                      {theme?.description && (
                        <p
                          className="text-sm mt-1"
                          style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}
                        >
                          {theme.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status badge */}
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: isCompleted
                          ? "var(--accent-soft)"
                          : isActive
                          ? "var(--accent-primary)"
                          : "var(--bg-elevated)",
                        color: isCompleted
                          ? "var(--accent-primary)"
                          : isActive
                          ? "var(--bg-base)"
                          : "var(--text-tertiary)",
                      }}
                    >
                      {isLocked && <Lock size={12} />}
                      {isCompleted && <CheckCircle2 size={12} />}
                      {isActive && <Play size={12} />}
                      {STATUS_LABELS[week.status]}
                    </span>
                    {!isLocked && (
                      <ArrowRight size={16} style={{ color: "var(--text-tertiary)" }} />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {!isLocked && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1">
                      <ProgressBar value={weekProgress} size="sm" />
                    </div>
                    <span
                      className="text-xs shrink-0"
                      style={{
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {weekProgress}%
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
