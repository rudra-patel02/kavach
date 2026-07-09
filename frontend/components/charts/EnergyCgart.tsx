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
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        ⚡ Energy Consumption
      </h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="time" />

            <YAxis />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="energy"
              stroke="#3B82F6"
              fill="url(#energyFill)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}