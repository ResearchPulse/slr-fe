import React, { useState } from "react";
import { FiCheckCircle, FiLink, FiLoader } from "react-icons/fi";

import toast from "react-hot-toast";
import { useExtractReferences } from "../../hooks/useSnowballCandidates";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";

interface ReferenceExtractionButtonProps {
  paperId: string;
  hasPdf: boolean;
  variant?: "panel" | "icon";
  className?: string;
  onSuccess?: () => void;
}

const ReferenceExtractionButton: React.FC<ReferenceExtractionButtonProps> = ({
  paperId,
  hasPdf,
  variant = "panel",
  className,
  onSuccess,
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const extractReferencesMutation = useExtractReferences();
  const iconButtonLabel = extractReferencesMutation.isPending
    ? "Extracting references"
    : success
      ? "Reference extraction complete"
      : hasPdf
        ? "Extract references"
        : "No PDF available";

  const handleExtract = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click in table
    try {
      await extractReferencesMutation.mutateAsync(paperId);
      toast.success(
        "References extracted successfully. Candidates added to the Snowballing pool.",
      );
      setIsConfirmModalOpen(false);
      setSuccess(true);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to extract references. Please try again.",
      );
      setIsConfirmModalOpen(false);
    }
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasPdf) {
      toast.error("No PDF available for extraction.");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const renderModal = () => (
    <Modal
      isOpen={isConfirmModalOpen}
      onClose={() => setIsConfirmModalOpen(false)}
      title="Extract References"
      size="md"
    >
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          This will analyze the full-text PDF and extract references using
          GROBID.
          <br />
          <br />
          Detected references will be added to the Snowballing Candidate Pool.
          <br />
          Do you want to continue?
        </p>
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button
            variant="secondary"
            onClick={() => setIsConfirmModalOpen(false)}
            disabled={extractReferencesMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtract}
            disabled={extractReferencesMutation.isPending}
            aria-busy={extractReferencesMutation.isPending}
            className="flex items-center gap-2"
          >
            {extractReferencesMutation.isPending ? (
              <>
                <FiLoader aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin motion-reduce:animate-none" />
                Extracting...
              </>
            ) : (
              "Extract"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={handleOpenModal}
          disabled={!hasPdf || extractReferencesMutation.isPending || success}
          aria-label={iconButtonLabel}
          aria-busy={extractReferencesMutation.isPending}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none",
            success
              ? "text-success bg-success/10 border-success/20 cursor-default"
              : "text-text-secondary hover:text-accent hover:bg-surface-white hover:border-border",
            !hasPdf && "opacity-30 cursor-not-allowed",
            className,
          )}
          title={iconButtonLabel}
        >
          {extractReferencesMutation.isPending ? (
            <FiLoader aria-hidden="true" className="w-4 h-4 text-primary motion-safe:animate-spin motion-reduce:animate-none" />
          ) : success ? (
            <FiCheckCircle className="w-4 h-4 text-success" />
          ) : (
            <FiLink className="w-4 h-4" />
          )}
        </button>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
        {success ? (
          <div role="status" aria-live="polite" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-2 text-sm font-semibold text-success">
            <FiCheckCircle aria-hidden="true" className="h-4 w-4" />
            Extraction Complete
          </div>
        ) : (
          <Button
            onClick={handleOpenModal}
            disabled={extractReferencesMutation.isPending || !hasPdf}
            aria-busy={extractReferencesMutation.isPending}
            className={cn(
              "w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap",
              className,
            )}
          >
            {extractReferencesMutation.isPending ? (
              <>
                <FiLoader aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin motion-reduce:animate-none" />
                Extracting references...
              </>
            ) : (
              <>
                <FiLink className="w-4 h-4" />
                Extract References
              </>
            )}
          </Button>
        )}
      </div>
      {renderModal()}
    </>
  );
};

export default ReferenceExtractionButton;
