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
    <div className="bg-[#111827] rounded-2xl p-6 shadow-lg h-full">
      <h2 className="text-xl font-semibold text-white mb-5">
        Live Production
      </h2>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />

            <XAxis dataKey="time" stroke="#9CA3AF" />

            <YAxis stroke="#9CA3AF" />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="production"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}