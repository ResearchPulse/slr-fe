import type { StatusFilter, MatchStatus } from "./types";
import { PaperSortBy } from "../../../../types/studySelection";

// ============================================
// Status Colors & Labels
// ============================================

export const STATUS_CONFIG = {
  pending: {
    label: "Not Screened",
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
// Sort Options
// ============================================

export const SORT_OPTIONS: { label: string; value: PaperSortBy }[] = [
  { label: "AI Relevance Score", value: PaperSortBy.RelevanceDesc },
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

import { ExclusionReasonCode } from "../../../../types/studySelection";

export const EXCLUDE_REASONS = [
  { label: "Wrong study type", value: ExclusionReasonCode.NotResearchPaper },
  { label: "Not empirical research", value: ExclusionReasonCode.NotEmpiricalStudy },
  { label: "Methodology insufficient", value: ExclusionReasonCode.Other },
  { label: "Outcome not relevant", value: ExclusionReasonCode.NotRelevantToTopic },
  { label: "Dataset not appropriate", value: ExclusionReasonCode.Other },
  { label: "Wrong population", value: ExclusionReasonCode.NotRelevantPopulation },
  { label: "Wrong intervention", value: ExclusionReasonCode.NotRelevantIntervention },
  { label: "Not within time range", value: ExclusionReasonCode.OutsideTimeRange },
  { label: "Language mismatch", value: ExclusionReasonCode.UnsupportedLanguage },
  { label: "Duplicate study", value: ExclusionReasonCode.DuplicateStudy },
  { label: "Full text unavailable", value: ExclusionReasonCode.Other },
  { label: "Other", value: ExclusionReasonCode.Other },
] as const;

// ============================================
// Paper Sections (for PDF navigation)
// ============================================

export const PAPER_SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "methodology", label: "Methodology" },
  { id: "population", label: "Population / Dataset" },
  { id: "experiment", label: "Experiment / Study Design" },
  { id: "results", label: "Results" },
  { id: "conclusion", label: "Conclusion" },
] as const;

// ============================================
// AI Match Status Config
// ============================================

export const MATCH_STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; icon: string; color: string; bg: string }
> = {
  match: { label: "Match", icon: "check", color: "text-success", bg: "bg-success/10" },
  partial_match: {
    label: "Partial Match",
    icon: "alert-circle",
    color: "text-warning",
    bg: "bg-warning/10",
  },
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

// ============================================
// Keyboard Shortcuts
// ============================================

export const SCREENING_SHORTCUTS = {
  INCLUDE: "1",
  EXCLUDE: "2",
  NEXT_PAPER: "ArrowDown",
  PREV_PAPER: "ArrowUp",
} as const;
