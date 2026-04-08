"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Copy, Check, Link2, ArrowRight, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

interface CoupleStatus {
  coupled: boolean;
  partnerName?: string;
  coupleId?: string;
}

interface SharedSession {
  id: string;
  counselorName?: string;
  status: string;
  createdAt: string;
}

export default function CouplePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<CoupleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite flow
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Join flow
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<SharedSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/couples/status");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/couples/sessions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessions(data.sessions ?? data ?? []);
    } catch {
      // silent
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !authUser) return;
    void fetchStatus();
  }, [fetchStatus, authLoading, authUser]);

  useEffect(() => {
    if (status?.coupled) {
      void fetchSessions();
    }
  }, [status, fetchSessions]);

  async function handleCreateInvite() {
    setInviteLoading(true);
    try {
      const res = await fetch("/api/couples/invite", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInviteCode(data.inviteCode ?? data.code);
    } catch {
      setError("초대 코드를 생성하지 못했어요.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError(null);
    try {
      const res = await fetch("/api/couples/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? "참여에 실패했어요.");
      }
      void fetchStatus();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "참여에 실패했어요. 코드를 확인해 주세요.");
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleStartSession() {
    setStartingSession(true);
    try {
      const res = await fetch("/api/couples/sessions", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/chat?sessionId=${data.id}`);
    } catch {
      setError("공동 상담을 시작하지 못했어요.");
    } finally {
      setStartingSession(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const skeletonUI = (
    <div className="couple-page">
      <div className="couple-container">
        {[1, 2].map((i) => (
          <div key={i} className="couple-skeleton-card">
            <div className="couple-skeleton-line couple-skeleton-line--short" />
            <div className="couple-skeleton-line couple-skeleton-line--medium" />
          </div>
        ))}
      </div>
    </div>
  );

  if (authLoading) return skeletonUI;
  if (!authUser) return skeletonUI;
  if (loading) return skeletonUI;

  return (
    <div className="couple-page">
      <div className="couple-container">
        {/* Header */}
        <header className="couple-header">
          <div className="couple-header-row">
            <Users size={24} className="couple-header-icon" />
            <h1 className="couple-title">부부 공동상담</h1>
          </div>
          <p className="couple-subtitle">
            파트너와 함께 상담을 진행할 수 있어요.
          </p>
        </header>

        {/* Intro recommendation banner */}
        <div className="couple-intro-banner">
          <p>
            마주에서는 각자 개별 상담을 먼저 진행한 후, 부부가 함께 공동 상담에
            참여하는 방식을 추천해요. 서로의 관점을 이해한 뒤 함께 대화하면 더
            효과적이에요.
          </p>
        </div>

        {error && (
          <div className="couple-error">{error}</div>
        )}

        {status && !status.coupled ? (
          /* Not coupled — invite/join flow */
          <>
            {/* Create invite */}
            <div className="couple-card">
              <h2 className="couple-card-title">파트너 초대하기</h2>
              <p className="couple-card-desc">
                초대 코드를 생성하고 파트너에게 전달해 주세요.
              </p>

              {inviteCode ? (
                <div className="couple-code-display">
                  <span className="couple-code-text">{inviteCode}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopyCode()}
                    className={`couple-copy-btn${copied ? " couple-copy-btn--copied" : ""}`}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "복사됨" : "복사"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleCreateInvite()}
                  disabled={inviteLoading}
                  className="couple-btn-primary"
                >
                  <Link2 size={16} />
                  {inviteLoading ? "생성 중..." : "초대 코드 생성"}
                </button>
              )}
            </div>

            {/* Join with code */}
            <div className="couple-card">
              <h2 className="couple-card-title">코드 입력</h2>
              <p className="couple-card-desc">
                파트너에게 받은 초대 코드를 입력해 주세요.
              </p>

              <div className="couple-join-row">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="초대 코드"
                  maxLength={6}
                  className="couple-join-input"
                />
                <button
                  type="button"
                  onClick={() => void handleJoin()}
                  disabled={joinLoading || !joinCode.trim()}
                  className="couple-btn-primary"
                >
                  {joinLoading ? "참여 중..." : "참여하기"}
                </button>
              </div>
              {joinError && (
                <p className="couple-join-error">{joinError}</p>
              )}
            </div>
          </>
        ) : status?.coupled ? (
          /* Coupled — partner info + sessions */
          <>
            {/* Partner info */}
            <div className="couple-card">
              <div className="couple-partner-row">
                <div>
                  <p className="couple-partner-label">연결된 파트너</p>
                  <p className="couple-partner-name">
                    {status.partnerName ?? "파트너"}
                  </p>
                </div>
                <div className="couple-status-badge">
                  <Check size={14} />
                  <span>연결됨</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleStartSession()}
                disabled={startingSession}
                className="couple-btn-primary couple-btn-primary--full"
              >
                <MessageSquare size={16} />
                {startingSession ? "시작 중..." : "공동 상담 시작"}
              </button>
            </div>

            {/* Shared sessions */}
            <div>
              <h2 className="couple-section-title">공유 상담 기록</h2>

              {sessionsLoading ? (
                <div className="couple-sessions-list">
                  {[1, 2].map((i) => (
                    <div key={i} className="couple-skeleton-card">
                      <div className="couple-skeleton-line couple-skeleton-line--short" />
                      <div className="couple-skeleton-line couple-skeleton-line--medium" />
                    </div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="couple-empty-state">
                  <p>아직 공유 상담 기록이 없어요.</p>
                </div>
              ) : (
                <div className="couple-sessions-list">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => router.push(`/chat?sessionId=${s.id}`)}
                      className="couple-session-btn"
                    >
                      <div>
                        <p className="couple-session-name">
                          {s.counselorName ?? "공동 상담"}
                        </p>
                        <p className="couple-session-date">
                          {formatDate(s.createdAt)}
                        </p>
                      </div>
                      <ArrowRight size={16} className="couple-session-arrow" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
