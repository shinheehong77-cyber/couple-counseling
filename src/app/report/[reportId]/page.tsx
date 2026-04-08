"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Share2,
  Printer,
} from "lucide-react";

interface DomainScore {
  domain: string;
  label: string;
  before: number;
  after: number;
}

interface Report {
  id: string;
  userId: string;
  dateRange?: { start: string; end: string };
  overallBefore: number;
  overallAfter: number;
  domains: DomainScore[];
  aiInsights?: string;
  actionPlan?: string[];
  shareToken?: string;
  createdAt: string;
}

function DeltaIndicator({ before, after }: { before: number; after: number }) {
  const delta = after - before;
  if (delta > 0)
    return (
      <span
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: "var(--accent-primary)" }}
      >
        <TrendingUp size={14} /> +{delta}
      </span>
    );
  if (delta < 0)
    return (
      <span
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: "var(--state-gentle-error)" }}
      >
        <TrendingDown size={14} /> {delta}
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 text-sm font-medium"
      style={{ color: "var(--text-tertiary)" }}
    >
      <Minus size={14} /> 0
    </span>
  );
}

function ScoreBar({
  value,
  max = 100,
  variant,
}: {
  value: number;
  max?: number;
  variant: "before" | "after";
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className="w-full h-2.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      <div
        className="h-2.5 rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor:
            variant === "after" ? "var(--accent-primary)" : "var(--text-tertiary)",
          opacity: variant === "before" ? 0.6 : 1,
        }}
      />
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReport(data.report ?? data);
      } catch {
        setError("보고서를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }
    void fetchReport();
  }, [reportId]);

  async function handleShare() {
    const shareUrl = report?.shareToken
      ? `${window.location.origin}/report/share/${report.shareToken}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div
        className="min-h-screen px-4 py-8 md:px-8"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <div className="mx-auto max-w-[680px] space-y-6">
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
                className="h-4 rounded w-2/3"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !report) {
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
            <p>{error ?? "보고서를 찾을 수 없어요."}</p>
          </div>
        </div>
      </div>
    );
  }

  const overallDelta = report.overallAfter - report.overallBefore;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: #1A1714 !important; }
          .no-print { display: none !important; }
          .print-section { break-inside: avoid; page-break-inside: avoid; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>

      <div
        className="min-h-screen px-4 py-8 md:px-8"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <div className="mx-auto max-w-[680px]">
          {/* Header */}
          <div className="mb-8 print-section">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} style={{ color: "var(--accent-primary)" }} />
              <h1
                className="font-semibold"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-2xl)",
                }}
              >
                관계 개선 보고서
              </h1>
            </div>
            {report.dateRange && (
              <p style={{ color: "var(--text-secondary)" }}>
                {formatDate(report.dateRange.start)} — {formatDate(report.dateRange.end)}
              </p>
            )}
          </div>

          {/* Section 1: Overall score change */}
          <div
            className="rounded-xl p-6 mb-6 print-section"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h2
              className="text-sm font-medium mb-4"
              style={{ color: "var(--text-tertiary)" }}
            >
              종합 점수 변화
            </h2>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>
                  이전
                </p>
                <p
                  className="font-semibold"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {report.overallBefore}
                </p>
              </div>
              <div
                className="text-2xl"
                style={{ color: "var(--text-tertiary)" }}
                aria-hidden="true"
              >
                →
              </div>
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>
                  이후
                </p>
                <p
                  className="font-semibold"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    color: "var(--accent-primary)",
                  }}
                >
                  {report.overallAfter}
                </p>
              </div>
            </div>
            <div className="text-center mt-4">
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: "var(--accent-soft)",
                  color:
                    overallDelta > 0
                      ? "var(--accent-primary)"
                      : overallDelta < 0
                      ? "var(--state-gentle-error)"
                      : "var(--text-tertiary)",
                }}
              >
                {overallDelta > 0 ? <TrendingUp size={14} /> : overallDelta < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                {overallDelta > 0 ? `+${overallDelta}점 개선` : overallDelta < 0 ? `${overallDelta}점` : "변화 없음"}
              </span>
            </div>
          </div>

          {/* Section 2: Domain comparison */}
          <div
            className="rounded-xl p-6 mb-6 print-section"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h2
              className="text-sm font-medium mb-6"
              style={{ color: "var(--text-tertiary)" }}
            >
              영역별 비교
            </h2>
            <div className="space-y-6">
              {report.domains.map((d) => (
                <div key={d.domain}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {d.label}
                    </span>
                    <DeltaIndicator before={d.before} after={d.after} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs w-8 text-right shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        이전
                      </span>
                      <div className="flex-1">
                        <ScoreBar value={d.before} variant="before" />
                      </div>
                      <span
                        className="text-xs w-6 text-right shrink-0"
                        style={{
                          color: "var(--text-tertiary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {d.before}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs w-8 text-right shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        이후
                      </span>
                      <div className="flex-1">
                        <ScoreBar value={d.after} variant="after" />
                      </div>
                      <span
                        className="text-xs w-6 text-right shrink-0"
                        style={{
                          color: "var(--accent-primary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {d.after}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: AI Insights */}
          {report.aiInsights && (
            <div
              className="rounded-xl p-6 mb-6 print-section"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h2
                className="text-sm font-medium mb-4"
                style={{ color: "var(--text-tertiary)" }}
              >
                분석 인사이트
              </h2>
              <div
                className="space-y-3"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text-secondary)",
                  fontSize: "var(--text-base)",
                  lineHeight: 1.8,
                }}
              >
                {report.aiInsights.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Action plan */}
          {report.actionPlan && report.actionPlan.length > 0 && (
            <div
              className="rounded-xl p-6 mb-6 print-section"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h2
                className="text-sm font-medium mb-4"
                style={{ color: "var(--text-tertiary)" }}
              >
                실천 계획
              </h2>
              <ol className="space-y-3">
                {report.actionPlan.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 mt-0.5"
                      style={{
                        backgroundColor: "var(--accent-soft)",
                        color: "var(--accent-primary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--text-base)",
                        lineHeight: 1.7,
                      }}
                    >
                      {item}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex gap-3 justify-center no-print">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex items-center gap-2 rounded-lg px-6 py-3 min-h-[44px] text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "var(--bg-base)",
              }}
            >
              <Share2 size={16} />
              {copied ? "복사됨" : "공유하기"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg px-6 py-3 min-h-[44px] text-sm font-medium transition-colors"
              style={{
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <Printer size={16} />
              인쇄
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
