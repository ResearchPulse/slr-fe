import React from "react";
import { FiFileText } from "react-icons/fi";

interface PaperNodeListProps {
  nodes: any[];
  isLoading: boolean;
  emptyLabel: string;
}

export const PaperNodeList: React.FC<PaperNodeListProps> = ({
  nodes,
  isLoading,
  emptyLabel,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-bg-secondary rounded-xl animate-pulse border border-border"
          />
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="py-12 text-center">
        <FiFileText className="w-10 h-10 text-slate-100 mx-auto mb-3" />
        <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">
          {emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="p-4 rounded-xl bg-bg-secondary border border-border hover:bg-surface-white hover:border-accent hover:shadow-none transition-all group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-black text-slate-800 group-hover:text-accent line-clamp-1 transition-colors">
              {node.title}
            </h4>
            {/* <span className="shrink-0 ml-4 px-2 py-0.5 rounded-xl bg-surface-white border border-border text-[10px] font-black text-text-secondary uppercase tracking-tighter">
              {node.citationCount} CIT
            </span> */}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <span className="truncate max-w-[200px]">
              {node.authors ?? "Unknown"}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>{node.year}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
