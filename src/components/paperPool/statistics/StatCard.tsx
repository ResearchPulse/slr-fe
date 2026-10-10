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
        "bg-surface-white rounded-xl border border-border p-4 shadow-sm hover:shadow-sm transition-all duration-300",
        loading && "animate-pulse",
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-text-secondary font-semibold uppercase tracking-[0.12em] text-[10px] mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-text-primary">
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
