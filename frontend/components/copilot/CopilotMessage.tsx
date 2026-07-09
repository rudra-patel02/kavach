import { Bot, Clock, User } from "lucide-react";
import type { CopilotChatResponse, CopilotRiskLevel } from "@/types/copilot";
import MarkdownContent from "./MarkdownContent";

export interface CopilotChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: CopilotChatResponse;
  variant?: "normal" | "critical";
}

interface CopilotMessageProps {
  message: CopilotChatMessage;
  visibleContent: string;
}

const riskStyles: Record<CopilotRiskLevel, string> = {
  Low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  Medium: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  High: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  Critical: "border-red-400/40 bg-red-400/10 text-red-200",
};

const formatTime = (value: string) => {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Now";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function CopilotMessage({
  message,
  visibleContent,
}: CopilotMessageProps) {
  const isUser = message.role === "user";
  const recommendation = message.metadata?.recommendation;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[88%] rounded-2xl border px-5 py-4 shadow-2xl transition-all duration-300 md:max-w-[78%] ${
          isUser
            ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-50 shadow-cyan-950/20"
            : message.variant === "critical"
              ? "border-red-400/30 bg-red-950/35 text-red-50 shadow-red-950/20"
              : "border-slate-700/80 bg-slate-900/95 text-slate-100 shadow-black/20"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <div
            className={`flex items-center gap-2 text-xs font-semibold uppercase ${
              isUser ? "text-cyan-100" : "text-cyan-300"
            }`}
          >
            {isUser ? <User size={15} /> : <Bot size={15} />}
            {isUser ? "Engineer" : "KAVACH Copilot"}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={13} />
            {formatTime(message.createdAt)}
          </div>
        </div>

        <MarkdownContent content={visibleContent} />

        {!isUser && recommendation ? (
          <div className="mt-4 grid gap-3 border-t border-slate-700/70 pt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  riskStyles[recommendation.riskLevel]
                }`}
              >
                Risk: {recommendation.riskLevel}
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
                Priority: {recommendation.priority}
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
                Downtime: {recommendation.estimatedDowntime}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <p className="text-xs font-semibold text-slate-400">
                Possible Cause
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {recommendation.possibleCause}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <p className="text-xs font-semibold text-slate-400">
                Recommended Action
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {recommendation.recommendedAction}
              </p>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}
