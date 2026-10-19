import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Modal from "../../../../components/ui/Modal";
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
    <section className="rounded-xl border border-border bg-bg-primary p-4">
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span className="rounded-xl bg-bg-secondary p-2 text-accent">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Strategy Guidelines</span>
        </span>
      }
      description="Review the synthesis strategy established during planning before grouping evidence or drafting sensitivity notes."
      size="lg"
      bodyClassName="space-y-4"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
          {strategiesQuery.isLoading ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-border bg-bg-primary">
              <LoadingSpinner />
            </div>
          ) : strategiesQuery.error ? (
            <div role="alert" className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error">
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
    </Modal>
  );
}
