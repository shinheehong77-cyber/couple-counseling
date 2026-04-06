"use client";

import type { YesNoQuestion as YesNoQ, QuestionResponse } from "../types";

interface Props {
  question: YesNoQ;
  value?: "yes" | "no";
  onChange: (response: QuestionResponse) => void;
  disabled?: boolean;
}

export default function YesNoQuestion({ question, value, onChange, disabled }: Props) {
  return (
    <div className="survey-question-body">
      {question.helpText && (
        <p className="survey-help-text">{question.helpText}</p>
      )}
      <div className="yesno-options">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ type: "YesNo", value: "yes" })}
          className={`yesno-option yesno-option--yes ${value === "yes" ? "yesno-option--selected" : ""}`}
          aria-pressed={value === "yes"}
        >
          {question.yesLabel ?? "예"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ type: "YesNo", value: "no" })}
          className={`yesno-option yesno-option--no ${value === "no" ? "yesno-option--selected" : ""}`}
          aria-pressed={value === "no"}
        >
          {question.noLabel ?? "아니요"}
        </button>
      </div>
    </div>
  );
}
