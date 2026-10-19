import {
  FiCheckCircle,
  FiClock,
  FiPlayCircle,
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
    return <FiCheckCircle className="h-4 w-4 text-success" />;
  if (statusText === "InProgress")
    return <FiPlayCircle className="h-4 w-4 text-accent" />;
  if (statusText === "Cancelled")
    return <FiXCircle className="h-4 w-4 text-error" />;
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
      className={`group relative rounded-xl border border-border p-4 transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none ${
        isSelected
          ? "border-accent bg-bg-secondary shadow-sm"
          : "border-border bg-surface-white hover:border-accent hover:shadow-sm"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
              isSelected
                ? "bg-accent text-surface-white"
                : "bg-surface-white border border-border text-accent"
            }`}
          >
            <FiUsers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
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
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="px-2 py-0.5 bg-surface-white text-text-primary rounded-xl text-[8px] font-bold uppercase tracking-widest border border-border shadow-sm">
            Independent
          </span>
          {onNavigate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(process.processId);
              }}
              className="relative z-30 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-white text-accent shadow-sm transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              aria-label={`Open ${process.processName} review workspace`}
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
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${process.progressPercent}%` }}
          />
        </div>
        <p className="text-[8px] font-bold text-text-secondary uppercase tracking-tight mt-2 italic text-center">
          Uses its own inclusion criteria
        </p>
      </div>

      {actionLabel && isLeader && (
        <button
          type="button"
          onClick={() => onSelect(process.processId)}
          aria-pressed={isSelected}
          className={`mt-4 min-h-11 w-full rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 motion-reduce:transition-none ${
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
          type="button"
          onClick={() => onSelect(process.processId)}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-xl opacity-0 focus-visible:bg-accent/5 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
          aria-label="Select process"
          aria-pressed={isSelected}
        />
      )}
    </div>
  );
}
