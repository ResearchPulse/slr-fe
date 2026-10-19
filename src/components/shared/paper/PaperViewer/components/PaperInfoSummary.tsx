import React from "react";
import { FiExternalLink } from "react-icons/fi";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";
import { formatAuthors } from "../../../../../utils/formatAuthors";

interface PaperInfoSummaryProps {
  paper: ScreeningPaper;
}

interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
  mono?: boolean;
}

function InfoRow({ label, value, wide = false, mono = false }: InfoRowProps) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
        {label}
      </span>
      {hasValue ? (
        <div
          className={`break-words text-sm font-bold text-text-primary ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </div>
      ) : (
        <p className="text-sm font-medium italic text-text-secondary">N/A</p>
      )}
    </div>
  );
}

/**
 * Always-visible bibliographic summary for the Overview tab. Unlike the
 * detail cards, empty fields stay visible as "N/A" so users can see what a
 * paper is still missing.
 */
export const PaperInfoSummary: React.FC<PaperInfoSummaryProps> = ({ paper }) => {
  const venue = paper.journal || paper.conferenceName;

  return (
    <div className="rounded-xl border border-border bg-surface-white p-5 shadow-none md:p-6">
      <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-text-secondary">
        Paper Information
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <InfoRow label="Title" value={paper.title} wide />
        <InfoRow label="Authors" value={formatAuthors(paper.authors)} wide />
        <InfoRow
          label="DOI"
          value={
            paper.doi ? (
              <a
                href={`https://doi.org/${encodeURIComponent(paper.doi)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
              >
                {paper.doi}
                <FiExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : null
          }
          mono
        />
        <InfoRow label="Year" value={paper.publicationYear} />
        <InfoRow label="Journal / Conference" value={venue} />
        <InfoRow label="Source" value={paper.source} />
      </div>
    </div>
  );
};
