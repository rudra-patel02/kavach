"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { machine: "Tank", health: 96 },
  { machine: "Mixer", health: 89 },
  { machine: "Conveyor", health: 92 },
  { machine: "Packaging", health: 78 },
];

export default function MachineHealthChart() {
  return (
    <div className="premium-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300/80">
        Reliability
      </p>
      <h2 className="mb-6 mt-2 text-xl font-black text-white">
        Machine Health
      </h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />
            <XAxis dataKey="machine" stroke="#94a3b8" />
            <YAxis domain={[0, 100]} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "rgba(2, 6, 23, 0.92)",
                border: "1px solid rgba(16, 185, 129, 0.28)",
                borderRadius: 12,
                color: "#e2e8f0",
              }}
            />
            <Bar
              dataKey="health"
              fill="#34d399"
              radius={[8, 8, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
