import { AlertTriangle } from "lucide-react";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  variant?: "danger" | "primary";
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  isConfirming = false,
  variant = "primary",
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isConfirming) onClose();
      }}
      closeOnOutsideClick={!isConfirming}
      closeOnEsc={!isConfirming}
      title={
        <span className="flex items-center gap-3">
          <span
            className={`rounded-xl p-2 ${
              variant === "danger"
                ? "bg-error/10 text-error"
                : "bg-warning/10 text-warning"
            }`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>{title}</span>
        </span>
      }
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={() => void onConfirm()}
            isLoading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
        Confirmation
      </p>
    </Modal>
  );
}
