import { BookOpen, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import synthesisExecutionService from "../../../../services/synthesisExecutionService";
import { getErrorMessage } from "../../../../utils/errorUtils";

interface StrategyGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  synthesisProcessId: string;
}

function StrategySection({
  title,
  content,
}: {
  title: string;
  content?: string;
}) {
  const hasContent = Boolean(content && content.trim());

  return (
    <section className="rounded-xl border border-border bg-bg-primary p-4 shadow-sm">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
        {title}
      </h4>
      <p
        className={`mt-3 text-sm leading-6 ${hasContent ? "whitespace-pre-line text-text-primary" : "italic text-text-secondary"}`}
      >
        {hasContent
          ? content
          : title === "Data Grouping Plan"
            ? "No specific data grouping plan was defined for this review."
            : "No specific sensitivity analysis plan was defined for this review."}
      </p>
    </section>
  );
}

export default function StrategyGuidelinesModal({
  isOpen,
  onClose,
  synthesisProcessId,
}: StrategyGuidelinesModalProps) {
  const strategiesQuery = useQuery({
    queryKey: QUERY_KEYS.synthesisExecution.strategies(synthesisProcessId),
    queryFn: () =>
      synthesisExecutionService.getSynthesisStrategiesByProcessId(
        synthesisProcessId,
      ),
    enabled: isOpen && Boolean(synthesisProcessId),
    staleTime: 60 * 1000,
  });

  const activeStrategy = strategiesQuery.data?.[0];
  const dataGroupingPlan = activeStrategy?.dataGroupingPlan ?? undefined;
  const sensitivityAnalysisPlan =
    activeStrategy?.sensitivityAnalysisPlan ?? undefined;

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = () => {
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
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface-white shadow-2xl"
        onClick={handleDialogClick}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-bg-secondary p-3 text-accent shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">
                Strategy Guidelines
              </p>
              <h3 className="mt-1 text-xl font-semibold text-text-primary">
                Synthesis planning reference
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Review the synthesis strategy established during planning before
                grouping evidence or drafting sensitivity notes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
            aria-label="Close strategy guidelines"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {strategiesQuery.isLoading ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-border bg-bg-primary">
              <LoadingSpinner />
            </div>
          ) : strategiesQuery.error ? (
            <div className="rounded-xl border border-border bg-surface-white p-4 text-sm text-red-700">
              {getErrorMessage(
                strategiesQuery.error,
                "Unable to load synthesis strategy guidelines.",
              )}
            </div>
          ) : (
            <>
              <StrategySection
                title="Data Grouping Plan"
                content={dataGroupingPlan}
              />
              <StrategySection
                title="Sensitivity Analysis Plan"
                content={sensitivityAnalysisPlan}
              />
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
