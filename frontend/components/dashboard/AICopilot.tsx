"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  BrainCircuit,
  ChevronRight,
  MessageSquareText,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";

export default function AICopilot() {
  const machines = useMachineFeed();
  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const thinkingTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (thinkingTimerRef.current) {
        window.clearTimeout(thinkingTimerRef.current);
      }
    },
    []
  );

  const updateQuestion = (value: string) => {
    setQuestion(value);

    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
    }

    if (!value.trim()) {
      setIsThinking(false);
      return;
    }

    setIsThinking(true);
    thinkingTimerRef.current = window.setTimeout(() => {
      setIsThinking(false);
    }, 420);
  };

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

  const suggestedPrompts = [
    { icon: BrainCircuit, label: "Critical machines", prompt: "Which machines are critical?" },
    { icon: Wrench, label: "Maintenance", prompt: "Which machine needs maintenance?" },
    { icon: Sparkles, label: "Temperature", prompt: "Which machine has the highest temperature?" },
  ];

  const activeContext =
    machines.length > 0
      ? `${machines.length} assets connected`
      : "Waiting for machine telemetry";

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="premium-card relative overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.13),transparent_34%)]" />

      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-3 shadow-lg shadow-cyan-950/30">
            <Bot size={24} className="text-cyan-200" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-300 shadow-lg shadow-emerald-300/40" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
              Operator Assistant
            </p>
            <h2 className="text-2xl font-black text-white">AI Copilot</h2>
          </div>
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
          {activeContext}
        </div>
      </div>

      <div className="relative space-y-4">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4">
          <div className="flex gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950 shadow-lg shadow-cyan-950/30">
              <Bot size={18} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                <MessageSquareText size={14} />
                Assistant
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-slate-200">
                {isThinking ? (
                  <span className="inline-flex items-center gap-2 text-cyan-100">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                    Analyzing plant context...
                  </span>
                ) : (
                  answer
                )}
              </div>
            </div>
          </div>
        </div>

        {question.trim() ? (
          <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-tr-sm border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm leading-6 text-slate-100">
              {question}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative mt-5 grid gap-2 sm:grid-cols-3">
        {suggestedPrompts.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.label}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.05, duration: 0.32 }}
              onClick={() => updateQuestion(item.prompt)}
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-950/50 px-3 py-3 text-left text-sm font-semibold text-slate-300 transition-all hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon size={16} className="shrink-0 text-cyan-300" />
                <span className="truncate">{item.label}</span>
              </span>
              <ChevronRight size={15} className="shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300" />
            </motion.button>
          );
        })}
      </div>

      <div className="relative mt-5 flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 transition-colors focus-within:border-cyan-300/50">
        <input
          value={question}
          onChange={(e) => updateQuestion(e.target.value)}
          placeholder="Ask: Which machine needs maintenance?"
          className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          aria-label="Submit question"
          className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300 transition-colors hover:bg-cyan-400/20 hover:text-cyan-100"
        >
          <Send size={18} />
        </button>
      </div>
    </motion.section>
  );
}
