"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Cpu, RadioTower, ShieldCheck, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

import AIDecisionCenterCard from "@/components/dashboard/AIDecisionCenterCard";
import OverviewCards from "@/components/dashboard/OverviewCards";
import LiveSensors from "@/components/sensors/LiveSensors";

const DashboardSectionSkeleton = ({ height = "h-80" }: { height?: string }) => (
  <div className={`premium-skeleton rounded-2xl ${height}`} />
);

const AICommandCenter = dynamic(
  () => import("@/components/dashboard/AICommandCenter"),
  { loading: () => <DashboardSectionSkeleton height="h-72" /> }
);
const AICopilot = dynamic(() => import("@/components/dashboard/AICopilot"), {
  loading: () => <DashboardSectionSkeleton height="h-80" />,
});
const ProductionAnalytics = dynamic(
  () => import("@/components/dashboard/ProductionAnalytics"),
  { loading: () => <DashboardSectionSkeleton height="h-80" /> }
);
const DigitalTwin = dynamic(() => import("@/components/digitalTwin/DigitalTwin"), {
  loading: () => <DashboardSectionSkeleton height="h-[560px]" />,
  ssr: false,
});
const PlantStatus = dynamic(() => import("@/components/dashboard/PlantStatus"), {
  loading: () => <DashboardSectionSkeleton height="h-[560px]" />,
});
const AnalyticsCharts = dynamic(() => import("@/components/charts/AnalyticsChart"), {
  loading: () => <DashboardSectionSkeleton />,
});
const MachineHealthChart = dynamic(
  () => import("@/components/charts/MAchineHealthChart"),
  { loading: () => <DashboardSectionSkeleton /> }
);
const EnergyChart = dynamic(() => import("@/components/charts/EnergyCgart"), {
  loading: () => <DashboardSectionSkeleton />,
});
const MachineStatusChart = dynamic(
  () => import("@/components/charts/MachineStatusChart"),
  { loading: () => <DashboardSectionSkeleton /> }
);
const AIInsights = dynamic(() => import("@/components/dashboard/AIInsights"), {
  loading: () => <DashboardSectionSkeleton height="h-96" />,
});
const LiveAlerts = dynamic(() => import("@/components/dashboard/LiveAlerts"), {
  loading: () => <DashboardSectionSkeleton height="h-96" />,
});
const OEEGauge = dynamic(() => import("@/components/dashboard/OEEGauge"), {
  loading: () => <DashboardSectionSkeleton />,
});
const Scene = dynamic(() => import("@/components/three/Scene"), {
  loading: () => <DashboardSectionSkeleton height="h-[520px]" />,
  ssr: false,
});

export default function Home() {
  return (
    <DashboardLayout>
      <div className="page-stack space-y-8 surface-enter">

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="holographic-panel rounded-2xl p-6 lg:p-8"
        >
          <div className="grid gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="status-pill border-cyan-300/30 text-cyan-100">
                  <Sparkles size={14} />
                  Enterprise Industrial AI
                </span>
                <span className="status-pill border-emerald-300/20 text-emerald-100">
                  <span className="live-dot h-2 w-2 rounded-full bg-emerald-300" />
                  Live plant telemetry
                </span>
              </div>
              <h1 className="text-hologram mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                Kavach Operations Command
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Real-time machine intelligence, ESP32 telemetry, predictive risk,
                and plant performance in one operational command surface.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Cpu, label: "Edge telemetry", value: "ESP32" },
                  { icon: ShieldCheck, label: "Operational trust", value: "JWT" },
                  { icon: RadioTower, label: "Realtime bus", value: "Socket.IO" },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="premium-tile rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-cyan-200" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-1 truncate text-sm font-black text-white">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <AIDecisionCenterCard />
          </div>
        </motion.section>

        {/* Overview Cards */}
        <OverviewCards />

        {/* AI Command Center */}
        <AICommandCenter />
        <AICopilot />
        <LiveSensors />
        <ProductionAnalytics />

        {/* Digital Twin + Plant Status */}
        <div className="grid grid-cols-12 gap-6">

          <div className="col-span-12 xl:col-span-8">
            <DigitalTwin />
          </div>

          <div className="col-span-12 xl:col-span-4">
            <PlantStatus />
          </div>

        </div>

        {/* Analytics */}
        <div className="grid grid-cols-12 gap-6">

          <div className="col-span-12 xl:col-span-6">
            <AnalyticsCharts />
          </div>

          <div className="col-span-12 xl:col-span-6">
            <MachineHealthChart />
          </div>

          <div className="col-span-12 xl:col-span-6">
            <EnergyChart />
          </div>

          <div className="col-span-12 xl:col-span-6">
            <MachineStatusChart />
          </div>

        </div>

        {/* AI Panels */}
        <div className="grid grid-cols-12 gap-6">

          <div className="col-span-12 xl:col-span-8">
            <AIInsights />
          </div>

          <div className="col-span-12 xl:col-span-4">
            <LiveAlerts />
          </div>

        </div>
        <div className="grid grid-cols-12 gap-6">

          <div className="col-span-12">
            <OEEGauge />
          </div>

        </div>

        {/* 3D Preview */}
        <div className="grid grid-cols-12 gap-6">

          <div className="col-span-12">
            <Scene />
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
