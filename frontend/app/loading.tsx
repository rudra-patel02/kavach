export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white industrial-shell sm:p-8">
      <div className="page-stack space-y-6">
        <div className="premium-skeleton h-12 w-72 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="premium-skeleton h-32 rounded-2xl"
            />
          ))}
        </div>
        <div className="premium-skeleton h-[520px] rounded-3xl" />
      </div>
    </div>
  );
}
