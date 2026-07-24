"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Clock3,
  DollarSign,
  type LucideIcon,
  ShieldCheck,
  TimerReset,
  Wrench,
} from "lucide-react";
import { fetchAIOverview } from "@/lib/ai";
import { fetchPredictiveOverview } from "@/lib/predictive";
import type { AIOverview } from "@/types/ai";
import type {
  PredictiveMachine,
  PredictiveOverview,
  PredictiveRecommendation,
  PredictiveRiskLevel,
} from "@/types/predictive";

type LoadState = "loading" | "ready" | "error";

const riskTone: Record<PredictiveRiskLevel, string> = {
  Low: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
  Medium: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  High: "border-orange-400/35 bg-orange-500/10 text-orange-200",
  Critical: "border-red-400/35 bg-red-500/10 text-red-200",
};

const riskDotTone: Record<PredictiveRiskLevel, string> = {
  Low: "bg-emerald-400 shadow-emerald-400/50",
  Medium: "bg-amber-400 shadow-amber-400/50",
  High: "bg-orange-400 shadow-orange-400/50",
  Critical: "bg-red-400 shadow-red-400/50",
};

const riskRank: Record<PredictiveRiskLevel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const formatHours = (hours?: number | null) => {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) {
    return "—";
  }

  return `${numberFormatter.format(hours)}h`;
};

const formatFailureTime = (hours?: number | null) => {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) {
    return "—";
  }

  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
};

const findPriorityMachine = (overview: PredictiveOverview | null) => {
  if (!overview) {
    return null;
  }

  return [...overview.predictions].sort((left, right) => {
    const riskDelta = riskRank[right.riskLevel] - riskRank[left.riskLevel];

    if (riskDelta !== 0) {
      return riskDelta;
    }

    return right.failureProbability - left.failureProbability;
  })[0] || null;
};

const findRecommendation = (
  overview: PredictiveOverview | null,
  priorityMachine: PredictiveMachine | null
) => {
  if (!overview) {
    return null;
  }

  const machineRecommendation = priorityMachine
    ? overview.recommendations.find(
        (item) => item.machineId === priorityMachine.machineId
      )
    : null;

  return machineRecommendation || overview.recommendations[0] || null;
};

const findCostImpact = (
  aiOverview: AIOverview | null,
  priorityMachine: PredictiveMachine | null
) => {
  if (!aiOverview || !priorityMachine) {
    return null;
  }

  const machine = aiOverview.machines.find(
    (item) => item.machine.machineId === priorityMachine.machineId
  );
  const estimatedCost = machine?.maintenancePlan?.estimatedCost;

  return typeof estimatedCost === "number" && Number.isFinite(estimatedCost)
    ? estimatedCost
    : null;
};

const riskFromScore = (score?: number | null): PredictiveRiskLevel | null => {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  if (score >= 85) {
    return "Critical";
  }

  if (score >= 65) {
    return "High";
  }

  if (score >= 35) {
    return "Medium";
  }

  return "Low";
};

const findPriorityAIMachine = (overview: AIOverview | null) => {
  if (!overview) {
    return null;
  }

  return [...overview.machines].sort((left, right) => {
    const riskDelta = right.riskPercent - left.riskPercent;

    if (riskDelta !== 0) {
      return riskDelta;
    }

    return right.failureProbability - left.failureProbability;
  })[0] || null;
};

const getRecommendationAction = (
  recommendation: PredictiveRecommendation | { recommendation: string } | null
) =>
  recommendation && "recommendedAction" in recommendation
    ? recommendation.recommendedAction || recommendation.recommendation
    : recommendation?.recommendation;

const getConfidenceTone = (confidence?: number | null) => {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    return "border-slate-700 bg-slate-950/55 text-slate-300";
  }

  if (confidence > 90) {
    return "border-emerald-400/35 bg-emerald-500/10 text-emerald-200";
  }

  if (confidence >= 70) {
    return "border-amber-400/35 bg-amber-500/10 text-amber-200";
  }

  return "border-red-400/35 bg-red-500/10 text-red-200";
};

function MetricTile({
  icon: Icon,
  label,
  tileClassName = "border-slate-800 bg-slate-950/55",
  value,
  valueClassName = "text-white",
}: {
  icon: LucideIcon;
  label: string;
  tileClassName?: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900/65 ${tileClassName}`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        <Icon size={14} className="text-cyan-300" />
        {label}
      </div>
      <p className={`truncate text-sm font-black ${valueClassName}`} title={value}>
        {value}
      </p>
    </div>
  );
}

export default function AIDecisionCenterCard() {
  const [predictiveOverview, setPredictiveOverview] =
    useState<PredictiveOverview | null>(null);
  const [aiOverview, setAIOverview] = useState<AIOverview | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let isMounted = true;

    const loadDecisionData = async () => {
      setState("loading");

      const [predictiveResult, aiResult] = await Promise.allSettled([
        fetchPredictiveOverview(),
        fetchAIOverview(),
      ]);

      if (!isMounted) {
        return;
      }

      if (predictiveResult.status === "fulfilled") {
        setPredictiveOverview(predictiveResult.value.overview);
      }

      if (aiResult.status === "fulfilled") {
        setAIOverview(aiResult.value.overview);
      }

      setState(
        predictiveResult.status === "fulfilled" || aiResult.status === "fulfilled"
          ? "ready"
          : "error"
      );
    };

    void loadDecisionData();

    return () => {
      isMounted = false;
    };
  }, []);

  const decision = useMemo(() => {
    const priorityMachine = findPriorityMachine(predictiveOverview);
    const priorityAIMachine = priorityMachine
      ? null
      : findPriorityAIMachine(aiOverview);
    const recommendation = findRecommendation(predictiveOverview, priorityMachine);
    const aiRecommendation = priorityAIMachine
      ? aiOverview?.recommendations.find(
          (item) => item.machineId === priorityAIMachine.machine.machineId
        ) || priorityAIMachine.recommendations[0]
      : null;
    const riskLevel =
      predictiveOverview?.summary.riskLevel ||
      priorityMachine?.riskLevel ||
      riskFromScore(priorityAIMachine?.riskPercent) ||
      null;
    const costImpact = findCostImpact(aiOverview, priorityMachine);
    const confidence =
      priorityMachine?.confidencePercent ||
      priorityMachine?.confidenceScore ||
      recommendation?.confidence ||
      priorityAIMachine?.confidencePercent ||
      aiRecommendation?.confidence ||
      predictiveOverview?.summary.aiConfidence ||
      null;

    return {
      confidence,
      costImpact:
        costImpact ??
        (typeof priorityAIMachine?.maintenancePlan?.estimatedCost === "number"
          ? priorityAIMachine.maintenancePlan.estimatedCost
          : null),
      priorityAIMachine,
      priorityMachine,
      recommendation: recommendation || aiRecommendation || null,
      riskLevel,
    };
  }, [aiOverview, predictiveOverview]);

  const recommendationText =
    getRecommendationAction(decision.recommendation) ||
    decision.priorityMachine?.recommendedAction ||
    decision.priorityMachine?.recommendation ||
    decision.priorityAIMachine?.recommendations[0]?.recommendation ||
    "No live AI recommendation available.";

  const machineName =
    decision.priorityMachine?.name ||
    decision.priorityAIMachine?.machine.name ||
    (decision.recommendation as PredictiveRecommendation | null)?.name ||
    "Not available";
  const riskLabel = decision.riskLevel || "Medium";
  const machineId =
    decision.priorityMachine?.machineId ||
    decision.priorityAIMachine?.machine.machineId ||
    (decision.recommendation as PredictiveRecommendation | null)?.machineId ||
    "";
  const detailsHref = machineId
    ? `/machines/${encodeURIComponent(machineId)}`
    : "/machines";
  const confidenceText =
    typeof decision.confidence === "number"
      ? `${Math.round(decision.confidence)}%`
      : "—";
  const confidenceTone = getConfidenceTone(decision.confidence);

  return (
    <section className="hero-visual premium-tile relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/35 sm:p-5">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[length:28px_28px]" />
        <div className="pulse-line absolute left-0 top-8 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      </div>

      <div className="relative flex min-h-[25rem] flex-col">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
              Live AI Decision Center
            </p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
              <BrainCircuit size={25} className="text-cyan-300" />
              Plant Risk Intelligence
            </h2>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${
              riskTone[riskLabel]
            }`}
          >
            <span
              className={`live-dot h-2.5 w-2.5 rounded-full shadow-lg ${riskDotTone[riskLabel]}`}
            />
            {decision.riskLevel || "Live"}
          </span>
        </div>

        {state === "loading" ? (
          <div className="mt-8 grid flex-1 place-items-center rounded-xl border border-slate-800 bg-slate-950/45 p-6 text-center">
            <div>
              <BrainCircuit className="mx-auto animate-pulse text-cyan-300" size={34} />
              <p className="mt-4 font-bold text-white">Loading live AI signals</p>
              <p className="mt-1 text-sm text-slate-400">
                Reading prediction and telemetry context
              </p>
            </div>
          </div>
        ) : state === "error" ? (
          <div className="mt-8 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            Live AI decision data is temporarily unavailable.
          </div>
        ) : (
          <>
            <Link
              href={detailsHref}
              className="mt-6 block rounded-xl border border-slate-800 bg-slate-950/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-slate-900/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                  <AlertTriangle size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Highest Priority Machine
                  </p>
                  <p className="mt-1 truncate text-xl font-black text-white">
                    {machineName}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                    {recommendationText}
                  </p>
                </div>
              </div>
            </Link>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricTile
                icon={Clock3}
                label="Predicted Failure"
                value={formatFailureTime(
                  decision.priorityMachine?.remainingUsefulLifeHours ??
                    decision.priorityAIMachine?.remainingUsefulLifeHours
                )}
              />
              <MetricTile
                icon={TimerReset}
                label="Downtime"
                value={formatHours(
                  decision.priorityMachine?.estimatedDowntimeHours ??
                    decision.priorityAIMachine?.maintenancePlan
                      .estimatedDowntimeHours
                )}
              />
              <MetricTile
                icon={DollarSign}
                label="Cost Impact"
                value={
                  decision.costImpact === null
                    ? "—"
                    : currencyFormatter.format(decision.costImpact)
                }
              />
              <MetricTile
                icon={ShieldCheck}
                label="Confidence"
                tileClassName={confidenceTone}
                value={confidenceText}
                valueClassName="text-current"
              />
            </div>

            <div className="mt-auto pt-5">
              <Link
                href={detailsHref}
                className="premium-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-transform duration-200 hover:-translate-y-0.5"
              >
                <Wrench size={17} />
                View Details
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
