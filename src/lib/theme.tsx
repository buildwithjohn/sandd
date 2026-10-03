"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Single app-wide theme (the landing's deep-purple / gold blend).
  // No light/dark split — `dark` is always applied so any `dark:` utilities
  // resolve, and toggle/setTheme are kept as harmless no-ops for callers.
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const value: ThemeContextValue = { theme: "dark", toggle: () => {}, setTheme: () => {} };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
