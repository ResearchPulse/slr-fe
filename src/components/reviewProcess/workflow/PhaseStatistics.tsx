import type { PhaseStatItem, PhaseStatusType } from "./types";

interface PhaseStatisticsProps {
  stats: PhaseStatItem[];
  status: PhaseStatusType;
}

const VARIANT_CLASSES: Record<string, string> = {
  default: "text-text-primary",
  success: "text-green-700",
  warning: "text-amber-700",
  danger: "text-red-700",
};

export default function PhaseStatistics({
  stats,
  status,
}: PhaseStatisticsProps) {
  if (stats.length === 0) return null;

  const isDisabled = status === "Locked";

  return (
    <div
      className={`grid grid-cols-2 gap-2 mt-3 ${isDisabled ? "opacity-40" : ""}`}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-bg-primary rounded-md px-2.5 py-2 border border-border"
        >
          <p className="text-[10px] text-text-secondary leading-tight mb-0.5">
            {stat.label}
          </p>
          <p
            className={`text-sm font-bold ${VARIANT_CLASSES[stat.variant ?? "default"]}`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
