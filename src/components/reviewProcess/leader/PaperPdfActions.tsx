import React, { useState } from "react";
import { FiPaperclip, FiFileText, FiDownload, FiLoader, FiTrash2 } from "react-icons/fi";
import { useSignalRSubscription } from "../../../hooks/useSignalR";
import toast from "react-hot-toast";
import type { MetadataExtractedPayload } from "../../../types/signalr";
import UploadFullTextPdfModal from "../../../pages/reviewProcess/studySelection/components/UploadFullTextPdfModal";
import MetadataSuggestionModal from "../../../pages/reviewProcess/studySelection/components/MetadataSuggestionModal";
import type { PaperDetailsResponse } from "../../../types/paper";
import type { UploadPdfOptions } from "../../../pages/reviewProcess/studySelection/uploadTypes";
import { type PaperWithDecisionsResponse } from "../../../types/studySelection";
import { cn } from "../../../utils/cn";
import { Modal } from "../../ui/Modal";
import { usePaperDetails } from "../../../hooks/usePaperDetails";

interface PaperPdfActionsProps {
  paper: PaperDetailsResponse;
  onUploadPdf?: (
    paperId: string,
    file: File,
    options?: UploadPdfOptions,
  ) => Promise<PaperWithDecisionsResponse>;
  isUploadingPdf?: boolean;
  onApplyMetadataSuggestion?: (
    paperId: string,
    sourceMetadataId: string,
    fields: string[],
  ) => Promise<void>;
  isApplyingMetadataSuggestion?: boolean;
  onRemovePdf?: (paperId: string) => Promise<void>;
  isRemovingPdf?: boolean;
  pdfRequired?: boolean;
  studySelectionProcessId?: string;
  isLeader?: boolean;
  canUploadPdf?: boolean;
  compact?: boolean;
}

const PaperPdfActions: React.FC<PaperPdfActionsProps> = ({
  paper,
  onUploadPdf,
  isUploadingPdf,
  onApplyMetadataSuggestion,
  isApplyingMetadataSuggestion,
  onRemovePdf,
  isRemovingPdf,
  pdfRequired = false,
  isLeader = false,
  canUploadPdf = false,
  compact = false,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConfirmNotRetrievedOpen, setIsConfirmNotRetrievedOpen] =
    useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<any | null>(null);
  const [hasReceivedSignalRUpdate, setHasReceivedSignalRUpdate] =
    useState(false);

  const { data: refreshedPaper } = usePaperDetails(
    activeSuggestion || isUploadModalOpen || hasReceivedSignalRUpdate
      ? paper.id
      : undefined,
  );
  const displayPaper = refreshedPaper || paper;
  const hasPdf = !!paper.pdfUrl;
  const isActionDisabled = !onRemovePdf || isRemovingPdf || !hasPdf;
  const isPending = isRemovingPdf;

  useSignalRSubscription(
    "OnMetadataExtracted",
    (payload: MetadataExtractedPayload) => {
      console.log(
        `[SignalR] Received OnMetadataExtracted for paper: ${payload.paperId}`,
      );
      if (payload.paperId === paper.id) {
        // Immediately trigger detail fetch to ensure comparison is accurate when modal opens
        setHasReceivedSignalRUpdate(true);
        toast(
          (t) => (
            <div className="flex flex-col gap-1 min-w-[280px]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <p className="text-sm font-semibold text-text-primary uppercase tracking-wider text-[10px]">
                  AI Assistant
                </p>
              </div>
              <div className="mt-1">
                <p className="text-sm font-bold text-text-primary leading-tight">
                  Metadata extracted
                </p>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  Completed for:{" "}
                  <span className="text-text-primary font-medium italic">
                    "{paper.title}"
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveSuggestion(payload.suggestion);
                  toast.dismiss(t.id);
                }}
                className="mt-3 min-h-11 w-full rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-none transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
              >
                Review & Apply Suggestions
              </button>
            </div>
          ),
          {
            duration: 12000,
            position: "bottom-right",
            style: {
              borderRadius: "12px",
              background: "#fff",
              padding: "20px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 4px 8px rgb(18 35 49 / 0.12)",
            },
          },
        );
      }
    },
  );

  const handleUploadSubmit = async (file: File, options: UploadPdfOptions) => {
    if (!onUploadPdf) return;
    try {
      await onUploadPdf(paper.id, file, options);
      setIsUploadModalOpen(false);
      // Logic for showing suggestions is now handled by SignalR listener
    } catch (error) {
      console.error("Failed to upload PDF:", error);
    }
  };

  const handleApplySuggestion = async (selectedFields: string[]) => {
    if (!onApplyMetadataSuggestion || !activeSuggestion) return;
    try {
      await onApplyMetadataSuggestion(
        paper.id,
        activeSuggestion.sourceMetadataId,
        selectedFields,
      );
      setActiveSuggestion(null);
    } catch (error) {
      console.error("Failed to apply metadata:", error);
    }
  };

  const handleRemovePdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActionDisabled) return;
    setIsConfirmNotRetrievedOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!onRemovePdf) return;

    try {
      await onRemovePdf(paper.id);
      setIsConfirmNotRetrievedOpen(false);
    } catch (error) {
      console.error("Failed to remove PDF:", error);
    }
  };

  return (
    <div className={cn("flex items-center", compact ? "w-max flex-nowrap gap-0.5" : "flex-wrap gap-1.5")}>
      {(isLeader || canUploadPdf) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsUploadModalOpen(true);
          }}
          disabled={!onUploadPdf || isUploadingPdf}
          aria-label={
            !paper.pdfUrl && pdfRequired
              ? "Upload required PDF"
              : paper.pdfUrl
                ? "Replace PDF"
                : "Attach PDF"
          }
          aria-busy={isUploadingPdf}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none",
            compact && "lg:min-h-8 lg:min-w-8",
            !paper.pdfUrl
              ? "text-warning bg-warning/10 border-warning/20 hover:bg-warning/15 shadow-none"
              : "text-text-secondary hover:text-accent hover:bg-primary-light border-transparent hover:border-primary/30",
            (!onUploadPdf || isUploadingPdf) && "opacity-50 cursor-not-allowed",
          )}
          title={
            !paper.pdfUrl && pdfRequired
              ? "PDF Missing - Upload required before assignment"
              : "Attach PDF"
          }
        >
          <FiPaperclip
            aria-hidden="true"
            className={cn(
              "w-4 h-4",
              isUploadingPdf && "motion-safe:animate-spin motion-reduce:animate-none",
            )}
          />
        </button>
      )}

      {paper.pdfUrl && (
        <>
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open PDF"
            className={cn("inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-transparent text-text-secondary transition-colors hover:border-primary/30 hover:bg-primary-light hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none", compact && "lg:min-h-8 lg:min-w-8")}
            title="Open PDF"
          >
            <FiFileText aria-hidden="true" className="w-4 h-4" />
          </a>
          <a
            href={paper.pdfUrl}
            {...((paper as any).pdfFileName
              ? { download: (paper as any).pdfFileName }
              : {})}
            onClick={(e) => e.stopPropagation()}
            aria-label="Download PDF"
            className={cn("inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-transparent text-text-secondary transition-colors hover:border-primary/30 hover:bg-primary-light hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none", compact && "lg:min-h-8 lg:min-w-8")}
            title="Download PDF"
          >
            <FiDownload aria-hidden="true" className="w-4 h-4" />
          </a>
        </>
      )}

      {isLeader && hasPdf && (
          <button
            onClick={handleRemovePdf}
            disabled={isActionDisabled}
            aria-label={isPending ? "Removing PDF" : "Remove PDF"}
            aria-busy={isPending}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 motion-reduce:transition-none",
              compact && "lg:min-h-8 lg:min-w-8",
              "text-text-secondary hover:text-error hover:bg-surface-white border-transparent hover:border-error/20",
              isActionDisabled && "opacity-50 cursor-not-allowed",
            )}
            title="Remove PDF"
          >
            {isPending ? (
              <FiLoader aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" />
            ) : (
              <FiTrash2 aria-hidden="true" className="w-4 h-4" />
            )}
          </button>
      )}

      {isUploadModalOpen && (
        <UploadFullTextPdfModal
          isOpen={isUploadModalOpen}
          isUploading={isUploadingPdf || false}
          paper={{
            title: paper.title,
            authors: paper.authors ?? "",
            doi: paper.doi ?? "",
            abstract: paper.abstract ?? "",
            journal: paper.journal ?? "",
          }}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUploadSubmit}
        />
      )}

      {activeSuggestion && (
        <MetadataSuggestionModal
          isOpen={!!activeSuggestion}
          isApplying={isApplyingMetadataSuggestion || false}
          currentMetadata={{
            title: displayPaper.title,
            authors: displayPaper.authors ?? "",
            abstract: displayPaper.abstract ?? "",
            doi: displayPaper.doi ?? "",
            journal: displayPaper.journal ?? "",
            volume: displayPaper.volume ?? "",
            issue: displayPaper.issue ?? "",
            pages: displayPaper.pages ?? "",
            keywords: displayPaper.keywords ?? "",
            year: displayPaper.publicationYear,
            issn: displayPaper.journalIssn ?? "",
            eissn: displayPaper.journalEIssn ?? "",
            language: displayPaper.language ?? "",
            md5: displayPaper.md5 ?? "",
            publisher: displayPaper.publisher ?? "",
          }}
          suggestion={activeSuggestion}
          onApply={handleApplySuggestion}
          onClose={() => setActiveSuggestion(null)}
        />
      )}

      <Modal
        isOpen={isConfirmNotRetrievedOpen}
        onClose={() => setIsConfirmNotRetrievedOpen(false)}
        title="Remove PDF"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to remove the PDF attachment for this paper?
            This action cannot be undone.
          </p>
          <p className="text-xs text-text-secondary">
            Title:{" "}
            <span className="font-medium text-text-primary">{paper.title}</span>
          </p>
          <p className="rounded-xl border border-warning/20 bg-warning/10 p-2 text-[10px] italic text-warning">
            Note: This will clear the PDF metadata and delete the file from the
            server.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmNotRetrievedOpen(false)}
              disabled={isPending}
              className="min-h-11 rounded-xl border border-border px-4 text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 motion-reduce:transition-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isPending}
              className="min-h-11 rounded-xl bg-error px-4 text-white font-semibold transition-colors hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50 motion-reduce:transition-none"
            >
              {isPending ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaperPdfActions;
