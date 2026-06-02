"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCountdown } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface VoteTimerProps {
  endTime: string;
  startTime?: string;
  className?: string;
  compact?: boolean;
}

function computeTimerState(endTime: string, startTime?: string) {
  const nowMs = Date.now();
  const start = startTime ? new Date(startTime).getTime() : nowMs;
  return {
    hasStarted: nowMs >= start,
    countdown: formatCountdown(endTime),
    startCountdown: startTime ? formatCountdown(startTime) : null,
  };
}

export function VoteTimer({ endTime, startTime, className, compact = false }: VoteTimerProps) {
  // Start as null so the server renders nothing time-dependent.
  // This prevents SSR/client hydration mismatches caused by Date.now() drift.
  const [tick, setTick] = useState<number | null>(null);

  useEffect(() => {
    // Trigger first real render after mount, then every second.
    const timeout = setTimeout(() => setTick(0), 0);
    const interval = setInterval(() => setTick((t) => (t ?? 0) + 1), 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Derived state — only computed after client mount (tick !== null)
  const timerState = useMemo(
    () => (tick !== null ? computeTimerState(endTime, startTime) : null),
    [tick, endTime, startTime]
  );

  // Before client mount, render a neutral placeholder to match the server.
  if (timerState === null) {
    return (
      <div className={cn("text-center", className)}>
        {!compact && <p className="text-xs text-text-muted mb-2">Berakhir dalam</p>}
        <span className="font-mono text-sm text-text-secondary">--:--:--</span>
      </div>
    );
  }

  const { hasStarted, countdown, startCountdown } = timerState;

  if (!hasStarted && startTime && startCountdown && !startCountdown.isExpired) {
    return (
      <div className={cn("text-center", className)}>
        <p className="text-xs text-text-muted mb-2">Dimulai dalam</p>
        <CountdownDisplay {...startCountdown} compact={compact} />
      </div>
    );
  }

  if (countdown.isExpired) {
    return (
      <div className={cn("text-center", className)}>
        <span className="text-sm font-medium text-text-muted">Voting telah berakhir</span>
      </div>
    );
  }

  return (
    <div className={cn("text-center", className)}>
      {!compact && <p className="text-xs text-text-muted mb-2">Berakhir dalam</p>}
      <CountdownDisplay {...countdown} compact={compact} />
    </div>
  );
}

function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
  compact,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  compact: boolean;
}) {
  if (compact) {
    return (
      <span className="font-mono text-sm text-text-secondary">
        {days > 0 && `${days}h `}
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    );
  }

  const units = [
    { value: days, label: "Hari" },
    { value: hours, label: "Jam" },
    { value: minutes, label: "Menit" },
    { value: seconds, label: "Detik" },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map(({ value, label }, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="bg-bg-card border border-primary/20 rounded-lg px-3 py-2 min-w-12.5 text-center">
              <span className="font-mono font-bold text-xl text-text-primary">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-xs text-text-muted mt-1">{label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="font-bold text-text-muted text-xl pb-5">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
