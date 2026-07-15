"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Send } from "lucide-react";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";

type Machine = {
  name: string;
  status: string;
  temperature: number;
  health: number;
  aiPrediction?: {
    recommendation?: string;
  };
};

export default function AICopilot() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    fetchMachines().then(setMachines);

    const handleMachineUpdate = (data: Machine[]) => {
      setMachines(data);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, []);

  const answer = useMemo(() => {
    if (!question.trim()) {
      return "Ask about machine health, maintenance, temperature, or critical equipment.";
    }

    const q = question.toLowerCase();

    if (q.includes("critical")) {
      const critical = machines.filter((m) => m.status === "Critical");

      if (!critical.length) {
        return "No machines are currently in a critical state.";
      }

      return `Critical machines: ${critical.map((m) => m.name).join(", ")}.`;
    }

    if (q.includes("maintenance")) {
      const machine = machines.find((m) => m.health < 70);

      if (!machine) {
        return "No immediate maintenance is recommended.";
      }

      return `${machine.name} should be inspected. Health is ${machine.health}%.`;
    }

    if (q.includes("temperature")) {
      const hottest = [...machines].sort(
        (a, b) => b.temperature - a.temperature
      )[0];

      if (!hottest) return "No machine data available.";

      return `${hottest.name} has the highest temperature (${hottest.temperature.toFixed(
        1
      )} C).`;
    }

    return "I couldn't understand that request. Try asking about critical machines, maintenance, or temperature.";
  }, [question, machines]);

  return (
    <div className="premium-card rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
          <Bot size={22} className="text-cyan-200" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            Operator Assistant
          </p>
          <h2 className="text-2xl font-black text-white">AI Copilot</h2>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 transition-colors focus-within:border-cyan-300/50">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask: Which machine needs maintenance?"
          className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
        />
        <Send size={18} className="text-cyan-300" />
      </div>

      <div className="premium-tile mt-5 rounded-xl p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
          Response
        </p>

        <p className="leading-6 text-slate-200">{answer}</p>
      </div>
    </div>
  );
}
