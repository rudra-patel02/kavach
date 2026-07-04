"use client";

import FactoryScene from "@/components/3d/FactoryScene";

export default function PlantPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-cyan-400">
          Digital Plant
        </h1>

        <p className="text-slate-400 mt-2">
          Real-time 3D visualization of the industrial plant.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 h-[700px]">
        <FactoryScene />
      </div>
    </main>
  );
}