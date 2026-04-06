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
      <div className="chat-avatar-lg mb-4">
        <span className="chat-avatar-initial text-2xl">
          {counselorName.charAt(0)}
        </span>
      </div>

      <div className="chat-welcome-bubble">
        <p>안녕하세요, {userName}님.</p>
        <p>저는 {counselorName}입니다.</p>
        <p>오늘 어떤 이야기를 나눠볼까요?</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onQuickPrompt(prompt)}
            className="chat-quick-prompt"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
