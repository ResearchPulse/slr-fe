import type { ReactNode } from "react";
import { ArrowLeft, Download, FileCheck2 } from "lucide-react";
import Button from "../../../../components/ui/Button";

interface QAHeaderProps {
  onBack: () => void;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    pending: number;
    completionPercentage: number;
  };
  phaseStatus: string;
  rightControls?: ReactNode;
  onExport?: () => void;
}

export function QAHeader({
  onBack,
  stats,
  phaseStatus,
  rightControls,
  onExport,
}: QAHeaderProps) {
  const completedPercent = Math.round(stats.completionPercentage);
  const normalizedStatus = phaseStatus.toLowerCase();
  const statusLabel = normalizedStatus === "inprogress" ? "Active" : phaseStatus;
  const statusStyle =
    normalizedStatus === "inprogress"
      ? "bg-emerald-50 text-emerald-700"
      : normalizedStatus === "completed"
        ? "bg-primary-light text-accent"
        : "bg-bg-primary text-text-secondary";

  return (
    <header className="border-b border-border bg-surface-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:flex-1">
          <button
            onClick={onBack}
            className="shrink-0 rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-accent">
            <FileCheck2 size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-6 text-text-primary sm:text-xl">
              Quality Assessment
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-secondary">Phase 3</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span className="text-xs text-text-secondary">
                Methodological quality and bias risk
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pl-1 sm:pl-14 lg:pl-0">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-primary px-3 py-2 sm:gap-4">
            <div>
              <div className="text-[10px] font-medium text-text-secondary">Studies</div>
              <div className="mt-0.5 text-sm font-semibold text-text-primary">{stats.total}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="w-28 sm:w-36">
              <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-text-secondary">
                <span>Complete</span>
                <span className="text-text-primary">{completedPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${completedPercent}%` }}
                />
              </div>
            </div>
          </div>

          {onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              className="h-12 min-h-12 flex items-center gap-2 rounded-xl border-border bg-surface-white text-sm font-medium text-text-primary shadow-none transition-colors hover:bg-bg-primary hover:text-text-primary"
            >
              <Download size={16} className="text-text-secondary" />
              Export Excel
            </Button>
          )}
          {rightControls}
        </div>
      </div>
    </header>
  );
}
