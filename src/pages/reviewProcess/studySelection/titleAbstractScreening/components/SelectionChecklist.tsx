import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  FiCheck,
  FiX,
  FiClipboard,
  FiMaximize2,
  FiExternalLink,
  FiLoader,
} from "react-icons/fi";
import { studySelectionChecklistSubmissionService } from "../../../../../services/studySelectionChecklistSubmissionService";
import { PreviewDocument } from "../../../../../components/ui/document-editor/PreviewDocument";
import ConfirmModal from "../../../../../components/ui/ConfirmModal";
import Modal from "../../../../../components/ui/Modal";
import Button from "../../../../../components/ui/Button";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import type { RootState } from "../../../../../redux/store";
import type { ScreeningPaper } from "../types";
import type {
  StudySelectionChecklistSubmissionSection,
  CreateStudySelectionChecklistSubmissionRequest,
} from "../../../../../types/studySelectionChecklistSubmission";
import { cn } from "../../../../../utils/cn";
import { toastSuccess, toastError } from "../../../../../utils/toast";

interface SelectionChecklistProps {
  paper: ScreeningPaper | null;
  processId: string;
  onClose: () => void;
  phase?: number;
}

export default function SelectionChecklist({
  paper,
  processId,
  onClose,
  phase = 0,
}: SelectionChecklistProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [sections, setSections] = useState<
    StudySelectionChecklistSubmissionSection[]
  >([]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "selection-checklist-context",
      processId,
      paper?.id,
      currentUser?.id,
      phase,
    ],
    queryFn: () =>
      studySelectionChecklistSubmissionService.getContext({
        processId,
        paperId: paper!.id,
        reviewerId: currentUser!.id,
        phase,
      }),
    enabled: !!paper && !!currentUser && !!processId,
  });

  const submitMutation = useMutation({
    mutationFn: (request: CreateStudySelectionChecklistSubmissionRequest) =>
      studySelectionChecklistSubmissionService.submit(request),
    onSuccess: (response) => {
      if (response.isSuccess) {
        toastSuccess(
          "Checklist Submitted",
          "The paper selection checklist has been successfully logged.",
        );
        queryClient.invalidateQueries({
          queryKey: [
            "selection-checklist-context",
            processId,
            paper?.id,
            currentUser?.id,
            phase,
          ],
        });
        setIsConfirmModalOpen(false);
        setIsModalOpen(false);
      } else {
        toastError(
          "Submission Failed",
          response.message || "Could not save checklist submission.",
        );
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message ||
        "An error occurred while submitting the checklist.";
      toastError("Error", errorMsg);
    },
  });

  // Reset auto-open flag when paper changes
  useEffect(() => {
    setHasAutoOpened(false);
  }, [paper?.id]);

  // Auto-open modal ONLY ONCE per paper
  useEffect(() => {
    if (data?.data && !hasAutoOpened) {
      setIsModalOpen(true);
      setHasAutoOpened(true);
      setSections(data.data.sections); // Initialize state
    }
  }, [data, hasAutoOpened]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onClose(); // Navigate back to AI tab
  };

  if (!paper) {
    return (
      <div className="flex flex-col h-full bg-surface-white border-l border-border">
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <FiClipboard aria-hidden="true" className="mb-3 h-8 w-8 text-text-tertiary" />
          <p className="text-sm text-text-secondary">
            Select a paper to view the checklist
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface-white border-l border-border">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border bg-bg-secondary text-text-tertiary">
          <FiClipboard aria-hidden="true" className="w-8 h-8" />
        </div>
        <h3 className="mb-2 text-sm font-bold text-text-primary">
          {error ? "Service Unavailable" : "No Checklist Found"}
        </h3>
        <p className="text-xs text-text-secondary max-w-[200px] leading-relaxed">
          {error
            ? "There was an error loading the checklist context. Please try again later."
            : "Wait for the leader to activate a checklist template for this screening phase."}
        </p>
      </div>
    );
  }

  const submission = data.data;

  // Map submission context to DocumentDraft structure for PreviewDocument
  const mappedDraft = {
    title: submission.name,
    paragraphs: submission.description
      ? [{ id: "desc", text: submission.description, order: 0 }]
      : [],
    sections: sections, // Use local state for interactivity
  };

  const toggleSection = (sectionId: string) => {
    if (!submission.isFromTemplate) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isChecked: !s.isChecked } : s,
      ),
    );
  };

  const toggleItem = (itemId: string) => {
    if (!submission.isFromTemplate) return;
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) =>
          i.id === itemId ? { ...i, isChecked: !i.isChecked } : i,
        ),
      })),
    );
  };

  const handleConfirm = () => {
    if (!paper || !currentUser || !data?.data) return;

    const finalSubmission: CreateStudySelectionChecklistSubmissionRequest = {
      studySelectionProcessId: processId,
      paperId: paper.id,
      reviewerId: currentUser.id,
      phase,
      checklistTemplateId: data.data.checklistTemplateId,
      sectionAnswers: sections.map((s) => ({
        sectionId: s.id,
        isChecked: s.isChecked,
      })),
      itemAnswers: sections.flatMap((s) =>
        s.items.map((i) => ({
          itemId: i.id,
          isChecked: i.isChecked,
        })),
      ),
    };

    submitMutation.mutate(finalSubmission);
  };

  const renderStatusIndicator = (
    isChecked: boolean,
    label: string,
    onToggle: () => void,
  ) => (
    <button
      type="button"
      aria-label={`${label}: ${isChecked ? "meets criteria" : "does not meet criteria"}`}
      aria-pressed={isChecked}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={!submission.isFromTemplate}
      className={cn(
        "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border transition-[color,background-color,border-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 motion-reduce:transition-none",
        submission.isFromTemplate
          ? "cursor-pointer hover:-translate-y-px active:translate-y-0"
          : "cursor-default opacity-80",
        isChecked
          ? "border-success/30 bg-success/10 text-success"
          : "border-error/30 bg-error/10 text-error",
      )}
    >
      {isChecked ? (
        <FiCheck aria-hidden="true" className="h-4 w-4 stroke-[3]" />
      ) : (
        <FiX aria-hidden="true" className="h-4 w-4 stroke-[3]" />
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-l border-border overflow-hidden">
      {/* Sidebar Placeholder / Header */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 bg-primary-light text-accent rounded-xl flex items-center justify-center shadow-none">
          <FiClipboard className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary">Checklist Ready</h3>
          <p className="text-xs text-text-secondary max-w-[200px]">
            The screening checklist for "{paper.title.slice(0, 40)}..." is
            available.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="secondary"
        >
          <FiMaximize2 aria-hidden="true" className="w-4 h-4" />
          Expand Checklist
        </Button>
      </div>

      {/* Main Checklist Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Study Selection Checklist Submission"
        description="Verify if this paper meets all the protocol requirements defined in the review protocol."
        size="xl"
      >
        <div className="flex flex-col gap-6">
          <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-bg-secondary/50 p-3 custom-scrollbar sm:p-5">
            <PreviewDocument
              draft={mappedDraft as any}
              renderSectionTitle={(section) =>
                renderStatusIndicator(
                  !!section.isChecked,
                  `Section ${section.title || "checklist section"}`,
                  () => toggleSection(section.id),
                )
              }
              renderItem={(item) =>
                renderStatusIndicator(
                  !!item.isChecked,
                  item.text || "Checklist item",
                  () => toggleItem(item.id),
                )
              }
            />
          </div>

          <div className="mt-2 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
            {submission.isFromTemplate && (
              <>
                <Button
                  onClick={handleCloseModal}
                  variant="secondary"
                >
                  Close
                </Button>

                <Button
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={submitMutation.isPending}
                  aria-busy={submitMutation.isPending}
                  variant="success"
                >
                  {submitMutation.isPending ? (
                    <FiLoader
                      aria-hidden="true"
                      className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none"
                    />
                  ) : (
                    <FiExternalLink aria-hidden="true" className="w-4 h-4" />
                  )}
                  {submitMutation.isPending
                    ? "Submitting..."
                    : "Accept Submission"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        isLoading={submitMutation.isPending}
        title="Confirm Checklist Submission"
        message="By confirming, you acknowledge that you have reviewed the checklist and accept the results. This action will be logged."
        confirmText="Yes, Accept"
        cancelText="Cancel"
      />
    </div>
  );
}
