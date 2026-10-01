import React from "react";
import { FiDatabase, FiCalendar, FiBook, FiExternalLink } from "react-icons/fi";
import { Sparkles } from "lucide-react";

import { StatusBadge } from "./StatusBadge";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";
import { formatAuthors } from "../../../../../utils/formatAuthors";

interface PaperHeroHeaderProps {
  paper: ScreeningPaper;
  isLeaderView: boolean;
  isFieldUpdated: (f: string) => boolean;
}

export const PaperHeroHeader: React.FC<PaperHeroHeaderProps> = ({
  paper,
  isLeaderView,
  isFieldUpdated,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#dce6ed] bg-white p-5 shadow-sm lg:p-6">
      {/* Background Decor */}
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-50/70 transition-transform duration-700 group-hover:scale-110" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {!isLeaderView && <StatusBadge paper={paper} />}
          {paper.source && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-secondary text-text-secondary text-[10px] font-black uppercase tracking-widest border border-border">
              <FiDatabase className="w-3 h-3" />
              {paper.source}
            </span>
          )}
          {paper.publicationYear && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <FiCalendar className="w-3.5 h-3.5" />
              {paper.publicationYear}
            </span>
          )}
        </div>

        <h1 className="mb-3 max-w-5xl text-xl font-bold leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-blue-700 md:text-2xl">
          {paper.title}
        </h1>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              {formatAuthors(paper.authors) ?? "Unknown authors"}
            </p>
            {isFieldUpdated("Authors") && (
              <div className="group/spark relative flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.1em] rounded-[4px] opacity-0 group-hover/spark:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-none border border-white/10 backdrop-blur-md">
                  Suggested fields applied
                </div>
              </div>
            )}
          </div>

          {(paper.journal || paper.conferenceName) && (
            <div className="flex items-center gap-2 text-sm text-text-secondary font-bold">
              <FiBook className="w-4 h-4 shrink-0 text-text-secondary" />
              <span className="italic">
                {paper.journal || paper.conferenceName}
              </span>
            </div>
          )}

          {paper.doi && (
            <a
              href={`https://doi.org/${encodeURIComponent(paper.doi)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700 transition-colors hover:bg-blue-700 hover:text-white"
            >
              DOI: {paper.doi}
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
