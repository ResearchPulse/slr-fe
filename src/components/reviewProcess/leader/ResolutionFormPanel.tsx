import React, { useId, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  StickyNote,
  ChevronUp,
  ChevronDown,
  Gavel,
} from "lucide-react";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import { useStudySelectionExclusionReasons } from "../../../hooks/useStudySelection";

interface ResolutionFormPanelProps {
  resolution: "Include" | "Exclude" | null;
  setResolution: (res: "Include" | "Exclude" | null) => void;
  exclusionReason: string;
  setExclusionReason: (reason: string) => void;
  resolutionNotes: string;
  setResolutionNotes: (notes: string) => void;
  onResolve: () => void;
  isFinishReview: boolean;
  onAssignThirdReviewer: () => void;
  processId: string | undefined;
}

const ResolutionFormPanel: React.FC<ResolutionFormPanelProps> = ({
  resolution,
  setResolution,
  exclusionReason,
  setExclusionReason,
  resolutionNotes,
  setResolutionNotes,
  onResolve,
  isFinishReview,
  onAssignThirdReviewer,
  processId,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reasonPageSize, setReasonPageSize] = useState(5);
  const panelId = useId();

  const { data: exclusionReasons = [] } = useStudySelectionExclusionReasons(
    processId,
    { onlyActive: true, pageSize: reasonPageSize },
  );

  const hasMoreReasons = exclusionReasons.length >= reasonPageSize;

  return (
    <div
      className={`absolute bottom-0 right-0 w-full bg-surface-white border-t border-border shadow-[0_-20px_50px_-20px_rgba(30,58,138,0.15)] z-20 transition-[transform] duration-200 ease-out motion-reduce:transition-none ${
        isExpanded ? "translate-y-0" : "translate-y-[calc(100%-64px)]"
      }`}
    >
      {/* Dynamic Handle/Toggle */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="group flex h-16 w-full items-center justify-between px-6 text-left transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 motion-reduce:transition-none"
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl transition-[background-color,color,transform] duration-150 motion-reduce:transition-none ${isExpanded ? "bg-primary text-white rotate-0" : "bg-primary-light text-accent -rotate-12"}`}
          >
            <Gavel className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-text-primary">
              Final Resolution
            </h4>
            <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">
              {resolution
                ? `Ready to resolve as ${resolution}`
                : "Pending leader decision"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {resolution && !isExpanded && (
            <div
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in motion-safe:duration-300 motion-reduce:animate-none ${
                resolution === "Include"
                  ? "bg-success/10 text-success"
                  : "bg-error/10 text-error"
              }`}
            >
              {resolution}
            </div>
          )}
          <div className="rounded-xl bg-bg-secondary p-2 text-text-secondary transition-colors group-hover:bg-border/60 motion-reduce:transition-none">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      <div
        id={panelId}
        aria-hidden={!isExpanded}
        inert={!isExpanded}
        className={`space-y-5 px-6 pb-8 transition-opacity duration-150 motion-reduce:transition-none ${isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="flex gap-3">
          <button
            aria-pressed={resolution === "Include"}
            onClick={() => isFinishReview && setResolution("Include")}
            disabled={!isFinishReview}
              className={`flex-1 flex flex-col items-center py-4 rounded-xl border-2 transition-[background-color,border-color,transform,box-shadow] duration-150 motion-reduce:transition-none ${
              resolution === "Include"
                ? "border-success bg-success/5 scale-[1.02] shadow-none"
                : "bg-surface-white border-border hover:border-border"
            } ${!isFinishReview ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <CheckCircle2
              className={`w-5 h-5 mb-1.5 transition-transform duration-150 motion-reduce:transition-none ${
                resolution === "Include"
                  ? "text-success scale-110"
                  : "text-text-secondary"
              }`}
            />
            <span
              className={`text-[10px] font-black uppercase tracking-[0.1em] ${
                resolution === "Include"
                  ? "text-success"
                  : "text-text-secondary"
              }`}
            >
              Include
            </span>
          </button>
          <button
            aria-pressed={resolution === "Exclude"}
            onClick={() => isFinishReview && setResolution("Exclude")}
            disabled={!isFinishReview}
              className={`flex-1 flex flex-col items-center py-4 rounded-xl border-2 transition-[background-color,border-color,transform,box-shadow] duration-150 motion-reduce:transition-none ${
              resolution === "Exclude"
                ? "border-error bg-error/5 scale-[1.02] shadow-none"
                : "bg-surface-white border-border hover:border-border"
            } ${!isFinishReview ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <XCircle
              className={`w-5 h-5 mb-1.5 transition-transform duration-150 motion-reduce:transition-none ${
                resolution === "Exclude"
                  ? "text-error scale-110"
                  : "text-text-secondary"
              }`}
            />
            <span
              className={`text-[10px] font-black uppercase tracking-[0.1em] ${
                resolution === "Exclude"
                  ? "text-error"
                  : "text-text-secondary"
              }`}
            >
              Exclude
            </span>
          </button>
        </div>

        {resolution === "Exclude" && (
          <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-150 motion-reduce:animate-none">
            <div>
              <label htmlFor="resolution-exclusion-reason" className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Exclusion Reason
              </label>
              <div className="relative group">
                <Select
                  id="resolution-exclusion-reason"
                  value={exclusionReason}
                  onChange={(e) => setExclusionReason(e.target.value)}
                  options={exclusionReasons.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                  placeholder="Select a reason..."
                  className="!min-h-11 !rounded-xl !border-none !bg-bg-secondary !py-3.5 !text-xs !font-bold transition-colors hover:!bg-bg-secondary focus:!ring-2 focus:!ring-primary/20 motion-reduce:transition-none"
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
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-accent transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
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
          </div>
        )}

        <div className="relative group">
          <StickyNote className="absolute left-4 top-4 h-4 w-4 text-text-secondary transition-colors group-focus-within:text-primary motion-reduce:transition-none" />
          <textarea
            placeholder="Resolution notes (optional)..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            className="min-h-[90px] w-full resize-none rounded-xl border-2 border-transparent bg-bg-secondary py-4 pl-12 pr-4 text-[11px] font-medium outline-none transition-[border-color,background-color,box-shadow] focus:border-primary/30 focus:bg-surface-white focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
          />
        </div>

        <div className="space-y-3 pt-2">
          {!isFinishReview && (
            <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none" role="status">
              <div className="h-1.5 w-1.5 rounded-full bg-warning" />
              <p className="text-[9px] font-bold uppercase tracking-wider leading-none text-warning">
                Decision locked until all reviewers finish their task assignment
              </p>
            </div>
          )}
          <Button
            onClick={onResolve}
            disabled={
              !resolution ||
              (resolution === "Exclude" && !exclusionReason) ||
              !isFinishReview
            }
            className="min-h-11 w-full rounded-xl bg-primary py-4 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-sm shadow-primary/10 transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:transition-none"
          >
            {isFinishReview ? "Resolve Conflict" : "Review in Progress"}
          </Button>

          <button
            onClick={onAssignThirdReviewer}
            className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3.5 transition-colors hover:border-primary/30 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-accent transition-colors">
              Assign more Reviewers
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolutionFormPanel;
