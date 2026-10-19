import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Button from "../../ui/Button";
import {
  useStudySelectionExclusionReasons,
  useBulkResolvePapers,
} from "../../../hooks/useStudySelection";
import Select from "../../ui/Select";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import {
  ScreeningDecisionType,
  PaperPhase,
} from "../../../types/studySelection";
import { toastSuccess, toastError } from "../../../utils/toast";

interface QuickDecisionPanelProps {
  processId?: string;
  selectedPaperIds: string[];
  onDecisionComplete: () => void;
  phase: PaperPhase;
}

const QuickDecisionPanel: React.FC<QuickDecisionPanelProps> = ({
  processId,
  selectedPaperIds,
  onDecisionComplete,
  phase,
}) => {
  const selectedCount = selectedPaperIds.length;
  const panelRef = useRef<HTMLDivElement>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [decisionType, setDecisionType] = React.useState<
    "include" | "exclude" | null
  >(null);
  const [exclusionReasonId, setExclusionReasonId] = React.useState<string>("");
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [reasonPageSize, setReasonPageSize] = React.useState(5);

  const { mutate: bulkResolve, isPending: isSubmitting } =
    useBulkResolvePapers();

  const { data: exclusionReasons = [], isLoading: isLoadingReasons } =
    useStudySelectionExclusionReasons(processId, {
      onlyActive: true,
      pageSize: reasonPageSize,
    });

  const hasMoreReasons = exclusionReasons.length >= reasonPageSize;

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(panelRef.current, {
        y: selectedCount > 0 ? 0 : 100,
        opacity: selectedCount > 0 ? 1 : 0,
      });
      return;
    }

    if (selectedCount > 0) {
      gsap.to(panelRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    } else {
      gsap.to(panelRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
      });
    }
  }, [selectedCount]);

  const handleDecision = (decision: "include" | "exclude") => {
    if (!processId || !currentUser) return;

    if (decision === "exclude" && !decisionType) {
      setDecisionType("exclude");
      return;
    }

    if (decision === "exclude" && !exclusionReasonId) {
      toastError("Please select an exclusion reason");
      return;
    }

    bulkResolve(
      {
        processId,
        request: {
          paperIds: selectedPaperIds,
          finalDecision:
            decision === "include"
              ? ScreeningDecisionType.Include
              : ScreeningDecisionType.Exclude,
          phase: phase,
          resolvedBy: currentUser.id,
          exclusionReasonId:
            decision === "exclude" ? exclusionReasonId : undefined,
          resolutionNotes: resolutionNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toastSuccess(`Successfully ${decision}d ${selectedCount} papers`);
          onDecisionComplete();
          setDecisionType(null);
          setExclusionReasonId("");
          setResolutionNotes("");
        },
        onError: (error: any) => {
          toastError(error.message || `Failed to ${decision} papers`);
        },
      },
    );
  };

  if (selectedCount === 0) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-4 left-1/2 z-(--z-index-dropdown) max-h-[calc(100dvh-2rem)] w-full max-w-3xl -translate-x-1/2 overflow-y-auto px-3 opacity-0 translate-y-[100px] sm:bottom-6 sm:px-4"
    >
      <div className="relative overflow-visible rounded-xl border border-border bg-surface-white p-4 text-text-primary shadow-xl sm:p-6">
        <div className="flex flex-col gap-6 relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Section 1: Stats */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="rounded-xl bg-primary-light p-3 text-primary ring-4 ring-primary/10">
                <CheckCircle2 aria-hidden="true" className="w-6 h-6" />
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Quick Decision
                </div>
                <div className="flex items-center gap-2 text-xl font-bold tabular-nums text-text-primary">
                  <span>{selectedCount}</span>
                  <span className="text-xs font-medium uppercase text-text-secondary">
                    Papers Selected
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Action Buttons */}
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
              {!isLoadingReasons && exclusionReasons.length === 0 && (
                <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-150 motion-reduce:animate-none">
                  <span className="rounded-lg border border-warning/20 bg-warning/10 px-2 py-1 text-[10px] font-semibold leading-5 text-warning">
                    Please import exclusion reason code to exclude papers
                  </span>
                </div>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {decisionType === "exclude" && (
                  <Button
                    onClick={() => setDecisionType(null)}
                    variant="secondary"
                    className="min-w-28"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={() => handleDecision("include")}
                  disabled={
                    decisionType === "exclude" ||
                    isSubmitting ||
                    isLoadingReasons
                  }
                  aria-busy={isSubmitting && decisionType !== "exclude"}
                  variant="success"
                  className="min-w-28"
                >
                  {isSubmitting && decisionType !== "exclude" ? (
                    <Loader2 aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin motion-reduce:animate-none" />
                  ) : null}
                  Include
                </Button>

                <Button
                  onClick={() => handleDecision("exclude")}
                  disabled={
                    isSubmitting ||
                    isLoadingReasons ||
                    exclusionReasons.length === 0
                  }
                  aria-busy={isSubmitting && decisionType === "exclude"}
                  variant="danger"
                  className="min-w-28"
                >
                  {isSubmitting && decisionType === "exclude" ? (
                    <Loader2 aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin motion-reduce:animate-none" />
                  ) : null}
                  {decisionType === "exclude" ? "Confirm Exclusion" : "Exclude"}
                </Button>
              </div>
            </div>
          </div>

          {/* Section 3: Exclusion Options - Only shown when Exclude is selected */}
          {decisionType === "exclude" && (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-bg-secondary p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 motion-reduce:animate-none sm:flex-row">
              <div className="flex-1">
                <label className="mb-2 ml-1 block text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
                  Exclusion Reason <span className="text-error">*</span>
                </label>
                <div className="relative group">
                  <Select
                    value={exclusionReasonId}
                    onChange={(e) => setExclusionReasonId(e.target.value)}
                    options={exclusionReasons.map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                    placeholder="Select a reason..."
                    className="!min-h-11 !rounded-xl !border-border !bg-surface-white !py-3 !text-xs !font-medium !text-text-primary transition-colors hover:!bg-bg-primary focus:!ring-2 focus:!ring-primary/30 motion-reduce:transition-none"
                  />

                  {/* Show More / Reset Reasons Button */}
                  {(hasMoreReasons || exclusionReasons.length > 5) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasMoreReasons) {
                          setReasonPageSize((prev) => prev + 5);
                        } else {
                          setReasonPageSize(5);
                        }
                      }}
                      className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold uppercase text-primary transition-colors hover:bg-primary-light hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
                    >
                      {hasMoreReasons ? (
                        <>
                          <span>Show more reasons</span>{" "}
                          <ChevronDown className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <span>Reset list</span>{" "}
                          <ChevronUp className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <label className="mb-2 ml-1 block text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  placeholder="Explain why these papers are being excluded..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="min-h-20 w-full resize-y overflow-hidden rounded-xl border border-border bg-surface-white px-4 py-3 text-sm font-medium text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickDecisionPanel;
