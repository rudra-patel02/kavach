"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, Search, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchAuditLogs } from "@/lib/enterprise";
import type { AuditLog } from "@/types/enterprise";

const auditRoles = [
  "Super Admin",
  "Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
];

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
      }).format(new Date(value))
    : "Unknown";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      const response = await fetchAuditLogs();
      setLogs(response.logs);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load audit logs"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return logs;
    return logs.filter((log) =>
      [
        log.action,
        log.resourceType,
        log.resourceId,
        log.userEmail,
        log.role,
        log.ip,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [logs, query]);

  return (
    <DashboardLayout allowedRoles={auditRoles}>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <ShieldCheck size={18} />
              Audit Trail
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              Enterprise Audit Viewer
            </h1>
            <p className="mt-2 text-slate-400">
              Logins, machine edits, work orders, alert acknowledgements, and
              configuration changes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            Refresh
          </button>
        </section>

        {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

        <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/85 px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search action, user, resource, IP..."
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/85">
          {isLoading ? (
            <div className="p-8 text-slate-300">Loading audit logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Resource</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">IP</th>
                    <th className="px-4 py-3 text-left">Request</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-800">
                      <td className="px-4 py-3 text-slate-300">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-cyan-200">{log.action}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.resourceType} {log.resourceId ? `/${log.resourceId}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{log.userEmail || log.userId || "System"}</td>
                      <td className="px-4 py-3 text-slate-300">{log.ip || "-"}</td>
                      <td className="px-4 py-3 text-slate-500">{log.requestId || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
