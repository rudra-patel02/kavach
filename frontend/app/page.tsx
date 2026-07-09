"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import OverviewCards from "@/components/dashboard/OverviewCards";
import AICommandCenter from "@/components/dashboard/AICommandCenter";
import PlantStatus from "@/components/dashboard/PlantStatus";
import AIInsights from "@/components/dashboard/AIInsights";
import LiveAlerts from "@/components/dashboard/LiveAlerts";

import DigitalTwin from "@/components/digitalTwin/DigitalTwin";

import AnalyticsCharts from "@/components/charts/AnalyticsChart";
import MachineHealthChart from "@/components/charts/MAchineHealthChart";
import EnergyChart from "@/components/charts/EnergyCgart";
import MachineStatusChart from "@/components/charts/MachineStatusChart";

import Scene from "@/components/three/Scene";
import OEEGauge from "@/components/dashboard/OEEGauge";
import AICopilot from "@/components/dashboard/AICopilot";
import ProductionAnalytics from "@/components/dashboard/ProductionAnalytics";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Overview Cards */}
        <OverviewCards />

        {/* AI Command Center */}
        <AICommandCenter />
        <AICopilot />
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