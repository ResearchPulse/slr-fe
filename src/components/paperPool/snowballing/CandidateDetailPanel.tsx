import React from "react";
import {
  AlertCircle,
  BookmarkCheck,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import Button from "../../ui/Button";
import type { CandidatePaperDto } from "../../../types/paper";
import { cn } from "../../../utils/cn";

interface CandidateDetailPanelProps {
  candidate: CandidatePaperDto | null;
  onClose: () => void;
  onAction: (id: string, action: "select" | "reject") => Promise<void>;
  isProcessing: boolean;
  isModal?: boolean;
}

interface CandidateDetailActionsProps {
  candidate: CandidatePaperDto | null;
  onAction: (id: string, action: "select" | "reject") => Promise<void>;
  isProcessing: boolean;
  layout?: "inline" | "stacked";
}

export const CandidateDetailActions: React.FC<CandidateDetailActionsProps> = ({
  candidate,
  onAction,
  isProcessing,
  layout = "inline",
}) => {
  if (!candidate) return null;

  const isStacked = layout === "stacked";
  const buttonLayout = isStacked ? "w-full" : "min-w-32";

  if (candidate.isSelectedInProjectRepository || candidate.statusText === "Rejected") {
    const isInRepository = candidate.isSelectedInProjectRepository;
    return (
      <Button
        disabled
        variant="secondary"
        size="md"
        className={cn(buttonLayout, "normal-case tracking-normal")}
      >
        {isInRepository ? <BookmarkCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {isInRepository ? "Already in repository" : "Candidate rejected"}
      </Button>
    );
  }

  return (
    <div className={cn("flex gap-3", isStacked ? "flex-col" : "flex-row-reverse")}>
      <Button
        onClick={() => onAction(candidate.candidateId, "select")}
        disabled={isProcessing}
        size="md"
        className={cn(buttonLayout, "normal-case tracking-normal")}
      >
        {isProcessing ? <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" /> : <Plus className="h-4 w-4" />}
        Add to repository
      </Button>
      <Button
        onClick={() => onAction(candidate.candidateId, "reject")}
        disabled={isProcessing}
        variant="secondary"
        size="md"
        className={cn(
          buttonLayout,
          "normal-case tracking-normal",
          "text-text-secondary hover:border-error/40 hover:bg-error/5 hover:text-error",
        )}
      >
        {isProcessing && <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" />}
        Reject candidate
      </Button>
    </div>
  );
};

const CandidateDetailPanel: React.FC<CandidateDetailPanelProps> = ({
  candidate,
  onClose,
  onAction,
  isProcessing,
  isModal = false,
}) => {
  if (!candidate) return null;

  const {
    title,
    authors,
    publicationYear,
    statusText,
    doi,
    rawReference,
    originPaperTitle,
    extractionQualityScore,
    matchConfidenceScore,
    isSelectedInProjectRepository,
    validationNote,
  } = candidate;

  const qualityScore = Math.max(0, Math.min(1, extractionQualityScore || 0));
  const matchScore = Math.max(0, Math.min(1, matchConfidenceScore || 0));
  const isLowQuality = validationNote?.toLowerCase().includes("low extraction quality");

  const content = (
    <div className={cn("space-y-6", isModal ? "p-5 sm:p-6" : "p-5")}>
      <section aria-labelledby="candidate-paper-title">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-text-secondary">Candidate paper</span>
          {isSelectedInProjectRepository && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-2.5 py-1 font-medium text-text-primary">
              <BookmarkCheck className="h-3.5 w-3.5" /> In repository
            </span>
          )}
          {!isSelectedInProjectRepository && statusText === "Matched" && (
            <span className="rounded-full bg-primary-light px-2.5 py-1 font-medium text-accent">Matched</span>
          )}
        </div>
        <h2 id="candidate-paper-title" className="mt-2 text-xl font-semibold leading-snug text-text-primary text-pretty">
          {title || "Untitled candidate"}
        </h2>
        {doi && (
          <a
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-md text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="truncate">doi:{doi}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">Open DOI in a new tab</span>
          </a>
        )}
      </section>

      {validationNote && (
        <div
          role="note"
          className={cn(
            "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed",
            isLowQuality
              ? "border-warning/20 bg-warning/10 text-warning"
              : "border-border bg-bg-secondary text-text-secondary",
          )}
        >
          {isLowQuality && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{validationNote}</span>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-y border-border py-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-text-secondary">Authors</dt>
          <dd className="mt-1.5 break-words text-sm font-medium leading-relaxed text-text-primary">
            {authors || "Author information unavailable"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-text-secondary">Publication year</dt>
          <dd className="mt-1.5 text-sm font-medium text-text-primary">{publicationYear || "Not provided"}</dd>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs font-medium text-text-secondary">Extracted from</dt>
          <dd className="mt-1.5 flex items-start gap-2 text-sm leading-relaxed text-text-primary">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            <span className="break-words">{originPaperTitle || "Origin paper unavailable"}</span>
          </dd>
        </div>
      </dl>

      <section aria-label="Candidate assessment" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-text-primary">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> Data quality
            </span>
            <span className="font-semibold tabular-nums text-text-primary">{Math.round(qualityScore * 100)}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-bg-secondary"
            role="meter"
            aria-label="Data quality"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(qualityScore * 100)}
          >
            <div
              className={cn(
                "h-full rounded-full",
                qualityScore < 0.4 ? "bg-error" : qualityScore <= 0.7 ? "bg-warning" : "bg-success",
              )}
              style={{ width: `${qualityScore * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-text-primary">
              <ShieldAlert className="h-4 w-4 text-accent" aria-hidden="true" /> Identity match
            </span>
            <span className="font-semibold text-text-primary">
              {matchScore === 0 ? "New entry" : `${Math.round(matchScore * 100)}%`}
            </span>
          </div>
          {matchScore > 0 ? (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-bg-secondary"
              role="meter"
              aria-label="Identity match"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(matchScore * 100)}
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${matchScore * 100}%` }} />
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-text-secondary">No existing repository match was found.</p>
          )}
        </div>
      </section>

      <details className="group border-t border-border pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text-primary outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
          <span>Original extracted reference</span>
          <span className="text-xs font-normal text-text-secondary group-open:hidden">Show</span>
          <span className="hidden text-xs font-normal text-text-secondary group-open:inline">Hide</span>
        </summary>
        <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-bg-secondary px-4 py-3 text-sm leading-relaxed text-text-secondary">
          {rawReference || "No raw reference text available."}
        </p>
      </details>
    </div>
  );

  return (
    <div className={cn("flex flex-col bg-surface-white", !isModal && "h-full overflow-hidden border-l border-border shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200 motion-reduce:animate-none w-full lg:w-[450px]")}>
      {!isModal && (
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-bg-secondary/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-accent">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-semibold text-text-primary">Candidate details</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close candidate details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {isModal ? content : <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>}

      {!isModal && (
        <div className="shrink-0 border-t border-border bg-bg-secondary/50 p-4">
          <CandidateDetailActions
            candidate={candidate}
            onAction={onAction}
            isProcessing={isProcessing}
            layout="stacked"
          />
        </div>
      )}
    </div>
  );
};

export default CandidateDetailPanel;
