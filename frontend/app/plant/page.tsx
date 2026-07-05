"use client";

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
import FactoryScene from "@/components/3d/FactoryScene";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEnterpriseTelemetry } from "@/hooks/useEnterpriseTelemetry";
import { createWorkOrder } from "@/lib/workorders";
import type { EnterpriseMachineProfile } from "@/lib/enterpriseAnalytics";

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
          />

          <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="font-semibold text-white">Live Socket.IO Twin</div>
            <div className="mt-1">
              {profiles.length} monitored assets | click a machine for details
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
                    RUL {selectedProfile.remainingUsefulLifeHours || "--"} hrs
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    ["Temperature", `${formatNumber(selectedProfile.machine.temperature)} C`],
                    ["Pressure", `${formatNumber(selectedProfile.machine.pressure, 2)} bar`],
                    ["Vibration", formatNumber(selectedProfile.machine.vibration, 2)],
                    ["Health", `${formatNumber(selectedProfile.machine.health)}%`],
                    ["Energy", `${formatNumber(selectedProfile.machine.energyConsumed || selectedProfile.machine.power)} kWh`],
                    ["Failure Probability", `${formatNumber(selectedProfile.failureProbability)}%`],
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
