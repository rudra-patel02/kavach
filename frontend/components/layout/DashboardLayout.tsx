"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasAnyRole, useStoredToken, useStoredUser } from "@/lib/auth";
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
  const isAllowed =
    !allowedRoles || allowedRoles.length === 0 || hasAnyRole(user?.role, allowedRoles);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!token) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Navbar />
          <main className="p-8">
            <section className="rounded-2xl border border-red-400/30 bg-red-500/10 p-8 text-red-100">
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
    <div className="flex bg-slate-950 min-h-screen">

      <Sidebar />

      <div className="min-w-0 flex-1">

        <Navbar />

        <main className="p-8">

          {children}

        </main>

      </div>

    </div>
  
  );
}
