import type { PhaseStatItem, PhaseStatusType } from "./types";

interface PhaseStatisticsProps {
  stats: PhaseStatItem[];
  status: PhaseStatusType;
}

const VALUE_TONE: Record<string, string> = {
  default: "text-text-primary",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-rose-700",
};

export default function PhaseStatistics({ stats }: PhaseStatisticsProps) {
  if (stats.length === 0) return null;

  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/70 pt-3">
      {stats.map((stat, index) => (
        <div key={`${stat.label}-${index}`} className="min-w-0">
          <dt className="truncate text-[11px] leading-4 text-text-secondary">{stat.label}</dt>
          <dd className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${VALUE_TONE[stat.variant ?? "default"]}`}>
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
