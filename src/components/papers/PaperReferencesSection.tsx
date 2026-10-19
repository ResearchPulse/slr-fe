import React from "react";
import { FiBookOpen, FiArrowRight } from "react-icons/fi";
import { Network } from "lucide-react";
import type { PaperResponse } from "../../types/paper";

interface PaperReferencesSectionProps {
  paper: PaperResponse;
}

const PaperReferencesSection: React.FC<PaperReferencesSectionProps> = ({
  paper,
}) => {
  // TODO: Use actual extracted references count from API query
  const extractedReferencesCount = 35;
  const isFullTextAvailable = paper.fullTextAvailable || paper.pdfUrl;

  if (!isFullTextAvailable) {
    return null;
  }

  return (
    <section className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        <FiBookOpen className="text-primary" />
        Extracted References
      </h3>

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-primary/15 bg-primary/5 p-4 sm:flex-row">
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <span className="font-semibold text-text-primary">
              Backward Snowballing
            </span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {extractedReferencesCount > 0
              ? `${extractedReferencesCount} references have been extracted from this paper.`
              : "No references have been extracted yet from the full-text PDF."}
          </p>
        </div>

        <div className="flex shrink-0 gap-2 w-full sm:w-auto">
          {extractedReferencesCount > 0 ? (
            <button className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none sm:flex-none">
              View Candidates
              <FiArrowRight />
            </button>
          ) : (
            <button className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-surface-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none sm:flex-none">
              Extract References
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PaperReferencesSection;
