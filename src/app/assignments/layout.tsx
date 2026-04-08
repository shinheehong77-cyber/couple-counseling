import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마주 - 상담 과제",
};

export default function AssignmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
