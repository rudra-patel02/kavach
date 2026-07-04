"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  BrainCircuit,
  Bell,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Digital Twin", icon: Factory, href: "/plant" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Copilot", icon: BrainCircuit, href: "/copilot" },
  { name: "Predictive", icon: Activity, href: "/predictive" },
  { name: "Alerts", icon: Bell, href: "/alerts" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

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

        {menuItems.map((item) => {

          const Icon = item.icon;
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
