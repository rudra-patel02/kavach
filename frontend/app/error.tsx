"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="w-full max-w-xl rounded-xl border border-red-400/30 bg-red-500/10 p-6">
        <div className="flex items-center gap-3 text-red-100">
          <AlertTriangle size={22} />
          <h1 className="text-xl font-bold">Something went wrong</h1>
        </div>
        <p className="mt-3 text-sm text-red-100/80">
          {error.message || "The requested view could not be rendered."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-50 transition-colors hover:bg-red-500/20"
        >
          <RefreshCcw size={16} />
          Retry
        </button>
      </section>
    </div>
  );
}
