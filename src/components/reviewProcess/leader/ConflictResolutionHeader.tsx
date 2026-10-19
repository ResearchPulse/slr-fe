import React from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface ConflictResolutionHeaderProps {
  paperId: string;
  onBack: () => void;
}

const ConflictResolutionHeader: React.FC<ConflictResolutionHeaderProps> = ({
  paperId,
  onBack,
}) => {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface-white shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none group"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary group-hover:text-accent" />
        </button>
        <div className="h-8 w-px bg-bg-secondary mx-2" />
        <div>
          <h1 className="text-sm font-black text-text-primary uppercase tracking-widest">
            Conflict Resolution
          </h1>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tight">
            Paper ID: {paperId}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 bg-bg-primary px-4 py-2 rounded-xl">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
            Paper
          </span>
          <span className="text-xs font-black text-text-primary">2 of 10</span>
          <div className="flex gap-1 ml-2">
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-surface-white disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ConflictResolutionHeader;
