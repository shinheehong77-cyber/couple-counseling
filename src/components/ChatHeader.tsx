"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ChatHeaderProps {
  counselorName: string;
}

export default function ChatHeader({ counselorName }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 shrink-0 min-w-[44px] min-h-[44px] -ml-2 px-2 rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)" }}
        aria-label="대시보드로 돌아가기"
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
      </Link>
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
