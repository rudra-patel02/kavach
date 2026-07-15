"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
          className="premium-card rounded-2xl p-6 lg:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300/80">
                Enterprise Industrial AI
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
                Kavach Operations Command
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                Real-time machine intelligence, ESP32 telemetry, predictive risk,
                and plant performance in one operational view.
              </p>
            </div>

            <div className="premium-tile rounded-xl px-4 py-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="live-dot h-2.5 w-2.5 rounded-full bg-cyan-300" />
                Live plant telemetry
              </div>
            </div>
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
