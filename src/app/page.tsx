"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "이메일 또는 비밀번호를 확인해주세요.");
        return;
      }

      if (autoLogin) {
        localStorage.setItem("autoLogin", "true");
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-hero auth-page-login">
        <form onSubmit={handleSubmit} className="auth-form-login">
          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-brand-wordmark">MAJU</div>
            <p className="auth-brand-tagline">서로를 마주보는 시간</p>
            <p className="auth-brand-desc">
              신뢰도 높은 과학적 접근을 통한 관계 개선을 도와드려요.
            </p>
          </div>

          {/* Fields */}
          <div className="auth-fields">
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                className="auth-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                className="auth-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Auto-login checkbox */}
          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
            />
            자동 로그인
          </label>

          {/* Error */}
          {error && <p className="auth-error-inline">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>

          {/* Sign up link */}
          <p className="auth-signup-link">
            <Link href="/auth/signup">회원가입</Link>
          </p>
        </form>

        {/* Ambient background circles */}
        <div className="landing-hero-ambient" aria-hidden="true">
          <div className="landing-ambient-circle landing-ambient-circle--1" />
          <div className="landing-ambient-circle landing-ambient-circle--2" />
        </div>
      </div>
    </div>
  );
}
