"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  Building2,
  ClipboardList,
  Cpu,
  FileText,
  Factory,
  Gauge,
  LayoutDashboard,
  RadioTower,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { hasAnyRole, useStoredUser } from "@/lib/auth";
import { NAVIGATION_ITEMS, type NavigationIcon } from "@/lib/navigation";

const iconMap: Record<NavigationIcon, typeof Activity> = {
  activity: Activity,
  barChart: BarChart3,
  bell: Bell,
  brain: BrainCircuit,
  building: Building2,
  clipboard: ClipboardList,
  cpu: Cpu,
  fileText: FileText,
  factory: Factory,
  gauge: Gauge,
  layout: LayoutDashboard,
  radio: RadioTower,
  server: Server,
  shield: ShieldCheck,
  settings: Settings,
  users: Users,
};

export default function Sidebar() {
  const pathname = usePathname();
  const user = useStoredUser();
  const visibleItems = NAVIGATION_ITEMS.filter((item) =>
    hasAnyRole(user?.role, item.roles)
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-cyan-400/10 bg-slate-950/80 shadow-2xl shadow-cyan-950/10 backdrop-blur-2xl lg:flex">

      <div className="border-b border-cyan-400/10 p-8">
        <div className="mb-5 h-1 w-16 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/30" />
        <h1 className="text-3xl font-black tracking-[0.18em] text-cyan-200">
          KAVACH
        </h1>

        <p className="mt-3 text-sm leading-5 text-slate-400">
          Industrial Decision Intelligence
        </p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">

        {visibleItems.map((item) => {

          const Icon = iconMap[item.icon];
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "border border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-lg shadow-cyan-950/30"
                  : "border border-transparent text-slate-400 hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100"
              }`}
            >
              <Icon size={20} className={isActive ? "text-cyan-200" : "text-slate-500 transition-colors group-hover:text-cyan-200"} />
              <span>{item.name}</span>
            </Link>
          );

        })}

      </nav>

      <div className="border-t border-cyan-400/10 p-5 text-xs text-slate-500">
        <div className="premium-tile rounded-lg px-4 py-3">
          <p className="font-semibold text-slate-300">Kavach v1.0</p>
          <p className="mt-1">Enterprise AI Platform</p>
        </div>
      </div>

    </aside>
  );
}
