import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import type { ProcessSnapshot, SelectionInsertResult } from "./types";
import ReviewProcessCard from "./ReviewProcessCard";

interface ReviewProcessRailProps {
  isOpen: boolean;
  onClose: () => void;
  processSnapshots: ProcessSnapshot[];
  selectedCount: number;
  filteredCount: number;
  savedFilterOptions: Array<{ id: string; name: string }>;
  selectedSavedFilterId: string | null;
  selectedSavedFilterMatchedCount: number | null;
  selectedProcessId: string | null;
  insertResult: SelectionInsertResult | null;
  onSelectProcess: (processId: string) => void;
  onSelectSavedFilter: (filterId: string) => void;
  onCreateSavedFilterFromCurrent: () => void;
  onAddToSelectedProcess: () => void;
  onAddAllFilteredToSelectedProcess: () => void;
  onNavigateToProcess: (processId: string) => void;
  isAdding: boolean;
  isLeader?: boolean;
}

export default function ReviewProcessRail({
  isOpen,
  onClose,
  processSnapshots,
  selectedCount,
  filteredCount,
  selectedProcessId,
  onSelectProcess,
  onNavigateToProcess,
  isLeader = false,
}: ReviewProcessRailProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Review Context"
      description="Review Processes Status"
      maxWidth="max-w-sm"
      contentClassName="custom-scrollbar space-y-4"
      footer={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
              Current Selection
            </span>
            <span className="text-sm font-black text-text-primary">
              {selectedCount} Items
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
              Global Library
            </span>
            <span className="text-sm font-black text-text-primary">
              {filteredCount} Items
            </span>
          </div>

          <Button className="w-full" onClick={onClose}>
            Confirm Selection
          </Button>
        </div>
      }
    >
      <div className="px-2 pb-2">
        <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
          Active Processes
        </h4>
      </div>

      {processSnapshots.map((process) => (
        <ReviewProcessCard
          key={process.processId}
          process={process}
          isSelected={selectedProcessId === process.processId}
          onSelect={onSelectProcess}
          onNavigate={onNavigateToProcess}
          actionLabel={
            isLeader
              ? selectedProcessId === process.processId
                ? "Currently Target"
                : "Set as Target"
              : undefined
          }
          isLeader={isLeader}
        />
      ))}
    </Drawer>
  );
}
