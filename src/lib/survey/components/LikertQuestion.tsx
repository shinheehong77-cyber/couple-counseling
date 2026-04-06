"use client";

import type { LikertQuestion as LikertQ, QuestionResponse } from "../types";

interface Props {
  question: LikertQ;
  value?: 1 | 2 | 3 | 4 | 5;
  onChange: (response: QuestionResponse) => void;
  disabled?: boolean;
}

export default function LikertQuestion({ question, value, onChange, disabled }: Props) {
  return (
    <div className="survey-question-body">
      {question.helpText && (
        <p className="survey-help-text">{question.helpText}</p>
      )}
      <div className="likert-options">
        {question.labels.map((label, idx) => {
          const score = (idx + 1) as 1 | 2 | 3 | 4 | 5;
          const selected = value === score;
          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ type: "Likert", value: score })}
              className={`likert-option ${selected ? "likert-option--selected" : ""}`}
              aria-pressed={selected}
            >
              <span className="likert-number">{score}</span>
              <span className="likert-label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
