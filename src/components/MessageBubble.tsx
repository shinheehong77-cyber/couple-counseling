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
        {/* Avatar — only for counselor */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm text-emerald-700 font-medium">
              {counselorName.charAt(0)}
            </span>
          </div>
        )}

        <div>
          {/* Sender name */}
          {!isUser && (
            <p className="text-xs text-stone-400 mb-1 ml-1">{counselorName}</p>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-3 text-base leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm"
                : "bg-[#F5F0EB] text-[#2D2D2D] rounded-2xl rounded-tl-sm"
            }`}
          >
            {content}
          </div>

          {/* Timestamp */}
          {timestamp && (
            <p className={`text-xs text-stone-400 mt-1 ${isUser ? "text-right mr-1" : "ml-1"}`}>
              {timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
