import {
  FiArrowRight,
  FiCheckCircle,
  FiCircle,
  FiActivity,
} from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import type { ScreeningStats } from "../titleAbstractScreening/types";

interface PhaseStatsProps {
  label: string;
  stats: ScreeningStats;
  isActive: boolean;
  onClick: () => void;
  color: "blue" | "indigo";
}

function PhaseCard({
  label,
  stats,
  isActive,
  onClick,
  color,
}: PhaseStatsProps) {
  const isBlue = color === "blue";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 p-2.5 rounded-[4px] border transition-all duration-200 text-center min-w-[200px]",
        isActive
          ? isBlue
            ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-100 shadow-none"
            : "border-indigo-200 bg-bg-secondary/50 ring-1 ring-indigo-100 shadow-none"
          : "border-border bg-surface-white hover:border-border hover:bg-bg-primary",
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            isActive
              ? isBlue
                ? "text-blue-700"
                : "text-indigo-700"
              : "text-text-secondary",
          )}
        >
          {label}
        </span>
        {isActive ? (
          <FiActivity
            className={cn(
              "w-3.5 h-3.5 animate-pulse",
              isBlue ? "text-blue-500" : "text-accent",
            )}
          />
        ) : stats.completionPercentage === 100 ? (
          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <FiCircle className="w-3.5 h-3.5 text-gray-300" />
        )}
      </div>
    </button>
  );
}

interface ScreeningPipelineHeaderProps {
  activePhase: "title-abstract" | "full-text";
  titleAbstractStats: ScreeningStats;
  fullTextStats: ScreeningStats;
  onNavigateToTitleAbstract: () => void;
  onNavigateToFullText: () => void;
}

export default function ScreeningPipelineHeader({
  activePhase,
  titleAbstractStats,
  fullTextStats,
  onNavigateToTitleAbstract,
  onNavigateToFullText,
}: ScreeningPipelineHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-4 w-full">
      <PhaseCard
        label="Title / Abstract"
        stats={titleAbstractStats}
        isActive={activePhase === "title-abstract"}
        onClick={onNavigateToTitleAbstract}
        color="blue"
      />

      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-px bg-bg-secondary" />
          <div className="bg-surface-white border border-border rounded-full p-1 shadow-none">
            <FiArrowRight className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="w-8 h-px bg-bg-secondary" />
        </div>
      </div>

      <PhaseCard
        label="Full-Text Review"
        stats={fullTextStats}
        isActive={activePhase === "full-text"}
        onClick={onNavigateToFullText}
        color="indigo"
      />
    </div>
  );
}
