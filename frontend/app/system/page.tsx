"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Database,
  Download,
  FileCode2,
  HardDrive,
  Loader2,
  RefreshCcw,
  Server,
  Wifi,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { apiUrl } from "@/lib/api";
import {
  downloadBackup,
  fetchBackupConfiguration,
  fetchSystemHealth,
} from "@/lib/enterprise";
import type { SystemHealthResponse } from "@/types/enterprise";

const systemRoles = ["Super Admin", "Admin", "Plant Admin", "Plant Manager"];

const formatUptime = (seconds = 0) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const defaultHealth: SystemHealthResponse["system"] = {
  api: {
    averageLatencyMs: 0,
    errorRate: 0,
    requests: 0,
    routes: [],
  },
  cpu: {
    cores: 0,
    loadAverage: [],
    usagePercent: 0,
  },
  database: {
    state: "unknown",
  },
  memory: {
    freeSystemMb: 0,
    heapUsedMb: 0,
    rssMb: 0,
    totalSystemMb: 0,
  },
  mqtt: {
    connected: false,
    started: false,
  },
  socket: {
    connections: 0,
  },
  uptimeSeconds: 0,
};

const normalizeHealth = (
  system?: Partial<SystemHealthResponse["system"]> | null
): SystemHealthResponse["system"] => ({
  ...defaultHealth,
  ...system,
  api: {
    ...defaultHealth.api,
    ...(system?.api || {}),
    routes: system?.api?.routes || [],
  },
  cpu: {
    ...defaultHealth.cpu,
    ...(system?.cpu || {}),
  },
  database: {
    ...defaultHealth.database,
    ...(system?.database || {}),
  },
  memory: {
    ...defaultHealth.memory,
    ...(system?.memory || {}),
  },
  mqtt: {
    ...defaultHealth.mqtt,
    ...(system?.mqtt || {}),
  },
  socket: {
    ...defaultHealth.socket,
    ...(system?.socket || {}),
  },
});

export default function SystemPage() {
  const [health, setHealth] = useState<SystemHealthResponse["system"] | null>(
    null
  );
  const [configPreview, setConfigPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchSystemHealth();
      setHealth(normalizeHealth(response.system));
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load system health"
      );
      setHealth(normalizeHealth(null));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHealth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHealth]);

  const handleConfigurationPreview = async () => {
    try {
      const response = await fetchBackupConfiguration();
      setConfigPreview(JSON.stringify(response.configuration, null, 2));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to export configuration"
      );
    }
  };

  const handleBackup = async () => {
    setIsBackupLoading(true);
    try {
      await downloadBackup();
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Backup export failed"
      );
    } finally {
      setIsBackupLoading(false);
    }
  };

  const safeHealth = normalizeHealth(health);

  return (
    <DashboardLayout allowedRoles={systemRoles}>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <Server size={18} />
              System Monitoring
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              Health & Operations
            </h1>
            <p className="mt-2 text-slate-400">
              CPU, memory, database, Socket.IO, MQTT, latency, diagnostics,
              backup, restore readiness, and API documentation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadHealth()}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            Refresh
          </button>
        </section>

        {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Activity, label: "CPU", value: `${safeHealth.cpu.usagePercent}%` },
            { icon: HardDrive, label: "Memory RSS", value: `${safeHealth.memory.rssMb} MB` },
            { icon: Database, label: "Database", value: safeHealth.database.state },
            { icon: Wifi, label: "Sockets", value: safeHealth.socket.connections },
            { icon: Server, label: "MQTT", value: safeHealth.mqtt.connected ? "connected" : "offline" },
            { icon: Activity, label: "API Latency", value: `${safeHealth.api.averageLatencyMs} ms` },
            { icon: Activity, label: "Error Rate", value: `${safeHealth.api.errorRate}%` },
            { icon: Server, label: "Uptime", value: formatUptime(safeHealth.uptimeSeconds) },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                    <Icon size={22} />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <h2 className="text-xl font-bold text-white">API Diagnostics</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 text-left">Route</th>
                    <th className="py-2 text-left">Count</th>
                    <th className="py-2 text-left">Latency</th>
                    <th className="py-2 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {safeHealth.api.routes.map((route) => (
                    <tr key={route.route} className="border-t border-slate-800">
                      <td className="py-3 text-slate-300">{route.route}</td>
                      <td className="py-3 text-slate-300">{route.count}</td>
                      <td className="py-3 text-slate-300">{route.averageLatencyMs} ms</td>
                      <td className="py-3 text-slate-300">{route.errors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
              <h2 className="text-xl font-bold text-white">Backup & Restore</h2>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => void handleBackup()}
                  disabled={isBackupLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-50"
                >
                  {isBackupLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Export Backup
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfigurationPreview()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200"
                >
                  <FileCode2 size={16} />
                  Export Configuration
                </button>
                <a
                  href={apiUrl("/api/docs")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100"
                >
                  <FileCode2 size={16} />
                  Open API Docs
                </a>
              </div>
            </section>
            {configPreview ? (
              <pre className="max-h-96 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
                {configPreview}
              </pre>
            ) : null}
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}
