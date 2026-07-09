"use client";

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  Gauge,
  Loader2,
  ShieldAlert,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import type { MachineData } from "@/types/machine";

interface CopilotRightPanelProps {
  machines: MachineData[];
  isReportLoading: boolean;
  onGenerateReport: () => void;
  onQuickPrompt: (prompt: string) => void;
  onDownloadReport: () => void;
}

interface QuickAction {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

const isCriticalMachine = (machine: MachineData) =>
  machine.status === "Critical" || machine.health < 40;

const isWarningMachine = (machine: MachineData) =>
  !isCriticalMachine(machine) &&
  (machine.status === "Warning" ||
    machine.status === "Offline" ||
    machine.health < 80 ||
    machine.temperature >= 75 ||
    machine.vibration >= 0.7);

const getAverageHealth = (machines: MachineData[]) => {
  if (machines.length === 0) {
    return 0;
  }

  const total = machines.reduce((sum, machine) => sum + machine.health, 0);
  return Math.round((total / machines.length) * 10) / 10;
};

const getEnergy = (machine: MachineData) =>
  Number(machine.energyConsumed ?? machine.power ?? 0);

const getTopMachine = (
  machines: MachineData[],
  selector: (machine: MachineData) => number
) => [...machines].sort((a, b) => selector(b) - selector(a))[0];

const formatNumber = (value?: number, digits = 1) =>
  Number(value ?? 0).toFixed(digits);

function HealthMetric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon size={18} className={accent} />
      </div>

      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function CopilotRightPanel({
  machines,
  isReportLoading,
  onGenerateReport,
  onQuickPrompt,
  onDownloadReport,
}: CopilotRightPanelProps) {
  const criticalMachines = machines.filter(isCriticalMachine);
  const warningMachines = machines.filter(isWarningMachine);
  const healthyMachines = machines.filter(
    (machine) => !isCriticalMachine(machine) && !isWarningMachine(machine)
  );
  const averageHealth = getAverageHealth(machines);
  const hottestMachine = getTopMachine(machines, (machine) => machine.temperature);
  const energyLeader = getTopMachine(machines, getEnergy);
  const quickActions: QuickAction[] = [
    {
      label: "Generate Plant Report",
      icon: FileText,
      action: onGenerateReport,
    },
    {
      label: "Show Critical Machines",
      icon: ShieldAlert,
      action: () => onQuickPrompt("Show critical machines"),
    },
    {
      label: "Maintenance Schedule",
      icon: CalendarDays,
      action: () => onQuickPrompt("Generate maintenance schedule"),
    },
    {
      label: "Download Report",
      icon: Download,
      action: onDownloadReport,
    },
  ];

  return (
    <aside className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Machine Health Summary
            </h2>
            <p className="text-sm text-slate-400">Live operating context</p>
          </div>

          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <Activity size={20} />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <HealthMetric
            icon={Gauge}
            label="Avg Health"
            value={`${averageHealth}%`}
            accent="text-cyan-300"
          />
          <HealthMetric
            icon={AlertTriangle}
            label="Critical"
            value={String(criticalMachines.length)}
            accent="text-red-300"
          />
          <HealthMetric
            icon={Thermometer}
            label="Peak Temp"
            value={
              hottestMachine
                ? `${formatNumber(hottestMachine.temperature)} C`
                : "0 C"
            }
            accent="text-orange-300"
          />
          <HealthMetric
            icon={Zap}
            label="Top Energy"
            value={energyLeader ? `${formatNumber(getEnergy(energyLeader), 0)} kWh` : "0 kWh"}
            accent="text-amber-300"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-emerald-400/10 p-3 text-emerald-200">
            <p className="text-xl font-bold">{healthyMachines.length}</p>
            <p className="text-xs">Healthy</p>
          </div>
          <div className="rounded-lg bg-amber-400/10 p-3 text-amber-200">
            <p className="text-xl font-bold">{warningMachines.length}</p>
            <p className="text-xs">Warning</p>
          </div>
          <div className="rounded-lg bg-red-400/10 p-3 text-red-200">
            <p className="text-xl font-bold">{criticalMachines.length}</p>
            <p className="text-xs">Critical</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Critical Alerts</h2>
            <p className="text-sm text-slate-400">Auto-refreshing from Socket.IO</p>
          </div>

          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-400/10 text-red-300">
            <ShieldAlert size={20} />
          </span>
        </div>

        <div className="space-y-3">
          {criticalMachines.length > 0 ? (
            criticalMachines.slice(0, 4).map((machine) => (
              <div
                key={machine._id || machine.machineId}
                className="rounded-xl border border-red-400/20 bg-red-950/30 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-red-100">{machine.name}</p>
                  <span className="rounded-full bg-red-400/15 px-2 py-1 text-xs text-red-200">
                    {machine.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Health {Math.round(machine.health)}%, temp{" "}
                  {formatNumber(machine.temperature)} C, vibration{" "}
                  {formatNumber(machine.vibration, 2)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              No critical machines detected.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
            <p className="text-sm text-slate-400">Engineer shortcuts</p>
          </div>

          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <Wrench size={20} />
          </span>
        </div>

        <div className="grid gap-3">
          {quickActions.map((item) => {
            const Icon = item.icon;
            const isDownload = item.label === "Download Report";

            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                disabled={isReportLoading && isDownload}
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-3">
                  {isReportLoading && isDownload ? (
                    <Loader2 size={18} className="animate-spin text-cyan-300" />
                  ) : (
                    <Icon size={18} className="text-cyan-300" />
                  )}
                  {item.label}
                </span>
                <ChevronRight size={18} className="text-cyan-400" />
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
