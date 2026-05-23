import type { ReactNode } from "react";
import { ArrowLeft, Download, FileCheck2 } from "lucide-react";
import { cn } from "../../../../utils/cn";
import Button from "../../../../components/ui/Button";

interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
}

const STATUS_CONFIG = {
  pending: {
    bg: "bg-bg-secondary",
    text: "text-text-primary",
    dot: "bg-slate-500",
  },
  included: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  excluded: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  inProgress: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  notStarted: {
    bg: "bg-bg-secondary",
    text: "text-text-primary",
    dot: "bg-slate-500",
  },
};

function StatBadge({
  label,
  value,
  config,
}: {
  label: string;
  value: number;
  config: StatusStyle;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-[4px] transition-all border",
        config.bg,
        config.bg
          .replace("bg-", "border-")
          .replace("50", "200")
          .replace("100", "200"),
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn("w-1.5 h-1.5 rounded-full shadow-none", config.dot)}
        />
        <span className={cn("font-bold text-sm", config.text)}>{value}</span>
      </div>
      <div className="w-px h-3 bg-current opacity-20" />
      <span className={cn("text-xs font-medium opacity-80", config.text)}>
        {label}
      </span>
    </div>
  );
}

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
  rightControls?: ReactNode;
  onExport?: () => void;
  isLeader?: boolean;
}

export function QAHeader({
  onBack,
  stats,
  rightControls,
  onExport,
  isLeader,
}: QAHeaderProps) {
  const completedPercent = Math.round(stats.completionPercentage);

  return (
    <div className="bg-surface-white border-b border-border sticky top-0 z-20 shadow-none">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section: Back button & Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="p-2 h-10 w-10 text-text-secondary hover:text-text-primary border-border hover:bg-bg-secondary/50 transition-colors shadow-none"
              title="Back"
            >
              <ArrowLeft size={18} />
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[4px] flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-600 shadow-none">
                <FileCheck2 size={20} />
              </div>
              <div>
                <h1 className="text-base font-bold text-text-primary leading-tight">
                  Quality Assessment
                </h1>
                <p className="text-xs font-medium text-text-secondary">
                  Methodological quality and bias risk
                </p>
              </div>
            </div>
          </div>

          {/* Middle section: Stats & Progress */}
          <div className="flex items-center gap-6 bg-bg-secondary/50 p-2 rounded-[4px] border border-border">
            <div className="flex items-center gap-2">
              <StatBadge
                label="Total"
                value={stats.total}
                config={STATUS_CONFIG.pending}
              />
              {isLeader ? (
                <>
                  <StatBadge
                    label="Completed"
                    value={stats.completed}
                    config={STATUS_CONFIG.completed}
                  />
                  <StatBadge
                    label="In Progress"
                    value={stats.inProgress}
                    config={STATUS_CONFIG.inProgress}
                  />
                  <StatBadge
                    label="Not Started"
                    value={stats.notStarted}
                    config={STATUS_CONFIG.notStarted}
                  />
                </>
              ) : (
                <>
                  <StatBadge
                    label="Completed"
                    value={stats.completed}
                    config={STATUS_CONFIG.completed}
                  />
                  <StatBadge
                    label="Pending"
                    value={stats.pending}
                    config={STATUS_CONFIG.pending}
                  />
                </>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-3 pr-2">
              <div className="w-32 h-2.5 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-blue-500"
                  style={{ width: `${completedPercent}%` }}
                />
              </div>
              <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-100 shadow-none">
                {completedPercent}%
              </span>
            </div>
          </div>

          {/* Right section: Controls */}
          <div className="flex items-center gap-3">
            {onExport && (
              <Button
                variant="outline"
                onClick={onExport}
                className="flex items-center gap-2 border-border text-text-primary hover:bg-bg-secondary shadow-none hover:text-text-primary transition-colors bg-surface-white font-medium text-sm"
              >
                <Download size={16} className="text-text-secondary" />
                Export Excel
              </Button>
            )}
            {rightControls}
          </div>
        </div>
      </div>
    </div>
  );
}
