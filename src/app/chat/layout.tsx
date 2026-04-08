import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마주 - 상담",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
