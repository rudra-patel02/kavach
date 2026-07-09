"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { hasToken, useStoredToken } from "@/lib/auth";

// Wraps every protected page. With no session token it redirects to /login and
// renders nothing sensitive; the api layer separately handles a mid-session 401
// by redirecting as well.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useStoredToken();

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className="p-8 text-sm text-slate-500" role="status">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}
