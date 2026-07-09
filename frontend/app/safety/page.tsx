export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        Safety Monitoring
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-green-400">
            PPE Compliance
          </h2>

          <p className="mt-4 text-5xl font-bold">98%</p>

          <p className="text-slate-400 mt-2">
            Workers wearing safety equipment.
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-400">
            Gas Leak Status
          </h2>

          <p className="mt-4 text-5xl font-bold">Safe</p>

          <p className="text-slate-400 mt-2">
            No hazardous gases detected.
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-400">
            Emergency Exits
          </h2>

          <p className="mt-4 text-5xl font-bold">8 / 8</p>

          <p className="text-slate-400 mt-2">
            All exits are operational.
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-cyan-400">
            Fire System
          </h2>

          <p className="mt-4 text-5xl font-bold">Active</p>

          <p className="text-slate-400 mt-2">
            Fire suppression system ready.
          </p>
        </div>
      </div>
    </div>
  );
}
