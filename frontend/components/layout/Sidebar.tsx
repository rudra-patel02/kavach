"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Factory,
  ShieldCheck,
  BrainCircuit,
  Bell,
  BarChart3,
  Settings,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Plant", icon: Factory, href: "/plant" },
  { name: "Safety", icon: ShieldCheck, href: "/safety" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "AI Copilot", icon: BrainCircuit, href: "/copilot" },
  { name: "Alerts", icon: Bell, href: "/alerts" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-slate-950 border-r border-slate-800 flex flex-col">

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

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-4 px-5 py-3 rounded-xl text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-400 transition-all duration-300"
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