"use client";

import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

export default function OEEGauge() {
  const oee = 91;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">

      <h2 className="text-2xl font-bold text-white mb-6">
        🎯 Overall Equipment Effectiveness
      </h2>

      <div className="flex justify-center">

        <div style={{ width: 220, height: 220 }}>
          <CircularProgressbar
            value={oee}
            text={`${oee}%`}
            styles={buildStyles({
              pathColor: "#22C55E",
              trailColor: "#1E293B",
              textColor: "#ffffff",
              textSize: "16px",
            })}
          />
        </div>

      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">

        <div>
          <p className="text-slate-400 text-sm">
            Availability
          </p>

          <p className="text-green-400 font-bold">
            95%
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">
            Performance
          </p>

          <p className="text-blue-400 font-bold">
            90%
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">
            Quality
          </p>

          <p className="text-purple-400 font-bold">
            97%
          </p>
        </div>

      </div>

    </div>
  );
}