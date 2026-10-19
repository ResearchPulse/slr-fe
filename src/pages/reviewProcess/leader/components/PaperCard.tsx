import React from "react";
import { FiExternalLink } from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import type { PaperResponse } from "../../../../types/paper";

interface PaperCardProps {
  paper: PaperResponse;
  onViewDetails: (paper: PaperResponse) => void;
  onRemove?: (paperId: string) => void;
  className?: string;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  onViewDetails,
  className,
}) => {
  const mockTags = paper.keywords
    ? paper.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 3)
    : ["Research"];

  const displayAuthors = paper.authors
    ? paper.authors
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(", ")
    : "Unknown Authors";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-surface-white",
        "transition-[transform,border-color] duration-200 ease-out motion-reduce:transition-none",
        "motion-safe:hover:-translate-y-0.5 hover:border-primary/30",
        "cursor-pointer",
        className,
      )}
      onClick={() => onViewDetails(paper)}
    >
      <div className="p-5">
        {/* Title */}
        <h3 className="text-base font-semibold text-text-primary leading-snug line-clamp-2 mb-2 group-hover:text-accent transition-colors">
          {paper.title}
        </h3>

        {/* Authors & Year */}
        <p className="text-sm text-text-secondary mb-3">
          {displayAuthors}
          {paper.authors && paper.authors.split(",").length > 2 && " et al."}
          {paper.publicationYear && ` • ${paper.publicationYear}`}
        </p>

        {/* Abstract Preview */}
        {paper.abstract && (
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-4 opacity-80">
            {paper.abstract}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mockTags.map((tag) => {
            return (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-primary/15 bg-primary-light/50 px-2.5 py-0.5 text-[11px] font-medium text-accent"
              >
                #{tag}
              </span>
            );
          })}
        </div>

        {/* Footer: DOI & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {paper.doi ? (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-accent hover:text-primary-hover hover:underline truncate max-w-[140px] flex items-center gap-1"
            >
              <FiExternalLink className="w-3 h-3 shrink-0" />
              {paper.doi}
            </a>
          ) : paper.url ? (
            <a
              href={paper.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-accent hover:text-primary-hover hover:underline truncate max-w-[140px] flex items-center gap-1"
            >
              <FiExternalLink className="w-3 h-3 shrink-0" />
              View Source
            </a>
          ) : (
            <span className="text-xs text-text-secondary">No DOI</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperCard;
