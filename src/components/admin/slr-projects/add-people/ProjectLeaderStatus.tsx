import { FiShield, FiAlertTriangle } from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import type { ResolvedLeader } from "../../../../utils/projectUtils";

interface ProjectLeaderStatusProps {
  currentLeader: ResolvedLeader | null;
  onReplaceClick: () => void;
  getInitials: (name: string) => string;
}

export default function ProjectLeaderStatus({
  currentLeader,
  onReplaceClick,
  getInitials,
}: ProjectLeaderStatusProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-white px-4 py-3 shadow-none">
      {currentLeader ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Title & Leader Info in a single line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FiShield className="shrink-0 text-primary" size={16} />
              <h6 className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-text-primary">
                Project Leadership:
              </h6>
            </div>
            
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-bg-secondary px-2.5 py-1.5 sm:flex-initial">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {getInitials(currentLeader.user.fullName)}
              </div>
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="truncate text-xs font-extrabold tracking-tight text-text-primary">
                    {currentLeader.user.fullName}
                  </p>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-center text-[7px] font-black uppercase tracking-widest whitespace-nowrap shrink-0",
                      currentLeader.type === "Accepted"
                        ? "border border-success/20 bg-success/10 text-success"
                        : "border border-warning/20 bg-warning/10 text-warning",
                    )}
                  >
                    {currentLeader.type === "Accepted" ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="hidden h-1 w-1 rounded-full bg-border sm:block" />
                <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-text-secondary">
                  <span className="truncate max-w-[150px]">@{currentLeader.user.userName}</span>
                  <span className="font-normal text-text-secondary">|</span>
                  <span className="truncate max-w-[200px]">{currentLeader.user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Replace Button */}
          <button
            type="button"
            onClick={onReplaceClick}
            className="min-h-11 shrink-0 rounded-xl bg-bg-secondary px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 sm:text-right"
          >
            Replace
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Title */}
          <div className="flex items-center gap-2">
            <FiShield className="shrink-0 text-text-secondary" size={16} />
            <h6 className="text-[10px] font-black uppercase tracking-widest text-text-primary">
              Project Leadership
            </h6>
          </div>

          {/* Right: Inline Alert Message */}
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-1.5 text-warning">
            <FiAlertTriangle size={14} className="shrink-0 text-warning" />
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
              Requires leader for oversight
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
