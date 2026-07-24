"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Factory,
  Gauge,
  Loader2,
  Play,
  Radio,
  RefreshCcw,
  TrendingDown,
  Zap,
} from "lucide-react";
import AIRecommendationCards from "@/components/predictive/AIRecommendationCards";
import AIRiskGauge from "@/components/predictive/AIRiskGauge";
import MachineRankingTable from "@/components/predictive/MachineRankingTable";
import MaintenanceCalendar from "@/components/predictive/MaintenanceCalendar";
import PredictiveExportButtons from "@/components/predictive/PredictiveExportButtons";
import PredictiveKpiCards from "@/components/predictive/PredictiveKpiCards";
import PredictiveTrendCharts from "@/components/predictive/PredictiveTrendCharts";
import RemainingUsefulLifeCards from "@/components/predictive/RemainingUsefulLifeCards";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchPredictiveOverview, runPredictiveSimulation } from "@/lib/predictive";
import socket from "@/lib/socket";
import type {
  PredictiveOverview,
  PredictiveMachine,
  PredictiveSimulationResponse,
} from "@/types/predictive";

const scenarioPresets = [
  {
    type: "machine_failure",
    label: "Machine Failure",
    description: "Force a severe health and vibration event.",
    overrides: { health: 18, vibration: 1.25, temperature: 94, status: "Critical" },
  },
  {
    type: "temperature_increase",
    label: "Temperature Increase",
    description: "Model overheating under sustained load.",
    overrides: { temperature: 96, power: 720 },
  },
  {
    type: "power_spike",
    label: "Power Spike",
    description: "Estimate impact from an electrical load spike.",
    overrides: { power: 980, current: 38, temperature: 86 },
  },
  {
    type: "production_slowdown",
    label: "Production Slowdown",
    description: "Assess reduced throughput and efficiency.",
    overrides: { efficiency: 52, oee: 48, power: 640 },
  },
  {
    type: "downtime",
    label: "Downtime",
    description: "Simulate an offline asset and lost capacity.",
    overrides: { status: "Offline", health: 32, efficiency: 0, power: 120 },
  },
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const getOptimizerRecommendations = (overview: PredictiveOverview) => {
  const highestEnergy = [...overview.predictions].sort(
    (a, b) => (b.telemetry.energy || 0) - (a.telemetry.energy || 0)
  )[0];
  const lowestEfficiency = [...overview.predictions].sort(
    (a, b) => (a.telemetry.efficiency || a.machineHealth) - (b.telemetry.efficiency || b.machineHealth)
  )[0];
  const nextMaintenance = overview.ranking[0];
  const highRiskCount = overview.summary.highRiskMachines;

  return [
    {
      icon: Zap,
      title: "Reduce Energy Usage",
      value: highestEnergy ? `${highestEnergy.telemetry.energy} kWh` : "No data",
      recommendation: highestEnergy
        ? `Shift ${highestEnergy.name} to a lower-load window and inspect mechanical drag, cooling, and idle power draw.`
        : "Energy telemetry is not available yet.",
    },
    {
      icon: Factory,
      title: "Improve Production Efficiency",
      value: lowestEfficiency
        ? `${Math.round(lowestEfficiency.telemetry.efficiency || lowestEfficiency.machineHealth)}%`
        : "No data",
      recommendation: lowestEfficiency
        ? `Review throughput constraints on ${lowestEfficiency.name}; compare speed, quality, and downtime against the current OEE trend.`
        : "Production efficiency telemetry is not available yet.",
    },
    {
      icon: Gauge,
      title: "Optimize Maintenance Scheduling",
      value: nextMaintenance ? nextMaintenance.maintenancePriority : "Monitor",
      recommendation: nextMaintenance
        ? `Prioritize ${nextMaintenance.name} before lower-risk assets to reduce unplanned downtime exposure.`
        : "No maintenance optimization action is required right now.",
    },
    {
      icon: DollarSign,
      title: "Lower Operational Costs",
      value: `${highRiskCount} high risk`,
      recommendation:
        highRiskCount > 0
          ? "Bundle inspections for high-risk machines into one planned maintenance window to reduce emergency callout and downtime cost."
          : "Maintain current preventive schedule and continue watching energy outliers.",
    },
  ];
};

const buildIncidentReport = (machine: PredictiveMachine | undefined) => {
  if (!machine) {
    return null;
  }

  return {
    title: `${machine.name} incident investigation`,
    timeline: [
      `Telemetry anomaly detected with ${machine.failureProbability}% failure probability.`,
      `AI confidence reached ${machine.aiConfidence}% from current sensor completeness and risk clarity.`,
      `Maintenance priority set to ${machine.maintenancePriority}.`,
      `Recommended action prepared for supervisor review.`,
    ],
    rootCause:
      machine.rootCauseAnalysis?.probableRootCause ||
      machine.probableCause ||
      "Root cause requires additional telemetry.",
    affectedAssets: [machine.name, machine.department],
    businessImpact:
      machine.businessImpact ||
      machine.rootCauseAnalysis?.businessImpact ||
      "Business impact is under assessment.",
    correctiveActions: [
      machine.recommendedAction || machine.recommendation,
      "Validate temperature, vibration, pressure, and energy readings against the latest sensor feed.",
      "Open or update the maintenance task during the next controlled service window.",
    ],
    preventiveRecommendations: [
      "Add this incident to shift handover notes.",
      "Track the same telemetry signature for recurrence during the next operating cycle.",
      "Review maintenance schedule if risk remains High or Critical after inspection.",
    ],
  };
};

export default function PredictiveMaintenancePage() {
  const [overview, setOverview] = useState<PredictiveOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulationMachineId, setSimulationMachineId] = useState("");
  const [simulationTemperature, setSimulationTemperature] = useState(82);
  const [simulationVibration, setSimulationVibration] = useState(0.7);
  const [simulationPower, setSimulationPower] = useState(620);
  const [simulationScenarioType, setSimulationScenarioType] =
    useState<(typeof scenarioPresets)[number]["type"]>("temperature_increase");
  const [simulation, setSimulation] =
    useState<PredictiveSimulationResponse["simulation"] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

  const optimizerRecommendations = useMemo(
    () => (overview ? getOptimizerRecommendations(overview) : []),
    [overview]
  );
  const incidentReport = useMemo(
    () => buildIncidentReport(overview?.predictions[0]),
    [overview]
  );

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetchPredictiveOverview();
      setOverview(response.overview);
      setSimulationMachineId((currentMachineId) =>
        currentMachineId || response.overview.predictions[0]?.machineId || ""
      );
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load predictive overview"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchPredictiveOverview()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setOverview(response.overview);
        setSimulationMachineId(
          response.overview.predictions[0]?.machineId || ""
        );
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load predictive overview"
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleMachineUpdate = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }

      setIsRefreshing(true);
      refreshTimerRef.current = window.setTimeout(() => {
        void loadOverview();
      }, 350);
    };
    const handlePredictiveOverview = (nextOverview: PredictiveOverview) => {
      setOverview(nextOverview);
      setError(null);
      setIsRefreshing(false);
    };

    socket.on("machineUpdate", handleMachineUpdate);
    socket.on("predictive:overview", handlePredictiveOverview);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
      socket.off("predictive:overview", handlePredictiveOverview);

      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [loadOverview]);

  const handleRunSimulation = async () => {
    if (!simulationMachineId) {
      setError("Select a machine before running simulation");
      return;
    }

    setIsSimulating(true);
    try {
      const preset = scenarioPresets.find(
        (scenario) => scenario.type === simulationScenarioType
      );
      const response = await runPredictiveSimulation({
        machineId: simulationMachineId,
        name: preset?.label || "Operator what-if scenario",
        eventType: simulationScenarioType,
        overrides: {
          ...(preset?.overrides || {}),
          power: simulationPower,
          temperature: simulationTemperature,
          vibration: simulationVibration,
        },
      });

      setSimulation(response.simulation);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Simulation failed"
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
                <BrainCircuit size={18} />
                Predictive Intelligence
              </div>

              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Predictive Maintenance Dashboard
              </h1>

              <p className="mt-2 max-w-3xl text-slate-400">
                Enterprise maintenance forecasting from live machine telemetry,
                rule-based failure probability, RUL, AI confidence, and service
                priority.
              </p>
            </div>

            {overview ? <PredictiveExportButtons overview={overview} /> : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-200">
              <Radio size={16} className="animate-pulse" />
              Socket.IO live refresh
            </span>

            {overview ? (
              <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-300">
                Source: {overview.source.replaceAll("_", " ")}
              </span>
            ) : null}

            {isRefreshing ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-cyan-200">
                <RefreshCcw size={16} className="animate-spin" />
                Refreshing predictions
              </span>
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <div className="flex min-h-[460px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-cyan-300" size={42} />
              <p className="mt-4 font-semibold text-white">
                Loading predictive maintenance model
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Reading machine telemetry from MongoDB
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-950/30 p-6 text-red-100">
            <p className="font-semibold">Predictive overview unavailable</p>
            <p className="mt-2 text-sm text-red-100/80">{error}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void loadOverview();
              }}
              className="mt-5 rounded-xl border border-red-300/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-50"
            >
              Retry
            </button>
          </div>
        ) : overview ? (
          <>
            <PredictiveKpiCards overview={overview} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
              <AIRiskGauge overview={overview} />
              <RemainingUsefulLifeCards machines={overview.predictions} />
            </div>

            <PredictiveTrendCharts overview={overview} />

            <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase text-cyan-300">
                    <Play size={16} />
                    Predictive Simulation
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    What-if analysis
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-400">
                    Compare the current prediction against temporary telemetry
                    overrides. This does not change machine data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRunSimulation()}
                  disabled={isSimulating || !simulationMachineId}
                  className="premium-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  {isSimulating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Run simulation
                </button>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-4">
                <select
                  value={simulationMachineId}
                  onChange={(event) => setSimulationMachineId(event.target.value)}
                  className="premium-input rounded-xl px-3 py-3 text-sm text-slate-200 outline-none"
                  aria-label="Select machine for simulation"
                >
                  {overview.predictions.map((machine) => (
                    <option key={machine.machineId} value={machine.machineId}>
                      {machine.name}
                    </option>
                  ))}
                </select>
                <select
                  value={simulationScenarioType}
                  onChange={(event) =>
                    setSimulationScenarioType(
                      event.target.value as (typeof scenarioPresets)[number]["type"]
                    )
                  }
                  className="premium-input rounded-xl px-3 py-3 text-sm text-slate-200 outline-none"
                  aria-label="Select scenario type"
                >
                  {scenarioPresets.map((scenario) => (
                    <option key={scenario.type} value={scenario.type}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
                {[
                  {
                    label: "Temperature",
                    max: 110,
                    min: 20,
                    step: 1,
                    unit: "C",
                    value: simulationTemperature,
                    setValue: setSimulationTemperature,
                  },
                  {
                    label: "Vibration",
                    max: 1.5,
                    min: 0.1,
                    step: 0.05,
                    unit: "g",
                    value: simulationVibration,
                    setValue: setSimulationVibration,
                  },
                  {
                    label: "Power",
                    max: 1200,
                    min: 100,
                    step: 10,
                    unit: "kW",
                    value: simulationPower,
                    setValue: setSimulationPower,
                  },
                ].map((field) => (
                  <label key={field.label} className="premium-tile rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-400">{field.label}</span>
                      <span className="font-semibold text-white">
                        {field.value} {field.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={field.value}
                      onChange={(event) => field.setValue(Number(event.target.value))}
                      className="mt-3 w-full accent-cyan-400"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {scenarioPresets.map((scenario) => (
                  <button
                    key={scenario.type}
                    type="button"
                    onClick={() => {
                      setSimulationScenarioType(scenario.type);
                    }}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      simulationScenarioType === scenario.type
                        ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-50"
                        : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-cyan-400/30"
                    }`}
                  >
                    <p className="text-sm font-bold">{scenario.label}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {scenario.description}
                    </p>
                  </button>
                ))}
              </div>

              {simulation ? (
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {[
                    ["Baseline Risk", `${simulation.baseline.failureProbability}%`],
                    ["Simulated Risk", `${simulation.simulated.failureProbability}%`],
                    ["Risk Delta", `${simulation.impact.riskDelta}%`],
                    ["RUL Delta", `${simulation.impact.remainingUsefulLifeHoursDelta}h`],
                    [
                      "Downtime",
                      `${simulation.impact.downtimeHours ?? simulation.simulated.estimatedDowntimeHours}h`,
                    ],
                    [
                      "Financial Impact",
                      formatCurrency(simulation.impact.financialImpact ?? 0),
                    ],
                    ["Risk Level", simulation.impact.riskLevel || simulation.simulated.riskLevel],
                    [
                      "Affected Assets",
                      String(simulation.impact.affectedMachines?.length || 1),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="premium-tile rounded-xl p-4">
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100 md:col-span-4">
                    <p className="font-semibold">{simulation.impact.recommendation}</p>
                    {simulation.impact.operationalImpact ? (
                      <p className="mt-2 text-cyan-50/80">
                        {simulation.impact.operationalImpact}
                      </p>
                    ) : null}
                    {simulation.impact.recommendedActions?.length ? (
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        {simulation.impact.recommendedActions.map((action) => (
                          <div
                            key={action}
                            className="rounded-lg border border-cyan-300/15 bg-slate-950/40 p-3"
                          >
                            {action}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-2">
                  <ClipboardList size={19} className="text-cyan-300" />
                  <h2 className="text-xl font-bold text-white">
                    AI Incident Investigation
                  </h2>
                </div>
                {incidentReport ? (
                  <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-cyan-100">
                        {incidentReport.title}
                      </p>
                      <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
                        <p className="text-xs font-bold uppercase text-red-200">
                          Root Cause
                        </p>
                        <p className="mt-2 text-sm text-red-50/90">
                          {incidentReport.rootCause}
                        </p>
                      </div>
                      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase text-amber-200">
                          Business Impact
                        </p>
                        <p className="mt-2 text-sm text-amber-50/90">
                          {incidentReport.businessImpact}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          Event Timeline
                        </p>
                        <div className="mt-3 space-y-2">
                          {incidentReport.timeline.map((item, index) => (
                            <div
                              key={item}
                              className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-200"
                            >
                              <span className="text-cyan-300">T{index}</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Corrective Actions
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            {incidentReport.correctiveActions.map((action) => (
                              <li key={action} className="flex gap-2">
                                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Prevention
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            {incidentReport.preventiveRecommendations.map((action) => (
                              <li key={action} className="flex gap-2">
                                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-yellow-300" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-2">
                  <TrendingDown size={19} className="text-emerald-300" />
                  <h2 className="text-xl font-bold text-white">
                    Plant Efficiency Optimizer
                  </h2>
                </div>
                <div className="mt-5 space-y-3">
                  {optimizerRecommendations.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-xl border border-slate-800 bg-slate-950/55 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Icon size={18} className="text-cyan-200" />
                            <p className="font-semibold text-white">{item.title}</p>
                          </div>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-100">
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-5 text-slate-400">
                          {item.recommendation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <MachineRankingTable rows={overview.ranking} />
              <MaintenanceCalendar items={overview.maintenanceCalendar} />
            </div>

            <AIRecommendationCards recommendations={overview.recommendations} />
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
