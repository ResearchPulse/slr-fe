import React from "react";
import { FiGitBranch } from "react-icons/fi";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";
import { cn } from "../../../../../utils/cn";

interface ResolutionDetailsProps {
  resolution: ScreeningPaper["resolution"];
}

export const ResolutionDetails: React.FC<ResolutionDetailsProps> = ({
  resolution,
}) => {
  if (!resolution) return null;
  const isIncluded = resolution.finalDecision === "included";
  return (
    <div
      className={cn(
        "rounded-xl border p-6 space-y-4",
        isIncluded
          ? "bg-success/10 border-success/20"
          : "bg-error/10 border-error/20",
      )}
    >
      <div className="flex items-center gap-2">
        <FiGitBranch
          className={cn(
            "w-4 h-4",
            isIncluded ? "text-success" : "text-error",
          )}
        />
        <h3
          className={cn(
            "text-xs font-black uppercase tracking-widest",
            isIncluded ? "text-success" : "text-error",
          )}
        >
          Final Resolution
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-4 text-[11px] font-bold uppercase tracking-widest">
        <div className="space-y-1">
          <span className="text-text-secondary">Decision</span>
          <p className={isIncluded ? "text-success" : "text-error"}>
            {resolution.finalDecision}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-text-secondary">Resolved By</span>
          <p className="text-text-primary">{resolution.resolverName}</p>
        </div>
      </div>
      {resolution.resolutionNotes && (
        <div className="pt-3 border-t border-black/5">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
            Notes
          </span>
          <p className="text-xs text-text-primary mt-1 font-medium italic">
            "{resolution.resolutionNotes}"
          </p>
        </div>
      )}
    </div>
  );
};
