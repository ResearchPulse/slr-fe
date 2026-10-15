import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertTriangle, FiCheck, FiHelpCircle, FiPlus, FiRefreshCw, FiX } from "react-icons/fi";
import { picocWizardStateService } from "../../../services/picocWizardStateService";
import {
  addCustomTerm,
  applyReviewFlags,
  buildSuggestionRequest,
  COMPONENT_LABELS,
  COMPONENT_QUESTIONS,
  keepItem,
  normalizeLabel,
  ORIGIN_LABELS,
  removeItem,
  setComparisonNotApplicable,
  setSuggestionState,
  upstreamSignature,
} from "./picocDraft";
import type { PicocComponent, PicocItem, PicocSuggestion, PicocWizardDraft } from "./types";

export interface SuggestionCacheEntry {
  signature: string;
  suggestions: PicocSuggestion[];
  source: "ai" | "openalex_fallback";
  fallbackReason: string | null;
}

interface ComponentStepProps {
  projectId: string;
  component: PicocComponent;
  draft: PicocWizardDraft;
  update: (change: (current: PicocWizardDraft) => PicocWizardDraft) => void;
  /** Suggestions per component, kept by the wizard so revisiting a step does not re-query the AI. */
  cache: Partial<Record<PicocComponent, SuggestionCacheEntry>>;
}

const FALLBACK_REASONS: Record<string, string> = {
  AI_TIMEOUT: "the AI service timed out",
  AI_NOT_CONFIGURED: "the AI service is not configured",
  AI_INVALID_OUTPUT: "the AI returned unusable suggestions",
  AI_UNAVAILABLE: "the AI service is unavailable",
};

const ComponentStep: React.FC<ComponentStepProps> = ({ projectId, component, draft, update, cache }) => {
  const signature = useMemo(() => upstreamSignature(draft, component), [draft, component]);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const cached = cache[component];
  const [entry, setEntry] = useState<SuggestionCacheEntry | undefined>(cached);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [openRationale, setOpenRationale] = useState<string | null>(null);
  const [customTerm, setCustomTerm] = useState("");
  const [naChecked, setNaChecked] = useState(Boolean(draft.comparisonNotApplicable));
  const [naReason, setNaReason] = useState(draft.comparisonNotApplicable?.reason ?? "");

  const fetchSuggestions = useCallback(async (mode: "refresh" | "more") => {
    setLoading(true);
    setRequestError(false);
    try {
      const shown = mode === "more" ? (cache[component]?.suggestions ?? []).map((item) => item.label) : [];
      const response = await picocWizardStateService.suggest(projectId, buildSuggestionRequest(draftRef.current, component, mode, shown));
      const previous = cache[component];
      const next: SuggestionCacheEntry = {
        signature,
        suggestions: mode === "more" ? [...(previous?.suggestions ?? []), ...response.suggestions] : response.suggestions,
        source: response.source,
        fallbackReason: response.fallbackReason,
      };
      cache[component] = next;
      setEntry(next);
      picocWizardStateService.track(projectId, "suggestion_viewed", {
        component,
        source: response.source === "ai" ? "ai" : "openalex_fallback",
        count: response.suggestions.length,
      });
      // Only flag selections when an earlier step changed during this session (T-08).
      if (mode === "refresh" && previous && previous.signature !== signature) {
        update((current) => applyReviewFlags(current, component, response.selectionsToReview));
      }
    } catch {
      setRequestError(true);
    } finally {
      setLoading(false);
    }
  }, [cache, component, projectId, signature, update]);

  useEffect(() => {
    if (!draft.intent.topic.trim()) return;
    if (cache[component]?.signature === signature) {
      setEntry(cache[component]);
      return;
    }
    void fetchSuggestions("refresh");
  }, [component, signature]);

  const items = draft.picoc[component];
  const itemFor = (label: string) => items.find((item) => normalizeLabel(item.label) === normalizeLabel(label));
  const suggestionLabels = new Set((entry?.suggestions ?? []).map((item) => normalizeLabel(item.label)));
  const otherItems = items.filter((item) => !suggestionLabels.has(normalizeLabel(item.label)));

  const toggle = (suggestion: PicocSuggestion, status: PicocItem["status"]) => {
    const current = itemFor(suggestion.label);
    const next = current?.status === status ? null : status;
    update((value) => setSuggestionState(value, component, suggestion, next));
    if (next === "selected") picocWizardStateService.track(projectId, "suggestion_selected", { component, source: suggestion.sourceType });
  };

  const addCustom = () => {
    if (!customTerm.trim()) return;
    update((value) => addCustomTerm(value, component, customTerm));
    picocWizardStateService.track(projectId, "custom_concept_added", { component });
    setCustomTerm("");
  };

  const applyNa = (checked: boolean, reason: string) => {
    setNaChecked(checked);
    setNaReason(reason);
    if (!checked) {
      if (draft.comparisonNotApplicable) update((value) => setComparisonNotApplicable(value, null));
    } else if (reason.trim()) {
      update((value) => setComparisonNotApplicable(value, reason.trim()));
    } else if (draft.comparisonNotApplicable) {
      // N/A without a reason is not saved.
      update((value) => setComparisonNotApplicable(value, null));
    }
  };

  // Selecting a comparator clears N/A in the draft; keep the checkbox in sync.
  useEffect(() => {
    if (component === "comparison" && !draft.comparisonNotApplicable && naChecked && naReason.trim()) setNaChecked(false);
  }, [draft.comparisonNotApplicable]);

  return (
    <section aria-labelledby={`picoc-step-${component}`} className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary">{COMPONENT_LABELS[component]}</p>
        <h3 id={`picoc-step-${component}`} className="mt-1 font-cormorant text-[28px] text-text-primary">{COMPONENT_QUESTIONS[component]}</h3>
        <p className="mt-1 text-sm text-text-secondary">Select every term that applies. Suggestions are not chosen for you; mark a term "Not sure" to come back to it.</p>
      </header>

      {component === "comparison" ? (
        <div className="border border-border bg-bg-primary p-4">
          <label className="flex items-start gap-3 text-sm text-text-primary">
            <input type="checkbox" checked={naChecked} onChange={(event) => applyNa(event.target.checked, naReason)} className="mt-1" />
            <span>
              Comparison is not applicable (N/A) for this review
              <span className="block text-xs text-text-secondary">
                {draft.reviewType === "comparative"
                  ? "Comparative reviews normally need a comparator — N/A will be flagged for review."
                  : "Common for mapping and exploratory reviews. Selected comparators are removed."}
              </span>
            </span>
          </label>
          {naChecked ? (
            <div className="mt-3">
              <label htmlFor="picoc-na-reason" className="text-xs font-medium text-text-primary">Reason (required)</label>
              <textarea
                id="picoc-na-reason"
                value={naReason}
                onChange={(event) => applyNa(true, event.target.value)}
                rows={2}
                maxLength={1000}
                className="mt-1 w-full border border-border bg-surface-white p-2 text-sm"
                aria-invalid={!naReason.trim()}
              />
              {!naReason.trim() ? <p role="alert" className="text-xs text-text-primary">Enter a reason to mark Comparison as N/A.</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {entry?.source === "openalex_fallback" ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 border border-border bg-bg-secondary p-3 text-sm text-text-primary">
          <span className="flex items-center gap-2">
            <FiAlertTriangle aria-hidden />
            AI suggestions are unavailable ({FALLBACK_REASONS[entry.fallbackReason ?? ""] ?? "unknown reason"}). Showing OpenAlex keywords instead — you can also add your own terms.
          </span>
          <button type="button" onClick={() => void fetchSuggestions("refresh")} className="inline-flex items-center gap-1 border border-text-primary px-3 py-1 text-xs">
            <FiRefreshCw aria-hidden /> Retry AI suggestions
          </button>
        </div>
      ) : null}

      {requestError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-border bg-bg-secondary p-3 text-sm">
          <span>Could not load suggestions. You can still add your own terms.</span>
          <button type="button" onClick={() => void fetchSuggestions("refresh")} className="inline-flex items-center gap-1 border border-text-primary px-3 py-1 text-xs">
            <FiRefreshCw aria-hidden /> Try again
          </button>
        </div>
      ) : null}

      {loading && !entry ? <p role="status" className="text-sm text-text-secondary">Generating suggestions…</p> : null}
      {!draft.intent.topic.trim() ? <p className="text-sm text-text-secondary">Enter the research topic first to get suggestions.</p> : null}

      {entry && entry.suggestions.length === 0 && !loading ? (
        <p className="text-sm text-text-secondary">No suggestions are available. Add your own terms below.</p>
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {(entry?.suggestions ?? []).map((suggestion) => {
          const current = itemFor(suggestion.label);
          const selected = current?.status === "selected";
          const unsure = current?.status === "unsure";
          return (
            <li key={suggestion.conceptId + suggestion.label} className={`border p-4 ${selected ? "border-text-primary" : "border-border"} bg-surface-white`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{suggestion.label}</p>
                  {suggestion.synonyms.length ? <p className="text-xs text-text-secondary">Also: {suggestion.synonyms.join(", ")}</p> : null}
                </div>
                <span className="shrink-0 border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-secondary">
                  {ORIGIN_LABELS[suggestion.sourceType]}
                </span>
              </div>
              {current?.needsReview ? <p className="mt-1 text-xs text-text-primary"><FiAlertTriangle aria-hidden className="mr-1 inline" />Needs review</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(suggestion, "selected")}
                  className={`inline-flex items-center gap-1 border px-3 py-1 text-xs ${selected ? "border-text-primary bg-text-primary text-surface-white" : "border-border text-text-primary"}`}
                >
                  <FiCheck aria-hidden /> {selected ? "Selected" : "Select"}
                </button>
                <button
                  type="button"
                  aria-pressed={unsure}
                  onClick={() => toggle(suggestion, "unsure")}
                  className={`inline-flex items-center gap-1 border px-3 py-1 text-xs ${unsure ? "border-text-primary bg-bg-secondary text-text-primary" : "border-border text-text-secondary"}`}
                >
                  <FiHelpCircle aria-hidden /> Not sure
                </button>
                <button
                  type="button"
                  aria-expanded={openRationale === suggestion.conceptId}
                  onClick={() => setOpenRationale(openRationale === suggestion.conceptId ? null : suggestion.conceptId)}
                  className="px-1 text-xs text-text-secondary underline underline-offset-4"
                >
                  Why?
                </button>
              </div>
              {openRationale === suggestion.conceptId ? <p className="mt-2 text-xs leading-5 text-text-secondary">{suggestion.rationale}</p> : null}
            </li>
          );
        })}
      </ul>

      {entry ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void fetchSuggestions("more")}
          className="inline-flex items-center gap-1 border border-border px-3 py-1.5 text-xs text-text-primary disabled:opacity-50"
        >
          <FiRefreshCw aria-hidden /> {loading ? "Loading…" : "Show more suggestions"}
        </button>
      ) : null}

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addCustom();
        }}
      >
        <label htmlFor={`picoc-custom-${component}`} className="sr-only">Add your own {COMPONENT_LABELS[component]} term</label>
        <input
          id={`picoc-custom-${component}`}
          value={customTerm}
          onChange={(event) => setCustomTerm(event.target.value)}
          maxLength={300}
          placeholder={`Add your own ${COMPONENT_LABELS[component].toLowerCase()} term`}
          className="min-w-0 flex-1 border border-border bg-surface-white px-3 py-2 text-sm"
        />
        <button type="submit" className="inline-flex items-center gap-1 border border-text-primary px-3 py-2 text-xs text-text-primary">
          <FiPlus aria-hidden /> Add
        </button>
      </form>

      {otherItems.length > 0 ? (
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">Your other terms</p>
          <ul className="mt-2 divide-y divide-border border border-border bg-surface-white">
            {otherItems.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="text-text-primary">
                  {item.label}
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-text-muted">{ORIGIN_LABELS[item.origin]}</span>
                  {item.status === "unsure" ? <span className="ml-2 text-xs text-text-secondary">Not sure</span> : null}
                  {item.needsReview ? <span className="ml-2 text-xs text-text-primary"><FiAlertTriangle aria-hidden className="mr-1 inline" />Needs review — no longer suggested after an earlier change</span> : null}
                </span>
                <span className="flex gap-2">
                  {item.needsReview ? (
                    <button type="button" onClick={() => update((value) => keepItem(value, component, item.id))} className="border border-border px-2 py-0.5 text-xs">Keep</button>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => update((value) => removeItem(value, component, item.id))}
                    className="inline-flex items-center border border-border px-2 py-0.5 text-xs"
                  >
                    <FiX aria-hidden /> Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default ComponentStep;
