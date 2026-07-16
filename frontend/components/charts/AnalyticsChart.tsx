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
  { time: "8 AM", production: 90 },
  { time: "10 AM", production: 120 },
  { time: "12 PM", production: 160 },
  { time: "2 PM", production: 185 },
  { time: "4 PM", production: 220 },
  { time: "6 PM", production: 250 },
];

export default function AnalyticsCharts() {
  return (
    <div className="premium-card chart-frame rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
        Throughput
      </p>
      <h2 className="mb-6 mt-2 text-xl font-black text-white">
        Production Analytics
      </h2>

      <div className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-2" style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />

            <XAxis dataKey="time" stroke="#94a3b8" />

            <YAxis stroke="#94a3b8" />

            <Tooltip
              contentStyle={{
                background: "rgba(2, 6, 23, 0.92)",
                border: "1px solid rgba(34, 211, 238, 0.28)",
                borderRadius: 12,
                color: "#e2e8f0",
              }}
            />

            <Line
              type="monotone"
              dataKey="production"
              stroke="#22d3ee"
              strokeWidth={4}
              activeDot={{ r: 6, fill: "#67e8f9", stroke: "#ecfeff", strokeWidth: 2 }}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
