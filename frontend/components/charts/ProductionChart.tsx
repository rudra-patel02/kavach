"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: "8 AM", production: 120 },
  { time: "10 AM", production: 180 },
  { time: "12 PM", production: 260 },
  { time: "2 PM", production: 220 },
  { time: "4 PM", production: 320 },
  { time: "6 PM", production: 390 },
];

export default function ProductionChart() {
  return (
    <div className="premium-card chart-frame h-full rounded-2xl p-6">
      <h2 className="mb-5 text-xl font-black text-white">
        Live Production
      </h2>

      <div className="h-72 rounded-xl border border-slate-800/80 bg-slate-950/35 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />

            <XAxis dataKey="time" stroke="#9CA3AF" />

            <YAxis stroke="#9CA3AF" />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="production"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
