"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Camera,
  Check,
  Factory,
  Loader2,
  QrCode,
  RadioTower,
  Search,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  createAIVisionEvent,
  fetchAIVisionCameraDashboard,
  fetchAIVisionTimeline,
  fetchProtocolIntegrations,
  fetchSmartFactoryTwin,
  lookupMachineByQr,
  updateAIVisionEventStatus,
  upsertAIVisionCamera,
  type AIVisionCamera,
  type AIVisionTimelineEvent,
  type ProtocolIntegration,
  type SmartFactoryTwin,
} from "@/lib/smartFactory";
import type { MachineData } from "@/types/machine";

const readRoles = [
  "Super Admin",
  "Admin",
  "Organization Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];

const statusClasses: Record<ProtocolIntegration["status"], string> = {
  degraded: "border-red-400/30 bg-red-500/10 text-red-100",
  healthy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  watch: "border-amber-400/30 bg-amber-500/10 text-amber-100",
};

export default function SmartFactoryPage() {
  const [twin, setTwin] = useState<SmartFactoryTwin | null>(null);
  const [cameras, setCameras] = useState<AIVisionCamera[]>([]);
  const [timeline, setTimeline] = useState<AIVisionTimelineEvent[]>([]);
  const [protocols, setProtocols] = useState<ProtocolIntegration[]>([]);
  const [qrCode, setQrCode] = useState("");
  const [lookupResult, setLookupResult] = useState<MachineData | null>(null);
  const [visionCameraId, setVisionCameraId] = useState("CAM-01");
  const [visionType, setVisionType] = useState<"PPE" | "FIRE" | "SMOKE" | "INTRUSION">("PPE");
  const [visionSeverity, setVisionSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [visionMachineId, setVisionMachineId] = useState("");
  const [cameraName, setCameraName] = useState("Main Gate Camera");
  const [cameraLocation, setCameraLocation] = useState("Main Gate");
  const [isLoading, setIsLoading] = useState(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmittingVision, setIsSubmittingVision] = useState(false);
  const [isSavingCamera, setIsSavingCamera] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSmartFactory = useCallback(async () => {
    const [twinResponse, protocolResponse, cameraResponse, timelineResponse] =
      await Promise.all([
        fetchSmartFactoryTwin(),
        fetchProtocolIntegrations(),
        fetchAIVisionCameraDashboard(),
        fetchAIVisionTimeline({ limit: "50" }),
      ]);

    setTwin(twinResponse.twin);
    setProtocols(protocolResponse.integrations.protocols);
    setCameras(cameraResponse.dashboard.cameras);
    setTimeline(timelineResponse.timeline);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadSmartFactory()
        .then(() => {
          setError(null);
        })
        .catch((requestError) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load smart factory"
          );
        })
        .finally(() => setIsLoading(false));
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadSmartFactory]);

  const machineNodes = useMemo(
    () => (twin?.nodes || []).filter((node) => node.type === "machine"),
    [twin]
  );

  const runLookup = async () => {
    const code = qrCode.trim();
    if (!code) return;

    setIsLookingUp(true);
    try {
      const response = await lookupMachineByQr(code);
      setLookupResult(response.machine);
      setError(null);
    } catch (requestError) {
      setLookupResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Machine lookup failed"
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const submitVisionEvent = async () => {
    if (!visionCameraId.trim()) {
      setError("Camera ID is required");
      return;
    }

    setIsSubmittingVision(true);
    try {
      await createAIVisionEvent({
        cameraId: visionCameraId.trim(),
        detections: [
          {
            confidence: visionType === "PPE" ? 88 : 94,
            label:
              visionType === "PPE"
                ? "ppe-compliance"
                : visionType.toLowerCase(),
            severity: visionSeverity,
          },
        ],
        eventType: visionType,
        machineId: visionMachineId.trim() || undefined,
        severity: visionSeverity,
      });
      await loadSmartFactory();
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI vision event failed"
      );
    } finally {
      setIsSubmittingVision(false);
    }
  };

  const saveCamera = async () => {
    if (!visionCameraId.trim() || !cameraName.trim()) {
      setError("Camera ID and name are required");
      return;
    }

    setIsSavingCamera(true);
    try {
      await upsertAIVisionCamera({
        cameraId: visionCameraId.trim(),
        location: cameraLocation.trim(),
        machineId: visionMachineId.trim() || undefined,
        name: cameraName.trim(),
        status: "online",
      });
      await loadSmartFactory();
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Camera save failed"
      );
    } finally {
      setIsSavingCamera(false);
    }
  };

  const updateEventStatus = async (
    eventId: string,
    status: "acknowledged" | "resolved"
  ) => {
    setPendingEventId(eventId);
    try {
      await updateAIVisionEventStatus(eventId, status);
      await loadSmartFactory();
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Vision event update failed"
      );
    } finally {
      setPendingEventId(null);
    }
  };

  return (
    <DashboardLayout allowedRoles={readRoles}>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="premium-card rounded-2xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="page-eyebrow mb-3 flex items-center gap-3">
                <Factory size={18} />
                Kavach v1.0
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Smart Factory Twin
              </h1>
              <p className="mt-2 max-w-3xl text-slate-400">
                Protocol integrations, AI vision, live asset state, simulation-ready
                telemetry, PWA alerts, and QR lookup in one operational view.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              {[
                ["Machines", twin?.summary.machines || 0],
                ["Devices", twin?.summary.devices || 0],
                ["Online", twin?.summary.onlineDevices || 0],
                ["High Risk", twin?.summary.highRiskMachines || 0],
              ].map(([label, value]) => (
                <div key={label} className="premium-tile rounded-xl px-4 py-3">
                  <p className="text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="premium-card flex items-center gap-3 rounded-2xl p-6 text-slate-300">
            <Loader2 size={18} className="animate-spin text-cyan-300" />
            Loading smart factory state
          </div>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="premium-card rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Boxes className="text-cyan-300" size={20} />
                  <h2 className="text-xl font-bold">Interactive Twin Nodes</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {machineNodes.slice(0, 12).map((node) => (
                    <article key={node.id} className="premium-tile rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {node.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{node.id}</p>
                        </div>
                        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-100">
                          {String(node.state.riskLevel || "Low")}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Health</p>
                          <p className="mt-1 font-bold text-white">
                            {String(node.state.health || 0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Risk</p>
                          <p className="mt-1 font-bold text-white">
                            {String(node.state.failureProbability || 0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">RUL</p>
                          <p className="mt-1 font-bold text-white">
                            {String(node.state.remainingUsefulLifeHours || 0)}h
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="space-y-4">
                <section className="premium-card rounded-2xl p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <QrCode className="text-cyan-300" size={20} />
                    <h2 className="font-bold">QR Machine Lookup</h2>
                  </div>
                  <div className="flex gap-2">
                    <label className="premium-input flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-sm">
                      <Search size={16} className="text-slate-500" />
                      <input
                        value={qrCode}
                        onChange={(event) => setQrCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void runLookup();
                        }}
                        placeholder="Scan or enter code"
                        className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void runLookup()}
                      disabled={isLookingUp}
                      className="premium-button inline-flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-50"
                      aria-label="Lookup machine"
                    >
                      {isLookingUp ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Search size={16} />
                      )}
                    </button>
                  </div>
                  {lookupResult ? (
                    <div className="premium-tile mt-4 rounded-xl p-3">
                      <p className="font-semibold text-white">{lookupResult.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {lookupResult.machineId} | {lookupResult.status} |{" "}
                        {lookupResult.health}% health
                      </p>
                    </div>
                  ) : null}
                </section>

                <section className="premium-card rounded-2xl p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Camera className="text-cyan-300" size={20} />
                    <h2 className="font-bold">AI Vision</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(twin?.vision.byType || {}).map(([type, count]) => (
                      <div key={type} className="premium-tile rounded-xl p-3">
                        <p className="text-xs text-slate-500">{type}</p>
                        <p className="mt-1 text-xl font-bold">{count}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <AlertTriangle size={15} />
                    {twin?.vision.summary.openEvents || 0} open events
                  </div>
                </section>

                <section className="premium-card rounded-2xl p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Camera className="text-cyan-300" size={20} />
                    <h2 className="font-bold">Create Vision Event</h2>
                  </div>
                  <div className="grid gap-2">
                    <input
                      value={visionCameraId}
                      onChange={(event) => setVisionCameraId(event.target.value)}
                      className="premium-input rounded-xl px-3 py-2 text-sm text-white outline-none"
                      placeholder="Camera ID"
                    />
                    <input
                      value={visionMachineId}
                      onChange={(event) => setVisionMachineId(event.target.value)}
                      className="premium-input rounded-xl px-3 py-2 text-sm text-white outline-none"
                      placeholder="Machine ID optional"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={visionType}
                        onChange={(event) =>
                          setVisionType(
                            event.target.value as "PPE" | "FIRE" | "SMOKE" | "INTRUSION"
                          )
                        }
                        className="premium-input rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                        aria-label="Vision event type"
                      >
                        <option value="PPE">PPE</option>
                        <option value="FIRE">Fire</option>
                        <option value="SMOKE">Smoke</option>
                        <option value="INTRUSION">Intrusion</option>
                      </select>
                      <select
                        value={visionSeverity}
                        onChange={(event) =>
                          setVisionSeverity(
                            event.target.value as "Low" | "Medium" | "High" | "Critical"
                          )
                        }
                        className="premium-input rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                        aria-label="Vision event severity"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => void submitVisionEvent()}
                      disabled={isSubmittingVision}
                      className="premium-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {isSubmittingVision ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Camera size={16} />
                      )}
                      Submit event
                    </button>
                  </div>
                </section>

                <section className="premium-card rounded-2xl p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Camera className="text-cyan-300" size={20} />
                    <h2 className="font-bold">Register Camera</h2>
                  </div>
                  <div className="grid gap-2">
                    <input
                      value={cameraName}
                      onChange={(event) => setCameraName(event.target.value)}
                      className="premium-input rounded-xl px-3 py-2 text-sm text-white outline-none"
                      placeholder="Camera name"
                    />
                    <input
                      value={cameraLocation}
                      onChange={(event) => setCameraLocation(event.target.value)}
                      className="premium-input rounded-xl px-3 py-2 text-sm text-white outline-none"
                      placeholder="Location"
                    />
                    <button
                      type="button"
                      onClick={() => void saveCamera()}
                      disabled={isSavingCamera}
                      className="premium-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {isSavingCamera ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Save camera
                    </button>
                  </div>
                </section>
              </aside>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="premium-card rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Camera className="text-cyan-300" size={20} />
                  <h2 className="text-xl font-bold">Camera Dashboard</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {cameras.length === 0 ? (
                    <div className="premium-tile rounded-xl p-4 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                      No cameras registered yet.
                    </div>
                  ) : (
                    cameras.map((camera) => (
                      <article key={camera.cameraId} className="premium-tile rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {camera.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {camera.cameraId} | {camera.location || "Unassigned"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-1 text-xs ${
                              camera.status === "online" && !camera.stale
                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                                : "border-amber-400/30 bg-amber-500/10 text-amber-100"
                            }`}
                          >
                            {camera.stale ? "stale" : camera.status}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500">Events</p>
                            <p className="mt-1 font-bold text-white">
                              {camera.totalEvents}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">High</p>
                            <p className="mt-1 font-bold text-white">
                              {camera.highSeverityEvents}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Machine</p>
                            <p className="mt-1 truncate font-bold text-white">
                              {camera.machineId || "--"}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <aside className="premium-card rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <AlertTriangle className="text-cyan-300" size={20} />
                  <h2 className="font-bold">Event Timeline</h2>
                </div>
                <div className="space-y-3">
                  {timeline.slice(0, 10).map((event) => (
                    <article key={event.eventId} className="premium-tile rounded-xl p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {event.eventType} | {event.severity}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {event.cameraId} {event.machineId ? `| ${event.machineId}` : ""}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                          {event.status}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void updateEventStatus(event.eventId, "acknowledged")}
                          disabled={pendingEventId === event.eventId || event.status !== "open"}
                          className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100 disabled:opacity-40"
                        >
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateEventStatus(event.eventId, "resolved")}
                          disabled={pendingEventId === event.eventId || event.status === "resolved"}
                          className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100 disabled:opacity-40"
                        >
                          Resolve
                        </button>
                      </div>
                    </article>
                  ))}
                  {timeline.length === 0 ? (
                    <p className="text-sm text-slate-400">No vision events yet.</p>
                  ) : null}
                </div>
              </aside>
            </section>

            <section className="premium-card rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <RadioTower className="text-cyan-300" size={20} />
                <h2 className="text-xl font-bold">Industrial Protocol Health</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {protocols.map((protocol) => (
                  <article
                    key={protocol.protocol}
                    className={`rounded-xl border p-4 ${statusClasses[protocol.status]}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{protocol.displayName}</p>
                        <p className="mt-1 text-xs opacity-80">
                          {protocol.online}/{protocol.devices} devices online
                        </p>
                      </div>
                      <ShieldCheck size={22} />
                    </div>
                    <p className="mt-4 text-2xl font-black">
                      {protocol.availability}%
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
