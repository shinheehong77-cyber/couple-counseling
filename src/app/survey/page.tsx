"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SurveyVersion, SurveyQuestion } from "@/lib/survey/types";
import SurveyTypeSelector from "@/lib/survey/components/SurveyTypeSelector";
import SurveyPage from "@/lib/survey/components/SurveyPage";
import ResultsSummary from "@/lib/survey/components/ResultsSummary";
import { useSurveySession } from "@/lib/survey/hooks/useSurveySession";
import { briefSurveyFull } from "@/lib/survey/data/brief";
import { comprehensiveSurveyFull } from "@/lib/survey/data/comprehensive";
import {
  type CounselingMode,
  getCounselingChatPath,
  readSelectedCounselingMode,
} from "@/lib/counseling-mode";
import { AlertTriangle } from "lucide-react";

type AppPhase = "mode" | "select" | "resume" | "survey" | "results";

export default function SurveyRootPage() {
  const router = useRouter();
  const [appPhase, setAppPhase] = useState<AppPhase>("select");
  const [selectedMode, setSelectedMode] = useState<CounselingMode | null>("chat");

  // Hydrate from sessionStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const stored = readSelectedCounselingMode();
    if (stored) setSelectedMode(stored);
  }, []);
  const [selectedVersion, setSelectedVersion] = useState<SurveyVersion>("brief");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loadingVersion, setLoadingVersion] = useState<SurveyVersion | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const session = useSurveySession();

  function handleError(msg: string) {
    setStartError(msg);
  }

  async function handleSelectVersion(version: SurveyVersion) {
    setLoadingVersion(version);
    setStartError(null);
    setSelectedVersion(version);
    const qs = version === "brief" ? briefSurveyFull : comprehensiveSurveyFull;
    setQuestions(qs);

    if (qs.length === 0) {
      handleError("설문 문항을 불러오지 못했습니다. 다시 시도해 주세요.");
      setLoadingVersion(null);
      return;
    }

    if (session.hasDraft(version)) {
      setAppPhase("resume");
      setLoadingVersion(null);
      return;
    }

    try {
      await session.startSurvey(qs, version);
      setAppPhase("survey");
    } catch {
      handleError("설문을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoadingVersion(null);
    }
  }

  async function handleStartFresh() {
    setStartError(null);
    try {
      await session.startSurvey(questions, selectedVersion);
      setAppPhase("survey");
    } catch {
      handleError("설문을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  function handleResumeDraft() {
    const resumed = session.resumeSurvey(questions, selectedVersion);
    if (resumed) {
      setAppPhase("survey");
      return;
    }
    void handleStartFresh();
  }

  async function handleComplete() {
    const result = await session.submit(questions, selectedVersion);
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
    const mode = selectedMode ?? readSelectedCounselingMode() ?? "chat";
    router.push(getCounselingChatPath(mode));
  }

  if (appPhase === "select") {
    return (
      <div>
        <SurveyTypeSelector onSelect={handleSelectVersion} />
        <div className="survey-skip-container">
          <button
            type="button"
            onClick={handleSkip}
            className="survey-btn survey-btn--ghost survey-skip-btn-wrapper"
            disabled={!!loadingVersion}
          >
            설문 없이 바로 상담 시작 →
          </button>
        </div>
        {startError && (
          <div className="survey-status-card survey-skip-container">
            <h2 className="survey-status-title">설문 시작 실패</h2>
            <p className="survey-status-text">{startError}</p>
            <button
              type="button"
              className="survey-btn survey-btn--primary"
              onClick={() => void handleSelectVersion(selectedVersion)}
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    );
  }

  if (appPhase === "resume") {
    return (
      <div className="survey-loading">
        <div className="survey-status-card">
          <h2 className="survey-status-title">중단한 설문을 발견했어요</h2>
          <p className="survey-status-text">
            마지막 답변 위치에서 이어서 진행하거나, 처음부터 다시 시작할 수 있습니다.
          </p>
          <div className="survey-resume-actions">
            <button
              type="button"
              className="survey-btn survey-btn--primary"
              onClick={handleResumeDraft}
            >
              이어서 진행
            </button>
            <button
              type="button"
              className="survey-btn survey-btn--ghost"
              onClick={() => void handleStartFresh()}
            >
              처음부터
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appPhase === "survey") {
    if (questions.length === 0) {
      return (
        <div className="survey-loading">
          <div className="survey-status-card">
            <h2 className="survey-status-title">설문 문항이 비어 있습니다</h2>
            <p className="survey-status-text">
              문항을 불러오지 못했어요. 설문 선택 화면으로 돌아가 다시 시도해 주세요.
            </p>
            <button
              type="button"
              className="survey-btn survey-btn--primary"
              onClick={() => setAppPhase("select")}
            >
              설문 선택으로 돌아가기
            </button>
          </div>
        </div>
      );
    }

    if (session.phase === "error") {
      return (
        <div className="survey-loading">
          <div className="survey-status-card">
            <AlertTriangle size={26} />
            <h2 className="survey-status-title">설문 처리 중 오류가 발생했습니다</h2>
            <p className="survey-status-text">
              {session.error ?? "잠시 후 다시 시도해 주세요."}
            </p>
            <button
              type="button"
              className="survey-btn survey-btn--primary"
              onClick={() => void handleComplete()}
            >
              재시도
            </button>
          </div>
        </div>
      );
    }

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
