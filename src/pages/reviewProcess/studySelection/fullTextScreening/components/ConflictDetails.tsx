import { FiAlertTriangle, FiClock } from "react-icons/fi";
import { cn } from "../../../../../utils/cn";
import type { FullTextPaper } from "../types";

interface ConflictDetailsProps {
  paper: FullTextPaper;
}

export default function ConflictDetails({ paper }: ConflictDetailsProps) {
  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center gap-2 mb-4">
          <FiAlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800">
            Conflict Detected
          </h3>
        </div>

        {/* Reviewer Decisions */}
        <div className="space-y-3 mb-4">
          {paper.decisions.map((d) => (
            <div
              key={d.id}
              className="bg-surface-white rounded-xl p-3 border border-amber-100"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">
                  {d.reviewerName}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    d.decision === "included"
                      ? "bg-surface-white text-green-700"
                      : "bg-surface-white text-red-700",
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
