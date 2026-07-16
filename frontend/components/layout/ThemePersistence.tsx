"use client";

import { useEffect } from "react";

export type ThemeMode = "auto" | "light" | "dark";

const THEME_MODE_KEY = "kavach:theme-mode";
const LEGACY_THEME_KEY = "kavach:theme";

const getAutoTheme = () => {
  const hour = new Date().getHours();

  return hour >= 7 && hour < 19 ? "light" : "dark";
};

const getStoredMode = (): ThemeMode => {
  const storedMode = localStorage.getItem(THEME_MODE_KEY);

  if (storedMode === "auto" || storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);

  return legacyTheme === "light" || legacyTheme === "dark" ? legacyTheme : "auto";
};

export const applyKavachTheme = (mode: ThemeMode) => {
  const resolvedTheme = mode === "auto" ? getAutoTheme() : mode;

  localStorage.setItem(THEME_MODE_KEY, mode);
  localStorage.setItem(LEGACY_THEME_KEY, resolvedTheme);
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  window.dispatchEvent(
    new CustomEvent("kavach:theme-change", {
      detail: { mode, theme: resolvedTheme },
    })
  );
};

export default function ThemePersistence() {
  useEffect(() => {
    applyKavachTheme(getStoredMode());

    const timer = window.setInterval(() => {
      const mode = getStoredMode();

      if (mode === "auto") {
        applyKavachTheme(mode);
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
