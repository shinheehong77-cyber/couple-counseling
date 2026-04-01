"use client";

interface ChatHeaderProps {
  counselorName: string;
}

export default function ChatHeader({ counselorName }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-6 py-4 border-b border-stone-200 bg-white">
      {/* Professional avatar — warm, gender-neutral per KDS-49 */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
        <span className="text-lg text-emerald-700 font-medium">
          {counselorName.charAt(0)}
        </span>
      </div>
      <div>
        <h1 className="text-base font-semibold text-stone-800">
          {counselorName}
        </h1>
        <p className="text-xs text-stone-400">상담 진행 중</p>
      </div>
    </header>
  );
}
