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
        "bg-surface-white rounded-2xl border border-border p-6 shadow-none hover:shadow-none transition-all duration-300",
        loading && "animate-pulse",
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-text-secondary font-black uppercase tracking-widest text-[10px] mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800">
              {loading ? "..." : value}
            </span>
            {suffix && (
              <span className="text-sm font-bold text-text-secondary">
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
