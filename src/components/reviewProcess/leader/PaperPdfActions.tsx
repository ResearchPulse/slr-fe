import React, { useState } from "react";
import { FiPaperclip, FiFileText, FiDownload, FiTrash2 } from "react-icons/fi";
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
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConfirmNotRetrievedOpen, setIsConfirmNotRetrievedOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<any | null>(null);
  const [hasReceivedSignalRUpdate, setHasReceivedSignalRUpdate] = useState(false);

  const { data: refreshedPaper } = usePaperDetails(
    activeSuggestion || isUploadModalOpen || hasReceivedSignalRUpdate ? paper.id : undefined,
  );
  const displayPaper = refreshedPaper || paper;
  const hasPdf = !!paper.pdfUrl;
  const isActionDisabled = !onRemovePdf || isRemovingPdf || !hasPdf;
  const isPending = isRemovingPdf;

  useSignalRSubscription("OnMetadataExtracted", (payload: MetadataExtractedPayload) => {
    console.log(`[SignalR] Received OnMetadataExtracted for paper: ${payload.paperId}`);
    if (payload.paperId === paper.id) {
      // Immediately trigger detail fetch to ensure comparison is accurate when modal opens
      setHasReceivedSignalRUpdate(true);
      toast(
        (t) => (
          <div className="flex flex-col gap-1 min-w-[280px]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <p className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-[10px]">
                AI Assistant
              </p>
            </div>
            <div className="mt-1">
              <p className="text-sm font-bold text-slate-800 leading-tight">Metadata extracted</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Completed for:{" "}
                <span className="text-slate-700 font-medium italic">"{paper.title}"</span>
              </p>
            </div>
            <button
              onClick={() => {
                setActiveSuggestion(payload.suggestion);
                toast.dismiss(t.id);
              }}
              className="mt-3 w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition-all shadow-md active:scale-[0.98]"
            >
              Review & Apply Suggestions
            </button>
          </div>
        ),
        {
          duration: 12000,
          position: "bottom-right",
          style: {
            borderRadius: "24px",
            background: "#fff",
            padding: "20px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          },
        },
      );
    }
  });

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
      await onApplyMetadataSuggestion(paper.id, activeSuggestion.sourceMetadataId, selectedFields);
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
    <div className="flex items-center gap-1.5">
      {isLeader && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsUploadModalOpen(true);
          }}
          disabled={!onUploadPdf || isUploadingPdf}
          className={cn(
            "p-1.5 rounded-lg transition-colors border",
            !paper.pdfUrl
              ? "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:text-amber-700 shadow-sm"
              : "text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-transparent hover:border-blue-100",
            (!onUploadPdf || isUploadingPdf) && "opacity-50 cursor-not-allowed",
          )}
          title={
            !paper.pdfUrl && pdfRequired
              ? "PDF Missing - Upload required before assignment"
              : "Attach PDF"
          }
        >
          <FiPaperclip className={cn("w-4 h-4", isUploadingPdf && "animate-spin")} />
        </button>
      )}

      {paper.pdfUrl && (
        <>
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            title="Open PDF"
          >
            <FiFileText className="w-4 h-4" />
          </a>
          <a
            href={paper.pdfUrl}
            {...((paper as any).pdfFileName ? { download: (paper as any).pdfFileName } : {})}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            title="Download PDF"
          >
            <FiDownload className="w-4 h-4" />
          </a>
        </>
      )}

      {isLeader && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleRemovePdf}
            disabled={isActionDisabled}
            className={cn(
              "p-1.5 rounded-lg transition-colors border",
              !hasPdf
                ? "text-slate-400 bg-slate-100 border-slate-200"
                : "text-gray-500 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-100",
              isActionDisabled && "opacity-50 cursor-not-allowed",
            )}
            title={hasPdf ? "Remove PDF" : "No PDF to remove"}
          >
            <FiTrash2 className={cn("w-4 h-4", isPending && "animate-spin")} />
          </button>
        </div>
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
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to remove the PDF attachment for this paper? This action cannot be
            undone.
          </p>
          <p className="text-xs text-slate-500">
            Title: <span className="font-medium text-slate-700">{paper.title}</span>
          </p>
          <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
            Note: This will clear the PDF metadata and delete the file from the server.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmNotRetrievedOpen(false)}
              disabled={isPending}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
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
