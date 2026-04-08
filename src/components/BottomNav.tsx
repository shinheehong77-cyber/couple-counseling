"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, ClipboardList, Menu } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "홈", icon: Home },
  { href: "/chat", label: "상담", icon: MessageSquare },
  { href: "/assignments", label: "과제", icon: ClipboardList },
  { href: "/about", label: "더보기", icon: Menu },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on landing, auth, and admin pages
  const shouldHide =
    pathname === "/" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/admin");
  if (shouldHide) return null;

  return (
    <nav className="bottom-nav" aria-label="메인 네비게이션">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
