"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserMode } from "@/types/user";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  coupleId?: string | null;
  userMode?: UserMode | null;
  onboardedAt?: string | null;
}

interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
}

/**
 * Client-side auth hook.
 * Checks /api/auth/session and redirects to / if unauthenticated.
 * Always sets loading=false so pages can transition from skeleton to content/redirect.
 */
export function useAuth(): UseAuthResult {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          if (!cancelled) {
            setLoading(false);
            router.replace("/");
          }
          return;
        }
        const data = await res.json();
        if (!data.user) {
          if (!cancelled) {
            setLoading(false);
            router.replace("/");
          }
          return;
        }
        if (!cancelled) {
          setUser(data.user);
          setLoading(false);

          /* Redirect to onboarding if user hasn't chosen a mode yet */
          if (!data.user.onboardedAt && pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          router.replace("/");
        }
      }
    }

    void check();
    return () => { cancelled = true; };
  }, [router, pathname]);

  return { user, loading };
}
