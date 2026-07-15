import { Box, Factory } from "lucide-react";
import FactoryScene from "@/components/3d/FactoryScene";

export default function DigitalTwin() {
  return (
    <div className="premium-card rounded-2xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            Spatial Operations
          </p>
          <h2 className="mt-2 flex items-center gap-3 text-2xl font-black text-white">
            <Factory size={24} className="text-cyan-300" />
            Digital Twin
          </h2>
        </div>

        <div className="premium-tile rounded-xl px-3 py-2 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Box size={16} className="text-cyan-300" />
            3D plant view
          </span>
        </div>
      </div>

      <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/60">
        <FactoryScene />
      </div>
    </div>
  );
}
