import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <Link href="/" className="landing-wordmark">
          마주
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
          <p className="landing-section-label">임상 기반</p>
          <h1 className="about-headline">
            과학적 근거 위에<br />
            <em>설계된 관계 상담</em>
          </h1>
          <p className="about-subheadline">
            마주는 40년 이상의 부부 관계 연구와 임상으로 검증된 방법론을 바탕으로
            설계되었어요. 감에 의존하지 않고, 근거 있는 구조로 두 분을 안내해 드려요.
          </p>
        </div>
      </header>

      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── Clinical Foundations ── */}
      <section className="about-section" aria-labelledby="methods-heading">
        <div className="about-section-inner">
          <p className="landing-section-label">3가지 임상 기반</p>
          <h2 id="methods-heading" className="about-section-heading">
            세계적으로 검증된<br />방법론을 통합했어요
          </h2>

          <div className="about-methods-grid">
            <article className="about-method-card">
              <div className="about-method-badge">01</div>
              <h3 className="about-method-title">
                Gottman 방법론
              </h3>
              <p className="about-method-author">
                Dr. John Gottman &amp; Dr. Julie Gottman
              </p>
              <p className="about-method-desc">
                40년 이상, 3,000쌍이 넘는 부부를 연구한 결과물이에요.
                관계를 무너뜨리는 4가지 핵심 패턴(비판, 경멸, 방어, 담쌓기)을
                감지하고 교정하며, 건강한 관계의 집(Sound Relationship House)
                7단계 구조를 통해 두 사람이 함께 성장할 수 있도록 안내해요.
              </p>
              <p className="about-method-stat">
                93.6% 정확도로 이혼 예측 — 연구의 깊이가 곧 개입의 정밀함이에요.
              </p>
              <p className="about-method-ref">
                Gottman, J. M. (1994). <em>What Predicts Divorce?</em> Lawrence Erlbaum.
              </p>
            </article>

            <article className="about-method-card">
              <div className="about-method-badge">02</div>
              <h3 className="about-method-title">
                감정중심치료 (EFT)
              </h3>
              <p className="about-method-author">
                Dr. Sue Johnson
              </p>
              <p className="about-method-desc">
                성인 애착 이론에 기반한 근거 중심 치료예요. 갈등의 표면 아래
                숨은 감정과 애착 욕구를 탐색하고, 반복되는 부정적 순환 패턴을
                인식해서 끊어내는 데 초점을 맞춰요. 관계의 감정적 유대를
                근본부터 회복시키는 방법론이에요.
              </p>
              <p className="about-method-stat">
                70–75%의 커플이 유의미한 관계 개선을 경험 — 미국심리학회(APA) 인정 근거 기반 치료예요.
              </p>
              <p className="about-method-ref">
                Johnson, S. M. (2004). <em>The Practice of Emotionally Focused Couple Therapy.</em> Brunner-Routledge.
              </p>
            </article>

            <article className="about-method-card">
              <div className="about-method-badge">03</div>
              <h3 className="about-method-title">
                한국 문화 통합 모델
              </h3>
              <p className="about-method-author">
                한국가족치료학회 기반
              </p>
              <p className="about-method-desc">
                서양 방법론을 그대로 적용하면 한국 부부에게 맞지 않는 경우가
                많아요. 체면, 정, 유교적 가족 역동, 시댁·처가 관계 등 한국
                부부 갈등의 고유한 맥락을 반영해서 상담을 설계했어요.
              </p>
              <p className="about-method-stat">
                드러내기 → 서로알기 → 실행하기, 한국 단기 부부상담 3단계 모델을 적용해요.
              </p>
              <p className="about-method-ref">
                한국가족치료학회. Korean Integrative Family Therapy Model.
              </p>
            </article>
          </div>
        </div>
      </section>

      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── 4-Week Program ── */}
      <section className="about-section" aria-labelledby="program-heading">
        <div className="about-section-inner">
          <p className="landing-section-label">4주 프로그램</p>
          <h2 id="program-heading" className="about-section-heading">
            주차별로 단계를 밟아가며<br />관계를 다시 설계해요
          </h2>
          <p className="about-program-intro">
            매주 개별상담 → 공동상담 → 과제 수행 → 체크인 순서로 진행돼요.
            두 분이 함께 구조 안에서 움직이면, 변화는 우연이 아니라 설계의 결과가 돼요.
          </p>

          <div className="about-program-grid">
            <div className="about-program-week">
              <div className="about-program-week-number">1주차</div>
              <div className="about-program-week-theme">현재 상태 파악</div>
              <p className="about-program-week-desc">
                각자의 감정과 상황을 탐색하고, 서로의 시각을 안전하게 공유해요.
                감사일기와 경청 연습으로 한 주를 마무리해요.
              </p>
            </div>
            <div className="about-program-week">
              <div className="about-program-week-number">2주차</div>
              <div className="about-program-week-theme">갈등 패턴 이해</div>
              <p className="about-program-week-desc">
                반복되는 갈등의 원인과 패턴을 분석하고, 비폭력 대화법을 연습해요.
                갈등 상황을 재현하고 함께 해결책을 찾아봐요.
              </p>
            </div>
            <div className="about-program-week">
              <div className="about-program-week-number">3주차</div>
              <div className="about-program-week-theme">소통 방식 개선</div>
              <p className="about-program-week-desc">
                각자의 소통 스타일을 인식하고 새로운 패턴을 연습해요.
                매일 15분 대화로 소통의 근육을 길러요.
              </p>
            </div>
            <div className="about-program-week">
              <div className="about-program-week-number">4주차</div>
              <div className="about-program-week-theme">관계 재설계</div>
              <p className="about-program-week-desc">
                변화를 점검하고 두 사람만의 관계 비전을 함께 수립해요.
                관계 선언문을 작성하며 새로운 출발점을 만들어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-section-rule" aria-hidden="true" />

      {/* ── Research Stats ── */}
      <section className="about-section" aria-labelledby="research-heading">
        <div className="about-section-inner">
          <p className="landing-section-label">연구 근거</p>
          <h2 id="research-heading" className="about-section-heading">
            숫자로 증명된<br />상담의 효과
          </h2>

          <div className="about-stats-grid">
            <div className="about-stat-card">
              <div className="about-stat-number">70%</div>
              <p className="about-stat-desc">
                부부상담을 받은 커플의 70%가 관계 개선을 보고했어요.
              </p>
              <p className="about-stat-source">
                Journal of Consulting and Clinical Psychology
              </p>
            </div>
            <div className="about-stat-card">
              <div className="about-stat-number">93.6%</div>
              <p className="about-stat-desc">
                Gottman 연구팀이 이혼을 예측한 정확도예요. 이 연구가 마주 상담 설계의 기초예요.
              </p>
              <p className="about-stat-source">
                Gottman, J. M. (1994). What Predicts Divorce?
              </p>
            </div>
            <div className="about-stat-card">
              <div className="about-stat-number">70–75%</div>
              <p className="about-stat-desc">
                EFT 치료를 받은 커플 중 유의미한 변화를 경험한 비율이에요.
              </p>
              <p className="about-stat-source">
                APA Division 43, EFT Research Summary
              </p>
            </div>
          </div>

          <div className="about-research-note">
            <p>
              마주는 전문 심리 상담사가 직접 진행하는 오프라인 상담의 구조와 방법론을
              모바일 환경에 옮긴 서비스예요. 상담의 형식은 바뀌었지만, 그 안의 근거는 그대로예요.
            </p>
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
              전문 심리 상담이나 의료 행위를 대체하지 않아요.
            </p>
            <p>
              서비스에 포함된 심리 평가 도구는 <strong>선별(screening) 목적</strong>으로만
              사용되며, 의학적 진단을 위한 것이 아니에요. 평가 결과가 심각한 수준을
              나타내는 경우, 반드시 정신건강 전문가와 상담하시기 바라요.
            </p>
            <p>
              긴급한 위기 상황(자해, 자살 충동, 가정폭력 등)이 발생한 경우
              즉시 전문 기관에 연락하시기 바라요.
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
            근거 있는 상담으로<br />두 분의 이야기를 시작해요
          </h2>
          <p className="landing-bottom-cta-desc">
            40년의 연구가 뒷받침하는 구조 안에서, 두 분만의 속도로 진행해요.
          </p>
          <Link href="/survey" className="landing-cta-btn">
            상담 시작하기
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p className="landing-footer-brand">MAJU</p>
          <p className="landing-footer-tagline">서로를 마주보는 시간</p>
          <p className="landing-footer-copy">
            © 2026 마주 · 모든 권리 보유
          </p>
        </div>
      </footer>
    </div>
  );
}
