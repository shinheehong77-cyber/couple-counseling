"use client";

interface EmotionIndicatorProps {
  emotion: string;
  intensity: number;
}

const EMOTION_LABELS: Record<string, string> = {
  anger: "분노",
  sadness: "슬픔",
  fear: "두려움",
  shame: "수치심",
  loneliness: "외로움",
  anxiety: "불안",
  confusion: "혼란",
  hope: "희망",
  relief: "안도",
  gratitude: "감사",
};

export default function EmotionIndicator({ emotion, intensity }: EmotionIndicatorProps) {
  const label = EMOTION_LABELS[emotion] || emotion;
  const widthPercent = Math.round(intensity * 100);

  return (
    <div className="chat-emotion-bar">
      <span className="chat-emotion-label">{label}</span>
      <div className="chat-emotion-track">
        <div
          className="chat-emotion-fill"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}
