import { cn } from "@/lib/utils";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "error" | "primary";
  subtitle?: string;
}

const variantStyles = {
  default: {
    icon: "bg-bg-muted text-text-secondary border-primary/20",
    glow: "rgba(148,163,184,0.1)",
  },
  primary: {
    icon: "bg-primary/15 text-primary border-primary/20",
    glow: "rgba(99,102,241,0.15)",
  },
  success: {
    icon: "bg-success/15 text-success border-success/20",
    glow: "rgba(16,185,129,0.12)",
  },
  warning: {
    icon: "bg-warning/15 text-warning border-warning/20",
    glow: "rgba(245,158,11,0.12)",
  },
  error: {
    icon: "bg-error/15 text-error border-error/20",
    glow: "rgba(239,68,68,0.12)",
  },
};

export function StatsCard({ title, value, icon, trend, variant = "default", subtitle }: StatsCardProps) {
  const styles = variantStyles[variant];
  const isPositive = trend ? trend.value > 0 : null;

  return (
    <div
      className="relative glass-card rounded-2xl p-5 overflow-hidden group hover:border-primary/20 transition-all duration-300"
      style={{
        background: `radial-gradient(circle at 90% 10%, ${styles.glow} 0%, transparent 60%)`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-bold font-display text-text-primary">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl border", styles.icon)}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs">
          {isPositive === null ? (
            <MinusIcon className="w-3.5 h-3.5 text-text-muted" />
          ) : isPositive ? (
            <TrendingUpIcon className="w-3.5 h-3.5 text-success" />
          ) : (
            <TrendingDownIcon className="w-3.5 h-3.5 text-error" />
          )}
          <span className={cn("font-medium", isPositive ? "text-success" : isPositive === false ? "text-error" : "text-text-muted")}>
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
