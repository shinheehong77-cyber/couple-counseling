"use client";

import { Clock, ClipboardList, ArrowRight } from "lucide-react";
import type { SurveyVersion } from "../types";
import { BRIEF_SURVEY_META } from "../data/brief";
import { COMPREHENSIVE_SURVEY_META } from "../data/comprehensive";

interface Props {
  onSelect: (version: SurveyVersion) => void;
}

export default function SurveyTypeSelector({ onSelect }: Props) {
  return (
    <div className="survey-selector">
      <div className="survey-selector-header">
        <h1 className="survey-selector-title">사전 설문</h1>
        <p className="survey-selector-subtitle">
          상담 전 짧은 설문으로 맞춤 상담을 준비해요
        </p>
      </div>

      <div className="survey-type-cards">
        {/* 종합 설문 */}
        <button
          type="button"
          className="survey-type-card"
          onClick={() => onSelect("comprehensive")}
        >
          <div className="survey-type-icon">
            <ClipboardList size={24} strokeWidth={1.5} />
          </div>
          <h2 className="survey-type-name">
            종합 설문
            <span className="survey-type-badge">추천</span>
          </h2>
          <p className="survey-type-time">
            약 {COMPREHENSIVE_SURVEY_META.estimatedMinutes.min}~
            {COMPREHENSIVE_SURVEY_META.estimatedMinutes.max}분
          </p>
          <p className="survey-type-desc">{COMPREHENSIVE_SURVEY_META.description}</p>
          <div className="survey-type-questions">
            {COMPREHENSIVE_SURVEY_META.totalQuestions}문항
          </div>
          <div className="survey-type-domains">
            {COMPREHENSIVE_SURVEY_META.domains.map((d) => (
              <span key={d} className="survey-type-domain-tag">
                {getDomainLabel(d)}
              </span>
            ))}
          </div>
          <div className="survey-type-cta">
            시작하기 <ArrowRight size={14} strokeWidth={1.5} />
          </div>
        </button>

        {/* 간략 설문 */}
        <button
          type="button"
          className="survey-type-card"
          onClick={() => onSelect("brief")}
        >
          <div className="survey-type-icon">
            <Clock size={24} strokeWidth={1.5} />
          </div>
          <h2 className="survey-type-name">간략 설문</h2>
          <p className="survey-type-time">
            약 {BRIEF_SURVEY_META.estimatedMinutes.min}~
            {BRIEF_SURVEY_META.estimatedMinutes.max}분
          </p>
          <p className="survey-type-desc">{BRIEF_SURVEY_META.description}</p>
          <div className="survey-type-questions">
            {BRIEF_SURVEY_META.totalQuestions}문항
          </div>
          <div className="survey-type-domains">
            {BRIEF_SURVEY_META.domains.map((d) => (
              <span key={d} className="survey-type-domain-tag">
                {getDomainLabel(d)}
              </span>
            ))}
          </div>
          <div className="survey-type-cta">
            시작하기 <ArrowRight size={14} strokeWidth={1.5} />
          </div>
        </button>
      </div>
    </div>
  );
}

function getDomainLabel(domain: string): string {
  const labels: Record<string, string> = {
    communication: "의사소통",
    conflict: "갈등 해결",
    intimacy: "친밀감",
    trust: "신뢰",
    values: "가치관",
    satisfaction: "만족도",
    attachment_style: "애착 유형",
    emotional_regulation: "감정 조절",
    self_awareness: "자기 인식",
  };
  return labels[domain] ?? domain;
}
