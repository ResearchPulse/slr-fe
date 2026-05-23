import React from "react";
import { FiExternalLink, FiFileText } from "react-icons/fi";

export interface PaperDetails {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  citationCount?: number;
  referenceCount?: number;
}

interface PaperDetailsPanelProps {
  paper: PaperDetails;
}

const PaperDetailsPanel: React.FC<PaperDetailsPanelProps> = ({ paper }) => {
  // Split authors by comma or semicolon and clean up
  const authorList = paper.authors
    ? paper.authors
        .split(/[;,]/)
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="flex flex-col h-full bg-surface-white text-text-primary border-l border-border shadow-none animate-in slide-in-from-right duration-300">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        {/* Header Section: Title & Year */}
        <header className="space-y-2">
          <div className="group">
            <h2 className="text-base font-bold leading-snug text-text-primary line-clamp-3 hover:text-blue-600 transition-colors cursor-pointer group-hover:underline decoration-blue-400 underline-offset-4 decoration-2">
              {paper.title}
              {paper.year && (
                <span className="ml-2 text-text-secondary font-medium no-underline inline-block">
                  ({paper.year})
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-blue-500/80">
            <FiExternalLink className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Open Source
            </span>
          </div>
        </header>

        {/* Authors Section */}
        {authorList.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">
              Authors
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {authorList.map((author, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-50/50 text-blue-700 rounded-md text-[11px] font-medium border border-blue-100/50"
                >
                  {author}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* DOI Section */}
        {paper.doi && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">
              DOI
            </h3>
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate block"
            >
              {paper.doi}
            </a>
          </div>
        )}

        {/* Abstract Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FiFileText className="w-3 h-3 text-text-secondary" />
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">
              Abstract
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-text-secondary line-clamp-[8] text-justify font-normal">
            {paper.abstract || "No abstract available for this paper."}
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-4 bg-bg-primary/50 border-t border-border flex items-center justify-between">
        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic">
          LITMAPS STYLE VISUALIZER
        </span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        </div>
      </div>
    </div>
  );
};

export default PaperDetailsPanel;
