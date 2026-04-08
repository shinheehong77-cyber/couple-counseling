"use client";

import type { ChecklistQuestion as ChecklistQ, QuestionResponse } from "../types";

interface Props {
  question: ChecklistQ;
  values?: string[];
  onChange: (response: QuestionResponse) => void;
  disabled?: boolean;
}

export default function ChecklistQuestion({ question, values = [], onChange, disabled }: Props) {
  function toggle(optionValue: string) {
    const next = values.includes(optionValue)
      ? values.filter((v) => v !== optionValue)
      : [...values, optionValue];

    if (question.maxSelections && next.length > question.maxSelections) return;
    onChange({ type: "Checklist", values: next });
  }

  return (
    <div className="survey-question-body">
      {question.maxSelections && (
        <p className="survey-help-text">최대 {question.maxSelections}개 선택</p>
      )}
      <div className="checklist-options">
        {question.options.map((opt) => {
          const checked = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt.value)}
              className={`checklist-option ${checked ? "checklist-option--selected" : ""}`}
              aria-pressed={checked}
            >
              <span className="checklist-check">{checked ? "✓" : ""}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
