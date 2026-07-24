"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white industrial-shell">
          <section
            role="alert"
            aria-live="assertive"
            className="premium-card w-full max-w-xl rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 text-red-100">
              <span className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-red-200">
                <AlertTriangle size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-200">
                  500
                </p>
                <h1 className="text-xl font-bold">Application Error</h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-red-100/80">
              KAVACH could not render this view. Retry the page once the
              service is available again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-50 transition-colors hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <RefreshCcw size={16} aria-hidden="true" />
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
