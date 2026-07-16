"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { time: "8 AM", energy: 180 },
  { time: "10 AM", energy: 220 },
  { time: "12 PM", energy: 260 },
  { time: "2 PM", energy: 240 },
  { time: "4 PM", energy: 285 },
  { time: "6 PM", energy: 250 },
];

export default function EnergyChart() {
  return (
    <div className="premium-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300/80">
        Power
      </p>
      <h2 className="mb-6 mt-2 text-xl font-black text-white">
        Energy Consumption
      </h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.72} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "rgba(2, 6, 23, 0.92)",
                border: "1px solid rgba(56, 189, 248, 0.28)",
                borderRadius: 12,
                color: "#e2e8f0",
              }}
            />
            <Area
              type="monotone"
              dataKey="energy"
              stroke="#38bdf8"
              fill="url(#energyFill)"
              strokeWidth={3}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
