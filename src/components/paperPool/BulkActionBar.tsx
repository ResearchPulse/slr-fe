import { FiPlus, FiTrash2 } from "react-icons/fi";
import Button from "../ui/Button";

interface BulkActionBarProps {
  selectedCount: number;
  onAddToProcess: () => void;
  onClear: () => void;
  isSubmitting?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onAddToProcess,
  onClear,
  isSubmitting = false,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-(--z-index-dropdown) w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-in slide-in-from-bottom-6 duration-300">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-surface-white/95 p-2.5 shadow-[0_12px_36px_rgba(15,23,42,0.14)] backdrop-blur-md sm:flex-nowrap sm:gap-3 sm:px-4">
        <div className="flex min-w-[5.5rem] flex-col px-2 py-1 sm:px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary leading-none">
            Selection
          </span>
          <span className="mt-1 text-sm font-semibold leading-tight text-text-primary">
            {selectedCount} {selectedCount === 1 ? "Item" : "Items"}
          </span>
        </div>

        <div className="hidden h-8 w-px bg-border sm:block" />

        <div className="flex items-center gap-2">
          <Button
            onClick={onAddToProcess}
            isLoading={isSubmitting}
            className="min-h-11 rounded-xl px-4 py-2.5 text-xs font-semibold normal-case tracking-normal shadow-none sm:px-5"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add to Process
          </Button>
          <button
            onClick={onClear}
            disabled={isSubmitting}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiTrash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
