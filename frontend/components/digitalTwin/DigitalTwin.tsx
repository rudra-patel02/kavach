"use client";

import { motion } from "framer-motion";
import {
  Box,
  Factory,
  Layers3,
  Pause,
  Play,
  Radar,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FactoryScene from "@/components/3d/FactoryScene";
import { useEnterpriseTelemetry } from "@/hooks/useEnterpriseTelemetry";

export default function DigitalTwin() {
  const { profiles, kpis, enhancedAlerts } = useEnterpriseTelemetry();
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [playbackWindow, setPlaybackWindow] = useState<15 | 60 | 1440>(15);
  const [playbackPosition, setPlaybackPosition] = useState(100);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const isPlaybackMode = playbackPosition < 100;
  const playbackProfiles = useMemo(() => {
    if (!isPlaybackMode) {
      return profiles;
    }

    const ageRatio = (100 - playbackPosition) / 100;
    const direction = playbackPosition % 2 === 0 ? 1 : -1;

    return profiles.map((profile, index) => {
      const machine = profile.machine;
      const stress = ageRatio * (index + 1) * 0.8 * direction;
      const health = Math.max(
        0,
        Math.min(100, Number(machine.health || 0) + ageRatio * 8)
      );
      const temperature = Number(machine.temperature || 0) - stress * 1.8;
      const vibration = Math.max(0, Number(machine.vibration || 0) - stress * 0.02);
      const replayMachine = {
        ...machine,
        health: Number(health.toFixed(1)),
        temperature: Number(temperature.toFixed(1)),
        vibration: Number(vibration.toFixed(2)),
        status:
          health < 35
            ? "Critical"
            : health < 65
            ? "Warning"
            : machine.status,
      };

      return {
        ...profile,
        machine: replayMachine,
        criticalAlerts:
          playbackPosition < 35 ? profile.criticalAlerts.slice(0, 1) : profile.criticalAlerts,
        remainingUsefulLifeHours: Math.round(
          Number(profile.remainingUsefulLifeHours || 0) + ageRatio * playbackWindow
        ),
        riskScore: Math.max(
          0,
          Number(profile.riskScore || 0) - Math.round(ageRatio * 12)
        ),
      };
    });
  }, [isPlaybackMode, playbackPosition, playbackWindow, profiles]);
  const replayTimestamp = useMemo(() => {
    const date = new Date();
    date.setMinutes(
      date.getMinutes() - Math.round(playbackWindow * ((100 - playbackPosition) / 100))
    );
    return date.toLocaleString();
  }, [playbackPosition, playbackWindow]);
  const selectedProfile = useMemo(
    () =>
      playbackProfiles.find((profile) => profile.machine.machineId === selectedMachineId) ||
      playbackProfiles[0] ||
      null,
    [playbackProfiles, selectedMachineId]
  );
  const twinMetrics = [
    { icon: Radar, label: "Telemetry", value: profiles.length ? "Live" : "Demo", tone: "text-emerald-300" },
    { icon: Layers3, label: "Assets", value: String(kpis.totalMachines || profiles.length || 4), tone: "text-cyan-300" },
    { icon: Zap, label: "Alarms", value: String(enhancedAlerts.length), tone: "text-amber-300" },
  ];

  useEffect(() => {
    if (!isPlaybackPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setPlaybackPosition((current) => {
        if (current >= 100) {
          setIsPlaybackPlaying(false);
          return 100;
        }

        return Math.min(100, current + 2);
      });
    }, 650);

    return () => window.clearInterval(timer);
  }, [isPlaybackPlaying]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48 }}
      className="premium-card relative overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.13),transparent_36%),linear-gradient(225deg,rgba(16,185,129,0.09),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
            <Sparkles size={14} />
            Spatial Operations
          </div>
          <h2 className="mt-3 flex items-center gap-3 text-2xl font-black text-white sm:text-3xl">
            <span className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-3 shadow-lg shadow-cyan-950/30">
              <Factory size={24} className="text-cyan-300" />
            </span>
            Digital Twin
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Real-time industrial plant visualization with machine state, AI risk context, and spatial telemetry.
          </p>
        </div>

        <div className="premium-tile rounded-xl px-3 py-2 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Box size={16} className="text-cyan-300" />
            3D plant view
          </span>
        </div>
      </div>

      <div className="relative mb-5 rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Digital Twin Playback
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Replaying sensor values, alerts, status, and AI prediction state at {replayTimestamp}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              [15, "15m"],
              [60, "1h"],
              [1440, "24h"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPlaybackWindow(value as 15 | 60 | 1440);
                  setPlaybackPosition(0);
                  setIsPlaybackPlaying(false);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                  playbackWindow === value
                    ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsPlaybackPlaying(true)}
              className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 p-2 text-emerald-100"
              aria-label="Play playback"
            >
              <Play size={17} />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaybackPlaying(false)}
              className="rounded-lg border border-yellow-300/30 bg-yellow-400/10 p-2 text-yellow-100"
              aria-label="Pause playback"
            >
              <Pause size={17} />
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaybackPosition(0);
                setIsPlaybackPlaying(true);
              }}
              className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-100"
              aria-label="Resume playback"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={playbackPosition}
          onChange={(event) => {
            setPlaybackPosition(Number(event.target.value));
            setIsPlaybackPlaying(false);
          }}
          className="mt-4 w-full accent-cyan-400"
          aria-label="Seek digital twin playback"
        />
      </div>

      <div className="relative grid gap-4 xl:grid-cols-[1fr_17rem]">
        <div className="relative h-[460px] min-h-[420px] w-full overflow-hidden rounded-2xl border border-cyan-400/15 bg-slate-950/70 shadow-2xl shadow-black/30 sm:h-[540px]">
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border border-cyan-400/20 bg-slate-950/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-xl">
            Interactive plant layer
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 grid gap-3 sm:grid-cols-3">
            {twinMetrics.map((metric, index) => {
              const Icon = metric.icon;

              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.08, duration: 0.36 }}
                  className="rounded-xl border border-white/10 bg-slate-950/72 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Icon size={15} className={metric.tone} />
                    {metric.label}
                  </div>
                  <div className={`mt-1 text-lg font-black ${metric.tone}`}>
                    {metric.value}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-white/5" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.28),transparent_38%,rgba(8,145,178,0.08))]" />
          <div className="relative h-full">
            <FactoryScene
              profiles={playbackProfiles}
              selectedMachineId={selectedMachineId}
              onMachineSelect={(profile) => setSelectedMachineId(profile.machine.machineId)}
              showSensorOverlays={false}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {[
            ["OEE", `${kpis.overallOee || 0}%`],
            ["Average Health", `${kpis.averageHealth || 0}%`],
            ["Energy", `${kpis.totalEnergy || 0} kWh`],
          ].map(([title, copy], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.08, duration: 0.36 }}
              className="premium-tile rounded-2xl p-4"
            >
              <div className="mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 shadow-lg shadow-cyan-300/20" />
              <h3 className="font-bold text-white">{title}</h3>
              <p className="mt-2 text-2xl font-black text-white">{copy}</p>
            </motion.div>
          ))}

          {selectedProfile ? (
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.44, duration: 0.36 }}
              className="premium-tile rounded-2xl p-4 sm:col-span-3 xl:col-span-1"
            >
              <div className="mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-amber-300 to-red-300 shadow-lg shadow-amber-300/20" />
              <h3 className="truncate font-bold text-white">
                {selectedProfile.machine.name}
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <span className="text-slate-400">Risk {selectedProfile.riskScore}</span>
                <span className="text-slate-400">RUL {selectedProfile.remainingUsefulLifeHours}h</span>
                <span className="text-slate-400">Alerts {selectedProfile.criticalAlerts.length}</span>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
