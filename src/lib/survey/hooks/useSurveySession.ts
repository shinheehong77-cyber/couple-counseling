"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  SurveyQuestion,
  SurveyResponse,
  QuestionResponse,
  SurveyResult,
  SurveyVersion,
} from "../types";
import { calcSurveyResult } from "../scoring";
import {
  hasSurveyDraft,
  readSurveyDraft,
  writeSurveyDraft,
  clearSurveyDraft,
} from "../draft-storage";

export type SurveyPhase = "idle" | "active" | "submitting" | "done" | "error";

export interface UseSurveySessionReturn {
  phase: SurveyPhase;
  currentIndex: number;
  responses: Map<string, SurveyResponse>;
  result: SurveyResult | null;
  error: string | null;
  /** 응답 저장 */
  answer: (questionId: string, response: QuestionResponse) => void;
  /** 설문 시작 (DB에 세션 생성) */
  startSurvey: (questions: SurveyQuestion[], version: SurveyVersion) => Promise<void>;
  /** 저장된 설문이 있는지 확인 */
  hasDraft: (version: SurveyVersion) => boolean;
  /** 저장된 설문에서 재개 */
  resumeSurvey: (questions: SurveyQuestion[], version: SurveyVersion) => boolean;
  /** 다음 질문으로 이동 */
  next: () => void;
  /** 이전 질문으로 이동 */
  prev: () => void;
  /** 설문 완료 및 DB 저장 */
  submit: (questions: SurveyQuestion[], version: SurveyVersion) => Promise<SurveyResult | null>;
}

export function useSurveySession(): UseSurveySessionReturn {
  const [phase, setPhase] = useState<SurveyPhase>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, SurveyResponse>>(new Map());
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const surveySessionIdRef = useRef<string | null>(null);
  const activeVersionRef = useRef<SurveyVersion | null>(null);

  const answer = useCallback((questionId: string, response: QuestionResponse) => {
    setResponses((prev) => {
      const next = new Map(prev);
      next.set(questionId, { questionId, response, answeredAt: new Date() });
      return next;
    });
  }, []);

  const startSurvey = useCallback(async (questions: SurveyQuestion[], version: SurveyVersion) => {
    if (questions.length === 0) {
      setError("설문 문항이 비어 있어 시작할 수 없습니다.");
      setPhase("error");
      throw new Error("survey_questions_empty");
    }

    activeVersionRef.current = version;
    clearSurveyDraft(version);
    setPhase("active");
    setCurrentIndex(0);
    setResponses(new Map());
    setResult(null);
    setError(null);

    // Try to create a DB survey session
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (res.ok) {
        const data = await res.json();
        surveySessionIdRef.current = data.id;
        try {
          sessionStorage.setItem("survey_session_id", data.id);
        } catch {
          // sessionStorage not available
        }
      }
      // 401 = not logged in, continue without DB persistence
    } catch {
      // network error, continue without persistence
    }
  }, []);

  const hasDraft = useCallback((version: SurveyVersion) => {
    return hasSurveyDraft(version);
  }, []);

  const resumeSurvey = useCallback((questions: SurveyQuestion[], version: SurveyVersion) => {
    const draft = readSurveyDraft(version);
    if (!draft || draft.responses.length === 0) return false;

    const validQuestionIds = new Set(questions.map((q) => q.id));
    const restoredEntries = draft.responses
      .filter((item) => validQuestionIds.has(item.questionId))
      .map((item) => [
        item.questionId,
        {
          questionId: item.questionId,
          response: item.response,
          answeredAt: new Date(item.answeredAt),
        },
      ] as const);

    if (restoredEntries.length === 0) return false;

    activeVersionRef.current = version;
    setPhase("active");
    setResult(null);
    setError(null);
    setResponses(new Map(restoredEntries));
    setCurrentIndex(Math.min(draft.currentIndex, Math.max(questions.length - 1, 0)));
    return true;
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const submit = useCallback(
    async (questions: SurveyQuestion[], version: SurveyVersion): Promise<SurveyResult | null> => {
      setPhase("submitting");
      setError(null);

      try {
        const responseArray = Array.from(responses.values());
        const surveyResult = calcSurveyResult(version, questions, responseArray);

        // Try to save to DB
        const sessionId = surveySessionIdRef.current;
        if (sessionId) {
          try {
            const answers = responseArray.map((r) => ({
              questionId: r.questionId,
              answer: r.response,
            }));

          await fetch(`/api/survey/${sessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers,
              complete: true,
              currentQuestionId: null,
            }),
          });
          } catch {
            // DB save failed, continue showing results
          }
        } else {
          // Fallback: save result to localStorage
          try {
            localStorage.setItem(
              `survey_result_${Date.now()}`,
              JSON.stringify({
                ...surveyResult,
                completedAt: surveyResult.completedAt.toISOString(),
              })
            );
          } catch {
            // localStorage not available
          }
        }

        clearSurveyDraft(version);
        setResult(surveyResult);
        setPhase("done");
        return surveyResult;
      } catch {
        setError("결과를 제출하는 중 문제가 발생했습니다.");
        setPhase("error");
        return null;
      }
    },
    [responses]
  );

  useEffect(() => {
    const version = activeVersionRef.current;
    if (phase !== "active" || !version) return;

    const draft = {
      version,
      currentIndex,
      responses: Array.from(responses.values()).map((r) => ({
        questionId: r.questionId,
        response: r.response,
        answeredAt: r.answeredAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
    writeSurveyDraft(version, draft);
  }, [currentIndex, responses, phase]);

  return {
    phase,
    currentIndex,
    responses,
    result,
    error,
    answer,
    startSurvey,
    hasDraft,
    resumeSurvey,
    next,
    prev,
    submit,
  };
}
