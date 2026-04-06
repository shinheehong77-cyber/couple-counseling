"use client";

interface TypingIndicatorProps {
  counselorName: string;
}

export default function TypingIndicator({ counselorName }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-2 items-end">
        <div className="chat-avatar-sm">
          <span className="chat-avatar-initial text-sm">
            {counselorName.charAt(0)}
          </span>
        </div>
        <div className="chat-typing-bubble">
          <span className="chat-typing-dot" style={{ animationDelay: "0ms" }} />
          <span className="chat-typing-dot" style={{ animationDelay: "180ms" }} />
          <span className="chat-typing-dot" style={{ animationDelay: "360ms" }} />
        </div>
      </div>
    </div>
  );
}
