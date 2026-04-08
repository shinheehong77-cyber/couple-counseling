import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마주 - 홈",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
