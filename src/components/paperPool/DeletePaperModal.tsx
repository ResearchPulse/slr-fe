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
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-sm">
            <FiTrash2 className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Paper</h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Permanently remove this paper from the repository
            </p>
          </div>
        </div>
      }
      size="sm"
    >
      <div className="space-y-5">
        {/* Paper Summary Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <FiFileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                {paper.title}
              </h4>
              {paper.authors && (
                <p className="text-xs text-slate-500 truncate mt-1">
                  {paper.authors}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
            {paper.year && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Year: {paper.year}
              </span>
            )}
            {paper.doi && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                DOI: {paper.doi}
              </span>
            )}
            {paper.source && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Source: {paper.source}
              </span>
            )}
          </div>
        </div>

        {/* Reason for Deletion */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <FiTag className="w-3.5 h-3.5 text-slate-400" />
            Reason for Deletion
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isLoading}
            className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {selectedReason === "Other reason" && (
            <input
              type="text"
              placeholder="Enter custom reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={isLoading}
              className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 mt-2 transition-colors"
              autoFocus
            />
          )}
        </div>

        {/* Permanent Warning */}
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-rose-800 text-xs leading-relaxed">
          <FiAlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
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
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            isLoading={isLoading}
            className="px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm"
          >
            Delete Paper
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePaperModal;
