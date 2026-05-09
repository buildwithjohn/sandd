"use client";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme"
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center theme-bg-subtle hover:theme-bg-muted transition-all ${className}`}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
      {theme === "light"
        ? <Moon className="w-4 h-4 theme-text-muted" />
        : <Sun  className="w-4 h-4 theme-accent" />
      }
    </button>
  );
}
