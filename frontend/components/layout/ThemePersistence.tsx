"use client";

import { useEffect } from "react";

export default function ThemePersistence() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("kavach:theme") || "dark";
    document.documentElement.dataset.theme = storedTheme;
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  return null;
}
