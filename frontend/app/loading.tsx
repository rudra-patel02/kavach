export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
            />
          ))}
        </div>
        <div className="h-[480px] animate-pulse rounded-xl border border-slate-800 bg-slate-900" />
      </div>
    </div>
  );
}
