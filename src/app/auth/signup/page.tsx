"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "가입에 실패했어요. 다시 시도해 주세요.");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Back to landing */}
      <Link href="/" className="auth-back-link">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        처음으로
      </Link>

      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-wordmark">MAJU</Link>
          <h1 className="auth-title">회원가입</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="name" className="auth-label">닉네임</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="닉네임을 입력하세요"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">이메일</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              비밀번호
              <span className="auth-password-hint">6자 이상</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="비밀번호 입력"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !name || !email || !password}
          >
            {loading ? "가입 중..." : "계정 만들기"}
          </button>
        </form>

        <div className="auth-divider" aria-hidden="true" />

        <p className="auth-footer-text">
          이미 계정이 있으신가요? {" "}
          <Link href="/">로그인</Link>
        </p>
      </div>
    </div>
  );
}
