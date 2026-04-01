"use client";

interface TypingIndicatorProps {
  counselorName: string;
}

export default function TypingIndicator({ counselorName }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-2 items-end">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm text-emerald-700 font-medium">
            {counselorName.charAt(0)}
          </span>
        </div>
        <div className="bg-[#F5F0EB] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
          <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
