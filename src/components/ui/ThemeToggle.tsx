"use client";

import { SunIcon, MoonIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-8 h-8 rounded-lg bg-bg-card border border-primary/20 opacity-0 pointer-events-none",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className={cn(
        "relative w-8 h-8 flex items-center justify-center rounded-lg",
        "bg-bg-card border border-primary/20",
        "hover:border-border-strong hover:bg-bg-elevated",
        "transition-all duration-200 cursor-pointer",
        className
      )}
    >
      {/* Sun — tampil saat dark mode, klik untuk ke light */}
      <SunIcon
        className={cn(
          "absolute w-4 h-4 text-text-muted transition-all duration-300",
          isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50"
        )}
      />
      {/* Moon — tampil saat light mode, klik untuk ke dark */}
      <MoonIcon
        className={cn(
          "absolute w-4 h-4 text-text-muted transition-all duration-300",
          !isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50"
        )}
      />
    </button>
  );
}

