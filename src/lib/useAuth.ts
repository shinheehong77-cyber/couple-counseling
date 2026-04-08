"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  coupleId?: string | null;
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
  }, [router]);

  return { user, loading };
}
