import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { FiAlertTriangle, FiTrash2, FiFileText, FiTag } from "react-icons/fi";
import type { PaperPoolItem } from "./types";

interface DeletePaperModalProps {
  isOpen: boolean;
  paper: PaperPoolItem | null;
  onClose: () => void;
  onConfirm: (paperId: string, reason: string) => void;
  isLoading?: boolean;
}

const COMMON_REASONS = [
  "Duplicate study",
  "Out of scope / Irrelevant",
  "Corrupted or invalid document",
  "Incorrect metadata",
  "Other reason",
];

export const DeletePaperModal: React.FC<DeletePaperModalProps> = ({
  isOpen,
  paper,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(COMMON_REASONS[0]);
      setCustomReason("");
    }
  }, [isOpen]);

  if (!paper) return null;

  const handleConfirm = () => {
    const finalReason =
      selectedReason === "Other reason" && customReason.trim()
        ? customReason.trim()
        : selectedReason;
    onConfirm(paper.id, finalReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-error/20 bg-error/5 text-error">
            <FiTrash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Delete Paper</h3>
            <p className="mt-0.5 text-xs font-normal text-text-secondary">
              Permanently remove this paper from the repository
            </p>
          </div>
        </div>
      }
      size="sm"
    >
      <div className="space-y-5">
        {/* Paper Summary Card */}
        <div className="space-y-2.5 rounded-xl border border-border bg-bg-primary p-4">
          <div className="flex items-start gap-2.5">
            <FiFileText className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
            <div className="flex-1 min-w-0">
              <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                {paper.title}
              </h4>
              {paper.authors && (
                <p className="mt-1 truncate text-xs text-text-secondary">
                  {paper.authors}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
            {paper.year && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-white px-2 py-1 text-[11px] font-semibold text-text-secondary">
                Year: {paper.year}
              </span>
            )}
            {paper.doi && (
              <span className="inline-flex max-w-[200px] items-center gap-1 truncate rounded-md border border-border bg-surface-white px-2 py-1 font-mono text-[11px] text-text-secondary">
                DOI: {paper.doi}
              </span>
            )}
            {paper.source && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-white px-2 py-1 text-[11px] font-semibold text-text-secondary">
                Source: {paper.source}
              </span>
            )}
          </div>
        </div>

        {/* Reason for Deletion */}
        <div className="space-y-2">
          <label htmlFor="delete-paper-reason" className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            <FiTag className="h-3.5 w-3.5 text-text-muted" />
            Reason for Deletion
          </label>
          <select
            id="delete-paper-reason"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isLoading}
            className="min-h-11 w-full rounded-lg border border-border bg-surface-white px-3 py-2.5 text-xs font-medium text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {selectedReason === "Other reason" && (
            <input
              id="delete-paper-custom-reason"
              type="text"
              aria-label="Custom deletion reason"
              placeholder="Enter custom reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={isLoading}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface-white px-3 py-2 text-xs font-medium text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              autoFocus
            />
          )}
        </div>

        {/* Permanent Warning */}
        <div className="flex items-start gap-2.5 rounded-lg border border-error/20 bg-error/5 p-3 text-xs leading-relaxed text-error">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="font-bold">Permanent Action:</span> The paper record and its linked PDF and Markdown assets on Cloudinary will be deleted.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 motion-reduce:transition-none"
          >
            Cancel
          </button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            isLoading={isLoading}
            className="min-h-11 rounded-lg px-5 py-2 text-xs font-bold text-white shadow-sm"
          >
            Delete Paper
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePaperModal;
