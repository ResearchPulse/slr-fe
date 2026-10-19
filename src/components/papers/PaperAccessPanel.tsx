import React, { memo, useState } from "react";
import {
  FiExternalLink,
  FiFileText,
  FiLock,
  FiUnlock,
  FiDatabase,
  FiClock,
  FiUser,
  FiUpload,
  FiEye,
} from "react-icons/fi";
import type { PaperResponse } from "../../types/paper";
import UploadFullTextPdfModal from "../../pages/reviewProcess/studySelection/components/UploadFullTextPdfModal";

interface PaperAccessPanelProps {
  paper: PaperResponse;
  onUploadPdf?: (
    paperId: string,
    file: File,
    options: Record<string, unknown>,
  ) => Promise<void>;
  isUploadingPdf?: boolean;
  onPreviewPdf?: (pdfUrl: string) => void;
}

/**
 * Access & Full Text panel + Import Provenance section.
 * Displays access type, full-text availability, PDF link,
 * and import audit metadata (source, importedAt, importedBy, createdAt).
 */
const PaperAccessPanel: React.FC<PaperAccessPanelProps> = ({
  paper,
  onUploadPdf,
  isUploadingPdf = false,
  onPreviewPdf,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [internalIsUploading, setInternalIsUploading] = useState(false);

  const isUploading = isUploadingPdf || internalIsUploading;
  const hasAccessInfo =
    paper.fullTextAvailable != null || paper.accessTypeText || paper.pdfUrl;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUploadSubmit = async (
    file: File,
    options: Record<string, unknown>,
  ) => {
    if (onUploadPdf) {
      try {
        await onUploadPdf(paper.id, file, options);
        setIsUploadModalOpen(false);
      } catch (error) {
        console.error("Failed to upload PDF", error);
      }
      return;
    }

    // Fallback if no handler provided
    setInternalIsUploading(true);
    try {
      console.log("Upload paper", paper.id, file, options);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setInternalIsUploading(false);
      setIsUploadModalOpen(false);
    }
  };

  return (
    <>
      {/* Access & Full Text Section */}
      {hasAccessInfo && (
        <section className="mb-6 min-w-0">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <FiFileText className="h-4 w-4 text-text-tertiary" />
            Access & Full Text
          </h3>
          <div className="min-w-0 rounded-xl border border-border bg-surface-white p-4 shadow-none">
            <div className="flex flex-wrap items-center gap-3">
              {/* Full text availability */}
              {paper.fullTextAvailable != null && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      paper.fullTextAvailable
                        ? "bg-success/10 text-success"
                        : "bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    {paper.fullTextAvailable ? (
                      <FiUnlock className="w-3 h-3" />
                    ) : (
                      <FiLock className="w-3 h-3" />
                    )}
                    {paper.fullTextAvailable
                      ? "Full Text Available"
                      : "No Full Text"}
                  </span>
                  {!paper.fullTextAvailable && (
                    <>
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface-white px-3 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        title="Upload PDF"
                      >
                        <FiUpload className="w-3.5 h-3.5" />
                        Upload PDF
                      </button>
                      {isUploadModalOpen && (
                        <UploadFullTextPdfModal
                          isOpen={isUploadModalOpen}
                          onClose={() => setIsUploadModalOpen(false)}
                          // @ts-expect-error Types mismatch due to strict any vs exact UploadPdfOptions
                          onSubmit={handleUploadSubmit}
                          isUploading={isUploading}
                          paper={{
                            title: paper.title,
                            authors: paper.authors ?? null,
                            doi: paper.doi ?? null,
                            abstract: paper.abstract ?? null,
                            journal: paper.journal ?? null,
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Access type */}
              {paper.accessTypeText && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                  {paper.accessTypeText}
                </span>
              )}

              {/* PDF link */}
              {paper.pdfUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface-white px-3 text-xs font-semibold text-accent transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
                  >
                    <FiExternalLink className="w-3 h-3" />
                    Open PDF
                  </a>
                  {onPreviewPdf && (
                    <button
                      onClick={() => onPreviewPdf(paper.pdfUrl!)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary-light px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
                      title="Preview PDF"
                    >
                      <FiEye className="w-3 h-3" />
                      Preview
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Import Provenance Section */}
      <section className="mb-6 min-w-0">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <FiDatabase className="h-4 w-4 text-text-tertiary" />
          Import Provenance
        </h3>
        <div className="min-w-0 rounded-xl border border-border bg-surface-white p-4 shadow-none">
          <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {paper.source && (
              <div className="flex min-w-0 items-center gap-2">
                <FiDatabase className="h-4 w-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Source
                  </p>
                  <p className="break-words text-xs text-text-primary">{paper.source}</p>
                </div>
              </div>
            )}

            {paper.importedAt && (
              <div className="flex min-w-0 items-center gap-2">
                <FiClock className="h-4 w-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Imported At
                  </p>
                  <p className="break-words text-xs text-text-primary">
                    {formatDate(paper.importedAt)}
                  </p>
                </div>
              </div>
            )}

            {paper.importedBy && (
              <div className="flex min-w-0 items-center gap-2">
                <FiUser className="h-4 w-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Imported By
                  </p>
                  <p className="break-words text-xs text-text-primary">{paper.importedBy}</p>
                </div>
              </div>
            )}

            {paper.createdAt && (
              <div className="flex min-w-0 items-center gap-2">
                <FiClock className="h-4 w-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Created At
                  </p>
                  <p className="break-words text-xs text-text-primary">
                    {formatDate(paper.createdAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default memo(PaperAccessPanel);
