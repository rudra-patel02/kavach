"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  ClipboardList,
  Factory,
  Gauge,
  Loader2,
  RefreshCcw,
  Search,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  autoAssignWorkOrder,
  createEnterpriseEntity,
  fetchEnterpriseDashboard,
  fetchEnterpriseList,
} from "@/lib/enterpriseOps";
import socket, { SOCKET_EVENTS } from "@/lib/socket";
import type {
  EnterpriseAssetRisk,
  EnterpriseDashboard,
  EnterpriseEntity,
  EnterprisePlantComparison,
} from "@/types/enterpriseOps";

type EnterpriseView =
  | "dashboard"
  | "organizations"
  | "plants"
  | "fleet"
  | "executive"
  | "workorders"
  | "engineers"
  | "notifications"
  | "audit"
  | "reports"
  | "settings";

interface EnterpriseWorkspaceProps {
  view?: EnterpriseView;
}

const navItems: { href: string; label: string; view: EnterpriseView }[] = [
  { href: "/enterprise", label: "Dashboard", view: "dashboard" },
  { href: "/enterprise/organizations", label: "Organizations", view: "organizations" },
  { href: "/enterprise/plants", label: "Plants", view: "plants" },
  { href: "/enterprise/fleet", label: "Fleet Intelligence", view: "fleet" },
  { href: "/enterprise/executive", label: "Executive Command", view: "executive" },
  { href: "/enterprise/workorders", label: "Work Orders", view: "workorders" },
  { href: "/enterprise/engineers", label: "Engineers", view: "engineers" },
  { href: "/enterprise/notifications", label: "Notifications", view: "notifications" },
  { href: "/enterprise/audit", label: "Audit Logs", view: "audit" },
  { href: "/enterprise/reports", label: "Reports", view: "reports" },
  { href: "/enterprise/settings", label: "Settings", view: "settings" },
];

const roles = [
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

const formatNumber = (value: unknown, suffix = "", digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `--${suffix}`;
  }

  return `${number.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}${suffix}`;
};

const formatCurrency = (value: unknown) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  return new Intl.NumberFormat(undefined, {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(number);
};

const formatDate = (value: unknown) => {
  if (!value) {
    return "--";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const asArray = <T,>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

function EnterpriseNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/70 p-2">
      {navItems.map((item) => {
        const active = item.href === "/enterprise" ? pathname === item.href : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-cyan-500/15 text-cyan-200"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function KpiCard({
  detail,
  icon: Icon,
  label,
  tone = "cyan",
  value,
}: {
  detail: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  tone?: "amber" | "cyan" | "emerald" | "red" | "violet";
  value: string | number;
}) {
  const toneClass = {
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    red: "border-red-400/25 bg-red-500/10 text-red-200",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  }[tone];

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${toneClass}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function ChartPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

function PlantComparisonTable({ plants }: { plants: EnterprisePlantComparison[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <h2 className="text-xl font-bold text-white">Plant Comparison</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
              <th className="px-3 py-3">Plant</th>
              <th className="px-3 py-3">OEE</th>
              <th className="px-3 py-3">Health</th>
              <th className="px-3 py-3">Failure</th>
              <th className="px-3 py-3">Energy</th>
              <th className="px-3 py-3">Downtime</th>
              <th className="px-3 py-3">Cost</th>
              <th className="px-3 py-3">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <tr key={plant.plantId} className="border-b border-slate-800/70">
                <td className="px-3 py-4">
                  <p className="font-semibold text-white">{plant.name}</p>
                  <p className="text-xs text-slate-500">{plant.country} / {plant.plantId}</p>
                </td>
                <td className="px-3 py-4 text-cyan-200">{formatNumber(plant.oee, "%")}</td>
                <td className="px-3 py-4 text-emerald-200">{formatNumber(plant.averageHealth, "%")}</td>
                <td className="px-3 py-4 text-orange-200">{formatNumber(plant.failureRate, "%")}</td>
                <td className="px-3 py-4 text-slate-300">{formatNumber(plant.energyUsage, " kWh")}</td>
                <td className="px-3 py-4 text-slate-300">{formatNumber(plant.downtimeHours, "h")}</td>
                <td className="px-3 py-4 text-slate-300">{formatCurrency(plant.maintenanceCost)}</td>
                <td className="px-3 py-4 text-red-200">{plant.criticalAlerts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopAssets({ assets }: { assets: EnterpriseAssetRisk[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <h2 className="text-xl font-bold text-white">Top Failing Assets</h2>
      <div className="mt-5 space-y-3">
        {assets.slice(0, 8).map((asset) => (
          <article
            key={`${asset.machineId}-${asset.assetId}`}
            className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{asset.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {asset.machineId} / {asset.assetId || "No asset id"} / {asset.criticality}
                </p>
              </div>
              <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-100">
                {formatNumber(asset.failureProbability, "%")}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
              <span>Health {formatNumber(asset.health, "%", 0)}</span>
              <span>RUL {formatNumber(asset.remainingUsefulLifeHours, "h", 0)}</span>
              <span>{formatCurrency(asset.replacementCost)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DashboardView({ dashboard }: { dashboard: EnterpriseDashboard }) {
  const kpis: Partial<EnterpriseDashboard["kpis"]> = dashboard.kpis || {};
  const trends = asArray(dashboard.trends);
  const plantComparison = asArray(dashboard.plantComparison);
  const topFailingAssets = asArray(dashboard.topFailingAssets);

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard detail="Enterprise-wide score" icon={Gauge} label="Health Score" tone="emerald" value={formatNumber(kpis.enterpriseHealthScore, "%")} />
        <KpiCard detail="Availability x performance x quality" icon={TrendingUp} label="OEE" value={formatNumber(kpis.oee, "%")} />
        <KpiCard detail="AI risk across assets" icon={AlertTriangle} label="AI Risk" tone="amber" value={formatNumber(kpis.aiRisk, "%")} />
        <KpiCard detail="Maintenance and downtime impact" icon={Zap} label="Revenue Impact" tone="red" value={formatCurrency(kpis.revenueImpact)} />
        <KpiCard detail="Open maintenance demand" icon={ClipboardList} label="Work Orders" value={formatNumber(kpis.activeWorkOrders, "", 0)} />
        <KpiCard detail="Unread critical alerts" icon={Bell} label="Critical Alerts" tone="red" value={formatNumber(kpis.criticalAlerts, "", 0)} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartPanel title="Enterprise Health and Risk">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Line dataKey="health" stroke="#22c55e" strokeWidth={3} type="monotone" />
              <Line dataKey="risk" stroke="#f97316" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Maintenance Cost Forecast">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Area dataKey="maintenanceCost" fill="#a78bfa" fillOpacity={0.2} stroke="#a78bfa" strokeWidth={3} type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <PlantComparisonTable plants={plantComparison} />
        <TopAssets assets={topFailingAssets} />
      </section>
    </>
  );
}

function FleetView({ dashboard }: { dashboard: EnterpriseDashboard }) {
  const fleet: Partial<EnterpriseDashboard["fleet"]> = dashboard.fleet || {};
  const kpis: Partial<EnterpriseDashboard["kpis"]> = dashboard.kpis || {};
  const distribution = Object.entries(fleet.failureDistribution || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const distributionColors: Record<string, string> = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#f97316",
    Critical: "#ef4444",
  };

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard detail="All assets with AI context" icon={Factory} label="Fleet Health" tone="emerald" value={formatNumber(fleet.overallFleetHealth, "%")} />
        <KpiCard detail="Critical risk machines" icon={AlertTriangle} label="Critical Machines" tone="red" value={formatNumber(fleet.criticalMachines, "", 0)} />
        <KpiCard detail="Maintenance cost exposure" icon={Wrench} label="Maintenance Cost" tone="violet" value={formatCurrency(fleet.maintenanceCost)} />
        <KpiCard detail="Enterprise energy usage" icon={Zap} label="Energy Usage" value={formatNumber(kpis.energyUsage, " kWh")} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartPanel title="Failure Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {distribution.map((entry) => (
                  <Cell key={entry.name} fill={distributionColors[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Risk Heatmap">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Failure" stroke="#94a3b8" unit="%" type="number" />
              <YAxis dataKey="y" name="Health" stroke="#94a3b8" unit="%" type="number" />
              <ZAxis dataKey="z" range={[80, 420]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Scatter data={asArray(fleet.riskHeatmap)} fill="#38bdf8" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Downtime Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={asArray(fleet.downtimeTrend)}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Area dataKey="value" fill="#f97316" fillOpacity={0.22} stroke="#f97316" strokeWidth={3} type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Energy Usage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={asArray(fleet.energyTrend)}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <PlantComparisonTable plants={asArray(fleet.plantComparison)} />
    </>
  );
}

function ExecutiveView({ dashboard }: { dashboard: EnterpriseDashboard }) {
  const analytics: Partial<EnterpriseDashboard["crossPlantAnalytics"]> =
    dashboard.crossPlantAnalytics || {};
  const insightCards = [
    ["Best Plant", analytics.bestPerformingPlant?.name || "--"],
    ["Worst Plant", analytics.worstPerformingPlant?.name || "--"],
    ["Highest Downtime", analytics.highestDowntime?.name || "--"],
    ["Highest Energy", analytics.highestEnergyConsumption?.name || "--"],
    ["Highest Failure", analytics.highestFailureRate?.name || "--"],
    ["Lowest OEE", analytics.lowestOee?.name || "--"],
  ];

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {insightCards.map(([label, value]) => (
          <article key={label} className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-xl font-bold text-white">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ChartPanel title="Revenue, Maintenance, and Downtime Cost">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={asArray(analytics.costComparison)}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="maintenanceCost" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              <Bar dataKey="downtimeCost" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
          <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
          <div className="mt-5 space-y-3">
            {asArray(analytics.recommendations).map((recommendation) => (
              <div key={recommendation} className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-50">
                {recommendation}
              </div>
            ))}
          </div>
        </section>
      </section>
      <TopAssets assets={asArray(dashboard.topFailingAssets)} />
    </>
  );
}

function EntityTable({
  columns = [],
  items = [],
  title,
}: {
  columns: { key: string; label: string; render?: (item: EnterpriseEntity) => string }[];
  items: EnterpriseEntity[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-3">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={String(item._id || item.id || index)} className="border-b border-slate-800/70">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-4 text-slate-300">
                    {column.render ? column.render(item) : String(item[column.key] ?? "--")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No records found.</div>
        ) : null}
      </div>
    </section>
  );
}

function EntityView({
  dashboard,
  resource,
  title,
}: {
  dashboard: EnterpriseDashboard;
  resource: "organizations" | "plants" | "assets" | "engineers" | "alerts" | "report-schedules" | "audit" | "notification-rules";
  title: string;
}) {
  const [items, setItems] = useState<EnterpriseEntity[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchEnterpriseList(resource, {
        search: query,
        limit: 100,
      });

      setItems(response.items ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [query, resource]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const createSample = async () => {
    const suffix = Date.now().toString().slice(-4);
    const payloadByResource: Record<string, Record<string, unknown>> = {
      organizations: { name: `Enterprise Org ${suffix}`, industry: "Industrial Manufacturing" },
      plants: {
        country: "India",
        location: "Enterprise Zone",
        name: `Plant ${suffix}`,
        organizationId: String(dashboard.scope?.organizationId || asArray(dashboard.plantComparison)[0]?.plantId || "default-org"),
      },
      assets: {
        criticality: "High",
        machineId: asArray(dashboard.topFailingAssets)[0]?.machineId || "M001",
        name: `Asset ${suffix}`,
        plantId: asArray(dashboard.plantComparison)[0]?.plantId || "default",
        replacementCost: 25000,
      },
      engineers: {
        availability: "Available",
        department: "Maintenance",
        name: `Engineer ${suffix}`,
        skills: ["Bearing", "Electrical", "Hydraulic"],
      },
      "notification-rules": {
        channels: ["email", "push", "teams"],
        name: `Critical escalation ${suffix}`,
        severity: "Critical",
      },
      "report-schedules": {
        frequency: "weekly",
        name: `Executive weekly ${suffix}`,
        reportType: "executive",
        recipients: ["operations@example.com"],
      },
    };
    const payload = payloadByResource[resource];

    if (!payload) {
      return;
    }

    await createEnterpriseEntity(resource, payload);
    setMessage(`${title} record created.`);
    await load();
  };

  const columnSets: Record<string, { key: string; label: string; render?: (item: EnterpriseEntity) => string }[]> = {
    organizations: [
      { key: "name", label: "Organization" },
      { key: "industry", label: "Industry" },
      { key: "headquartersCountry", label: "Country" },
      { key: "status", label: "Status" },
    ],
    plants: [
      { key: "name", label: "Plant" },
      { key: "plantId", label: "Plant ID" },
      { key: "country", label: "Country" },
      { key: "status", label: "Status" },
    ],
    assets: [
      { key: "name", label: "Asset" },
      { key: "machineId", label: "Machine" },
      { key: "criticality", label: "Criticality" },
      { key: "lifecycleState", label: "Lifecycle" },
      { key: "replacementCost", label: "Replacement", render: (item) => formatCurrency(item.replacementCost) },
    ],
    engineers: [
      { key: "name", label: "Engineer" },
      { key: "department", label: "Department" },
      { key: "availability", label: "Availability" },
      { key: "skills", label: "Skills", render: (item) => Array.isArray(item.skills) ? item.skills.join(", ") : "--" },
    ],
    alerts: [
      { key: "severity", label: "Severity" },
      { key: "title", label: "Title" },
      { key: "machineName", label: "Machine" },
      { key: "owner", label: "Owner" },
      { key: "read", label: "Acknowledged", render: (item) => item.read ? "Yes" : "No" },
    ],
    audit: [
      { key: "action", label: "Action" },
      { key: "resourceType", label: "Resource" },
      { key: "userEmail", label: "User" },
      { key: "createdAt", label: "Time", render: (item) => formatDate(item.createdAt) },
    ],
    "notification-rules": [
      { key: "name", label: "Rule" },
      { key: "severity", label: "Severity" },
      { key: "channels", label: "Channels", render: (item) => Array.isArray(item.channels) ? item.channels.join(", ") : "--" },
      { key: "enabled", label: "Enabled", render: (item) => item.enabled === false ? "No" : "Yes" },
    ],
    "report-schedules": [
      { key: "name", label: "Schedule" },
      { key: "reportType", label: "Report" },
      { key: "frequency", label: "Frequency" },
      { key: "nextRunAt", label: "Next Run", render: (item) => formatDate(item.nextRunAt) },
    ],
  };

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}
      <section className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/75 p-4 md:flex-row md:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
          <Search size={17} className="text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </label>
        {["organizations", "plants", "assets", "engineers", "notification-rules", "report-schedules"].includes(resource) ? (
          <button
            type="button"
            onClick={() => void createSample()}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
          >
            Create Sample
          </button>
        ) : null}
      </section>
      {isLoading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/75 p-8 text-slate-300">
          Loading {title.toLowerCase()}...
        </div>
      ) : (
        <EntityTable columns={columnSets[resource]} items={items} title={title} />
      )}
    </div>
  );
}

function WorkOrdersView({ dashboard }: { dashboard: EnterpriseDashboard }) {
  const [message, setMessage] = useState<string | null>(null);

  const assign = async (workOrderId: string) => {
    await autoAssignWorkOrder(workOrderId);
    setMessage(`Auto-assignment requested for ${workOrderId}.`);
  };

  return (
    <div className="space-y-5">
      {message ? <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
        <h2 className="text-xl font-bold text-white">Enterprise Work Orders</h2>
        <div className="mt-5 space-y-3">
          {asArray(dashboard.recentWorkOrders).map((order) => (
            <article key={String(order.workOrderId || order._id)} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">{String(order.workOrderId || "--")}</p>
                  <p className="mt-1 text-sm text-slate-400">{String(order.machineName || order.machineId || "--")} / {String(order.status || "--")} / {String(order.priority || "--")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void assign(String(order.workOrderId))}
                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
                >
                  Auto Assign
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function EnterpriseWorkspace({ view = "dashboard" }: EnterpriseWorkspaceProps) {
  const [dashboard, setDashboard] = useState<EnterpriseDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetchEnterpriseDashboard();
      setDashboard(response.dashboard);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load enterprise dashboard"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    const refresh = () => {
      void loadDashboard(true);
    };

    socket.on(SOCKET_EVENTS.ENTERPRISE_REFRESH, refresh);
    socket.on(SOCKET_EVENTS.FLEET_HEALTH_UPDATE, refresh);
    socket.on(SOCKET_EVENTS.MAINTENANCE_STATUS_UPDATE, refresh);

    return () => {
      socket.off(SOCKET_EVENTS.ENTERPRISE_REFRESH, refresh);
      socket.off(SOCKET_EVENTS.FLEET_HEALTH_UPDATE, refresh);
      socket.off(SOCKET_EVENTS.MAINTENANCE_STATUS_UPDATE, refresh);
    };
  }, [loadDashboard]);

  const currentNav = useMemo(
    () => navItems.find((item) => item.view === view) || navItems[0],
    [view]
  );

  const viewContent = () => {
    if (!dashboard) {
      return null;
    }

    if (view === "fleet") return <FleetView dashboard={dashboard} />;
    if (view === "executive") return <ExecutiveView dashboard={dashboard} />;
    if (view === "organizations") return <EntityView dashboard={dashboard} resource="organizations" title="Organizations" />;
    if (view === "plants") return <EntityView dashboard={dashboard} resource="plants" title="Plants" />;
    if (view === "workorders") return <WorkOrdersView dashboard={dashboard} />;
    if (view === "engineers") return <EntityView dashboard={dashboard} resource="engineers" title="Engineers" />;
    if (view === "notifications") return <EntityView dashboard={dashboard} resource="alerts" title="Enterprise Alerts" />;
    if (view === "audit") return <EntityView dashboard={dashboard} resource="audit" title="Audit Logs" />;
    if (view === "reports") return <EntityView dashboard={dashboard} resource="report-schedules" title="Report Schedules" />;
    if (view === "settings") return <EntityView dashboard={dashboard} resource="notification-rules" title="Notification Rules" />;
    return <DashboardView dashboard={dashboard} />;
  };

  return (
    <DashboardLayout allowedRoles={roles}>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <Building2 size={18} />
              Enterprise Operations
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">{currentNav.label}</h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Multi-tenant factory operations, fleet intelligence, CMMS, alerts,
              engineers, reporting, audit, and executive analytics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
          >
            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            Refresh
          </button>
        </section>

        <EnterpriseNav />

        {error ? (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading && !dashboard ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/75">
            <div className="text-center">
              <Loader2 size={42} className="mx-auto animate-spin text-cyan-300" />
              <p className="mt-4 font-semibold text-white">Loading enterprise operations</p>
              <p className="mt-2 text-sm text-slate-400">Aggregating factories, assets, teams, and risks</p>
            </div>
          </div>
        ) : (
          viewContent()
        )}
      </div>
    </DashboardLayout>
  );
}
