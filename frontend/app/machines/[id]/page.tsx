"use client";

import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  History,
  Loader2,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchMachine } from "@/lib/machines";
import { fetchNotifications } from "@/lib/notifications";
import { fetchPredictiveMachine } from "@/lib/predictive";
import { fetchWorkOrders } from "@/lib/workorders";
import type { MachineData } from "@/types/machine";
import type { NotificationItem } from "@/types/notification";
import type { PredictiveMachine } from "@/types/predictive";
import type { WorkOrder } from "@/types/workOrder";

type TimelineItem = {
  at: string;
  description: string;
  kind: "Alert" | "Failure" | "Maintenance" | "Upcoming" | "Prediction";
  title: string;
  tone: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not scheduled"
    : date.toLocaleString();
};

const riskTone = (risk?: string) => {
  if (risk === "Critical") return "border-red-400/40 bg-red-500/10 text-red-100";
  if (risk === "High") return "border-orange-400/40 bg-orange-500/10 text-orange-100";
  if (risk === "Medium") return "border-yellow-400/40 bg-yellow-500/10 text-yellow-100";
  return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
};

export default function MachineDetails() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  const [machine, setMachine] = useState<MachineData | null>(null);
  const [prediction, setPrediction] = useState<PredictiveMachine | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [liveHealth, setLiveHealth] = useState(98);
  const [liveTemperature, setLiveTemperature] = useState(62);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.allSettled([
      fetchMachine(id),
      fetchPredictiveMachine(id),
      fetchNotifications(),
      fetchWorkOrders(),
    ])
      .then(([machineResult, predictiveResult, notificationResult, workOrderResult]) => {
        if (machineResult.status === "rejected") {
          throw machineResult.reason;
        }

        setMachine(machineResult.value);
        setLiveHealth(Number(machineResult.value.health ?? 98));
        setLiveTemperature(Number(machineResult.value.temperature ?? 62));

        if (predictiveResult.status === "fulfilled") {
          setPrediction(predictiveResult.value.detail.prediction);
        }

        if (notificationResult.status === "fulfilled") {
          setNotifications(
            notificationResult.value.notifications.filter(
              (notification) => notification.machineId === id
            )
          );
        }

        if (workOrderResult.status === "fulfilled") {
          setWorkOrders(
            workOrderResult.value.workOrders.filter(
              (workOrder) => workOrder.machineId === id
            )
          );
        }

        setError(null);
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load machine details"
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      setLiveHealth((prev) => {
        let value = prev + Math.floor(Math.random() * 5) - 2;

        if (value > 100) value = 100;
        if (value < 30) value = 30;

        return value;
      });

      setLiveTemperature((prev) => {
        let value = prev + Math.floor(Math.random() * 5) - 2;

        if (value > 110) value = 110;
        if (value < 40) value = 40;

        return value;
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-cyan-200">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Loader2 size={20} className="animate-spin" />
            Loading machine details
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !machine) {
    return (
      <DashboardLayout>
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          <div className="flex items-center gap-3">
            <AlertTriangle size={22} />
            <h1 className="text-xl font-bold">Machine unavailable</h1>
          </div>
          <p className="mt-2 text-sm">{error || "Machine was not found."}</p>
        </div>
      </DashboardLayout>
    );
  }

  const sensorData = [
    { time: "10:00", value: liveTemperature - 5 },
    { time: "10:30", value: liveTemperature - 3 },
    { time: "11:00", value: liveTemperature - 1 },
    { time: "11:30", value: liveTemperature + 1 },
    { time: "12:00", value: liveTemperature },
  ];
  const rootCauseAnalysis = prediction?.rootCauseAnalysis;
  const machinePriority =
    rootCauseAnalysis?.maintenancePriority ||
    prediction?.maintenancePriority ||
    machine.aiPrediction?.maintenancePriority ||
    "Monitor";
  const machineImpact =
    rootCauseAnalysis?.businessImpact ||
    prediction?.businessImpact ||
    "No immediate production impact is visible from current telemetry.";
  const machineAction =
    rootCauseAnalysis?.recommendedAction ||
    prediction?.recommendedAction ||
    machine.aiPrediction?.recommendedAction ||
    machine.aiPrediction?.recommendation ||
    "Continue monitoring machine. Schedule preventive maintenance if health drops below 70%.";
  const timelineItems: TimelineItem[] = (() => {
    const alertItems = notifications.map((notification) => ({
      at: notification.createdAt,
      description: notification.message,
      kind:
        notification.type === "machine_failure" ||
        notification.failureProbability >= 70
          ? "Failure"
          : "Alert",
      title: notification.title,
      tone:
        notification.severity === "Critical"
          ? "border-red-400/40"
          : notification.severity === "High"
          ? "border-orange-400/40"
          : "border-cyan-400/30",
    })) satisfies TimelineItem[];
    const maintenanceItems = workOrders.flatMap((workOrder) => {
      const items: TimelineItem[] = [
        {
          at: workOrder.createdAt || workOrder.updatedAt || "",
          description: workOrder.description,
          kind: "Maintenance",
          title: `${workOrder.workOrderId} ${workOrder.status}`,
          tone: "border-cyan-400/30",
        },
      ];

      if (workOrder.completedDate) {
        items.push({
          at: workOrder.completedDate,
          description:
            workOrder.completionNotes ||
            workOrder.aiRecommendation ||
            "Maintenance work order completed.",
          kind: "Maintenance",
          title: `${workOrder.workOrderId} completed`,
          tone: "border-emerald-400/40",
        });
      }

      if (workOrder.scheduledDate || workOrder.dueDate) {
        items.push({
          at: workOrder.scheduledDate || workOrder.dueDate || "",
          description: workOrder.aiRecommendation || workOrder.description,
          kind: "Upcoming",
          title: `${workOrder.workOrderId} scheduled`,
          tone: "border-yellow-400/40",
        });
      }

      return items;
    });
    const predictedNextService = prediction
      ? [
          {
            at: prediction.inspectionDate,
            description: `${prediction.recommendation} RUL ${prediction.remainingUsefulLifeHours}h.`,
            kind: "Prediction" as const,
            title: "Predicted next service",
            tone: "border-violet-400/40",
          },
        ]
      : [];

    return [...alertItems, ...maintenanceItems, ...predictedNextService]
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white">

      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
          Machine Detail
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          {machine.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {machine.machineId} - {machine.department}
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col items-center">
  <p className="text-slate-400 mb-4">Health</p>

  <div className="w-28 h-28">
    <CircularProgressbar
      value={liveHealth}
      text={`${liveHealth}%`}
      styles={buildStyles({
        textColor: "#22d3ee",
        pathColor:
          liveHealth > 80
            ? "#22c55e"
            : liveHealth > 60
            ? "#facc15"
            : "#ef4444",
        trailColor: "#1e293b",
      })}
    />
  </div>
</div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-slate-400">Status</p>

          <h2
            className={`text-2xl font-bold ${
              machine.status === "Running"
                ? "text-green-400"
                : machine.status === "Warning"
                ? "text-yellow-400"
                : "text-red-500"
            }`}
          >
            {machine.status}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-slate-400">Health</p>

          <h2 className="text-3xl font-bold text-cyan-400">
            {liveHealth}%
          </h2>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col items-center">
  <p className="text-slate-400 mb-4">Temperature</p>

  <div className="w-28 h-28">
    <CircularProgressbar
      value={liveTemperature}
      maxValue={120}
      text={`${liveTemperature} C`}
      styles={buildStyles({
        textColor: "#fb923c",
        pathColor:
          liveTemperature < 70
            ? "#22c55e"
            : liveTemperature < 90
            ? "#facc15"
            : "#ef4444",
        trailColor: "#1e293b",
      })}
    />
  </div>
</div>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Live Temperature
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sensorData}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                isAnimationActive={false}
                stroke="#06b6d4"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">

          <h2 className="text-2xl font-semibold mb-4">
            AI Analysis
          </h2>

          <div className="space-y-5">

            <div>
              <p className="text-slate-400">Prediction</p>

              <h2 className="text-3xl font-bold text-green-400">
                {prediction?.riskLevel || machine.status}
              </h2>
            </div>

            <div>
              <p className="text-slate-400">
                Estimated Failure Risk
              </p>

              <div className="w-full bg-slate-700 rounded-full h-4 mt-2">

                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${100 - liveHealth}%` }}
                />

              </div>

              <p className="mt-2">
                {100 - liveHealth}% Risk
              </p>

            </div>

            <div>
              <p className="text-slate-400">
                Recommendation
              </p>

              <p className="mt-2 text-slate-200">
                {machineAction}
              </p>
            </div>

          </div>

        </div>

      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase text-violet-300">
              <BrainCircuit size={17} />
              AI Root Cause Analysis
            </div>
            <h2 className="mt-2 text-2xl font-semibold">
              Current anomaly assessment
            </h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${riskTone(prediction?.riskLevel)}`}>
            {machinePriority}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[
            {
              icon: ShieldCheck,
              label: "Probable Root Cause",
              value:
                rootCauseAnalysis?.probableRootCause ||
                prediction?.probableCause ||
                machine.aiRootCauseSummary ||
                "No dominant root-cause signature detected.",
            },
            {
              icon: BrainCircuit,
              label: "Confidence",
              value: `${rootCauseAnalysis?.confidencePercent || prediction?.aiConfidence || machine.aiConfidencePercent || 0}%`,
            },
            {
              icon: BriefcaseBusiness,
              label: "Business Impact",
              value: machineImpact,
            },
            {
              icon: Wrench,
              label: "Recommended Action",
              value: machineAction,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Icon size={17} className="text-violet-300" />
                  {item.label}
                </div>
                <p className="text-sm leading-6 text-slate-200">{item.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 p-3 text-cyan-200">
            <History size={22} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold">Machine Maintenance Timeline</h2>
            <p className="mt-1 text-sm text-slate-400">
              Alerts, failures, maintenance history, upcoming work, and predicted service.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {timelineItems.length > 0 ? (
            timelineItems.map((item, index) => (
              <div
                key={`${item.kind}-${item.title}-${index}`}
                className={`rounded-xl border-l-4 bg-slate-950/60 p-4 ${item.tone}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} className="text-cyan-300" />
                    <p className="font-semibold text-white">{item.title}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {item.kind} / {formatDateTime(item.at)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              No timeline events are available yet. Live alerts, completed work
              orders, and predicted service dates will appear here automatically.
            </div>
          )}
        </div>
      </section>

      </div>
    </DashboardLayout>
  );
}
