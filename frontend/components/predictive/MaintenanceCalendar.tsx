"use client";

import { CalendarDays, Clock } from "lucide-react";
import type { PredictiveCalendarItem } from "@/types/predictive";
import { riskBadgeClass, riskBorderClass } from "./predictiveStyles";

interface MaintenanceCalendarProps {
  items: PredictiveCalendarItem[];
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export default function MaintenanceCalendar({ items }: MaintenanceCalendarProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Maintenance Calendar</h2>
          <p className="mt-1 text-sm text-slate-400">
            AI-prioritized service windows
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <CalendarDays size={22} />
        </span>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article
              key={`${item.machineId}-${item.date}`}
              className={`rounded-xl border bg-slate-950/75 p-4 ${riskBorderClass[item.riskLevel]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-center">
                    <span className="text-xs text-slate-400">
                      {formatDate(item.date).split(" ")[0]}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatDate(item.date).split(" ")[1]}
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold text-white">{item.task}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.name} / {item.machineId}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                      <Clock size={15} className="text-cyan-300" />
                      {item.estimatedDowntimeHours} hrs downtime
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass[item.riskLevel]}`}
                >
                  {item.priority}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            No urgent service windows are required. Continue planned preventive
            maintenance.
          </div>
        )}
      </div>
    </section>
  );
}
