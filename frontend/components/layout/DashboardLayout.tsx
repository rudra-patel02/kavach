"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoredToken } from "@/lib/auth";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const token = useStoredToken();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!token) {
    return <div className="min-h-screen bg-slate-950" />;
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
