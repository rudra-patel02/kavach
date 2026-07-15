"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { name: "Running", value: 8, color: "#34d399" },
  { name: "Idle", value: 2, color: "#fbbf24" },
  { name: "Maintenance", value: 1, color: "#fb7185" },
  { name: "Offline", value: 1, color: "#64748b" },
];

export default function MachineStatusChart() {
  return (
    <div className="premium-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
        Fleet
      </p>
      <h2 className="mb-6 mt-2 text-xl font-black text-white">
        Machine Status
      </h2>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: "rgba(2, 6, 23, 0.92)",
                border: "1px solid rgba(34, 211, 238, 0.28)",
                borderRadius: 12,
                color: "#e2e8f0",
              }}
            />
            <Legend wrapperStyle={{ color: "#cbd5e1" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
