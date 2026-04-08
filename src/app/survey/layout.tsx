import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마주 - 상담 시작",
};

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
