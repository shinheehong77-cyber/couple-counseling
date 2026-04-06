"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SurveyVersion, SurveyQuestion } from "@/lib/survey/types";
import SurveyTypeSelector from "@/lib/survey/components/SurveyTypeSelector";
import SurveyPage from "@/lib/survey/components/SurveyPage";
import ResultsSummary from "@/lib/survey/components/ResultsSummary";
import { useSurveySession } from "@/lib/survey/hooks/useSurveySession";
import { briefSurvey } from "@/lib/survey/data/brief";

type AppPhase = "select" | "survey" | "results";

export default function SurveyRootPage() {
  const router = useRouter();
  const [appPhase, setAppPhase] = useState<AppPhase>("select");
  const [selectedVersion, setSelectedVersion] = useState<SurveyVersion>("brief");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  const session = useSurveySession(selectedVersion);

  async function handleSelectVersion(version: SurveyVersion) {
    setSelectedVersion(version);
    const qs = version === "brief" ? briefSurvey : briefSurvey; // comprehensive TBD
    setQuestions(qs);
    await session.startSurvey(qs);
    setAppPhase("survey");
  }

  async function handleComplete() {
    const result = await session.submit(questions);
    if (result) {
      // Store AI context for the chat session
      try {
        sessionStorage.setItem(
          "survey_ai_context",
          JSON.stringify(result.aiContextPayload)
        );
      } catch {
        // sessionStorage not available
      }
    }
    setAppPhase("results");
  }

  function handleSkip() {
    router.push("/chat");
  }

  if (appPhase === "select") {
    return (
      <div>
        <SurveyTypeSelector onSelect={handleSelectVersion} />
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button
            type="button"
            onClick={handleSkip}
            className="survey-btn survey-btn--ghost"
            style={{ fontSize: "0.875rem", opacity: 0.7 }}
          >
            설문 없이 바로 상담 시작 →
          </button>
        </div>
      </div>
    );
  }

  if (appPhase === "survey") {
    return (
      <SurveyPage
        questions={questions}
        session={session}
        onComplete={handleComplete}
      />
    );
  }

  if (appPhase === "results" && session.result) {
    return <ResultsSummary result={session.result} />;
  }

  // Fallback while submitting
  return (
    <div className="survey-loading">
      <div className="survey-spinner" />
      <p>결과를 분석하는 중...</p>
    </div>
  );
}
