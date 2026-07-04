"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bot,
  Cpu,
  Loader2,
  Radio,
  Send,
  Sparkles,
} from "lucide-react";
import CopilotMessage, {
  type CopilotChatMessage,
} from "@/components/copilot/CopilotMessage";
import CopilotRightPanel from "@/components/copilot/CopilotRightPanel";
import TypingIndicator from "@/components/copilot/TypingIndicator";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchCopilotReport, sendCopilotMessage } from "@/lib/copilot";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";
import type { CopilotReport } from "@/types/copilot";
import type { MachineData } from "@/types/machine";

const starterPrompts = [
  "Why is Machine-03 overheating?",
  "Which machines need maintenance?",
  "Show unhealthy machines.",
  "Predict failures in next 24 hours.",
  "Explain vibration anomaly.",
  "Generate maintenance plan.",
  "Summarize plant status.",
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isCriticalState = (machine: MachineData) =>
  machine.status === "Critical" || machine.health < 40;

const getMachineKey = (machine: MachineData) => machine.machineId || machine._id;

const getMachineLabel = (machine: MachineData) =>
  machine.name || machine.machineId || "Machine";

const buildSnapshot = (machines: MachineData[]) =>
  new Map(
    machines.map((machine) => [
      getMachineKey(machine),
      {
        critical: isCriticalState(machine),
        status: machine.status,
      },
    ])
  );

const buildReportMessage = (report: CopilotReport) => {
  const summary = report.plantSummary;
  const leadAlert = report.criticalAlerts[0];
  const leadMaintenance = report.maintenanceSchedule[0];
  const riskLevel = leadAlert?.riskLevel || "Low";
  const priority = leadAlert?.priority || "Monitor";
  const action =
    leadAlert?.recommendedAction ||
    leadMaintenance?.recommendedAction ||
    "Continue live monitoring and preventive maintenance.";

  return [
    `Plant report generated: ${report.reportId}`,
    `Healthy machines: ${summary.healthyMachines}`,
    `Warning machines: ${summary.warningMachines}`,
    `Critical machines: ${summary.criticalMachines}`,
    `Average health: ${summary.averageHealth}%`,
    `Highest temperature: ${
      summary.highestTemperature
        ? `${summary.highestTemperature.name} at ${summary.highestTemperature.value} ${summary.highestTemperature.unit}`
        : "No data"
    }`,
    `Highest energy consumption: ${
      summary.highestEnergyConsumption
        ? `${summary.highestEnergyConsumption.name} at ${summary.highestEnergyConsumption.value} ${summary.highestEnergyConsumption.unit}`
        : "No data"
    }`,
    "",
    `Possible cause: ${leadAlert?.issue || "No critical degradation pattern is currently visible."}`,
    `Risk level: ${riskLevel}`,
    `Recommended action: ${action}`,
    `Priority: ${priority}`,
    `Estimated downtime: ${leadMaintenance?.estimatedDowntime || "Under 1 hour"}`,
  ].join("\n");
};

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello. I am the KAVACH AI Maintenance Copilot. Ask me about overheating, unhealthy machines, failure prediction, vibration anomalies, maintenance plans, or plant status.",
      createdAt: "",
    },
  ]);
  const [typedContent, setTypedContent] = useState<Record<string, string>>({});
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimersRef = useRef<number[]>([]);
  const machineSnapshotRef = useRef<Map<string, { critical: boolean; status: string }>>(
    new Map()
  );

  const machineStats = useMemo(() => {
    const critical = machines.filter(isCriticalState).length;
    const warning = machines.filter(
      (machine) =>
        !isCriticalState(machine) &&
        (machine.status === "Warning" ||
          machine.status === "Offline" ||
          machine.health < 80)
    ).length;

    return {
      total: machines.length,
      critical,
      warning,
    };
  }, [machines]);

  const addAssistantMessage = useCallback(
    (
      content: string,
      options: Pick<CopilotChatMessage, "metadata" | "variant"> = {}
    ) => {
      const message: CopilotChatMessage = {
        id: createId(),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        ...options,
      };

      setMessages((current) => [...current, message]);
      setTypedContent((current) => ({ ...current, [message.id]: "" }));

      let cursor = 0;
      const step = Math.max(2, Math.ceil(content.length / 180));
      const timer = window.setInterval(() => {
        cursor += step;

        setTypedContent((current) => ({
          ...current,
          [message.id]: content.slice(0, cursor),
        }));

        if (cursor >= content.length) {
          window.clearInterval(timer);
          typingTimersRef.current = typingTimersRef.current.filter(
            (item) => item !== timer
          );
        }
      }, 12);

      typingTimersRef.current.push(timer);
    },
    []
  );

  const addCriticalEventMessage = useCallback((machine: MachineData) => {
    const content = `⚠ ${getMachineLabel(machine)} has entered Critical condition.`;
    const message: CopilotChatMessage = {
      id: createId(),
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
      variant: "critical",
    };

    setToast(content);
    setMessages((current) => [...current, message]);

    window.setTimeout(() => {
      setToast(null);
    }, 5500);
  }, []);

  const askCopilot = useCallback(
    async (prompt: string) => {
      const question = prompt.trim();

      if (!question || isLoading) {
        return;
      }

      const userMessage: CopilotChatMessage = {
        id: createId(),
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await sendCopilotMessage(question);
        addAssistantMessage(response.answer, {
          metadata: response,
          variant:
            response.recommendation.riskLevel === "Critical"
              ? "critical"
              : "normal",
        });
      } catch (error) {
        addAssistantMessage(
          `I could not reach the copilot service. ${
            error instanceof Error ? error.message : "Please try again."
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [addAssistantMessage, isLoading]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askCopilot(input);
  };

  const handleGenerateReport = useCallback(async () => {
    if (isReportLoading) {
      return;
    }

    setIsReportLoading(true);

    try {
      const response = await fetchCopilotReport();
      addAssistantMessage(buildReportMessage(response.report));
    } catch (error) {
      addAssistantMessage(
        `I could not generate the plant report. ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsReportLoading(false);
    }
  }, [addAssistantMessage, isReportLoading]);

  const handleDownloadReport = useCallback(async () => {
    if (isReportLoading) {
      return;
    }

    setIsReportLoading(true);

    try {
      const response = await fetchCopilotReport();
      const payload = JSON.stringify(response.report, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${response.report.reportId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      addAssistantMessage(`Downloaded report ${response.report.reportId}.`);
    } catch (error) {
      addAssistantMessage(
        `I could not download the report. ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsReportLoading(false);
    }
  }, [addAssistantMessage, isReportLoading]);

  useEffect(() => {
    fetchMachines()
      .then((data) => {
        setMachines(data);
        machineSnapshotRef.current = buildSnapshot(data);
      })
      .catch((error) => {
        addAssistantMessage(
          `I could not load live machine telemetry. ${
            error instanceof Error ? error.message : "Check the backend service."
          }`
        );
      });
  }, [addAssistantMessage]);

  useEffect(() => {
    const handleMachineUpdate = (data: MachineData[]) => {
      const previousSnapshot = machineSnapshotRef.current;
      const hadPreviousSnapshot = previousSnapshot.size > 0;
      const newCriticalMachines = hadPreviousSnapshot
        ? data.filter((machine) => {
            const previous = previousSnapshot.get(getMachineKey(machine));
            return isCriticalState(machine) && !previous?.critical;
          })
        : [];

      setMachines(data);
      machineSnapshotRef.current = buildSnapshot(data);
      newCriticalMachines.forEach(addCriticalEventMessage);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, [addCriticalEventMessage]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typedContent, isLoading]);

  useEffect(() => {
    const timers = typingTimersRef.current;

    return () => {
      timers.forEach((timer) => window.clearInterval(timer));
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-9rem)] space-y-6 text-white">
        {toast ? (
          <div className="fixed right-6 top-6 z-50 max-w-sm rounded-2xl border border-red-400/40 bg-red-950/95 px-5 py-4 text-sm font-semibold text-red-50 shadow-2xl shadow-red-950/40">
            {toast}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
                <Sparkles size={18} />
                Production AI
              </div>

              <h1 className="text-3xl font-bold text-white md:text-4xl">
                AI Maintenance Copilot
              </h1>

              <p className="mt-2 text-slate-400">
                Industrial AI Assistant for Engineers
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[420px]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-2xl font-bold text-white">{machineStats.total}</p>
                <p className="mt-1 text-xs text-slate-400">Machines</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-2xl font-bold text-amber-200">
                  {machineStats.warning}
                </p>
                <p className="mt-1 text-xs text-amber-100/80">Warnings</p>
              </div>
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                <p className="text-2xl font-bold text-red-200">
                  {machineStats.critical}
                </p>
                <p className="mt-1 text-xs text-red-100/80">Critical</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="flex h-[calc(100vh-17rem)] min-h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                  <Bot size={22} />
                </span>

                <div>
                  <h2 className="font-bold text-white">Maintenance Chat</h2>
                  <p className="text-sm text-slate-400">
                    Rule-based analysis over live MongoDB machine data
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200 sm:flex">
                <Radio size={16} className="animate-pulse" />
                Live Socket.IO
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto scroll-smooth bg-slate-950 p-5">
              {messages.map((message) => (
                <CopilotMessage
                  key={message.id}
                  message={message}
                  visibleContent={typedContent[message.id] ?? message.content}
                />
              ))}

              {isLoading ? <TypingIndicator /> : null}
              <div ref={messageEndRef} />
            </div>

            <div className="border-t border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void askCopilot(prompt)}
                    className="shrink-0 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 transition-all duration-300 hover:border-cyan-400/40 hover:text-cyan-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus-within:border-cyan-400/60">
                  <Cpu size={20} className="text-cyan-300" />
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask about Machine-03, failures, maintenance, vibration, or plant status..."
                    className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/20 text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
                  aria-label="Send message"
                  title="Send message"
                >
                  {isLoading ? (
                    <Loader2 size={21} className="animate-spin" />
                  ) : (
                    <Send size={21} />
                  )}
                </button>
              </form>
            </div>
          </section>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <CopilotRightPanel
              machines={machines}
              isReportLoading={isReportLoading}
              onGenerateReport={handleGenerateReport}
              onQuickPrompt={(prompt) => void askCopilot(prompt)}
              onDownloadReport={handleDownloadReport}
            />
          </div>
        </div>

        <div className="sr-only" aria-live="polite">
          {toast}
        </div>
      </div>
    </DashboardLayout>
  );
}
