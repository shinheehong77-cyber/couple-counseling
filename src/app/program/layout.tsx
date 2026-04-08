import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마주 - 4주 프로그램",
};

export default function ProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
