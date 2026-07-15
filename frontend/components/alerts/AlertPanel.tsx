"use client";

const alerts = [
  {
    id: 1,
    level: "Critical",
    machine: "Boiler-02",
    message: "Temperature exceeded safe limit",
    time: "08:31 AM",
  },
  {
    id: 2,
    level: "Warning",
    machine: "Pump-03",
    message: "Pressure dropping",
    time: "09:12 AM",
  },
  {
    id: 3,
    level: "Info",
    machine: "Cooling Unit",
    message: "Maintenance completed",
    time: "09:45 AM",
  },
];

export default function AlertPanel() {
  return (
    <div className="premium-card mt-6 rounded-2xl p-6">
      <h2 className="mb-4 text-2xl font-black">Live Alerts</h2>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between gap-4 border-b border-slate-800/80 py-3 transition-colors last:border-0 hover:bg-cyan-400/5"
        >
          <div>
            <p className="font-semibold">{alert.machine}</p>
            <p className="text-sm text-slate-400">{alert.message}</p>
          </div>

          <div className="text-right">
            <span
              className={`status-pill ${
                alert.level === "Critical"
                  ? "border-red-400/30 bg-red-500/10 text-red-200"
                  : alert.level === "Warning"
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                  : "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
              }`}
            >
              {alert.level}
            </span>

            <p className="mt-2 text-xs text-slate-500">
              {alert.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
