import React from "react";
import { FiLink } from "react-icons/fi";
import ReferenceExtractionButton from "./ReferenceExtractionButton";

interface ReferenceExtractionPanelProps {
  paperId: string;
  hasPdf: boolean;
}

const ReferenceExtractionPanel: React.FC<ReferenceExtractionPanelProps> = ({
  paperId,
  hasPdf,
}) => {
  return (
    <section className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        <FiLink className="w-3.5 h-3.5" />
        References Extraction
      </h3>

      <div className="rounded-xl border border-border bg-bg-secondary/50 p-4">
        {!hasPdf ? (
          <p className="text-sm text-text-secondary">
            No PDF available. Upload a full-text PDF to enable reference
            extraction.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="max-w-md text-sm text-text-primary">
              Extract references from this paper's full-text PDF to discover
              additional studies via backward snowballing.
            </p>
            <ReferenceExtractionButton
              paperId={paperId}
              hasPdf={hasPdf}
              variant="panel"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ReferenceExtractionPanel;
