"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";
import type { UserMode } from "@/types/user";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(mode: UserMode) {
    setSelected(mode);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMode: mode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "설정에 실패했어요.");
      }

      if (mode === "solo") {
        router.push("/survey");
      } else {
        router.push("/couple");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "잠시 문제가 생겼어요. 다시 시도해 주세요.");
      setSelected(null);
      setLoading(false);
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <header className="onboarding-header">
          <div className="onboarding-wordmark">MAJU</div>
          <h1 className="onboarding-title">어떤 방식으로 시작하시겠어요?</h1>
        </header>

        <div className="onboarding-cards">
          <button
            type="button"
            className={`onboarding-card${selected === "solo" ? " onboarding-card--selected" : ""}`}
            onClick={() => void handleSelect("solo")}
            disabled={loading}
          >
            <div className="onboarding-card-icon-wrap">
              <User size={28} strokeWidth={1.5} />
            </div>
            <h2 className="onboarding-card-title">혼자 시작하기</h2>
            <p className="onboarding-card-desc">
              나 자신의 감정과 관계 패턴을 먼저 이해해요
            </p>
          </button>

          <button
            type="button"
            className={`onboarding-card${selected === "couple" ? " onboarding-card--selected" : ""}`}
            onClick={() => void handleSelect("couple")}
            disabled={loading}
          >
            <div className="onboarding-card-icon-wrap">
              <Users size={28} strokeWidth={1.5} />
            </div>
            <h2 className="onboarding-card-title">둘이 함께하기</h2>
            <p className="onboarding-card-desc">
              파트너와 함께 관계를 개선해 나가요
            </p>
          </button>
        </div>

        {error && <p className="onboarding-error">{error}</p>}

        <p className="onboarding-hint">나중에 언제든 변경할 수 있어요</p>
      </div>
    </div>
  );
}
