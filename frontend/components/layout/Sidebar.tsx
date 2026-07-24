"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  PanelLeftClose,
  PanelLeftOpen,
  RadioTower,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { hasAnyRole, useStoredUser } from "@/lib/auth";
import {
  NAVIGATION_ITEMS,
  type NavigationIcon,
  type NavigationItem,
} from "@/lib/navigation";

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

const navigationGroups = [
  {
    label: "Command",
    match: ["/", "/dashboard/executive", "/enterprise", "/machines", "/plant", "/iot", "/smart-factory"],
  },
  {
    label: "Intelligence",
    match: ["/analytics", "/copilot", "/predictive", "/ai"],
  },
  {
    label: "Operations",
    match: ["/workorders", "/alerts", "/reports", "/audit"],
  },
  {
    label: "Administration",
    match: ["/admin", "/system", "/users", "/settings"],
  },
] satisfies Array<{ label: string; match: string[] }>;

const groupNavigationItems = (items: NavigationItem[]) =>
  navigationGroups
    .map((group) => ({
      ...group,
      items: items.filter((item) => group.match.includes(item.href)),
    }))
    .filter((group) => group.items.length > 0);

export default function Sidebar() {
  const pathname = usePathname();
  const user = useStoredUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const visibleItems = NAVIGATION_ITEMS.filter((item) =>
    hasAnyRole(user?.role, item.roles)
  );
  const groupedItems = groupNavigationItems(visibleItems);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 96 : 288 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className="sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-cyan-400/10 bg-slate-950/72 shadow-2xl shadow-cyan-950/10 backdrop-blur-2xl lg:flex"
    >

      <div className="border-b border-cyan-400/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-5 h-1 w-16 rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-violet-300 shadow-lg shadow-cyan-400/30" />
            <AnimatePresence initial={false}>
              {!isCollapsed ? (
                <motion.div
                  key="brand-expanded"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <h1 className="text-hologram text-3xl font-black tracking-[0.18em]">
                    KAVACH
                  </h1>

                  <p className="mt-3 text-sm leading-5 text-slate-400">
                    Industrial Decision Intelligence
                  </p>
                </motion.div>
              ) : (
                <motion.h1
                  key="brand-collapsed"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                  className="text-hologram text-2xl font-black tracking-[0.12em]"
                >
                  K
                </motion.h1>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-2 text-cyan-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/20"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto p-4">

        {groupedItems.map((group) => (
          <div key={group.label} className="space-y-2">
            {!isCollapsed ? (
              <p className="px-3 text-[0.66rem] font-black uppercase tracking-[0.24em] text-slate-600">
                {group.label}
              </p>
            ) : null}

            {group.items.map((item) => {

              const Icon = iconMap[item.icon];
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    isCollapsed ? "justify-center" : "gap-4"
                  } ${
                    isActive
                      ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-lg shadow-cyan-950/30"
                      : "border-transparent text-slate-400 hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-cyan-100 hover:shadow-lg hover:shadow-cyan-950/20"
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-cyan-300 shadow-lg shadow-cyan-300/40"
                    />
                  ) : null}

                  <Icon size={20} className={isActive ? "text-cyan-200" : "text-slate-500 transition-colors group-hover:text-cyan-200"} />
                  {!isCollapsed ? <span className="truncate">{item.name}</span> : null}
                </Link>
              );

            })}
          </div>
        ))}

      </nav>

      <div className="border-t border-cyan-400/10 p-5 text-xs text-slate-500">
        <div className="premium-tile rounded-lg px-4 py-3 text-center">
          <p className="font-semibold text-slate-300">{isCollapsed ? "v1.0" : "Kavach v1.0"}</p>
          {!isCollapsed ? <p className="mt-1">Enterprise AI Platform</p> : null}
        </div>
      </div>

    </motion.aside>
  );
}
