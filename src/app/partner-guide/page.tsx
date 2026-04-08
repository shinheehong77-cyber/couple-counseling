"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import type { PartnerGuideResponse, PartnerGuideEmptyResponse } from "@/types/partner-guide";

export default function PartnerGuidePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [guide, setGuide] = useState<PartnerGuideResponse | null>(null);
  const [empty, setEmpty] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !authUser) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/partner-guide");
        if (!res.ok) {
          throw new Error("가이드를 불러오지 못했어요.");
        }
        const data = await res.json();
        if (!data.guide || data.guide === null) {
          setEmpty(true);
          setEmptyMessage(
            (data as PartnerGuideEmptyResponse).message ??
              "파트너가 아직 상담을 시작하지 않았어요"
          );
        } else {
          setGuide(data as PartnerGuideResponse);
        }
      } catch {
        setError("잠시 문제가 생겼어요. 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [authUser, authLoading]);

  /* Skeleton */
  if (authLoading || loading) {
    return (
      <div className="partner-guide-page">
        <div className="partner-guide-container">
          <div className="partner-guide-skeleton-block" />
          <div className="partner-guide-skeleton-block partner-guide-skeleton-block--tall" />
          <div className="partner-guide-skeleton-block partner-guide-skeleton-block--tall" />
        </div>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="partner-guide-page">
        <div className="partner-guide-container">
          <button
            type="button"
            className="partner-guide-back"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span>돌아가기</span>
          </button>
          <div className="partner-guide-empty">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  /* Empty state */
  if (empty || !guide) {
    return (
      <div className="partner-guide-page">
        <div className="partner-guide-container">
          <button
            type="button"
            className="partner-guide-back"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span>돌아가기</span>
          </button>
          <div className="partner-guide-empty">
            <p>{emptyMessage || "파트너가 아직 상담을 시작하지 않았어요"}</p>
          </div>
        </div>
      </div>
    );
  }

  const { guide: guideData, aboutUserName, createdAt } = guide;

  function formatDate(dateStr: string) {
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

  return (
    <div className="partner-guide-page">
      <div className="partner-guide-container">
        {/* Back button */}
        <button
          type="button"
          className="partner-guide-back"
          onClick={() => router.back()}
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
          <span>돌아가기</span>
        </button>

        {/* Header */}
        <header className="partner-guide-header">
          <h1 className="partner-guide-title">
            {aboutUserName}님의 파트너를 위한 가이드
          </h1>
        </header>

        {/* Section 1: 소통 성향 */}
        <section className="partner-guide-section">
          <h2 className="partner-guide-section-title">소통 성향</h2>
          <p className="partner-guide-section-body">
            {guideData.communicationStyle.summary}
          </p>
        </section>

        {/* Section 2: 이렇게 하면 좋아요 */}
        <section className="partner-guide-section">
          <h2 className="partner-guide-section-title">이렇게 하면 좋아요</h2>
          <ul className="partner-guide-list partner-guide-list--do">
            {guideData.recommendations.doList.map((item, i) => (
              <li key={i} className="partner-guide-list-item">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: 이런 건 피해주세요 */}
        <section className="partner-guide-section">
          <h2 className="partner-guide-section-title">이런 건 피해주세요</h2>
          <ul className="partner-guide-list partner-guide-list--avoid">
            {guideData.recommendations.avoidList.map((item, i) => (
              <li key={i} className="partner-guide-list-item">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4: 파트너가 가장 원하는 것 */}
        <section className="partner-guide-section partner-guide-section--highlight">
          <h2 className="partner-guide-section-title">파트너가 가장 원하는 것</h2>
          <p className="partner-guide-core-need">{guideData.coreNeed}</p>
        </section>

        {/* Footer */}
        <footer className="partner-guide-footer">
          마지막 업데이트: {formatDate(createdAt)}
        </footer>
      </div>
    </div>
  );
}
