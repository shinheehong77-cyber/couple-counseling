"use client";

import { QUICK_PROMPTS } from "@/lib/counseling-prompts";

interface ChatWelcomeProps {
  counselorName: string;
  userName: string;
  onQuickPrompt: (prompt: string) => void;
}

export default function ChatWelcome({
  counselorName,
  userName,
  onQuickPrompt,
}: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Counselor avatar */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center mb-4">
        <span className="text-2xl text-emerald-700 font-medium">
          {counselorName.charAt(0)}
        </span>
      </div>

      {/* Welcome message — warm and personal per KDS-49 */}
      <div className="bg-[#F5F0EB] rounded-2xl px-6 py-4 mb-8 max-w-md text-[#2D2D2D] text-base leading-relaxed">
        <p>안녕하세요, {userName}님.</p>
        <p>저는 {counselorName}입니다.</p>
        <p>오늘 어떤 이야기를 나눠볼까요?</p>
      </div>

      {/* Quick prompts — pill-shaped buttons per KDS-49 */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onQuickPrompt(prompt)}
            className="px-4 py-2.5 rounded-full border border-stone-300 text-sm text-stone-600
                       hover:bg-stone-50 hover:border-stone-400 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
