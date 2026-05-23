import {
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiXCircle,
  FiExternalLink,
  FiUsers,
} from "react-icons/fi";
import type { ProcessSnapshot } from "./types";

interface ReviewProcessCardProps {
  process: ProcessSnapshot;
  isSelected: boolean;
  onSelect: (processId: string) => void;
  onNavigate?: (processId: string) => void;
  actionLabel?: string;
  className?: string;
  isLeader?: boolean;
}

export function ProcessStatusIcon({
  statusText,
}: {
  statusText: ProcessSnapshot["statusText"];
}) {
  if (statusText === "Completed")
    return <FiCheckCircle className="h-4 w-4 text-[#2d5a2d]" />;
  if (statusText === "InProgress")
    return <FiLoader className="h-4 w-4 text-accent animate-spin" />;
  if (statusText === "Cancelled")
    return <FiXCircle className="h-4 w-4 text-[#7a0000]" />;
  return <FiClock className="h-4 w-4 text-text-secondary" />;
}

export default function ReviewProcessCard({
  process,
  isSelected,
  onSelect,
  onNavigate,
  actionLabel,
  className = "",
  isLeader = false,
}: ReviewProcessCardProps) {
  return (
    <div
      className={`group relative rounded-[4px] border border-border p-4 transition-all duration-200 ${
        isSelected
          ? "border-accent bg-bg-secondary shadow-sm"
          : "border-border bg-surface-white hover:border-accent hover:shadow-sm"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-[4px] flex items-center justify-center transition-colors shadow-sm ${
              isSelected
                ? "bg-accent text-surface-white"
                : "bg-surface-white border border-border text-accent"
            }`}
          >
            <FiUsers className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-serif font-bold text-text-primary line-clamp-1">
              {process.processName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ProcessStatusIcon statusText={process.statusText} />
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                {process.statusText}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-2 py-0.5 bg-surface-white text-text-primary rounded-md text-[8px] font-bold uppercase tracking-widest border border-border shadow-sm">
            Independent
          </span>
          {onNavigate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(process.processId);
              }}
              className="relative z-30 p-2 rounded-[4px] text-accent bg-surface-white hover:bg-bg-secondary hover:text-accent transition-all shadow-sm border border-border"
              title="Go to review process workspace"
            >
              <FiExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-text-secondary">Completion</span>
          <span className="text-accent">{process.progressPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-1000"
            style={{ width: `${process.progressPercent}%` }}
          />
        </div>
        <p className="text-[8px] font-bold text-text-secondary uppercase tracking-tight mt-2 italic text-center">
          Uses its own inclusion criteria
        </p>
      </div>

      {actionLabel && isLeader && (
        <button
          onClick={() => onSelect(process.processId)}
          className={`w-full mt-4 py-2.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all ${
            isSelected
              ? "bg-accent text-surface-white shadow-sm"
              : "bg-surface-white border border-border text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          {actionLabel}
        </button>
      )}

      {!actionLabel && !isSelected && isLeader && (
        <button
          onClick={() => onSelect(process.processId)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
          aria-label="Select process"
        />
      )}
    </div>
  );
}
