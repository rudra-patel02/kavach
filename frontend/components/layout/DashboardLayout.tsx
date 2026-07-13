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
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Navbar />
          <main className="p-4 sm:p-6 lg:p-8">
            <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Navbar />

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
