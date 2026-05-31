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
    <div className="bg-surface-white border border-slate-100 rounded-md py-3 px-4 shadow-none">
      {currentLeader ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Title & Leader Info in a single line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FiShield className="text-accent shrink-0" size={16} />
              <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-800 whitespace-nowrap">
                Project Leadership:
              </h6>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 flex-1 sm:flex-initial min-w-0">
              <div className="w-8 h-8 rounded-[4px] bg-accent text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {getInitials(currentLeader.user.fullName)}
              </div>
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate tracking-tight">
                    {currentLeader.user.fullName}
                  </p>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-[4px] text-center text-[7px] font-black uppercase tracking-widest whitespace-nowrap shrink-0",
                      currentLeader.type === "Accepted"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100",
                    )}
                  >
                    {currentLeader.type === "Accepted" ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-200" />
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 min-w-0">
                  <span className="truncate max-w-[150px]">@{currentLeader.user.userName}</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="truncate max-w-[200px]">{currentLeader.user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Replace Button */}
          <button
            onClick={onReplaceClick}
            className="text-[10px] font-black text-accent hover:text-indigo-800 transition-colors uppercase tracking-widest px-3 py-2 bg-bg-secondary hover:bg-slate-100 rounded-[4px] active:scale-95 shrink-0 text-center sm:text-right"
          >
            Replace
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Title */}
          <div className="flex items-center gap-2">
            <FiShield className="text-slate-400 shrink-0" size={16} />
            <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              Project Leadership
            </h6>
          </div>

          {/* Right: Inline Alert Message */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-md text-amber-800 shrink-0">
            <FiAlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
              Requires leader for oversight
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
