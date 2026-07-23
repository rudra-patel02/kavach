"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, Loader2, Play, Radio, RefreshCcw } from "lucide-react";
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
  PredictiveSimulationResponse,
} from "@/types/predictive";

export default function PredictiveMaintenancePage() {
  const [overview, setOverview] = useState<PredictiveOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulationMachineId, setSimulationMachineId] = useState("");
  const [simulationTemperature, setSimulationTemperature] = useState(82);
  const [simulationVibration, setSimulationVibration] = useState(0.7);
  const [simulationPower, setSimulationPower] = useState(620);
  const [simulation, setSimulation] =
    useState<PredictiveSimulationResponse["simulation"] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

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
      const response = await runPredictiveSimulation({
        machineId: simulationMachineId,
        name: "Operator what-if scenario",
        overrides: {
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

              {simulation ? (
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {[
                    ["Baseline Risk", `${simulation.baseline.failureProbability}%`],
                    ["Simulated Risk", `${simulation.simulated.failureProbability}%`],
                    ["Risk Delta", `${simulation.impact.riskDelta}%`],
                    ["RUL Delta", `${simulation.impact.remainingUsefulLifeHoursDelta}h`],
                  ].map(([label, value]) => (
                    <div key={label} className="premium-tile rounded-xl p-4">
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                  <p className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100 md:col-span-4">
                    {simulation.impact.recommendation}
                  </p>
                </div>
              ) : null}
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
