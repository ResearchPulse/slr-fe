import React from "react";
import { cn } from "../../../utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix,
  icon: Icon,
  color,
  loading,
}) => {
  return (
    <div
      className={cn(
        "flex h-full items-center rounded-xl border border-border bg-surface-white p-4 shadow-sm transition-colors duration-200 hover:border-primary/25",
        loading && "motion-safe:animate-pulse motion-reduce:animate-none",
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 12%, white)`,
            color,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-text-primary">
              {loading ? "..." : value}
            </span>
            {suffix && (
              <span className="text-xs font-semibold text-text-secondary">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
