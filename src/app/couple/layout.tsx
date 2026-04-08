import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마주 - 공동상담",
};

export default function CoupleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
