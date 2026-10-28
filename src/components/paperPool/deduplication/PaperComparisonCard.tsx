// Paper Comparison Card with diff highlighting and expandable abstract
// Simplified for the new deduplication model — no survivor chain, display-only

import { useState, useCallback } from "react";
import {
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import type {
  DuplicatePaperInfo,
  DiffSegment,
} from "../../../types/deduplication";
import {
  computeWordDiff,
  fieldsAreDifferent,
} from "../../../pages/reviewProcess/identification/utils";

type CardOutcome = "kept" | "removed" | null;

interface PaperComparisonCardProps {
  label: string;
  labelColor: string;
  paper: DuplicatePaperInfo;
  otherPaper: DuplicatePaperInfo;
  isResolved: boolean;
  /** Which side this card represents */
  side: "original" | "duplicate";
  /** The resolution decision (if resolved): "cancel" or "keep-both" */
  resolvedDecision?: string | null;
  /** Whether to show differences highlighting (only applies to duplicate side) */
  showDiffs?: boolean;
}

function getCardOutcome(
  side: "original" | "duplicate",
  resolvedDecision?: string | null,
): CardOutcome {
  if (!resolvedDecision) return null;
  if (resolvedDecision === "keep-both") return "kept";
  // "cancel" means the duplicate (PaperId) is removed, original stays
  if (resolvedDecision === "cancel") {
    return side === "duplicate" ? "removed" : "kept";
  }
  return null;
}

export default function PaperComparisonCard({
  label,
  labelColor,
  paper,
  otherPaper,
  isResolved,
  side,
  resolvedDecision,
  showDiffs = true,
}: PaperComparisonCardProps) {
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const [copiedDoi, setCopiedDoi] = useState(false);

  const outcome = isResolved ? getCardOutcome(side, resolvedDecision) : null;
  const displayDiff = showDiffs && side === "duplicate";

  const handleCopyDoi = useCallback(async () => {
    if (!paper.doi) return;
    try {
      await navigator.clipboard.writeText(paper.doi);
      setCopiedDoi(true);
      setTimeout(() => setCopiedDoi(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [paper.doi]);

  // Compute diffs against the other paper
  const titleDiff = computeWordDiff(paper.title, otherPaper.title);
  const authorsDiff = computeWordDiff(paper.authors, otherPaper.authors);
  const abstractDiff = computeWordDiff(paper.abstract, otherPaper.abstract);

  const yearDiffers = fieldsAreDifferent(paper.year, otherPaper.year);
  const sourceDiffers = fieldsAreDifferent(paper.source, otherPaper.source);
  const doiDiffers = fieldsAreDifferent(paper.doi, otherPaper.doi);

  const ABSTRACT_TRUNCATE = 150;
  const abstractIsLong = paper.abstract.length > ABSTRACT_TRUNCATE;

  const cardBorderClass =
    outcome === "kept"
      ? "border-success/30 bg-success/5"
      : outcome === "removed"
        ? "border-border bg-surface-white/30 opacity-60"
        : isResolved
          ? "border-border bg-bg-primary opacity-70"
          : "border-border bg-surface-white";

  return (
    <div
      className={`relative border rounded-xl p-4 transition-colors motion-reduce:transition-none ${cardBorderClass}`}
    >
      {/* Resolution outcome badge */}
      {outcome && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-none ${
            outcome === "kept"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-error/10 text-error border border-error/20"
          }`}
        >
          {outcome === "kept" ? (
            <>
              <FiCheckCircle className="w-3 h-3" /> Not Duplicate
            </>
          ) : (
            <>
              <FiXCircle className="w-3 h-3" /> Duplicate Removed
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold ${labelColor}`}>{label}</span>
        <span className="text-xs font-bold text-text-secondary">
          {side === "original" ? "Original" : "Duplicate"}
        </span>
      </div>

      <div className="space-y-3">
        <ComparisonField
          label="Title"
          diff={titleDiff}
          value={paper.title}
          showDiff={displayDiff}
        />

        {/* Authors with diff (only on duplicate side) */}
        <ComparisonField
          label="Authors"
          diff={authorsDiff}
          value={paper.authors}
          showDiff={displayDiff}
        />

        {/* Year + Source row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <FieldLabel label="Year" isDifferent={displayDiff && yearDiffers} />
            <p
              className={`text-sm mt-1 ${
                displayDiff && yearDiffers
                  ? "text-warning font-medium"
                  : "text-text-primary"
              }`}
            >
              {paper.year || "—"}
            </p>
          </div>
          <div className="flex-1">
            <FieldLabel
              label="Source"
              isDifferent={displayDiff && sourceDiffers}
            />
            <p
              className={`text-sm mt-1 ${
                displayDiff && sourceDiffers
                  ? "text-warning font-medium"
                  : "text-text-primary"
              }`}
            >
              {paper.source || "—"}
            </p>
          </div>
        </div>

        {/* DOI with copy action */}
        <div>
          <FieldLabel label="DOI" isDifferent={displayDiff && doiDiffers} />
          {paper.doi ? (
            <div className="flex items-center gap-2 mt-1">
              <p
                className={`text-sm font-mono flex-1 truncate ${
                  displayDiff && doiDiffers
                    ? "text-warning"
                    : "text-text-primary"
                }`}
              >
                {paper.doi}
              </p>
              <button
                onClick={handleCopyDoi}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-secondary"
                title="Copy DOI"
                aria-label="Copy DOI"
              >
                {copiedDoi ? (
                  <FiCheck className="w-3.5 h-3.5 text-success" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-1 italic">
              No DOI available
            </p>
          )}
        </div>

        {/* Abstract with expand/collapse and diff (only on duplicate side) */}
        <div>
          <label className="text-xs font-medium text-text-secondary">
            Abstract
          </label>
          <div className="mt-1">
            {isAbstractExpanded ? (
              displayDiff ? (
                <DiffText
                  segments={abstractDiff}
                  className="text-xs leading-relaxed"
                />
              ) : (
                <p className="text-xs text-text-primary leading-relaxed">
                  {paper.abstract || "No abstract available"}
                </p>
              )
            ) : (
              <p className="text-xs text-text-primary leading-relaxed">
                {(paper.abstract || "").length > ABSTRACT_TRUNCATE
                  ? paper.abstract.substring(0, ABSTRACT_TRUNCATE) + "..."
                  : paper.abstract || "No abstract available"}
              </p>
            )}
          </div>
          {abstractIsLong && (
            <button
              onClick={() => setIsAbstractExpanded((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-accent hover:text-primary-hover mt-1 transition-colors"
            >
              {isAbstractExpanded ? (
                <>
                  <FiChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <FiChevronDown className="w-3 h-3" />
                  {displayDiff
                    ? "Show full abstract with diff"
                    : "Show full abstract"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function FieldLabel({
  label,
  isDifferent,
}: {
  label: string;
  isDifferent: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      {isDifferent && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-warning"
          title="Differs from other paper"
        />
      )}
    </div>
  );
}

function ComparisonField({
  label,
  diff,
  value,
  showDiff,
}: {
  label: string;
  diff: DiffSegment[];
  value: string;
  showDiff: boolean;
}) {
  const hasDiffs = showDiff && diff.some((s) => s.type !== "same");
  const isDifferent = diff.some((s) => s.type !== "same");

  return (
    <div>
      <FieldLabel label={label} isDifferent={showDiff && isDifferent} />
      <div className="mt-1">
        {hasDiffs ? (
          <DiffText segments={diff} className="text-sm" />
        ) : (
          <p className="text-sm text-text-primary">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

function DiffText({
  segments,
  className = "",
}: {
  segments: DiffSegment[];
  className?: string;
}) {
  return (
    <p className={className}>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "same":
            return (
              <span key={i} className="text-text-primary">
                {seg.text}{" "}
              </span>
            );
          case "removed":
            // Word unique to THIS paper (not in the other) → highlight green
            return (
              <span
                key={i}
                className="bg-success/10 text-success rounded px-0.5 font-medium"
              >
                {seg.text}{" "}
              </span>
            );
          case "added":
            // Word unique to the OTHER paper (not in this one) → red strikethrough
            return (
              <span
                key={i}
                className="bg-error/10 text-error rounded px-0.5 line-through"
              >
                {seg.text}{" "}
              </span>
            );
        }
      })}
    </p>
  );
}
