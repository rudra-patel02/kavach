import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] rounded-2xl border border-cyan-400/20 bg-slate-900/90 px-5 py-4 shadow-2xl shadow-cyan-950/20">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300">
          <Bot size={15} />
          KAVACH Copilot
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.24s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.12s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
        </div>
      </div>
    </div>
  );
}
