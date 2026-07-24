import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white industrial-shell">
      <section className="premium-card w-full max-w-2xl rounded-2xl p-6 text-center md:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-200">
          <SearchX size={28} aria-hidden="true" />
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
          404
        </p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
          Page Not Found
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
          The requested KAVACH view does not exist or may have moved. Return to
          the command dashboard to continue monitoring plant operations.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
}
