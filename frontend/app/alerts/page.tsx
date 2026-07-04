"use client";

const alerts = [
  {
    title: "High Temperature",
    machine: "Mixer",
    level: "Critical",
    color: "text-red-400",
  },
  {
    title: "Low Machine Health",
    machine: "Conveyor",
    level: "Warning",
    color: "text-yellow-400",
  },
  {
    title: "Maintenance Due",
    machine: "Packaging",
    level: "Info",
    color: "text-cyan-400",
  },
];

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        Live Alerts
      </h1>

      <div className="space-y-5">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="bg-slate-900 border border-slate-700 rounded-xl p-5"
          >
            <h2 className={`text-xl font-bold ${alert.color}`}>
              {alert.title}
            </h2>

            <p className="mt-2">
              Machine: <b>{alert.machine}</b>
            </p>

            <p>
              Severity: <span className={alert.color}>{alert.level}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}