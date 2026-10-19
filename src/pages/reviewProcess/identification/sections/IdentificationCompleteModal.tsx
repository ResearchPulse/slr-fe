import React from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { useSnapshotDataset } from "../hooks/useSnapshotDataset";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

interface IdentificationCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCompleting: boolean;
  identificationPhaseId: string | undefined;
  canComplete: boolean;
}

const IdentificationCompleteModal: React.FC<
  IdentificationCompleteModalProps
> = ({ isOpen, onClose, onConfirm, isCompleting, identificationPhaseId, canComplete }) => {
  const ds = useSnapshotDataset({
    identificationProcessId: identificationPhaseId,
    pageSize: 5, // Smaller page size for modal
  });

  const {
    snapshotPapers,
    snapshotTotalCount,
    snapshotPage,
    snapshotTotalPages,
    snapshotLoading,
    snapshotSearch,
    setSnapshotSearch,
    snapshotNextPage,
    snapshotPrevPage,
  } = ds;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Identification Phase"
      description="Finalize the identification process and move to the next phase."
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Section */}
        <div className="flex gap-3 rounded-xl border border-warning/20 bg-warning/10 p-4 text-text-primary" role="status">
          <FiAlertCircle size={24} className="shrink-0 text-warning" />
          <div className="space-y-1">
            <p className="text-sm font-black">Ready to proceed?</p>
            <p className="text-xs font-medium leading-relaxed opacity-90">
              Completing this phase will finalize the current set of unique
              papers. These papers will be using for the{" "}
              <strong>Study Selection</strong> phase. Ensure all duplicates are
              resolved and all relevant sources are imported.
            </p>
            <p className="text-xs font-medium leading-relaxed opacity-90">
              You can always come back and add more papers later if re-open this
              phase
            </p>
          </div>
        </div>

        {!canComplete && (
          <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning" role="alert">
            Add a search strategy or import at least one paper before completing this phase.
          </div>
        )}

        {/* Papers Summary Header */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-primary">
              <FiCheckCircle className="text-accent" />
              <span className="font-black text-lg">Snapshot Dataset</span>
            </div>
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
              {snapshotTotalCount} Papers
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search in snapshot..."
              value={snapshotSearch}
              onChange={(e) => setSnapshotSearch(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-2 pl-10 pr-4 text-sm font-medium text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            />
          </div>

          <div className="space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative">
            {snapshotLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <LoadingSpinner size="md" className="mb-4" />
                <p className="text-xs font-medium italic">
                  Loading snapshot papers...
                </p>
              </div>
            ) : snapshotPapers.length > 0 ? (
              snapshotPapers.map((paper, index) => (
                <div
                  key={paper.id || index}
                  className="bg-surface-white border border-border p-3 rounded-xl shadow-sm hover:border-primary/30 transition-colors"
                >
                  <p className="line-clamp-1 text-sm font-bold text-text-primary">
                    {paper.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                    <span className="bg-bg-secondary px-2 py-0.5 rounded-md">
                      {paper.publicationYear || "N/A"}
                    </span>
                    <span className="truncate max-w-[200px]">
                      {paper.authors || "Unknown Author"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-secondary">
                <FiInfo size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium italic">
                  {snapshotSearch
                    ? "No papers match your search."
                    : "No papers have been added to calculations yet."}
                </p>
              </div>
            )}
          </div>

          {/* Table Pagination */}
          {snapshotTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[10px] font-medium text-text-secondary">
                Page {snapshotPage} of {snapshotTotalPages}
              </span>
              <div className="flex gap-1">
                <button
                    type="button"
                    aria-label="Previous snapshot page"
                  onClick={snapshotPrevPage}
                  disabled={snapshotPage === 1 || snapshotLoading}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-transparent text-text-secondary transition-colors hover:border-border hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30 motion-reduce:transition-none"
                >
                  <FiChevronLeft />
                </button>
                <button
                    type="button"
                    aria-label="Next snapshot page"
                  onClick={snapshotNextPage}
                  disabled={
                    snapshotPage === snapshotTotalPages || snapshotLoading
                  }
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-transparent text-text-secondary transition-colors hover:border-border hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30 motion-reduce:transition-none"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-xl px-6 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
            disabled={isCompleting}
          >
            Cancel
          </button>
          <Button
            onClick={onConfirm}
            isLoading={isCompleting}
            variant="primary"
            disabled={!canComplete || isCompleting}
            className="min-h-11 min-w-[160px] bg-primary shadow-sm shadow-primary/10 transition-transform active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:transition-none"
          >
            Complete module
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default IdentificationCompleteModal;
