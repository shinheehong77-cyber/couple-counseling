"use client";

import type { FreeTextQuestion as FreeTextQ, QuestionResponse } from "../types";

interface Props {
  question: FreeTextQ;
  text?: string;
  onChange: (response: QuestionResponse) => void;
  disabled?: boolean;
}

export default function FreeTextQuestion({ question, text = "", onChange, disabled }: Props) {
  const maxLen = question.maxLength ?? 500;

  return (
    <div className="survey-question-body">
      <textarea
        value={text}
        onChange={(e) => onChange({ type: "FreeText", text: e.target.value })}
        placeholder={question.placeholder ?? "자유롭게 작성해 주세요..."}
        maxLength={maxLen}
        disabled={disabled}
        rows={4}
        className="freetext-input"
      />
      <div className="freetext-count">
        {text.length} / {maxLen}
      </div>
    </div>
  );
}
