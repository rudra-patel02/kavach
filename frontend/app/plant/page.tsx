"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  ClipboardList,
  Factory,
  Loader2,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEnterpriseTelemetry } from "@/hooks/useEnterpriseTelemetry";
import { createWorkOrder } from "@/lib/workorders";
import type { EnterpriseMachineProfile } from "@/lib/enterpriseAnalytics";

const FactoryScene = dynamic(() => import("@/components/3d/FactoryScene"), {
  loading: () => (
    <div className="flex h-full min-h-[520px] items-center justify-center bg-slate-950 text-sm font-semibold text-slate-400">
      Loading digital twin
    </div>
  ),
  ssr: false,
});

const formatNumber = (value: number | undefined, digits = 1) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "--";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
};

const statusBadgeClass = (status?: string) => {
  if (status === "Running") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "Warning") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (status === "Critical") return "border-red-400/30 bg-red-500/10 text-red-200";
  return "border-slate-500/30 bg-slate-700/50 text-slate-300";
};

export default function PlantPage() {
  const {
    enhancedAlerts,
    insights,
    kpis,
    profiles,
    isLoading,
    error,
    reload,
  } = useEnterpriseTelemetry();
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const selectedProfile = useMemo(
    () =>
      profiles.find((profile) => profile.machine.machineId === selectedMachineId) ||
      null,
    [profiles, selectedMachineId]
  );

  const handleCreateWorkOrder = async (
    profile: EnterpriseMachineProfile,
    scheduled = false
  ) => {
    setIsCreatingOrder(true);
    setActionMessage(null);

    try {
      await createWorkOrder({
        machineId: profile.machine.machineId,
        priority: scheduled ? "MEDIUM" : "CRITICAL",
        status: "OPEN",
        description: scheduled
          ? `Scheduled maintenance for ${profile.machine.name}.`
          : `Digital Twin action: inspect ${profile.machine.name}.`,
        probableCause: profile.prediction?.probableCause,
        aiRecommendation: profile.prediction?.recommendation,
        estimatedDowntimeHours: profile.prediction?.estimatedDowntimeHours || 2,
      });
      setActionMessage(
        scheduled
          ? "Maintenance schedule request created."
          : "Work order created."
      );
      await reload();
    } catch (requestError) {
      setActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create work order"
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <Factory size={18} />
              Digital Twin
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Digital Plant
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Real-time industrial twin with live status colors, animated
              equipment, telemetry overlays, and asset-level maintenance actions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
            Refresh Twin
          </button>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="relative h-[72vh] min-h-[560px] overflow-hidden rounded-2xl bg-slate-950">
          <FactoryScene
            profiles={profiles}
            selectedMachineId={selectedMachineId}
            onMachineSelect={(profile) => {
              setSelectedMachineId(profile.machine.machineId);
              setActionMessage(null);
            }}
            showSensorOverlays
          />

          <div className="pointer-events-none absolute left-4 top-4 max-w-xl rounded-xl border border-slate-700 bg-slate-950/82 px-4 py-3 text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="font-semibold text-white">Live Socket.IO Twin</div>
            <div className="mt-1">
              {profiles.length} monitored assets | click a machine for details
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                ["OEE", `${kpis.overallOee}%`],
                ["Health", `${kpis.averageHealth}%`],
                ["Energy", `${kpis.totalEnergy} kWh`],
                ["Alarms", kpis.criticalAlerts],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2">
                  <div className="text-[10px] uppercase text-slate-500">{label}</div>
                  <div className="mt-1 font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="pointer-events-none absolute bottom-4 right-4 w-[min(24rem,calc(100%-2rem))] rounded-xl border border-cyan-400/20 bg-slate-950/82 p-4 text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-white">Twin Alarms</div>
              <div className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-100">
                {enhancedAlerts.length}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {enhancedAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                  <div className="font-semibold text-white">{alert.machine || alert.machineId || "Plant"}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-slate-400">{alert.message}</div>
                </div>
              ))}
              {enhancedAlerts.length === 0 ? (
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-100">
                  No active alarms in the twin.
                </div>
              ) : null}
            </div>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="font-bold text-white">Production Flow</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {[
                ["Running", kpis.running],
                ["Warning", kpis.warning],
                ["Critical", kpis.critical],
                ["Work Orders", kpis.activeWorkOrders],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="font-bold text-white">AI Twin Insights</h2>
            <div className="mt-4 space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </section>

        {selectedProfile ? (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm">
            <aside className="work-order-drawer-enter ml-auto flex h-full w-full max-w-3xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
              <div className="border-b border-slate-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      Machine Information
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-white">
                      {selectedProfile.machine.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedProfile.machine.machineId} - {selectedProfile.machine.department}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMachineId(null)}
                    aria-label="Close machine drawer"
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(selectedProfile.machine.status)}`}
                  >
                    {selectedProfile.machine.status}
                  </span>
                  <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200">
                    Risk {selectedProfile.riskScore.toFixed(1)}
                  </span>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">
                    RUL {selectedProfile.ai?.remainingUsefulLifeHours || selectedProfile.remainingUsefulLifeHours || "--"} hrs
                  </span>
                  <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-100">
                    Failure {formatNumber(selectedProfile.ai?.failureProbability || selectedProfile.failureProbability)}%
                  </span>
                  <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-100">
                    AI {selectedProfile.ai?.anomaly.severity || selectedProfile.machine.aiAnomalySeverity || "Low"}
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-100">
                    {selectedProfile.machine.liveTelemetryEnabled
                      ? "Live IoT"
                      : "Simulator"}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    ["Temperature", `${formatNumber(selectedProfile.machine.temperature)} C`],
                    ["Humidity", `${formatNumber(selectedProfile.machine.humidity)}%`],
                    ["Pressure", `${formatNumber(selectedProfile.machine.pressure, 2)} bar`],
                    ["Vibration", formatNumber(selectedProfile.machine.vibration, 2)],
                    ["Current", `${formatNumber(selectedProfile.machine.current)} A`],
                    ["Voltage", `${formatNumber(selectedProfile.machine.voltage)} V`],
                    ["RPM", formatNumber(selectedProfile.machine.rpm, 0)],
                    ["Oil Level", `${formatNumber(selectedProfile.machine.oilLevel)}%`],
                    ["Noise", `${formatNumber(selectedProfile.machine.noise)} dB`],
                    ["Flow Rate", `${formatNumber(selectedProfile.machine.flowRate)} L/min`],
                    ["AI Health", `${formatNumber(selectedProfile.ai?.healthPercent || selectedProfile.machine.aiHealthPercent || selectedProfile.machine.health)}%`],
                    ["Energy", `${formatNumber(selectedProfile.machine.energyConsumed || selectedProfile.machine.power)} kWh`],
                    ["Failure Probability", `${formatNumber(selectedProfile.ai?.failureProbability || selectedProfile.failureProbability)}%`],
                    ["AI Risk", `${formatNumber(selectedProfile.ai?.riskPercent || selectedProfile.riskScore)}%`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-800 bg-slate-900/75 p-4"
                    >
                      <p className="text-xs uppercase text-slate-500">{label}</p>
                      <p className="mt-2 font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                  <h3 className="flex items-center gap-2 font-bold text-white">
                    <Bot size={18} className="text-cyan-300" />
                    AI Decision Intelligence
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      ["Root Cause", selectedProfile.ai?.rootCauseSummary || selectedProfile.machine.aiRootCauseSummary || "No root cause active"],
                      ["Confidence", `${formatNumber(selectedProfile.ai?.confidencePercent || selectedProfile.machine.aiConfidencePercent)}%`],
                      ["Last AI Run", formatDate(selectedProfile.machine.aiLastAnalyzedAt || selectedProfile.ai?.generatedAt)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                      >
                        <p className="text-xs uppercase text-slate-500">{label}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-200">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {selectedProfile.ai?.topRootCauses?.length ? (
                    <div className="mt-4 space-y-3">
                      {selectedProfile.ai.topRootCauses.slice(0, 3).map((cause) => (
                        <div
                          key={cause.cause}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-white">
                              {cause.cause}
                            </span>
                            <span className="text-sm font-bold text-cyan-200">
                              {formatNumber(cause.probability)}%
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            {cause.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                  <h3 className="font-bold text-white">Telemetry Sync</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      ["Source", selectedProfile.machine.telemetrySource || "simulator"],
                      ["Linked Device", selectedProfile.machine.linkedDeviceId || "Not mapped"],
                      ["Last Live Packet", formatDate(selectedProfile.machine.lastLiveTelemetryAt)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                      >
                        <p className="text-xs uppercase text-slate-500">{label}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-200">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                  <h3 className="flex items-center gap-2 font-bold text-white">
                    <Bot size={18} className="text-cyan-300" />
                    Recommended Actions
                  </h3>
                  <div className="mt-4 space-y-3">
                    {selectedProfile.recommendedActions.map((action) => (
                      <div
                        key={action}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                    <h3 className="flex items-center gap-2 font-bold text-white">
                      <ClipboardList size={18} className="text-cyan-300" />
                      Open Work Orders
                    </h3>
                    <div className="mt-4 space-y-3">
                      {selectedProfile.openWorkOrders.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No active work orders.
                        </p>
                      ) : (
                        selectedProfile.openWorkOrders.map((workOrder) => (
                          <div
                            key={workOrder.id}
                            className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                          >
                            <div className="font-semibold text-cyan-200">
                              {workOrder.workOrderId}
                            </div>
                            <div className="mt-1 text-sm text-slate-300">
                              {workOrder.status.replaceAll("_", " ")} - {workOrder.priority}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Due {formatDate(workOrder.dueDate)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                    <h3 className="flex items-center gap-2 font-bold text-white">
                      <AlertTriangle size={18} className="text-red-300" />
                      Critical Alerts
                    </h3>
                    <div className="mt-4 space-y-3">
                      {selectedProfile.criticalAlerts.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No active critical alerts.
                        </p>
                      ) : (
                        selectedProfile.criticalAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="rounded-lg border border-red-400/20 bg-red-500/10 p-3"
                          >
                            <div className="font-semibold text-red-100">
                              {alert.title}
                            </div>
                            <div className="mt-1 text-sm text-red-100/80">
                              {alert.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                  <h3 className="font-bold text-white">Maintenance History</h3>
                  <div className="mt-4 space-y-3">
                    {selectedProfile.machine.maintenanceHistory?.length ? (
                      selectedProfile.machine.maintenanceHistory.map((item) => (
                        <div
                          key={`${item.workOrderId}-${item.completedAt}`}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300"
                        >
                          <div className="font-semibold text-white">
                            {item.workOrderId || "Maintenance record"}
                          </div>
                          <div className="mt-1">
                            {item.status} - {item.engineer || "Unassigned"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatDate(item.completedAt)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">
                        No completed maintenance records yet.
                      </p>
                    )}
                  </div>
                </section>

                {actionMessage ? (
                  <div className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    {actionMessage}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-800 p-5 sm:grid-cols-2 xl:grid-cols-4">
                <Link
                  href="/copilot"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
                >
                  <Bot size={16} />
                  Open Copilot
                </Link>
                <button
                  type="button"
                  onClick={() => void handleCreateWorkOrder(selectedProfile)}
                  disabled={isCreatingOrder}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  {isCreatingOrder ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} />}
                  Create Work Order
                </button>
                <Link
                  href={`/analytics?machine=${selectedProfile.machine.machineId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
                >
                  <Activity size={16} />
                  View Analytics
                </Link>
                <button
                  type="button"
                  onClick={() => void handleCreateWorkOrder(selectedProfile, true)}
                  disabled={isCreatingOrder}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <CalendarClock size={16} />
                  Schedule Maintenance
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
