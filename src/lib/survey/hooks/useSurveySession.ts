"use client";

import { useState, useCallback, useRef } from "react";
import type { SurveyQuestion, SurveyResponse, QuestionResponse, SurveyResult } from "../types";
import { calcSurveyResult } from "../scoring";

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
  startSurvey: (questions: SurveyQuestion[]) => Promise<void>;
  /** 다음 질문으로 이동 */
  next: () => void;
  /** 이전 질문으로 이동 */
  prev: () => void;
  /** 설문 완료 및 DB 저장 */
  submit: (questions: SurveyQuestion[]) => Promise<SurveyResult | null>;
}

export function useSurveySession(version: "brief" | "comprehensive"): UseSurveySessionReturn {
  const [phase, setPhase] = useState<SurveyPhase>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, SurveyResponse>>(new Map());
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const surveySessionIdRef = useRef<string | null>(null);

  const answer = useCallback((questionId: string, response: QuestionResponse) => {
    setResponses((prev) => {
      const next = new Map(prev);
      next.set(questionId, { questionId, response, answeredAt: new Date() });
      return next;
    });
  }, []);

  const startSurvey = useCallback(async (questions: SurveyQuestion[]) => {
    setPhase("active");
    setCurrentIndex(0);
    setResponses(new Map());
    setResult(null);
    setError(null);

    // Try to create a DB survey session
    try {
      const res = await fetch("/api/survey", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        surveySessionIdRef.current = data.id;
      }
      // 401 = not logged in, continue without DB persistence
    } catch {
      // network error, continue without persistence
    }
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const submit = useCallback(
    async (questions: SurveyQuestion[]): Promise<SurveyResult | null> => {
      setPhase("submitting");

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
            body: JSON.stringify({ answers, complete: true }),
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

      setResult(surveyResult);
      setPhase("done");
      return surveyResult;
    },
    [responses, version]
  );

  return {
    phase,
    currentIndex,
    responses,
    result,
    error,
    answer,
    startSurvey,
    next,
    prev,
    submit,
  };
}
