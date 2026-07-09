"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEnterpriseTelemetry } from "@/hooks/useEnterpriseTelemetry";

const severityClasses = {
  Critical: "border-red-400/30 bg-red-500/10 text-red-200",
  High: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  Low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  Medium: "border-amber-400/30 bg-amber-500/10 text-amber-100",
};

const displaySeverityClasses = {
  Critical: "border-red-400/30 bg-red-500/10 text-red-200",
  Information: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  Warning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));

const toDateKey = (value: string) => new Date(value).toISOString().slice(0, 10);

export default function AlertsPage() {
  const {
    enhancedAlerts,
    machines,
    isLoading,
    error,
  } = useEnterpriseTelemetry();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const departments = useMemo(
    () => [...new Set(machines.map((machine) => machine.department))].sort(),
    [machines]
  );
  const filteredAlerts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return enhancedAlerts.filter((alert) => {
      if (
        severityFilter !== "ALL" &&
        alert.displaySeverity !== severityFilter
      ) {
        return false;
      }

      if (
        departmentFilter !== "ALL" &&
        alert.department !== departmentFilter
      ) {
        return false;
      }

      if (dateFilter && toDateKey(alert.timestamp) !== dateFilter) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      return [
        alert.machine,
        alert.machineId,
        alert.category,
        alert.assignedEngineer,
        alert.message,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchText);
    });
  }, [dateFilter, departmentFilter, enhancedAlerts, search, severityFilter]);

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <BellRing size={18} />
              Alert Center
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Enterprise Alerts
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Live maintenance alerts enriched with escalation, acknowledgement,
              work-order ownership, and resolution context.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
            Socket.IO live alerts
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <Search size={18} className="text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search machine, category, engineer, resolution"
                className="ml-3 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <label className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3">
              <Filter size={16} className="mr-2 text-slate-500" />
              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none"
              >
                <option className="bg-slate-950" value="ALL">
                  All Severity
                </option>
                <option className="bg-slate-950" value="Critical">
                  Critical
                </option>
                <option className="bg-slate-950" value="Warning">
                  Warning
                </option>
                <option className="bg-slate-950" value="Information">
                  Information
                </option>
              </select>
            </label>

            <label className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3">
              <UserRound size={16} className="mr-2 text-slate-500" />
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none"
              >
                <option className="bg-slate-950" value="ALL">
                  All Departments
                </option>
                {departments.map((department) => (
                  <option
                    key={department}
                    className="bg-slate-950"
                    value={department}
                  >
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3">
              <CalendarDays size={16} className="mr-2 text-slate-500" />
              <input
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                type="date"
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/75 py-16 text-center">
              <Loader2 className="mx-auto animate-spin text-cyan-300" size={34} />
              <p className="mt-3 font-semibold text-slate-200">
                Loading alert center
              </p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/75 py-16 text-center">
              <CheckCircle2 className="mx-auto text-emerald-300" size={38} />
              <p className="mt-3 font-semibold text-white">
                No alerts match this view
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Adjust filters or wait for live machine events.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <article
                key={alert.id}
                className="rounded-xl border border-slate-800 bg-slate-900/75 p-5 transition-colors hover:border-slate-700"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${displaySeverityClasses[alert.displaySeverity]}`}
                      >
                        {alert.displaySeverity}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClasses[alert.severity]}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">
                        {alert.priority}
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-bold text-slate-300">
                        {alert.category}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-white">
                      {alert.machine}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {alert.machineId} - {alert.department}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      {alert.message}
                    </p>
                  </div>

                  <div className="grid min-w-[300px] grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase text-slate-500">
                        Timestamp
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {formatDate(alert.timestamp)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase text-slate-500">
                        Engineer
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {alert.assignedEngineer !== "Unassigned"
                          ? alert.assignedEngineer
                          : alert.recommendedEngineer || "Unassigned"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase text-slate-500">
                        Failure Probability
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {alert.failureProbability}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase text-slate-500">
                        Downtime
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {alert.estimatedDowntimeHours} hrs
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase text-slate-500">
                        Location
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {alert.machineLocation || "Plant floor"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase text-slate-500">
                        Acknowledged
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {alert.acknowledged ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase text-slate-500">
                        Escalation
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {alert.escalationLevel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">
                    Suggested Action:
                  </span>{" "}
                  {alert.suggestedAction || "Validate telemetry and assign maintenance response."}
                </div>

                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">
                    Resolution Notes:
                  </span>{" "}
                  {alert.resolutionNotes}
                </div>

                {alert.alertTimeline.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {alert.alertTimeline.slice(0, 2).map((item, index) => (
                      <div
                        key={`${alert.id}-${item.event}-${index}`}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm"
                      >
                        <p className="font-semibold text-white">
                          {item.event.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {formatDate(item.at)} - {item.actor}
                        </p>
                        <p className="mt-1 text-slate-300">{item.message}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
