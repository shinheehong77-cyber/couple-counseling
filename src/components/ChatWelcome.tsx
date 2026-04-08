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
        <span className="chat-avatar-initial text-2xl">✦</span>
      </div>

      <div className="chat-welcome-bubble">
        <p>안녕하세요, {userName}님.</p>
        <p>당신을 위한 전담 상담사입니다.</p>
        <p>무엇이든 편하게 말씀해주세요.</p>
      </div>

      <p className="chat-welcome-hint">
        선택지 없이 자유롭게 대화하시는 게 더 좋아요. 하고 싶은 말씀을 편하게 해주세요.
      </p>

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
