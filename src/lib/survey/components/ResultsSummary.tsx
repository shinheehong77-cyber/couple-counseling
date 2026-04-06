"use client";

import type { SurveyResult, ScoreLevel, SurveyDomain, SurveyCategory } from "../types";
import { DOMAIN_LABELS, SCORE_LEVEL_LABELS, DOMAIN_CATEGORY, CATEGORY_LABELS } from "../types";
import { useRouter } from "next/navigation";

interface Props {
  result: SurveyResult;
  onStartCounseling?: () => void;
}

const LEVEL_COLORS: Record<ScoreLevel, string> = {
  excellent: "#4ade80",
  good: "#86efac",
  moderate: "#fbbf24",
  low: "#f87171",
  critical: "#ef4444",
};

const LEVEL_BG: Record<ScoreLevel, string> = {
  excellent: "result-level--excellent",
  good: "result-level--good",
  moderate: "result-level--moderate",
  low: "result-level--low",
  critical: "result-level--critical",
};

const APPROACH_LABELS: Record<string, string> = {
  eft_attachment: "EFT 정서 중심 상담",
  gottman_conflict: "Gottman 갈등 관리 상담",
  communication: "의사소통 기술 중심 상담",
  trust_rebuild: "신뢰 재건 중심 상담",
  values_alignment: "가치관 조율 중심 상담",
  crisis_support: "위기 개입 / 즉각적 지원",
};

export default function ResultsSummary({ result, onStartCounseling }: Props) {
  const router = useRouter();
  const { totalScore, totalLevel, domainScores, aiContextPayload, riskFlags } = result;

  function handleStartCounseling() {
    if (onStartCounseling) {
      onStartCounseling();
    } else {
      // Pass AI context as session storage then navigate to chat
      try {
        sessionStorage.setItem(
          "survey_ai_context",
          JSON.stringify(aiContextPayload)
        );
      } catch {
        // ignore
      }
      router.push("/counseling");
    }
  }

  return (
    <div className="results-page">
      {/* 헤더 */}
      <div className={`results-header ${LEVEL_BG[totalLevel]}`}>
        <div className="results-score-circle">
          <span className="results-score-number">{totalScore}</span>
          <span className="results-score-label">/ 100</span>
        </div>
        <h2 className="results-level-title">{SCORE_LEVEL_LABELS[totalLevel]}</h2>
        <p className="results-approach-label">
          권장 상담: {APPROACH_LABELS[aiContextPayload.recommendedApproach]}
        </p>
      </div>

      {/* 위험 플래그 */}
      {riskFlags.length > 0 && (
        <div className="results-risk-alert">
          <span className="results-risk-icon">⚠️</span>
          <p>
            일부 응답에서 전문 상담이 즉시 필요한 신호가 감지되었습니다.
            아래 상담 시작 버튼을 눌러 빠른 지원을 받으세요.
          </p>
        </div>
      )}

      {/* 도메인 점수 — 카테고리별 그룹 */}
      <div className="results-domains">
        {(["relationship", "personality"] as SurveyCategory[]).map((category) => {
          const categoryScores = domainScores.filter(
            (d) => DOMAIN_CATEGORY[d.domain as SurveyDomain] === category
          );
          if (categoryScores.length === 0) return null;
          return (
            <div key={category} className="results-category-group">
              <h3 className="results-section-title">
                {CATEGORY_LABELS[category]}
              </h3>
              {categoryScores.map((d) => (
                <div key={d.domain} className="domain-row">
                  <div className="domain-row-top">
                    <span className="domain-name">
                      {DOMAIN_LABELS[d.domain as SurveyDomain]}
                    </span>
                    <span className="domain-score">{d.score}점</span>
                  </div>
                  <div className="domain-bar-bg">
                    <div
                      className="domain-bar-fill"
                      style={{
                        width: `${d.score}%`,
                        backgroundColor: LEVEL_COLORS[d.level],
                      }}
                    />
                  </div>
                  <span className="domain-level-label">
                    {SCORE_LEVEL_LABELS[d.level]}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 강점 / 개선 영역 */}
      {aiContextPayload.strengths.length > 0 && (
        <div className="results-section results-strengths">
          <h3 className="results-section-title">강점 영역</h3>
          <div className="results-tag-list">
            {aiContextPayload.strengths.map((d) => (
              <span key={d} className="results-tag results-tag--strength">
                {DOMAIN_LABELS[d]}
              </span>
            ))}
          </div>
        </div>
      )}

      {aiContextPayload.concerns.length > 0 && (
        <div className="results-section results-concerns">
          <h3 className="results-section-title">개선이 필요한 영역</h3>
          <div className="results-tag-list">
            {aiContextPayload.concerns.map((d) => (
              <span key={d} className="results-tag results-tag--concern">
                {DOMAIN_LABELS[d]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI 상담 시작 버튼 */}
      <div className="results-cta">
        <button
          type="button"
          onClick={handleStartCounseling}
          className="survey-btn survey-btn--primary results-cta-btn"
        >
          AI 상담 시작하기 →
        </button>
        <p className="results-cta-note">
          설문 결과를 바탕으로 맞춤 상담을 제공합니다
        </p>
      </div>
    </div>
  );
}
