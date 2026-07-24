import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white industrial-shell"
    >
      <section className="premium-card w-full max-w-xl rounded-2xl p-6 text-center">
        <Loader2
          size={36}
          className="mx-auto animate-spin text-cyan-300"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-xl font-bold text-white">
          Loading KAVACH
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Preparing live plant intelligence and operational views.
        </p>
      </section>
    </main>
  );
}
