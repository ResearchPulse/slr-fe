import type { StatusFilter, MatchStatus } from "./types";
import { PaperSortBy } from "../../../../types/studySelection";

// ============================================
// Keyboard Shortcuts
// ============================================

export const SCREENING_SHORTCUTS = {
  INCLUDE: "1",
  EXCLUDE: "2",
  NEXT_PAPER: "ArrowDown",
  PREV_PAPER: "ArrowUp",
} as const;

// ============================================
// Status Colors & Labels
// ============================================

export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "gray",
    bg: "bg-bg-secondary",
    text: "text-text-secondary",
    border: "border-border",
    dot: "bg-text-secondary",
  },
  included: {
    label: "Included",
    color: "green",
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    dot: "bg-success",
  },
  excluded: {
    label: "Excluded",
    color: "red",
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error/20",
    dot: "bg-error",
  },
  conflicted: {
    label: "Conflicted",
    color: "amber",
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    dot: "bg-warning",
  },
} as const;

// ============================================
// Sort Options (maps to PaperSortBy enum for server-side sorting)
// ============================================

export const SORT_OPTIONS: { label: string; value: PaperSortBy }[] = [
  { label: "Relevance Score", value: PaperSortBy.RelevanceDesc },
  { label: "Title A–Z", value: PaperSortBy.TitleAsc },
  { label: "Title Z–A", value: PaperSortBy.TitleDesc },
  { label: "Year (Newest)", value: PaperSortBy.YearNewest },
  { label: "Year (Oldest)", value: PaperSortBy.YearOldest },
];

// ============================================
// Filter Options
// ============================================

export const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "All Papers", value: "all" },
  { label: "Not Screened", value: "pending" },
  { label: "Included", value: "included" },
  { label: "Excluded", value: "excluded" },
  { label: "Conflicted", value: "conflicted" },
];

// ============================================
// Exclude Reasons
// ============================================

import { ExclusionReasonCode } from "../../../../types/studySelection";

export const EXCLUDE_REASONS: { label: string; value: ExclusionReasonCode }[] = [
  { label: "Not Relevant to Topic", value: ExclusionReasonCode.NotRelevantToTopic },
  { label: "Not Relevant Population", value: ExclusionReasonCode.NotRelevantPopulation },
  { label: "Not Relevant Intervention", value: ExclusionReasonCode.NotRelevantIntervention },
  { label: "Not Empirical Study", value: ExclusionReasonCode.NotEmpiricalStudy },
  { label: "Not Research Paper", value: ExclusionReasonCode.NotResearchPaper },
  { label: "Outside Time Range", value: ExclusionReasonCode.OutsideTimeRange },
  { label: "Unsupported Language", value: ExclusionReasonCode.UnsupportedLanguage },
  { label: "Duplicate Study", value: ExclusionReasonCode.DuplicateStudy },
  { label: "Other", value: ExclusionReasonCode.Other },
];

// ============================================
// AI Match Status Config
// ============================================

export const MATCH_STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; icon: string; color: string; bg: string }
> = {
  match: { label: "Match", icon: "check", color: "text-success", bg: "bg-success/10" },
  partial_match: { label: "Partial Match", icon: "alert", color: "text-warning", bg: "bg-warning/10" },
  not_match: { label: "Not Match", icon: "x", color: "text-error", bg: "bg-error/10" },
  unknown: { label: "Unknown", icon: "help", color: "text-text-secondary", bg: "bg-bg-secondary" },
} as const;

// ============================================
// PICOC Labels
// ============================================

export const PICOC_LABELS: Record<string, string> = {
  population: "Population",
  intervention: "Intervention",
  comparison: "Comparison",
  outcome: "Outcome",
  context: "Context",
} as const;
