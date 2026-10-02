import React, { memo, useMemo, useCallback } from "react";
import {
  FiCopy,
  FiExternalLink,
  FiTag,
  FiDatabase,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";

import PaperAbstractSection from "../../../../components/papers/PaperAbstractSection";
import PaperMetadataGrid from "../../../../components/papers/PaperMetadataGrid";
import type { WorkspaceQAPaper } from "../QualityAssessmentWorkspace";

// ============================================
// Props
// ============================================

interface QAPaperDetailsProps {
  paper: WorkspaceQAPaper;
}

// ============================================
// Keywords Component
// ============================================

const PaperKeywords = memo(({ keywords }: { keywords?: string | null }) => {
  const tags = useMemo(() => {
    if (!keywords) return [];
    return keywords
      .split(/[;,]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }, [keywords]);

  if (tags.length === 0) return null;

  return (
    <section className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
        <FiTag className="w-3.5 h-3.5" />
        Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center rounded-full border border-primary/15 bg-primary-light px-2.5 py-1 text-xs font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
});
PaperKeywords.displayName = "PaperKeywords";

// ============================================
// Header Section
// ============================================

const PaperHeader = memo(({ paper }: { paper: WorkspaceQAPaper }) => {
  const handleCopyDoi = useCallback(() => {
    if (paper.doi) {
      navigator.clipboard.writeText(paper.doi).then(
        () => toast.success("DOI copied to clipboard"),
        () => toast.error("Failed to copy DOI"),
      );
    }
  }, [paper.doi]);

  return (
    <header className="mb-6 border-b border-border pb-6">
      {/* Title */}
      <h2 className="mb-3 text-xl font-semibold leading-snug text-text-primary wrap-break-word sm:text-2xl">
        {paper.title}
      </h2>

      {/* Authors */}
      {paper.authors && (
        <p className="mb-4 flex items-start gap-2 text-sm leading-6 text-text-secondary">
          <FiUser className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
          <span className="wrap-break-word">{paper.authors}</span>
        </p>
      )}

      {/* Badges Row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {paper.publicationYear && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
            <FiCalendar className="w-3 h-3" />
            {paper.publicationYear}
          </span>
        )}
        {paper.publicationType && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
            {paper.publicationType}
          </span>
        )}
        {paper.source && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-primary px-2.5 py-1 text-xs font-medium text-text-secondary">
            <FiDatabase className="w-3 h-3" />
            {paper.source}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {paper.doi && (
          <button
            onClick={handleCopyDoi}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-white px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-primary"
            title={`Copy DOI: ${paper.doi}`}
          >
            <FiCopy className="w-3.5 h-3.5" />
            Copy DOI
          </button>
        )}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary-light px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Open DOI
          </a>
        )}
        {paper.url && !paper.doi && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary-light px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Open URL
          </a>
        )}
      </div>
    </header>
  );
});
PaperHeader.displayName = "PaperHeader";

// ============================================
// Main Content
// ============================================

const QAPaperDetails: React.FC<QAPaperDetailsProps> = ({ paper }) => {
  return (
    <div className="bg-surface-white">
      <PaperHeader paper={paper} />
      <PaperAbstractSection abstract={paper.abstract} />
      {/* Fallback type to any since PaperResponse differs slightly from WorkspaceQAPaper but contains the matched fields */}
      <PaperMetadataGrid paper={paper as any} />
      <PaperKeywords keywords={paper.keywords} />
    </div>
  );
};

export default memo(QAPaperDetails);
