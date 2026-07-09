"use client";

import CountUp from "react-countup";
import {
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ExecutiveMetric } from "@/types/executive";
import {
  executiveIndicatorClasses,
  executiveStatusClasses,
  isPositiveMetric,
} from "@/utils/executiveKpiStatus";

interface ExecutiveKPICardProps {
  icon: LucideIcon;
  metric: ExecutiveMetric;
}

const Sparkline = ({ data }: { data: ExecutiveMetric["sparkline"] }) => {
  const values = data.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 96;
      const y = 28 - ((value - min) / range) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      className="h-8 w-24"
      viewBox="0 0 96 32"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
};

export default function ExecutiveKPICard({
  icon: Icon,
  metric,
}: ExecutiveKPICardProps) {
  const TrendIcon =
    metric.trend === "up"
      ? TrendingUp
      : metric.trend === "down"
        ? TrendingDown
        : Minus;
  const trendGood =
    metric.trend === "flat" ||
    (metric.trend === "up" && isPositiveMetric(metric.key)) ||
    (metric.trend === "down" && !isPositiveMetric(metric.key));
  const decimalPlaces = Number.isInteger(metric.value) ? 0 : 1;

  return (
    <article className="min-h-44 rounded-xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${executiveIndicatorClasses[metric.status]}`}
            />
            <p className="truncate text-sm font-semibold text-slate-400">
              {metric.label}
            </p>
          </div>
          <div className="mt-4 whitespace-nowrap text-3xl font-bold text-white">
            <CountUp
              decimals={decimalPlaces}
              duration={0.85}
              end={metric.value}
              preserveValue
            />
            <span className="ml-1 text-base font-semibold text-slate-400">
              {metric.unit}
            </span>
          </div>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${executiveStatusClasses[metric.status]}`}
        >
          <Icon size={21} />
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
            trendGood
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
              : "border-amber-400/25 bg-amber-500/10 text-amber-200"
          }`}
        >
          <TrendIcon size={14} />
          {metric.trendValue}
        </span>
        <div className="text-cyan-300/80">
          <Sparkline data={metric.sparkline} />
        </div>
      </div>
    </article>
  );
}
