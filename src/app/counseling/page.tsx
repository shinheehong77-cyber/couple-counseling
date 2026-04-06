"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, Mic } from "lucide-react";

type CounselingMode = "chat" | "voice";

export default function CounselingModePage() {
  const router = useRouter();

  function handleSelect(mode: CounselingMode) {
    if (mode === "chat") {
      router.push("/chat");
    } else {
      router.push("/chat?mode=voice");
    }
  }

  return (
    <div className="counseling-select">
      <div className="counseling-select-header">
        <h1 className="counseling-select-title">상담 방식 선택</h1>
        <p className="counseling-select-subtitle">
          편한 방식으로 상담을 시작해 보세요
        </p>
      </div>

      <div className="counseling-mode-cards">
        {/* 대화하며 상담하기 (음성) */}
        <button
          type="button"
          className="counseling-mode-card"
          onClick={() => handleSelect("voice")}
        >
          <div className="counseling-mode-icon">
            <Mic size={28} strokeWidth={1.5} />
          </div>
          <h2 className="counseling-mode-name">대화하며 상담하기</h2>
          <p className="counseling-mode-desc">
            음성으로 편안하게 대화하듯 상담을 진행해요.
            상담사의 따뜻한 목소리로 안내받을 수 있어요.
          </p>
          <ul className="counseling-mode-features">
            <li>편안한 TTS 음성 응답</li>
            <li>실제 상담처럼 대화 형식</li>
            <li>텍스트 입력도 함께 가능</li>
          </ul>
        </button>

        {/* 채팅으로 상담하기 */}
        <button
          type="button"
          className="counseling-mode-card"
          onClick={() => handleSelect("chat")}
        >
          <div className="counseling-mode-icon">
            <MessageSquare size={28} strokeWidth={1.5} />
          </div>
          <h2 className="counseling-mode-name">채팅으로 상담하기</h2>
          <p className="counseling-mode-desc">
            텍스트로 차분하게 생각을 정리하며 상담해요.
            나만의 속도로 천천히 이야기할 수 있어요.
          </p>
          <ul className="counseling-mode-features">
            <li>텍스트 기반 대화</li>
            <li>생각을 정리할 시간 충분</li>
            <li>대화 내용 다시 읽기 편함</li>
          </ul>
        </button>
      </div>
    </div>
  );
}
