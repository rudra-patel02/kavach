"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredUser,
  hasAnyRole,
  hasToken,
  useStoredToken,
  useStoredUser,
} from "@/lib/auth";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function DashboardLayout({ allowedRoles, children }: Props) {
  const router = useRouter();
  const token = useStoredToken();
  const user = useStoredUser();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const effectiveToken =
    isAuthReady && typeof window !== "undefined"
      ? hasToken()
        ? "present"
        : null
      : token;
  const effectiveUser = isAuthReady ? user || getStoredUser() : user;
  const isAllowed =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    hasAnyRole(effectiveUser?.role, allowedRoles);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsAuthReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthReady && !effectiveToken) {
      router.replace("/login");
    }
  }, [effectiveToken, isAuthReady, router]);

  if (!isAuthReady || !effectiveToken) {
    return (
      <div className="min-h-screen bg-slate-950 industrial-shell p-6">
        <div className="page-stack space-y-6">
          <div className="premium-skeleton h-12 w-72 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="premium-skeleton h-32 rounded-2xl" />
            ))}
          </div>
          <div className="premium-skeleton h-[520px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen bg-slate-950 industrial-shell">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Navbar />
          <main className="p-4 sm:p-6 lg:p-8">
            <section className="premium-card page-stack rounded-2xl p-6 text-red-100">
              <h1 className="text-2xl font-bold">Access denied</h1>
              <p className="mt-2 text-sm">
                Your current role does not have permission to open this page.
              </p>
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950 industrial-shell">
      <div className="pointer-events-none fixed left-0 top-0 z-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-px w-full bg-gradient-to-r from-emerald-300/20 via-transparent to-cyan-300/20" />
      <Sidebar />

      <div className="relative z-10 min-w-0 flex-1">
        <Navbar />

        <main className="p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
