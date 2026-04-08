"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

interface SessionItem {
  id: string;
  counselorName: string;
  counselingMode: string;
  status: string;
  createdAt: string;
  _count?: { messages: number };
}

export default function SessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    fetch(`/api/sessions?userId=${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
        <div className="mx-auto max-w-[680px]">
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: "var(--bg-surface)" }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="mx-auto max-w-[680px]">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={24} style={{ color: "var(--accent-primary)" }} />
            <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              상담 기록
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            지금까지 진행한 상담 내역을 확인하세요.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <MessageSquare size={40} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>아직 상담 기록이 없어요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const date = new Date(s.createdAt);
              const dateStr = `${date.getMonth()+1}월 ${date.getDate()}일`;
              return (
                <Link
                  key={s.id}
                  href={`/chat?sessionId=${s.id}`}
                  className="block rounded-xl p-5 transition-colors"
                  style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {dateStr} 상담
                      </p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                        {s.status === "completed" ? "완료" : "진행 중"} · {s.counselingMode === "voice" ? "음성" : "채팅"}
                      </p>
                    </div>
                    <ChevronRight size={20} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
