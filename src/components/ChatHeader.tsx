"use client";

interface ChatHeaderProps {
  counselorName: string;
}

export default function ChatHeader({ counselorName }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="chat-avatar">
        <span className="chat-avatar-initial text-base">
          {counselorName.charAt(0)}
        </span>
      </div>
      <div>
        <h1 className="chat-name">{counselorName}</h1>
        <p className="chat-status">상담 진행 중</p>
      </div>
    </header>
  );
}
