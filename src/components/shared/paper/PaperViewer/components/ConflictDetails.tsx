import React from "react";
import { FiAlertTriangle, FiClock } from "react-icons/fi";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";
import { cn } from "../../../../../utils/cn";

interface ConflictDetailsProps {
  paper: ScreeningPaper;
}

export const ConflictDetails: React.FC<ConflictDetailsProps> = ({ paper }) => {
  return (
    <div className="space-y-4 rounded-xl border border-warning/20 bg-warning/10 p-6">
      <div className="flex items-center gap-2">
        <FiAlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="text-xs font-black uppercase tracking-widest text-warning">
          Conflict Detected
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paper.decisions.map((d) => (
          <div
            key={d.id}
            className="space-y-2 rounded-xl border border-warning/20 bg-surface-white p-4 shadow-none"
          >
            <div className="flex items-center justify-between">
              <span className="max-w-[120px] truncate text-xs font-black uppercase tracking-tight text-text-primary">
                {d.reviewerName}
              </span>
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                  d.decision === "included"
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-error/10 text-error border border-error/20",
                )}
              >
                {d.decision}
              </span>
            </div>
            {d.reason && (
              <p className="text-[11px] text-text-secondary font-medium italic leading-relaxed line-clamp-2">
                "{d.reason}"
              </p>
            )}
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-tighter flex items-center gap-1">
              <FiClock className="w-2.5 h-2.5" />{" "}
              {new Date(d.decidedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
