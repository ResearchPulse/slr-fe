import React from "react";
import { FileText, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import type { OriginPaperSummary } from "../../../mocks/snowballingMockData";

interface OriginPaperCardProps {
  paper: OriginPaperSummary;
  onClick: (id: string) => void;
}

const OriginPaperCard: React.FC<OriginPaperCardProps> = ({
  paper,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(paper.id)}
      className="group flex h-full w-full cursor-pointer flex-col rounded-xl border border-border bg-surface-white p-6 text-left transition-[border-color,box-shadow,transform] hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <FileText className="w-6 h-6 text-text-secondary group-hover:text-primary transition-colors" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
            Published
          </span>
          <span className="text-xs font-bold text-text-primary">
            {paper.year}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-black text-text-primary leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {paper.title}
        </h3>
        <p className="text-xs text-text-secondary font-medium mt-2 line-clamp-1">
          {paper.authors}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-6">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-tighter text-text-secondary mb-1">
            Refs
          </span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-text-primary">
              {paper.totalReferences}
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="mb-1 text-[9px] font-black uppercase tracking-tighter text-success">
            Logic
          </span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-success" />
            <span className="text-sm font-black text-success">
              {paper.suggestedCount}
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="mb-1 text-[9px] font-black uppercase tracking-tighter text-warning">
            Dups
          </span>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-warning" />
            <span className="text-sm font-black text-warning">
              {paper.duplicateCount}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex translate-x-[-10px] items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary opacity-0 transition-[opacity,transform] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transform-none motion-reduce:transition-none">
        Open Workspace
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};

export default OriginPaperCard;
