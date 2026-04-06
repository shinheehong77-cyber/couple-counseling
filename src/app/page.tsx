import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <span className="landing-wordmark">부부상담</span>
        <div className="about-nav-links">
          <Link href="/about" className="about-nav-link">
            About Us
          </Link>
          <Link href="/auth/login" className="landing-nav-login">
            로그인
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-ornament" aria-hidden="true">✦</div>
          <h1 className="landing-headline">
            두 사람 사이의<br />
            <em>조용한 공간</em>
          </h1>
          <p className="landing-subheadline">
            관계를 개선하고 싶은 마음, 하지만 어디서부터 시작해야 할지 모를 때.
            <br className="landing-br-desktop" />
            AI 상담사와 함께 천천히, 솔직하게 이야기를 시작해보세요.
          </p>
          <Link href="/survey" className="landing-cta-btn">
            상담 시작하기
          </Link>
        </div>

        {/* CSS-only ambient texture — no images */}
        <div className="landing-hero-ambient" aria-hidden="true">
          <div className="landing-ambient-circle landing-ambient-circle--1" />
          <div className="landing-ambient-circle landing-ambient-circle--2" />
        </div>
      </header>

      {/* ── Section divider ── */}
      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── How it works ── */}
      <section
        className="landing-section"
        aria-labelledby="how-it-works-heading"
      >
        <div className="landing-section-inner">
          <p className="landing-section-label">어떻게 시작하나요</p>
          <h2 id="how-it-works-heading" className="landing-section-heading">
            세 단계로 이루어지는<br />상담의 흐름
          </h2>

          <ol className="landing-steps">
            <li className="landing-step">
              <span className="landing-step-num" aria-hidden="true">01</span>
              <div className="landing-step-body">
                <h3 className="landing-step-title">관계 설문</h3>
                <p className="landing-step-desc">
                  두 분의 관계에 대한 짧은 설문에 답해주세요. 소요 시간은 약 5분입니다.
                  솔직한 답변이 더 깊은 대화로 이어져요.
                </p>
              </div>
            </li>

            <li className="landing-step">
              <span className="landing-step-num" aria-hidden="true">02</span>
              <div className="landing-step-body">
                <h3 className="landing-step-title">맞춤 분석</h3>
                <p className="landing-step-desc">
                  응답을 바탕으로 관계의 강점과 개선 가능성을 파악합니다.
                  판단이 아닌 이해를 목표로 해요.
                </p>
              </div>
            </li>

            <li className="landing-step">
              <span className="landing-step-num" aria-hidden="true">03</span>
              <div className="landing-step-body">
                <h3 className="landing-step-title">AI 상담 대화</h3>
                <p className="landing-step-desc">
                  준비된 맥락을 바탕으로 AI 상담사와 자유롭게 이야기를 나눠보세요.
                  언제든, 혼자서도 시작할 수 있어요.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Section divider ── */}
      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── Features ── */}
      <section className="landing-section" aria-labelledby="features-heading">
        <div className="landing-section-inner">
          <p className="landing-section-label">이런 점이 다릅니다</p>
          <h2 id="features-heading" className="landing-section-heading">
            조심스럽게 설계된<br />상담의 공간
          </h2>

          <ul className="landing-features" role="list">
            <li className="landing-feature-card">
              <div className="landing-feature-icon" aria-hidden="true">
                {/* Lucide-style: message circle */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="landing-feature-title">맞춤형 AI 상담</h3>
              <p className="landing-feature-desc">
                설문 결과를 바탕으로 개인화된 상담 흐름을 제공합니다.
                일반적인 조언이 아닌, 두 분의 이야기에 집중해요.
              </p>
            </li>

            <li className="landing-feature-card">
              <div className="landing-feature-icon" aria-hidden="true">
                {/* Lucide-style: clipboard check */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="landing-feature-title">설문 기반 분석</h3>
              <p className="landing-feature-desc">
                관계 심리학에 기반한 설문으로 시작합니다.
                감정, 소통, 친밀감 등 다양한 영역을 자연스럽게 짚어줘요.
              </p>
            </li>

            <li className="landing-feature-card">
              <div className="landing-feature-icon" aria-hidden="true">
                {/* Lucide-style: lock */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="landing-feature-title">안전한 공간</h3>
              <p className="landing-feature-desc">
                이곳에서 나누는 이야기는 비공개로 유지됩니다.
                판단받을 걱정 없이 솔직하게 털어놓을 수 있어요.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="landing-bottom-cta"
        aria-labelledby="bottom-cta-heading"
      >
        <div className="landing-bottom-cta-inner">
          <div className="landing-ornament" aria-hidden="true">✦</div>
          <h2 id="bottom-cta-heading" className="landing-bottom-cta-heading">
            지금 바로 시작해볼 수 있어요
          </h2>
          <p className="landing-bottom-cta-desc">
            회원가입 없이도 설문과 상담을 경험할 수 있습니다.
          </p>
          <div className="landing-bottom-cta-actions">
            <Link href="/survey" className="landing-cta-btn">
              상담 시작하기
            </Link>
            <Link href="/auth/login" className="landing-cta-secondary">
              계정 만들기
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p className="landing-footer-copy">
          © 2026 부부상담 &middot; 조용하고 안전한 관계 개선의 공간
        </p>
      </footer>
    </div>
  );
}
