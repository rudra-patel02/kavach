"use client";

import { useEffect, useMemo, useState } from "react";
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
    fetch("http://localhost:5000/api/machines")
      .then((res) => res.json())
      .then(setMachines);

    socket.on("machineUpdate", setMachines);

    return () => {
      socket.off("machineUpdate");
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

      return `Critical machines: ${critical
        .map((m) => m.name)
        .join(", ")}.`;
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
      )}°C).`;
    }

    return "I couldn't understand that request. Try asking about critical machines, maintenance, or temperature.";
  }, [question, machines]);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-5">
        🤖 AI Copilot
      </h2>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask: Which machine needs maintenance?"
        className="w-full rounded-lg bg-slate-800 border border-slate-600 p-3 text-white outline-none"
      />

      <div className="mt-5 rounded-xl bg-slate-800 p-4">
        <p className="text-cyan-300 font-semibold mb-2">Response</p>

        <p className="text-slate-200">{answer}</p>
      </div>
    </div>
  );
}