import { Activity } from "lucide-react";

export default function PlantStatus() {
  const machines = [
    {
      name: "CNC Machine",
      status: "Running",
      color: "bg-green-500",
    },
    {
      name: "Compressor",
      status: "Warning",
      color: "bg-yellow-500",
    },
    {
      name: "Cooling Unit",
      status: "Stopped",
      color: "bg-red-500",
    },
    {
      name: "Assembly Line",
      status: "Running",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="premium-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300/80">
        Operations
      </p>
      <h2 className="mb-5 mt-2 flex items-center gap-3 text-xl font-black text-white">
        <Activity size={21} className="text-emerald-300" />
        Plant Status
      </h2>

      <div className="space-y-4">
        {machines.map((machine) => (
          <div
            key={machine.name}
            className="premium-tile flex items-center justify-between rounded-xl p-4"
          >
            <span className="font-medium text-slate-200">
              {machine.name}
            </span>

            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${machine.color} live-dot`}
              />

              <span className="text-sm text-slate-400">
                {machine.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
