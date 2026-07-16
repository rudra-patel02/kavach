"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Download,
  Gauge,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ExecutiveDashboardPanel, {
  ExecutiveDashboardSkeleton,
} from "@/components/dashboard/ExecutiveDashboard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { downloadReportPdf, type ReportType } from "@/lib/reports";
import socket, {
  SOCKET_EVENTS,
  joinPlantRoom,
  leavePlantRoom,
} from "@/lib/socket";
import { getExecutiveDashboard } from "@/services/executiveService";
import type {
  ExecutiveDashboard as ExecutiveDashboardData,
  ExecutiveTrendPoint,
} from "@/types/executive";

const POLL_INTERVAL_MS = 15000;

const realtimeEvents = [
  SOCKET_EVENTS.LEGACY_MACHINE_UPDATE,
  SOCKET_EVENTS.MACHINES_UPDATE,
  SOCKET_EVENTS.MACHINE_UPDATE,
  SOCKET_EVENTS.ALERT_CREATED,
  SOCKET_EVENTS.NOTIFICATION_CREATED,
  SOCKET_EVENTS.LEGACY_NOTIFICATION_CREATED,
  "workorder:new",
  "workorder:updated",
] as const;

function ChartPanel({
  title,
  data,
  color,
  type = "line",
}: {
  title: string;
  data: ExecutiveTrendPoint[];
  color: string;
  type?: "area" | "bar" | "line";
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
      <h2 className="text-sm font-bold uppercase text-slate-300">{title}</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="value" fill={color} isAnimationActive={false} radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : type === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Area
                dataKey="value"
                fill={color}
                fillOpacity={0.2}
                isAnimationActive={false}
                stroke={color}
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Line
                dataKey="value"
                dot={false}
                isAnimationActive={false}
                stroke={color}
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface LoadOptions {
  signal?: AbortSignal;
  silent?: boolean;
}

export default function ExecutiveDashboardPage() {
  const [dashboard, setDashboard] = useState<ExecutiveDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingType, setDownloadingType] = useState<ReportType | null>(null);
  const requestIdRef = useRef(0);

  const loadDashboard = useCallback(async ({ signal, silent = false }: LoadOptions = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getExecutiveDashboard({
        retries: silent ? 0 : 1,
        signal,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setDashboard(response.dashboard);
      setError(null);
    } catch (requestError) {
      if (signal?.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Executive dashboard unavailable"
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadDashboard({ signal: controller.signal });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadDashboard({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  useEffect(() => {
    const handleRealtimeRefresh = () => {
      void loadDashboard({ silent: true });
    };

    joinPlantRoom("default");
    realtimeEvents.forEach((eventName) => {
      socket.on(eventName, handleRealtimeRefresh);
    });
    socket.on("connect", handleRealtimeRefresh);

    return () => {
      realtimeEvents.forEach((eventName) => {
        socket.off(eventName, handleRealtimeRefresh);
      });
      socket.off("connect", handleRealtimeRefresh);
      leavePlantRoom("default");
    };
  }, [loadDashboard]);

  const reportButtons = useMemo(
    () =>
      [
        ["maintenance", "Maintenance"],
        ["plant-health", "Plant Health"],
        ["energy", "Energy"],
        ["weekly", "Weekly"],
        ["monthly", "Monthly"],
      ] as const,
    []
  );

  const handleDownloadReport = async (type: ReportType) => {
    setDownloadingType(type);

    try {
      await downloadReportPdf(type);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Report download failed"
      );
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <Gauge size={18} />
              Executive Dashboard
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Plant KPI Command Center
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              OEE, availability, health, energy, risk, downtime, and alerts from
              live plant telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dashboard ? (
              <span className="hidden text-sm text-slate-400 sm:inline">
                Last sync {new Date(dashboard.generatedAt).toLocaleTimeString()}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void loadDashboard();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCcw size={16} />
              )}
              Refresh
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading && !dashboard ? (
          <ExecutiveDashboardSkeleton />
        ) : dashboard ? (
          <>
            <ExecutiveDashboardPanel
              dashboard={dashboard}
              isRefreshing={isRefreshing}
            />

            <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">AI PDF Reports</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Generated from live plant data and maintenance intelligence.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportButtons.map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => void handleDownloadReport(type)}
                      disabled={downloadingType === type}
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
                    >
                      {downloadingType === type ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <ChartPanel
                title="OEE Trend"
                data={dashboard.trends.oee}
                color="#22d3ee"
                type="area"
              />
              <ChartPanel
                title="Downtime Trend"
                data={dashboard.trends.downtime}
                color="#f97316"
                type="bar"
              />
              <ChartPanel
                title="Energy Forecast"
                data={dashboard.trends.energy}
                color="#a78bfa"
                type="bar"
              />
              <ChartPanel
                title="Production Trend"
                data={dashboard.trends.production}
                color="#2dd4bf"
              />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={19} className="text-cyan-300" />
                  <h2 className="text-xl font-bold text-white">
                    Department Performance
                  </h2>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-3 text-left">Department</th>
                        <th className="py-3 text-left">OEE</th>
                        <th className="py-3 text-left">Availability</th>
                        <th className="py-3 text-left">Performance</th>
                        <th className="py-3 text-left">Quality</th>
                        <th className="py-3 text-left">Energy</th>
                        <th className="py-3 text-left">Risk</th>
                        <th className="py-3 text-left">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.departmentPerformance.map((department) => (
                        <tr
                          key={department.department}
                          className="border-t border-slate-800"
                        >
                          <td className="py-3 font-semibold text-white">
                            {department.department}
                          </td>
                          <td className="py-3 text-cyan-200">{department.oee}%</td>
                          <td className="py-3 text-slate-300">
                            {department.availability}%
                          </td>
                          <td className="py-3 text-slate-300">
                            {department.performance}%
                          </td>
                          <td className="py-3 text-slate-300">
                            {department.quality}%
                          </td>
                          <td className="py-3 text-slate-300">
                            {department.energy} kWh
                          </td>
                          <td className="py-3 text-slate-300">
                            {department.failureProbability}%
                          </td>
                          <td className="py-3 text-slate-300">
                            {department.activeWorkOrders}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dashboard.departmentPerformance.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      No department data available.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                  <h2 className="text-xl font-bold text-white">Top Risk Machines</h2>
                  <div className="mt-4 space-y-3">
                    {dashboard.topRiskMachines.map((machine) => (
                      <div
                        key={machine.machineId}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white">{machine.name}</p>
                          <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-100">
                            {machine.failureProbability}%
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {machine.machineId} - {machine.department} - RUL{" "}
                          {machine.remainingUsefulLifeHours}h
                        </p>
                      </div>
                    ))}
                    {dashboard.topRiskMachines.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No high-risk machines detected.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                  <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
                  <div className="mt-4 space-y-3">
                    {dashboard.recommendations.slice(0, 4).map((item) => (
                      <div
                        key={item.machineId}
                        className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-50"
                      >
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-2 text-cyan-50/80">
                          {item.recommendation}
                        </p>
                      </div>
                    ))}
                    {dashboard.recommendations.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No recommendations available.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
