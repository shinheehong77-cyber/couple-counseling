"use client";

import { useState } from "react";
import type { VisualSliderQuestion as SliderQ, QuestionResponse } from "../types";

interface Props {
  question: SliderQ;
  value?: number;
  onChange: (response: QuestionResponse) => void;
  disabled?: boolean;
}

export default function VisualSliderQuestion({ question, value, onChange, disabled }: Props) {
  const mid = Math.round((question.min + question.max) / 2);
  const current = value ?? mid;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ type: "VisualSlider", value: Number(e.target.value) });
  }

  const pct = ((current - question.min) / (question.max - question.min)) * 100;

  return (
    <div className="survey-question-body">
      <div className="slider-wrapper">
        <div className="slider-value-display">{current}</div>
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step ?? 1}
          value={current}
          onChange={handleChange}
          disabled={disabled}
          className="slider-input"
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
        />
        <div className="slider-labels">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
