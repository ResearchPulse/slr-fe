import { AlertTriangle, X } from "lucide-react";
import Button from "../../../../components/ui/Button";

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
  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = () => {
    if (isConfirming) {
      return;
    }

    onClose();
  };

  const handleDialogClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-(--z-index-modal) flex items-center justify-center bg-slate-900/40 px-4 py-6"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface-white shadow-2xl"
        onClick={handleDialogClick}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">
                Confirmation
              </p>
              <h3 className="mt-1 text-xl font-semibold text-text-primary">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close confirmation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-bg-secondary px-6 py-4">
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
        </div>
      </div>
    </div>
  );
}
