import { FiAlertTriangle, FiClock } from "react-icons/fi";
import { cn } from "../../../../../utils/cn";
import type { FullTextPaper } from "../types";

interface ConflictDetailsProps {
  paper: FullTextPaper;
}

export default function ConflictDetails({ paper }: ConflictDetailsProps) {
  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FiAlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-warning">
            Conflict Detected
          </h3>
        </div>

        {/* Reviewer Decisions */}
        <div className="space-y-3 mb-4">
          {paper.decisions.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-warning/20 bg-surface-white p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">
                  {d.reviewerName}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    d.decision === "included"
                      ? "bg-success/10 text-success"
                      : "bg-error/10 text-error",
                  )}
                >
                  {d.decision === "included" ? "Include" : "Exclude"}
                </span>
              </div>
              {d.reason && (
                <p className="text-xs text-text-secondary mt-1">
                  Reason: {d.reason}
                </p>
              )}
              <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
                <FiClock className="w-2.5 h-2.5" />
                {new Date(d.decidedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
