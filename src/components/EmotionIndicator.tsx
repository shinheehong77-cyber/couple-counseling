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

const EMOTION_COLORS: Record<string, string> = {
  anger: "bg-red-100 text-red-700",
  sadness: "bg-blue-100 text-blue-700",
  fear: "bg-purple-100 text-purple-700",
  shame: "bg-pink-100 text-pink-700",
  loneliness: "bg-indigo-100 text-indigo-700",
  anxiety: "bg-orange-100 text-orange-700",
  confusion: "bg-yellow-100 text-yellow-700",
  hope: "bg-emerald-100 text-emerald-700",
  relief: "bg-teal-100 text-teal-700",
  gratitude: "bg-amber-100 text-amber-700",
};

export default function EmotionIndicator({ emotion, intensity }: EmotionIndicatorProps) {
  const label = EMOTION_LABELS[emotion] || emotion;
  const colorClass = EMOTION_COLORS[emotion] || "bg-stone-100 text-stone-700";
  const widthPercent = Math.round(intensity * 100);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.replace("text-", "bg-").replace("100", "300")}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}
