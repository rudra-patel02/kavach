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
    <div className="bg-slate-900 rounded-xl p-6 mt-6 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4">Live Alerts</h2>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="border-b border-slate-700 py-3 flex justify-between items-center"
        >
          <div>
            <p className="font-semibold">{alert.machine}</p>
            <p className="text-gray-400 text-sm">{alert.message}</p>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1 rounded text-sm ${
                alert.level === "Critical"
                  ? "bg-red-600"
                  : alert.level === "Warning"
                  ? "bg-yellow-500 text-black"
                  : "bg-cyan-600"
              }`}
            >
              {alert.level}
            </span>

            <p className="text-xs text-gray-400 mt-2">
              {alert.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}