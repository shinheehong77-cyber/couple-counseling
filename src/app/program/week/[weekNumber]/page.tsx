"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MessageSquare,
  ClipboardList,
  FileQuestion,
  CheckCircle2,
  Circle,
  ArrowLeft,
} from "lucide-react";

interface Milestone {
  id: string;
  type: "counseling_session" | "assignment" | "check_in_survey";
  title: string;
  ordinal: number;
  completedAt?: string;
}

interface WeekDetail {
  id: string;
  weekNumber: number;
  theme: string;
  status: string;
  progress: number;
  milestones: Milestone[];
}

const WEEK_DESCRIPTIONS: Record<number, string> = {
  1: "의사소통 패턴을 이해하고 건강한 대화법을 연습합니다",
  2: "갈등을 건설적으로 해결하고 친밀감을 회복합니다",
  3: "신뢰를 재건하고 공유 가치관을 발견합니다",
  4: "배운 것을 통합하고 미래 계획을 수립합니다",
};

const WEEK_THEMES: Record<number, string> = {
  1: "소통의 기초",
  2: "갈등과 친밀감",
  3: "신뢰와 가치관",
  4: "통합과 성장",
};

const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  counseling_session: MessageSquare,
  assignment: ClipboardList,
  check_in_survey: FileQuestion,
};

const TYPE_LINKS: Record<string, string> = {
  counseling_session: "/chat",
  assignment: "/assignments",
  check_in_survey: "/survey",
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="w-full h-3 rounded-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      <div
        className="h-3 rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: "var(--accent-primary)",
        }}
      />
    </div>
  );
}

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = Number(params.weekNumber);

  const [week, setWeek] = useState<WeekDetail | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First get the program to obtain programId
      const progRes = await fetch("/api/program");
      if (!progRes.ok) throw new Error();
      const progData = await progRes.json();
      const prog = progData.program ?? progData;
      const pid = prog.id;
      setProgramId(pid);

      // Then fetch week detail
      const weekRes = await fetch(`/api/program/${pid}/week/${weekNumber}`);
      if (!weekRes.ok) throw new Error();
      const weekData = await weekRes.json();
      setWeek(weekData.week ?? weekData);
    } catch {
      setError("주차 정보를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [weekNumber]);

  useEffect(() => {
    if (weekNumber >= 1 && weekNumber <= 4) {
      void fetchWeek();
    }
  }, [weekNumber, fetchWeek]);

  async function handleCompleteMilestone(milestoneId: string) {
    if (!programId) return;
    setCompletingId(milestoneId);
    try {
      const res = await fetch(
        `/api/program/${programId}/milestone/${milestoneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedAt: new Date().toISOString() }),
        }
      );
      if (!res.ok) throw new Error();
      void fetchWeek();
    } catch {
      setError("마일스톤 완료 처리에 실패했어요.");
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen px-4 py-8 md:px-8"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <div className="mx-auto max-w-[680px] space-y-4">
          <div
            className="rounded-xl p-6 animate-pulse h-32"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 animate-pulse"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="h-4 rounded w-2/3"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !week) {
    return (
      <div
        className="min-h-screen px-4 py-8 md:px-8"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <div className="mx-auto max-w-[680px]">
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--state-gentle-error)",
            }}
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => router.push("/program")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 min-h-[44px] text-sm"
              style={{
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <ArrowLeft size={16} /> 프로그램으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const themeName = week?.theme ?? WEEK_THEMES[weekNumber] ?? "";
  const description = WEEK_DESCRIPTIONS[weekNumber] ?? "";
  const weekProgress = Math.round((week?.progress ?? 0) * 100);
  const milestones = (week?.milestones ?? []).sort((a, b) => a.ordinal - b.ordinal);

  return (
    <div
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto max-w-[680px]">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/program")}
          className="flex items-center gap-2 mb-6 text-sm min-h-[44px]"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} /> 프로그램 목록
        </button>

        {/* Header */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-medium"
              style={{
                color: "var(--accent-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {weekNumber}주차
            </span>
          </div>
          <h1
            className="font-semibold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              lineHeight: 1.3,
            }}
          >
            {themeName}
          </h1>
          <p
            className="mb-4"
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--text-base)",
              lineHeight: 1.7,
            }}
          >
            {description}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={weekProgress} />
            </div>
            <span
              className="text-sm font-medium shrink-0"
              style={{
                color: "var(--accent-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {weekProgress}%
            </span>
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl p-4 mb-4 text-center text-sm"
            style={{ color: "var(--state-gentle-error)" }}
          >
            {error}
          </div>
        )}

        {/* Milestones */}
        <h2
          className="font-medium mb-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
          }}
        >
          마일스톤
        </h2>

        {milestones.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              이 주차에 등록된 마일스톤이 없어요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => {
              const isCompleted = !!m.completedAt;
              const Icon = TYPE_ICONS[m.type] ?? Circle;
              const link = TYPE_LINKS[m.type];

              return (
                <div
                  key={m.id}
                  className="rounded-xl p-5 flex items-center gap-4"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {/* Checkbox */}
                  {isCompleted ? (
                    <CheckCircle2
                      size={22}
                      style={{ color: "var(--accent-primary)", flexShrink: 0 }}
                    />
                  ) : (
                    <Circle
                      size={22}
                      style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
                    />
                  )}

                  {/* Icon + title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon
                      size={18}
                      style={{
                        color: isCompleted
                          ? "var(--text-tertiary)"
                          : "var(--text-secondary)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="font-medium truncate"
                      style={{
                        color: isCompleted
                          ? "var(--text-tertiary)"
                          : "var(--text-primary)",
                        textDecoration: isCompleted ? "line-through" : "none",
                      }}
                    >
                      {m.title}
                    </span>
                  </div>

                  {/* Action */}
                  {isCompleted ? (
                    <span
                      className="text-xs shrink-0"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      완료
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      {link && (
                        <button
                          type="button"
                          onClick={() => router.push(link)}
                          className="rounded-lg px-3 py-2 text-xs font-medium min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                          style={{
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          이동
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleCompleteMilestone(m.id)}
                        disabled={completingId === m.id}
                        className="rounded-lg px-3 py-2 text-xs font-medium min-h-[44px] min-w-[44px] flex items-center justify-center transition-opacity disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          color: "var(--bg-base)",
                        }}
                      >
                        {completingId === m.id ? "..." : "완료"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
