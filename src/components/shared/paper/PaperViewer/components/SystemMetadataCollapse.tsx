import React, { useState } from "react";
import { FiDatabase, FiChevronUp, FiChevronDown } from "react-icons/fi";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";

interface SystemMetadataCollapseProps {
  paper: ScreeningPaper;
}

export const SystemMetadataCollapse: React.FC<SystemMetadataCollapseProps> = ({
  paper,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-bg-secondary/50 rounded-[4px] border border-border overflow-hidden shadow-none transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-200/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-surface-white border border-border flex items-center justify-center text-text-secondary">
            <FiDatabase className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em]">
            System Metadata
          </span>
        </div>
        {isOpen ? (
          <FiChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <FiChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                Internal ID
              </span>
              <p className="text-xs font-mono font-bold text-text-secondary">
                {paper.id}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                Source
              </span>
              <p className="text-xs font-bold text-slate-800">
                {paper.source || "Manual Entry"}
              </p>
            </div>
            <div className="col-span-full py-4 px-4 bg-surface-white/50 rounded-[4px] border border-border border-dashed">
              <p className="text-[10px] text-text-secondary font-medium text-center italic">
                System tracking data is primarily used for synchronization and
                conflict resolution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
