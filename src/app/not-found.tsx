import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="text-center max-w-md">
        <p
          className="mb-3"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          404
        </p>
        <h1
          className="mb-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            lineHeight: 1.3,
          }}
        >
          찾으시는 페이지가 없어요
        </h1>
        <p
          className="mb-8"
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-base)",
            lineHeight: 1.7,
          }}
        >
          주소를 다시 확인하시거나, 아래 버튼으로 홈으로 돌아가실 수 있어요.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-8 py-4 min-h-[44px] text-base font-medium transition-opacity"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "var(--bg-base)",
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
