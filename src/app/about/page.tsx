import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <Link href="/" className="landing-wordmark">
          부부상담
        </Link>
        <div className="about-nav-links">
          <Link href="/survey" className="about-nav-link">
            상담 시작
          </Link>
          <Link href="/auth/login" className="landing-nav-login">
            로그인
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="about-hero">
        <div className="about-hero-inner">
          <p className="landing-section-label">About Us</p>
          <h1 className="about-headline">
            과학이 함께하는<br />
            <em>관계 회복의 여정</em>
          </h1>
          <p className="about-subheadline">
            이 서비스는 최신 심리학 연구와 과학적 방법론을 바탕으로,
            어려움을 겪는 부부 관계의 개선을 돕기 위해 만들어졌습니다.
          </p>
        </div>
      </header>

      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── Philosophy ── */}
      <section className="about-section" aria-labelledby="philosophy-heading">
        <div className="about-section-inner">
          <p className="landing-section-label">우리의 철학</p>
          <h2 id="philosophy-heading" className="about-section-heading">
            판단이 아닌 이해,<br />처방이 아닌 동행
          </h2>
          <div className="about-text-block">
            <p>
              우리는 모든 관계에 고유한 맥락이 있다고 믿습니다. 부부 사이의 갈등은
              단순한 &apos;문제&apos;가 아니라, 서로를 더 깊이 이해할 수 있는 기회입니다.
            </p>
            <p>
              이 서비스는 과학적으로 검증된 심리치료 이론과 임상 도구를 기반으로,
              두 사람이 자신과 상대방의 감정을 안전하게 탐색하고,
              건강한 소통 방식을 함께 찾아갈 수 있도록 설계되었습니다.
            </p>
          </div>
        </div>
      </section>

      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── Methodologies ── */}
      <section className="about-section" aria-labelledby="methods-heading">
        <div className="about-section-inner">
          <p className="landing-section-label">과학적 기반</p>
          <h2 id="methods-heading" className="about-section-heading">
            우리 서비스에 적용된<br />연구와 방법론
          </h2>

          <div className="about-methods-grid">
            <article className="about-method-card">
              <h3 className="about-method-title">
                감정중심치료 (EFT)
              </h3>
              <p className="about-method-author">
                Dr. Sue Johnson
              </p>
              <p className="about-method-desc">
                감정중심치료는 성인 애착 이론에 기반하여 부부 사이의 정서적 유대를
                회복하는 데 초점을 맞춥니다. 30년 이상의 임상 연구를 통해
                70-75%의 부부가 관계 개선을 경험한 것으로 보고되었습니다.
              </p>
              <p className="about-method-ref">
                Johnson, S. M. (2004). <em>The Practice of Emotionally Focused Couple Therapy.</em> Brunner-Routledge.
              </p>
            </article>

            <article className="about-method-card">
              <h3 className="about-method-title">
                Gottman 방법론
              </h3>
              <p className="about-method-author">
                Dr. John Gottman & Dr. Julie Gottman
              </p>
              <p className="about-method-desc">
                40년 이상의 부부 관계 연구를 통해 개발된 방법론입니다.
                관계를 해치는 4대 위험 신호(비난, 경멸, 방어, 담쌓기)를 식별하고,
                건강한 갈등 관리 방식을 훈련합니다.
              </p>
              <p className="about-method-ref">
                Gottman, J. M., & Silver, N. (2015). <em>The Seven Principles for Making Marriage Work.</em> Harmony Books.
              </p>
            </article>

            <article className="about-method-card">
              <h3 className="about-method-title">
                성인 애착 이론
              </h3>
              <p className="about-method-author">
                Bowlby, Hazan & Shaver
              </p>
              <p className="about-method-desc">
                개인의 애착 유형(안정형, 불안형, 회피형)이 친밀한 관계에서의
                소통 패턴과 갈등 반응에 깊은 영향을 미칩니다.
                자신과 상대방의 애착 패턴을 이해함으로써 관계의 악순환을 인식하고
                변화의 실마리를 찾을 수 있습니다.
              </p>
              <p className="about-method-ref">
                Hazan, C., & Shaver, P. (1987). Romantic love conceptualized as an attachment process.
                <em> Journal of Personality and Social Psychology, 52</em>(3), 511-524.
              </p>
            </article>
          </div>
        </div>
      </section>

      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── Clinical Tools ── */}
      <section className="about-section" aria-labelledby="tools-heading">
        <div className="about-section-inner">
          <p className="landing-section-label">임상 평가 도구</p>
          <h2 id="tools-heading" className="about-section-heading">
            검증된 심리 평가 도구로<br />현재 상태를 이해합니다
          </h2>

          <div className="about-tools-list">
            <div className="about-tool-item">
              <h3 className="about-tool-name">PHQ-9 (환자 건강 설문지)</h3>
              <p className="about-tool-desc">
                우울 증상의 심각도를 선별하는 9문항 자기보고식 도구입니다.
                전 세계적으로 가장 널리 사용되는 우울 선별 도구 중 하나입니다.
              </p>
              <p className="about-method-ref">
                Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001).
                The PHQ-9: validity of a brief depression severity measure.
                <em> Journal of General Internal Medicine, 16</em>(9), 606-613.
              </p>
            </div>

            <div className="about-tool-item">
              <h3 className="about-tool-name">GAD-7 (범불안장애 척도)</h3>
              <p className="about-tool-desc">
                불안 증상의 심각도를 선별하는 7문항 자기보고식 도구입니다.
                관계 스트레스로 인한 불안 수준을 파악하는 데 활용됩니다.
              </p>
              <p className="about-method-ref">
                Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006).
                A brief measure for assessing generalized anxiety disorder.
                <em> Archives of Internal Medicine, 166</em>(10), 1092-1097.
              </p>
            </div>

            <div className="about-tool-item">
              <h3 className="about-tool-name">RAS (관계 만족도 척도)</h3>
              <p className="about-tool-desc">
                관계에 대한 전반적인 만족도를 측정하는 7문항 도구입니다.
                상담 전후의 변화를 추적하는 데 효과적으로 사용됩니다.
              </p>
              <p className="about-method-ref">
                Hendrick, S. S. (1988). A generic measure of relationship satisfaction.
                <em> Journal of Marriage and the Family, 50</em>(1), 93-98.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── Disclaimer ── */}
      <section className="about-section about-disclaimer-section" aria-labelledby="disclaimer-heading">
        <div className="about-section-inner">
          <h2 id="disclaimer-heading" className="about-disclaimer-heading">
            이용 안내 및 면책 사항
          </h2>
          <div className="about-disclaimer-text">
            <p>
              본 서비스는 <strong>관계 개선을 위한 자기 탐색 도구</strong>이며,
              전문 심리 상담이나 의료 행위를 대체하지 않습니다.
            </p>
            <p>
              서비스에 포함된 심리 평가 도구(PHQ-9, GAD-7 등)는
              <strong>선별(screening) 목적</strong>으로만 사용되며,
              의학적 진단을 위한 것이 아닙니다.
              평가 결과가 심각한 수준을 나타내는 경우,
              반드시 정신건강 전문가와 상담하시기 바랍니다.
            </p>
            <p>
              긴급한 위기 상황(자해, 자살 충동, 가정폭력 등)이 발생한 경우
              즉시 전문 기관에 연락하시기 바랍니다.
            </p>
            <div className="about-hotlines">
              <p><strong>자살예방상담전화</strong> 1393 (24시간)</p>
              <p><strong>정신건강위기상담전화</strong> 1577-0199</p>
              <p><strong>여성긴급전화</strong> 1366</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-bottom-cta" aria-labelledby="about-cta-heading">
        <div className="landing-bottom-cta-inner">
          <div className="landing-ornament" aria-hidden="true">✦</div>
          <h2 id="about-cta-heading" className="landing-bottom-cta-heading">
            과학과 함께, 관계의 새로운 시작
          </h2>
          <p className="landing-bottom-cta-desc">
            검증된 방법론을 바탕으로 두 분의 이야기를 시작해보세요.
          </p>
          <Link href="/survey" className="landing-cta-btn">
            상담 시작하기
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p className="landing-footer-copy">
          © 2026 부부상담 · 과학적 방법론 기반 관계 개선 서비스
        </p>
      </footer>
    </div>
  );
}
