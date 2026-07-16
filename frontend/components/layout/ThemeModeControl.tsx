"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applyKavachTheme, type ThemeMode } from "./ThemePersistence";

const options: Array<{ icon: typeof Monitor; label: string; value: ThemeMode }> = [
  { icon: Monitor, label: "Auto", value: "auto" },
  { icon: Sun, label: "Light", value: "light" },
  { icon: Moon, label: "Dark", value: "dark" },
];

export default function ThemeModeControl({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "auto";
    }

    const storedMode = localStorage.getItem("kavach:theme-mode");

    if (storedMode === "auto" || storedMode === "light" || storedMode === "dark") {
      return storedMode;
    }

    return document.documentElement.dataset.themeMode === "light" ||
      document.documentElement.dataset.themeMode === "dark"
      ? document.documentElement.dataset.themeMode
      : "auto";
  });

  useEffect(() => {
    const syncTheme = (event: Event) => {
      const detail = (event as CustomEvent<{ mode: ThemeMode }>).detail;
      setMode(detail?.mode || "auto");
    };

    window.addEventListener("kavach:theme-change", syncTheme);

    return () => window.removeEventListener("kavach:theme-change", syncTheme);
  }, []);

  const updateMode = (nextMode: ThemeMode) => {
    setMode(nextMode);
    applyKavachTheme(nextMode);
  };

  return (
    <div
      className={`theme-mode-control premium-tile flex items-center rounded-xl p-1 ${
        compact ? "gap-0.5" : "gap-1"
      }`}
      role="group"
      aria-label="Theme mode"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            title={`${option.label} theme`}
            onClick={() => updateMode(option.value)}
            className={`theme-mode-button inline-flex h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-bold transition-colors ${
              isActive ? "is-active" : ""
            }`}
          >
            <Icon size={15} />
            {!compact ? <span>{option.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
