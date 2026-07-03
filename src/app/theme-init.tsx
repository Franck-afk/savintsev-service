"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      const prefersDark = matchMedia("(prefers-color-scheme:dark)").matches;
      const shouldBeDark = t === "dark" || (!t && prefersDark);

      document.documentElement.classList.toggle("dark", shouldBeDark);

      if (!t) {
        const value = shouldBeDark ? "dark" : "light";
        localStorage.setItem("theme", value);
        document.cookie = `theme=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
      }
    } catch {}

    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) location.reload();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  return null;
}
