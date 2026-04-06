"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  counselorName: string;
  timestamp?: string;
}

export default function MessageBubble({
  role,
  content,
  counselorName,
  timestamp,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <div className="chat-avatar-sm">
            <span className="chat-avatar-initial text-sm">
              {counselorName.charAt(0)}
            </span>
          </div>
        )}

        <div>
          {!isUser && (
            <p className="chat-sender-name">{counselorName}</p>
          )}

          <div className={isUser ? "chat-bubble-user" : "chat-bubble-counselor"}>
            {content}
          </div>

          {timestamp && (
            <p className={`chat-timestamp ${isUser ? "text-right mr-1" : "ml-1"}`}>
              {timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
