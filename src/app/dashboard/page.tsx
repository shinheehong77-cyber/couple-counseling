"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  ClipboardList,
  FileText,
  ChevronRight,
  CalendarCheck,
  LogOut,
  Users,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import type { UserMode, AuthUserResponse } from "@/types/user";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProgramWeek {
  weekNumber: number;
  theme: string;
  status: string;
  progress: number;
}

interface Program {
  id: string;
  currentWeek: number;
  status: string;
  weeks: ProgramWeek[];
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  type?: string | null;
}

interface SessionItem {
  id: string;
  counselorName: string;
  counselingMode: string;
  status: string;
  createdAt: string;
  messages?: { content: string }[];
}

interface DashboardData {
  user: AuthUserResponse | null;
  program: Program | null;
  pendingAssignments: Assignment[];
  completedAssignmentsCount: number;
  recentSession: SessionItem | null;
  hasSurvey: boolean;
  totalSessions: number;
  userMode: UserMode;
  coupleStatus: { coupled: boolean; partnerName?: string } | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !authUser) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        /* Fetch auth session to get userMode */
        const authSessionRes = await fetch("/api/auth/session");
        let fullUser: AuthUserResponse | null = null;
        if (authSessionRes.ok) {
          const authData = await authSessionRes.json();
          fullUser = authData.user ?? null;
        }

        /* If user hasn't onboarded, redirect */
        if (fullUser && !fullUser.onboardedAt) {
          router.replace("/onboarding");
          return;
        }

        const userMode: UserMode = fullUser?.userMode ?? "solo";

        const [programRes, pendingAssignRes, completedAssignRes, surveyRes, overviewRes] =
          await Promise.all([
            fetch("/api/program"),
            fetch("/api/assignments?status=pending"),
            fetch("/api/assignments?status=completed"),
            fetch("/api/survey"),
            fetch("/api/analytics/overview"),
          ]);

        const programData = programRes.ok ? await programRes.json() : null;
        const pendingAssignData = pendingAssignRes.ok ? await pendingAssignRes.json() : [];
        const completedAssignData = completedAssignRes.ok ? await completedAssignRes.json() : [];
        const surveyData = surveyRes.ok ? await surveyRes.json() : null;
        const overviewData = overviewRes.ok
          ? await overviewRes.json()
          : { totalSessions: 0 };

        let recentSession: SessionItem | null = null;
        const sessionsRes = await fetch(`/api/sessions?userId=${authUser.id}`);
        if (sessionsRes.ok) {
          const sessions = await sessionsRes.json();
          if (Array.isArray(sessions) && sessions.length > 0) {
            recentSession = sessions[0];
          }
        }

        /* Fetch couple status only for couple mode */
        let coupleStatus: { coupled: boolean; partnerName?: string } | null = null;
        if (userMode === "couple") {
          try {
            const coupleRes = await fetch("/api/couples/status");
            if (coupleRes.ok) {
              coupleStatus = await coupleRes.json();
            }
          } catch {
            /* silent — couple info is non-critical */
          }
        }

        setData({
          user: fullUser,
          program: programData,
          pendingAssignments: Array.isArray(pendingAssignData)
            ? pendingAssignData.slice(0, 3)
            : [],
          completedAssignmentsCount: Array.isArray(completedAssignData)
            ? completedAssignData.length
            : 0,
          recentSession,
          hasSurvey: !!(surveyData?.id || surveyData?.completedAt),
          totalSessions: overviewData?.totalSessions ?? 0,
          userMode,
          coupleStatus,
        });
      } catch {
        setError("데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [authUser, authLoading, router]);

  /* ---------- Skeleton ---------- */
  const skeletonUI = (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-skeleton-header" />
        <div className="dashboard-skeleton-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dashboard-skeleton-card" />
          ))}
        </div>
      </div>
    </div>
  );

  if (authLoading || loading) return skeletonUI;
  if (!authUser) return skeletonUI;

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-error-card">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const userName = data?.user?.name ?? "회원";
  const program = data?.program;
  const pendingAssignments = data?.pendingAssignments ?? [];
  const completedAssignmentsCount = data?.completedAssignmentsCount ?? 0;
  const recentSession = data?.recentSession;
  const hasSurvey = data?.hasSurvey ?? false;
  const userMode = data?.userMode ?? "solo";
  const coupleStatus = data?.coupleStatus;
  const isCoupleMode = userMode === "couple";

  /* Program progress */
  const programWeeks = program?.weeks ?? [];
  const currentWeek = program?.currentWeek ?? 1;
  const totalProgress =
    programWeeks.length > 0
      ? programWeeks.reduce((sum, w) => sum + w.progress, 0) / programWeeks.length
      : 0;

  /* Weeks to render — fall back to 4 placeholder weeks if no program */
  const WEEK_COUNT = 4;
  const weekIndicators = Array.from({ length: WEEK_COUNT }, (_, i) => {
    const weekNum = i + 1;
    const weekData = programWeeks.find((w) => w.weekNumber === weekNum);
    let state: "active" | "done" | "locked" = "locked";
    if (weekData) {
      state =
        weekData.weekNumber === currentWeek
          ? "active"
          : weekData.status === "completed"
          ? "done"
          : "locked";
    } else if (weekNum === currentWeek) {
      state = "active";
    }
    return { weekNum, state };
  });

  /* Helpers */
  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  /* Assignment completion percentage */
  const pendingCount = pendingAssignments.length;
  const totalAssign = completedAssignmentsCount + pendingCount;
  const assignPercent =
    totalAssign > 0 ? Math.round((completedAssignmentsCount / totalAssign) * 100) : 0;

  /* Logout handler */
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* ========== 1. Header ========== */}
        <header className="dashboard-header">
          <div className="dashboard-header-row">
            <h1 className="dashboard-greeting">안녕하세요, {userName}님</h1>
            <button
              className="dashboard-logout-btn"
              onClick={handleLogout}
              aria-label="로그아웃"
            >
              <LogOut size={20} strokeWidth={1.5} />
            </button>
          </div>
          <p className="dashboard-subtitle">
            {isCoupleMode
              ? "파트너와 함께하는 4주 상담 프로그램이에요"
              : "매주 1회씩 총 4주의 상담을 기본으로 구성되어 있어요"}
          </p>
        </header>

        {/* ========== 2. Program Progress ========== */}
        <section className="dashboard-program-section">
          <div className="dashboard-week-indicators">
            {weekIndicators.map(({ weekNum, state }) => (
              <div
                key={weekNum}
                className={`dashboard-week-chip dashboard-week-chip--${state}`}
              >
                {weekNum}주차
              </div>
            ))}
          </div>
          <div className="dashboard-progress-bar-track">
            <div
              className="dashboard-progress-bar-fill"
              data-progress={Math.round(totalProgress * 100)}
            />
          </div>
        </section>

        {/* ========== 3. 개인 상담하기 ========== */}
        <Link
          href={hasSurvey ? "/chat" : "/survey"}
          className="dashboard-card dashboard-card--link"
        >
          <div className="dashboard-card-header">
            <MessageSquare size={20} className="dashboard-card-icon" />
            <div>
              <h2 className="dashboard-card-title">개인 상담하기</h2>
              <p className="dashboard-card-desc">자신의 심리와 문제상황을 알아봐요</p>
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-card-arrow" />
        </Link>

        {/* ========== 3-2. 부부 공동 상담하기 (couple mode only) ========== */}
        {isCoupleMode && (
          <Link
            href="/couple"
            className="dashboard-card dashboard-card--link"
          >
            <div className="dashboard-card-header">
              <Users size={20} className="dashboard-card-icon" />
              <div>
                <h2 className="dashboard-card-title">
                  부부 공동 상담하기
                  {coupleStatus?.coupled && (
                    <span className="dashboard-card-badge">연결됨</span>
                  )}
                </h2>
                <p className="dashboard-card-desc">
                  {coupleStatus?.coupled && coupleStatus.partnerName
                    ? `${coupleStatus.partnerName}님과 함께하는 상담이에요`
                    : "개인 상담을 먼저 진행한 후 함께하는 것을 추천해요"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="dashboard-card-arrow" />
          </Link>
        )}

        {/* ========== 3-3. 파트너 가이드 (couple mode + coupled) ========== */}
        {isCoupleMode && coupleStatus?.coupled && (
          <Link
            href="/partner-guide"
            className="dashboard-card dashboard-card--link"
          >
            <div className="dashboard-card-header">
              <BookOpen size={20} className="dashboard-card-icon" />
              <div>
                <h2 className="dashboard-card-title">파트너 가이드</h2>
                <p className="dashboard-card-desc">
                  {coupleStatus.partnerName
                    ? `${coupleStatus.partnerName}님과 더 잘 소통하는 방법을 확인해요`
                    : "파트너와 더 잘 소통하는 방법을 확인해요"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="dashboard-card-arrow" />
          </Link>
        )}

        {/* ========== 4. 과제 진행하기 ========== */}
        <Link href="/assignments" className="dashboard-card dashboard-card--link">
          <div className="dashboard-card-header">
            <ClipboardList size={20} className="dashboard-card-icon" />
            <div>
              <h2 className="dashboard-card-title">과제 진행하기</h2>
              {totalAssign > 0 ? (
                <p className="dashboard-card-desc">완료율 {assignPercent}% ({completedAssignmentsCount}/{totalAssign})</p>
              ) : (
                <p className="dashboard-card-desc">상담 후 과제가 생성돼요</p>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-card-arrow" />
        </Link>

        {/* ========== 5. 상담 결과 확인하기 ========== */}
        <Link href="/sessions" className="dashboard-card dashboard-card--link">
          <div className="dashboard-card-header">
            <FileText size={20} className="dashboard-card-icon" />
            <div>
              <h2 className="dashboard-card-title">상담 결과 확인하기</h2>
              {recentSession && (
                <p className="dashboard-card-desc">
                  <CalendarCheck size={13} className="dashboard-card-inline-icon" />
                  최근 상담: {formatDate(recentSession.createdAt)}
                </p>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="dashboard-card-arrow" />
        </Link>

      </div>
    </div>
  );
}
