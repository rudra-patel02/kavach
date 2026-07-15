"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Battery,
  Cpu,
  Gauge,
  Loader2,
  RadioTower,
  RefreshCcw,
  Search,
  Server,
  Signal,
  WifiOff,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchIoTOverview } from "@/lib/iot";
import socket, { SOCKET_EVENTS } from "@/lib/socket";
import type { IoTDevice, IoTDeviceStatus, IoTOverview } from "@/types/iot";

const statusClasses: Record<IoTDeviceStatus, string> = {
  offline: "border-red-400/30 bg-red-500/10 text-red-200",
  online: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  unknown: "border-slate-500/30 bg-slate-700/50 text-slate-300",
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not seen";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
};

const upsertDevice = (devices: IoTDevice[], nextDevice: IoTDevice) =>
  devices.some((device) => device.deviceId === nextDevice.deviceId)
    ? devices.map((device) =>
        device.deviceId === nextDevice.deviceId ? nextDevice : device
      )
    : [nextDevice, ...devices];

const getSignalLabel = (value: number | null) => {
  if (value === null || value === undefined) return "--";
  return `${value} dBm`;
};

export default function IoTManagementPage() {
  const [overview, setOverview] = useState<IoTOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IoTDeviceStatus | "all">(
    "all"
  );
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimerRef = useRef<number | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetchIoTOverview();
      setOverview(response.overview);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load IoT devices"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadOverview]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadOverview();
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefresh, loadOverview]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        void loadOverview();
      }, 500);
    };

    const handleDevice = (device: IoTDevice) => {
      setOverview((currentOverview) =>
        currentOverview
          ? {
              ...currentOverview,
              devices: upsertDevice(currentOverview.devices, device),
            }
          : currentOverview
      );
    };

    const handleTelemetry = () => {
      scheduleRefresh();
    };

    socket.on(SOCKET_EVENTS.DEVICE_ONLINE, handleDevice);
    socket.on(SOCKET_EVENTS.DEVICE_OFFLINE, handleDevice);
    socket.on(SOCKET_EVENTS.DEVICE_HEARTBEAT, scheduleRefresh);
    socket.on(SOCKET_EVENTS.TELEMETRY_UPDATE, handleTelemetry);

    return () => {
      socket.off(SOCKET_EVENTS.DEVICE_ONLINE, handleDevice);
      socket.off(SOCKET_EVENTS.DEVICE_OFFLINE, handleDevice);
      socket.off(SOCKET_EVENTS.DEVICE_HEARTBEAT, scheduleRefresh);
      socket.off(SOCKET_EVENTS.TELEMETRY_UPDATE, handleTelemetry);

      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [loadOverview]);

  const devices = useMemo(() => overview?.devices || [], [overview]);
  const latestTelemetry = useMemo(
    () => overview?.latestTelemetry || [],
    [overview]
  );
  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesStatus =
        statusFilter === "all" || device.connectionStatus === statusFilter;
      const searchable = [
        device.deviceId,
        device.machineId,
        device.deviceType,
        device.firmwareVersion,
        device.protocol,
        device.ipAddress,
        device.macAddress,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [devices, search, statusFilter]);

  const latestMetricCount = useMemo(
    () =>
      latestTelemetry.reduce(
        (count, telemetry) => count + Object.keys(telemetry.metrics).length,
        0
      ),
    [latestTelemetry]
  );

  return (
    <DashboardLayout>
      <div className="page-stack min-h-[calc(100vh-9rem)] space-y-6 text-white surface-enter">
        <section className="premium-card rounded-2xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow mb-3 flex items-center gap-3">
              <RadioTower size={18} />
              Industrial IoT
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Device Management
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Real hardware telemetry, MQTT/REST device onboarding, heartbeat
              monitoring, and machine mapping.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                autoRefresh
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                  : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-400/30 hover:bg-cyan-500/10"
              }`}
            >
              <Activity size={16} />
              Auto refresh
            </button>
            <button
              type="button"
              onClick={() => void loadOverview()}
              className="premium-button inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCcw size={16} />
              )}
              Refresh
            </button>
          </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Server,
              label: "Connected Devices",
              value: overview?.status.onlineDevices || 0,
            },
            {
              icon: WifiOff,
              label: "Offline Devices",
              value: overview?.status.offlineDevices || 0,
            },
            {
              icon: Gauge,
              label: "Sensor Values",
              value: latestMetricCount,
            },
            {
              icon: RadioTower,
              label: "Protocols Ready",
              value: overview?.protocolAdapters.length || 0,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="premium-card rounded-2xl p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {item.value}
                    </p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                    <Icon size={24} />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="premium-card rounded-2xl p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="premium-input flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300">
              <Search size={17} className="shrink-0 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search device, machine, protocol, firmware..."
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as IoTDeviceStatus | "all")
              }
              className="premium-input rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              aria-label="Filter devices by status"
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading && devices.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="premium-skeleton h-64 rounded-2xl"
                />
              ))
            ) : filteredDevices.length === 0 ? (
              <div className="premium-card rounded-2xl p-8 text-center text-slate-400 md:col-span-2">
                No devices match the current filter.
              </div>
            ) : (
              filteredDevices.map((device) => (
                <article
                  key={device.deviceId}
                  className="premium-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClasses[device.connectionStatus]}`}
                        >
                          {device.connectionStatus}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                          {device.protocol}
                        </span>
                      </div>
                      <h2 className="mt-3 truncate text-xl font-bold text-white">
                        {device.deviceId}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {device.deviceType} mapped to {device.machineId}
                      </p>
                    </div>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                      <Cpu size={23} />
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      {
                        icon: Battery,
                        label: "Battery",
                        value:
                          device.batteryLevel === null
                            ? "--"
                            : `${device.batteryLevel}%`,
                      },
                      {
                        icon: Signal,
                        label: "Signal",
                        value: getSignalLabel(device.signalStrength),
                      },
                      {
                        icon: Zap,
                        label: "Rate",
                        value: `${device.telemetryRate.toFixed(2)}/min`,
                      },
                      {
                        icon: Activity,
                        label: "Sensors",
                        value: device.supportedSensors.length,
                      },
                    ].map((metric) => {
                      const Icon = metric.icon;

                      return (
                        <div
                          key={metric.label}
                          className="premium-tile rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Icon size={14} />
                            {metric.label}
                          </div>
                          <p className="mt-2 font-semibold text-white">
                            {metric.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-2 text-sm text-slate-400">
                    <div>Firmware {device.firmwareVersion}</div>
                    <div>Last heartbeat {formatDate(device.lastHeartbeat)}</div>
                    <div>IP {device.ipAddress || "Not reported"}</div>
                  </div>
                </article>
              ))
            )}
          </div>

          <aside className="space-y-4">
            <section className="premium-card rounded-2xl p-5">
              <h2 className="font-bold text-white">Status Timeline</h2>
              <div className="mt-4 space-y-3">
                {(overview?.statusTimeline || []).slice(0, 8).map((item) => (
                  <div
                    key={`${item.deviceId}-${item.at}-${item.event}`}
                    className="premium-tile rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-cyan-200">
                        {item.deviceId}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(item.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{item.event}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="premium-card rounded-2xl p-5">
              <h2 className="font-bold text-white">Edge Support</h2>
              <div className="mt-4 space-y-3">
                {(overview?.protocolAdapters || []).map((device) => (
                  <div
                    key={device.deviceType}
                    className="premium-tile rounded-xl p-3"
                  >
                    <p className="text-sm font-semibold text-white">
                      {device.deviceType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {device.protocols.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}
