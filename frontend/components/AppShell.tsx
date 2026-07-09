"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { canManagePlant, useStoredUser } from "@/lib/auth";
import { logout } from "@/lib/data";
import AuthGuard from "./AuthGuard";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/workorders", label: "Work orders" },
  { href: "/alerts", label: "Alerts" },
  { href: "/reports", label: "Reports" },
];

// The authenticated app frame: sits behind AuthGuard, shows the in-scope nav
// (Admin only for a Manager), the signed-in user, and sign-out.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useStoredUser();
  const pathname = usePathname();
  const router = useRouter();

  const nav = canManagePlant(user)
    ? [...NAV, { href: "/admin", label: "Admin" }]
    : NAV;

  const onSignOut = () => {
    logout();
    router.replace("/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              KAVACH
            </Link>
            <nav className="flex flex-1 flex-wrap gap-1 text-sm">
              {nav.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-slate-500 sm:inline">
                {user?.name} · {user?.role}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
