"use client";

import type { SurveyQuestion, QuestionResponse } from "../types";
import LikertQuestion from "./LikertQuestion";
import VisualSliderQuestion from "./VisualSliderQuestion";
import ChecklistQuestion from "./ChecklistQuestion";
import FreeTextQuestion from "./FreeTextQuestion";
import YesNoQuestion from "./YesNoQuestion";
import type { UseSurveySessionReturn } from "../hooks/useSurveySession";

interface Props {
  questions: SurveyQuestion[];
  session: UseSurveySessionReturn;
  onComplete: () => void;
}

export default function SurveyPage({ questions, session, onComplete }: Props) {
  const { currentIndex, responses, answer, next, prev, phase } = session;
  if (questions.length === 0) return null;

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);
  const currentResponse = responses.get(question.id);

  const isLast = currentIndex === total - 1;
  const isSubmitting = phase === "submitting";

  function getResponseValue(q: SurveyQuestion) {
    const r = currentResponse?.response;
    if (!r) return undefined;
    switch (q.type) {
      case "Likert":
        return r.type === "Likert" ? r.value : undefined;
      case "VisualSlider":
        return r.type === "VisualSlider" ? r.value : undefined;
      case "Checklist":
        return r.type === "Checklist" ? r.values : undefined;
      case "FreeText":
        return r.type === "FreeText" ? r.text : undefined;
      case "YesNo":
        return r.type === "YesNo" ? r.value : undefined;
    }
  }

  // Auto-advance question types: after selecting, move to next with a brief delay
  const autoAdvanceTypes = new Set(["Likert", "YesNo"]);

  function handleChange(response: QuestionResponse) {
    answer(question.id, response);

    // Auto-advance for single-select question types
    if (autoAdvanceTypes.has(question.type) && !isLast && !isSubmitting) {
      setTimeout(() => {
        next();
      }, 300);
    }
  }

  function handleNext() {
    if (isLast) {
      onComplete();
    } else {
      next();
    }
  }

  const canAdvance = !!currentResponse;

  function renderQuestion() {
    const val = getResponseValue(question);
    switch (question.type) {
      case "Likert":
        return (
          <LikertQuestion
            question={question}
            value={val as 1 | 2 | 3 | 4 | 5 | undefined}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        );
      case "VisualSlider":
        return (
          <VisualSliderQuestion
            question={question}
            value={val as number | undefined}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        );
      case "Checklist":
        return (
          <ChecklistQuestion
            question={question}
            values={val as string[] | undefined}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        );
      case "FreeText":
        return (
          <FreeTextQuestion
            question={question}
            text={val as string | undefined}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        );
      case "YesNo":
        return (
          <YesNoQuestion
            question={question}
            value={val as "yes" | "no" | undefined}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        );
    }
  }

  // For slider/freetext, allow advancing even without explicit answer
  const allowSkip = question.type === "VisualSlider" || question.type === "FreeText";

  return (
    <div className="survey-page">
      {/* 진행률 표시 */}
      <div className="survey-progress-bar-wrap">
        <div className="survey-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="survey-progress-label">
        {currentIndex + 1} / {total}
      </div>

      {/* 질문 카드 */}
      <div className="survey-card">
        <h2 className="survey-question-text">{question.text}</h2>
        {renderQuestion()}
      </div>

      {/* 네비게이션 */}
      <div className="survey-nav">
        <button
          type="button"
          onClick={prev}
          disabled={currentIndex === 0 || isSubmitting}
          className="survey-btn survey-btn--ghost"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={(!canAdvance && !allowSkip) || isSubmitting}
          className="survey-btn survey-btn--primary"
        >
          {isSubmitting ? "제출 중..." : isLast ? "완료" : "다음"}
        </button>
      </div>
    </div>
  );
}
