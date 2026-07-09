"use client";

import { useEffect, useState } from "react";

export default function LiveSensors() {
  const [temperature, setTemperature] = useState(62);
  const [pressure, setPressure] = useState(12.4);
  const [health, setHealth] = useState(98);
  const [vibration, setVibration] = useState(1.2);

  useEffect(() => {
    const timer = setInterval(() => {
      setTemperature(Number((60 + Math.random() * 8).toFixed(1)));
      setPressure(Number((12 + Math.random()).toFixed(2)));
      setHealth(Math.floor(95 + Math.random() * 5));
      setVibration(Number((1 + Math.random()).toFixed(2)));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h3 className="text-gray-400 text-sm">Temperature</h3>
        <p className="text-cyan-400 text-3xl font-bold">{temperature}°C</p>
      </div>

      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h3 className="text-gray-400 text-sm">Pressure</h3>
        <p className="text-yellow-400 text-3xl font-bold">{pressure} Bar</p>
      </div>

      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h3 className="text-gray-400 text-sm">Health</h3>
        <p className="text-green-400 text-3xl font-bold">{health}%</p>
      </div>

      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h3 className="text-gray-400 text-sm">Vibration</h3>
        <p className="text-red-400 text-3xl font-bold">{vibration} mm/s</p>
      </div>
    </div>
  );
}