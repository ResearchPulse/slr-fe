import React from "react";
import { Modal } from "../../../../../components/ui/Modal";
import { PreviewDocument } from "../../../../../components/ui/document-editor/PreviewDocument";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import { useStudySelectionTemplateDetail } from "../../../../../hooks/useStudySelectionChecklistTemplate";

interface ChecklistTemplateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  templateId: string | null;
}

export const ChecklistTemplateDetailModal: React.FC<
  ChecklistTemplateDetailModalProps
> = ({ isOpen, onClose, projectId, templateId }) => {
  const { data, isLoading, error } = useStudySelectionTemplateDetail(
    projectId,
    templateId || undefined,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Preview"
      description="Review the structure and criteria of the selected checklist version."
      size="xl"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary font-medium mt-4">
            Fetching template details...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-surface-white rounded-xl border border-error/20">
          <p className="text-error font-medium">
            Failed to load template details.
          </p>
        </div>
      ) : data?.data ? (
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-150 motion-reduce:animate-none">
          <PreviewDocument template={data.data} />
        </div>
      ) : (
        <div className="text-center py-10 text-text-secondary font-medium">
          No data available for this template.
        </div>
      )}
    </Modal>
  );
};
