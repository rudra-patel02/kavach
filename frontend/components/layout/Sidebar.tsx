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
    <aside className="hidden h-screen w-72 flex-col border-r border-slate-800 bg-slate-950 lg:flex lg:sticky lg:top-0">

      <div className="p-8 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-cyan-400">
          KAVACH
        </h1>

        <p className="text-slate-400 mt-2 text-sm">
          Industrial Decision Intelligence
        </p>
      </div>

      <nav className="flex-1 p-5 space-y-3">

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
              className={`flex items-center gap-4 rounded-xl px-5 py-3 transition-all duration-300 ${
                isActive
                  ? "border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-lg shadow-cyan-950/20"
                  : "text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-400"
              }`}
            >
              <Icon size={22} />
              <span>{item.name}</span>
            </Link>
          );

        })}

      </nav>

      <div className="p-6 border-t border-slate-800 text-center text-slate-500 text-xs">
        Kavach v1.0
      </div>

    </aside>
  );
}
