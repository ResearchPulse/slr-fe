import { FiShield } from "react-icons/fi";
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
    <div className="bg-surface-white border border-slate-100 rounded-[2rem] p-5 shadow-none">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <FiShield className="text-accent" size={16} />
          <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
            Project Leadership
          </h6>
        </div>
        {!currentLeader && (
          <span className="text-[9px] font-bold text-slate-400 italic">
            No leader assigned yet
          </span>
        )}
      </div>

      {currentLeader ? (
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-md border border-slate-100">
          <div className="w-10 h-10 rounded-[4px] bg-accent text-white flex items-center justify-center text-xs font-black shadow-none shadow-indigo-100">
            {getInitials(currentLeader.user.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-slate-900 truncate tracking-tight">
                {currentLeader.user.fullName}
              </p>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-[4px] text-center text-[8px] font-black uppercase tracking-widest",
                  currentLeader.type === "Accepted"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100",
                )}
              >
                {currentLeader.type === "Accepted"
                  ? "Active"
                  : "Pending Acceptance"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] font-bold text-slate-400 italic">
                @{currentLeader.user.userName}
              </p>
              <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <p className="text-[10px] font-medium text-slate-400 truncate">
                {currentLeader.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onReplaceClick}
            className="text-[10px] font-black text-accent hover:text-indigo-800 transition-colors uppercase tracking-widest px-3 py-1.5 hover:bg-surface-white rounded-[4px] active:scale-95"
          >
            Replace
          </button>
        </div>
      ) : (
        <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-md">
          <p className="text-xs font-bold text-slate-300">
            Requires one leader for oversight
          </p>
        </div>
      )}
    </div>
  );
}
