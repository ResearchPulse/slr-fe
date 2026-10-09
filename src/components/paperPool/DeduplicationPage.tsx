import { FiShield, FiAlertTriangle } from "react-icons/fi";
import Button from "../ui/Button";
import DeduplicationTabContent from "./deduplication/DeduplicationTabContent";
import type { DuplicateResolution } from "../../types/deduplication";
import { useDuplicatePairs } from "../../hooks/useDuplicatePairs";
import { useProjectMember } from "../../hooks/useProjectMember";
import toast from "react-hot-toast";

interface DeduplicationPageProps {
  projectId: string;
}

export default function DeduplicationPage({
  projectId,
}: DeduplicationPageProps) {
  const {
    pairs: duplicatePairs,
    pendingPairs: pendingDuplicates,
    loading: isLoading,
    error,
    resolving: isResolving,
    resolvePair,
    runDeduplication,
    isRunningDeduplication,
    refetch: onRefetch,
  } = useDuplicatePairs({ projectId });

  const { member } = useProjectMember(projectId);
  const isLeader = member?.isLeader ?? false;

  const handleResolveDuplicate = async (
    pairId: string,
    decision: DuplicateResolution,
  ) => {
    try {
      await resolvePair(pairId, decision);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resolve duplicate",
      );
    }
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-surface-white p-6 rounded-2xl border border-border shadow-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-bg-secondary rounded-xl flex items-center justify-center text-accent">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">
                Project Deduplication
              </h2>
              <p className="text-xs font-black text-text-secondary uppercase tracking-widest mt-0.5">
                Maintain Data Integrity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50/30 px-4">
            <FiAlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-red-700">
              {pendingDuplicates.length} Pending Conflicts
            </span>
          </div>
          {isLeader && (
            <Button
              variant="primary"
              onClick={runDeduplication}
              disabled={isLoading || isRunningDeduplication}
              isLoading={isRunningDeduplication}
              className="rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              Run Deduplication
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onRefetch}
            disabled={isLoading || isRunningDeduplication}
            className="rounded-xl font-bold uppercase tracking-wider text-xs"
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-surface-white rounded-2xl border border-border shadow-none overflow-hidden min-h-[600px]">
        <DeduplicationTabContent
          duplicatePairs={duplicatePairs}
          pendingDuplicates={pendingDuplicates}
          onResolveDuplicate={handleResolveDuplicate}
          onRunDeduplication={runDeduplication}
          isRunningDeduplication={isRunningDeduplication}
          isLoading={isLoading}
          isResolving={isResolving}
          error={error}
          onRefetch={onRefetch}
          canEdit={isLeader}
        />
      </div>
    </div>
  );
}
