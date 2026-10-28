import { AlertTriangle, RefreshCw, ScanSearch, ShieldCheck } from "lucide-react";
import Button from "../ui/Button";
import DeduplicationTabContent from "./deduplication/DeduplicationTabContent";
import type { DuplicateResolution } from "../../types/deduplication";
import { useDuplicatePairs } from "../../hooks/useDuplicatePairs";
import { useProjectMember } from "../../hooks/useProjectMember";
import { toastError } from "../../utils/toast";

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
      toastError(
        err instanceof Error ? err.message : "Failed to resolve duplicate",
      );
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-accent">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              Deduplication
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Find matching records and review duplicate pairs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            role="status"
            aria-label={`${pendingDuplicates.length} pending duplicate pairs`}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-warning/25 bg-warning/5 px-3 text-sm font-medium text-warning"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>{pendingDuplicates.length} pending</span>
          </div>
          {isLeader && (
            <Button
              variant="primary"
              onClick={runDeduplication}
              disabled={isLoading || isRunningDeduplication}
              isLoading={isRunningDeduplication}
              className="normal-case tracking-normal"
            >
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
              Run duplicate check
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            onClick={onRefetch}
            disabled={isLoading || isRunningDeduplication}
            aria-label="Refresh duplicate queue"
            className="normal-case tracking-normal"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">Refresh</span>
            <span className="hidden sm:inline">Refresh queue</span>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface-white">
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
