import { useState, useMemo } from "react";
import { FiFilter, FiCheckCircle } from "react-icons/fi";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import LoadingSpinner from "../ui/LoadingSpinner";
import type {
  ProcessSnapshot,
  PaperPoolFilterSetting,
  SelectionInsertResult,
} from "./types";
import ReviewProcessCard from "./ReviewProcessCard";

interface AddToProcessByFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  processSnapshots: ProcessSnapshot[];
  savedFilters: PaperPoolFilterSetting[];
  onAddFromFilter: (processId: string, filterId: string) => Promise<void>;
  onNavigateToProcess?: (processId: string) => void;
  isAdding: boolean;
  insertResult: SelectionInsertResult | null;
  selectedSavedFilterId: string | null;
  selectedSavedFilterMatchedCount: number | null;
  onSelectFilter: (id: string) => void;
  isLeader?: boolean;
}

export default function AddToProcessByFilterModal({
  isOpen,
  onClose,
  processSnapshots,
  savedFilters,
  onAddFromFilter,
  onNavigateToProcess,
  isAdding,
  insertResult,
  selectedSavedFilterId,
  selectedSavedFilterMatchedCount,
  onSelectFilter,
  isLeader = false,
}: AddToProcessByFilterModalProps) {
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null,
  );

  const selectedProcess = useMemo(
    () => processSnapshots.find((p) => p.processId === selectedProcessId),
    [processSnapshots, selectedProcessId],
  );

  const handleConfirm = async () => {
    if (!selectedProcessId || !selectedSavedFilterId) return;
    await onAddFromFilter(selectedProcessId, selectedSavedFilterId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Filter Results to Process"
      description="Transfer papers matching a filter to a review process"
      size="md"
      bodyClassName="custom-scrollbar p-8"
      footer={
        !insertResult ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              isLoading={isAdding}
              disabled={!selectedProcessId || !selectedSavedFilterId}
            >
              Confirm Transfer
            </Button>
          </>
        ) : undefined
      }
    >
          {insertResult ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <FiCheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-2xl font-black text-text-primary mb-2">
                Transfer Successful
              </h4>
              <p className="text-text-secondary max-w-md mx-auto mb-8 font-medium">
                We've processed the paper transfer to{" "}
                <span className="text-accent font-bold">
                  {selectedProcess?.processName}
                </span>
                .
              </p>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-bg-primary p-4 rounded-xl border border-border">
                  <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">
                    Added
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {insertResult.inserted}
                  </div>
                </div>
                <div className="bg-bg-primary p-4 rounded-xl border border-border">
                  <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">
                    Skipped
                  </div>
                  <div className="text-2xl font-black text-amber-500">
                    {insertResult.skippedAsDuplicate}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (onNavigateToProcess && selectedProcessId) {
                      onNavigateToProcess(selectedProcessId);
                    }
                    onClose();
                  }}
                >
                  View Process
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest">
                    1. Select Destination Process
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {processSnapshots.map((process) => (
                    <ReviewProcessCard
                      key={process.processId}
                      process={process}
                      isSelected={selectedProcessId === process.processId}
                      onSelect={setSelectedProcessId}
                      onNavigate={onNavigateToProcess}
                      isLeader={isLeader}
                      className="cursor-pointer"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest">
                  2. Select Saved Filter Collection
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={selectedSavedFilterId || ""}
                    onChange={(e) => onSelectFilter(e.target.value)}
                    className="rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full text-text-primary appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose a filter collection...
                    </option>
                    {savedFilters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSavedFilterId && (
                  <div className="bg-primary-light/50 border border-accent/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-accent">
                      <FiFilter className="w-5 h-5" />
                      <span className="text-sm font-bold">Matched Papers</span>
                    </div>
                    <div className="text-xl font-black text-accent">
                      {selectedSavedFilterMatchedCount ?? (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
    </Modal>
  );
}
