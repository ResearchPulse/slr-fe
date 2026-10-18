import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiCheck, FiLoader, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { picocWizardStateService } from "../../../services/picocWizardStateService";
import { normalizeLabel } from "./picocDraft";
import type {
  ClassifiedTopic,
  FieldClassification,
  PicocKeyword,
  PicocWizardDraft,
  ResearchField,
  Taxon,
  TaxonomyItem,
  TaxonomyLevel,
} from "./types";

interface FieldStepProps {
  projectId: string;
  draft: PicocWizardDraft;
  update: (change: (current: PicocWizardDraft) => PicocWizardDraft) => void;
}

const CANONICAL: Record<"topic" | "subfield" | "field" | "domain", RegExp> = {
  topic: /^https:\/\/openalex\.org\/T\d+$/,
  subfield: /^https:\/\/openalex\.org\/subfields\/\d+$/,
  field: /^https:\/\/openalex\.org\/fields\/\d+$/,
  domain: /^https:\/\/openalex\.org\/domains\/\d+$/,
};

/** Keeps only canonical OpenAlex IDs so the saved field is never rejected by the server. */
const taxon = (value: Taxon | undefined, level: keyof typeof CANONICAL) =>
  value && CANONICAL[level].test(value.id) ? { id: value.id, label: value.label } : undefined;

const pathOf = (topic: ClassifiedTopic) => [topic.domain?.label, topic.field?.label, topic.subfield?.label].filter(Boolean).join(" → ");

const NEXT_LEVEL: Record<TaxonomyLevel, TaxonomyLevel | null> = { domain: "field", field: "subfield", subfield: "topic", topic: null };

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.error?.code as string | undefined;
    if (code === "OPENALEX_TIMEOUT") return "OpenAlex did not respond in time.";
    if (code === "OPENALEX_RATE_LIMITED") return "OpenAlex is busy right now. Try again in a moment.";
    if (code === "OPENALEX_CONFIGURATION") return "OpenAlex is not configured on the server.";
    if (error.response?.status === 400) return "Title and abstract must total 20 to 2000 characters.";
  }
  return "Field suggestions are unavailable.";
}

const FieldStep: React.FC<FieldStepProps> = ({ projectId, draft, update }) => {
  const [title, setTitle] = useState(draft.intent.topic);
  const [abstract, setAbstract] = useState(draft.intent.description);
  const [consent, setConsent] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<FieldClassification | null>(null);
  const [chosenTopicId, setChosenTopicId] = useState<string | null>(null);
  const [keptKeywordIds, setKeptKeywordIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [browsePath, setBrowsePath] = useState<TaxonomyItem[]>([]);
  const [browseItems, setBrowseItems] = useState<TaxonomyItem[]>([]);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseLevel, setBrowseLevel] = useState<TaxonomyLevel>("domain");
  const [browseParentId, setBrowseParentId] = useState<string | undefined>();
  const [browseLoading, setBrowseLoading] = useState(false);
  const browseRequestId = useRef(0);
  const [customKeyword, setCustomKeyword] = useState("");

  const length = Array.from(`${title.trim()}${abstract.trim()}`).length;
  const canClassify = consent && title.trim() && abstract.trim() && length >= 20 && length <= 2000 && !classifying;

  const editInput = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setConsent(false); // Consent covers the exact text and must be given again after edits.
  };

  const classify = async () => {
    setClassifying(true);
    setError(null);
    try {
      const result = await picocWizardStateService.classify(projectId, title.trim(), abstract.trim());
      setClassification(result);
      setChosenTopicId(result.primaryTopic?.id ?? null);
      setKeptKeywordIds(new Set(result.keywords.map((keyword) => keyword.id)));
    } catch (classifyError) {
      setError(errorMessage(classifyError));
    } finally {
      setClassifying(false);
      setConsent(false);
    }
  };

  const loadLevel = async (level: TaxonomyLevel, parentId?: string, search?: string) => {
    const requestId = ++browseRequestId.current;
    setBrowseError(null);
    setBrowseLoading(true);
    try {
      const page = await picocWizardStateService.browseTaxonomy(projectId, level, parentId, search);
      if (requestId === browseRequestId.current) setBrowseItems(page.items);
    } catch {
      if (requestId === browseRequestId.current) setBrowseError("Could not load the OpenAlex taxonomy. Try again later.");
    } finally {
      if (requestId === browseRequestId.current) setBrowseLoading(false);
    }
  };

  useEffect(() => {
    if (!browsing) return undefined;
    const timer = window.setTimeout(() => {
      void loadLevel(browseLevel, browseParentId, browseSearch.trim() || undefined);
    }, browseSearch.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [browseLevel, browseParentId, browseSearch, browsing, projectId]);

  const startBrowse = () => {
    setBrowsing(true);
    setBrowsePath([]);
    setBrowseLevel("domain");
    setBrowseParentId(undefined);
    setBrowseSearch("");
    setBrowseError(null);
  };

  const toggleBrowse = () => {
    if (!browsing) {
      startBrowse();
      return;
    }
    browseRequestId.current += 1;
    setBrowseLoading(false);
    setBrowsing(false);
  };

  const pick = (item: TaxonomyItem) => {
    const nextLevel = NEXT_LEVEL[item.level];
    const path = [...browsePath, item];
    setBrowsePath(path);
    setBrowseSearch("");
    if (nextLevel) {
      setBrowseLevel(nextLevel);
      setBrowseParentId(item.id);
    } else {
      browseRequestId.current += 1;
      setBrowseItems([]);
      setBrowseLoading(false);
    }
  };

  const confirmField = (field: ResearchField, openAlexKeywords: PicocKeyword[]) => {
    update((value) => {
      const userKeywords = value.keywords.filter((keyword) => keyword.origin === "user");
      return {
        ...value,
        researchField: field,
        keywords: field.source === "openalex_suggestion" ? [...openAlexKeywords, ...userKeywords] : value.keywords,
      };
    });
    setClassification(null);
    setBrowsing(false);
    picocWizardStateService.track(projectId, "field_confirmed", { source: field.source === "openalex_suggestion" ? "openalex" : "user" });
  };

  const confirmSuggestion = () => {
    if (!classification) return;
    const topic = [classification.primaryTopic, ...classification.alternatives].find((item) => item?.id === chosenTopicId);
    if (!topic || !CANONICAL.topic.test(topic.id)) return;
    confirmField({
      topic: { id: topic.id, label: topic.label },
      subfield: taxon(topic.subfield, "subfield"),
      field: taxon(topic.field, "field"),
      domain: taxon(topic.domain, "domain"),
      source: "openalex_suggestion",
      classifierVersion: classification.classifierVersion,
    }, classification.keywords.map((keyword) => ({ id: keyword.id, label: keyword.label, origin: "openalex", kept: keptKeywordIds.has(keyword.id) })));
  };

  const browsedTopic = browsePath.find((item) => item.level === "topic");
  const confirmBrowse = () => {
    if (!browsedTopic) return;
    const at = (level: TaxonomyLevel) => browsePath.find((item) => item.level === level);
    confirmField({
      topic: { id: browsedTopic.id, label: browsedTopic.label },
      subfield: taxon(at("subfield"), "subfield"),
      field: taxon(at("field"), "field"),
      domain: taxon(at("domain"), "domain"),
      source: "manual_browse",
      classifierVersion: null,
    }, []);
  };

  const toggleKeyword = (label: string) => update((value) => ({
    ...value,
    keywords: value.keywords.map((keyword) => (keyword.label === label ? { ...keyword, kept: !keyword.kept } : keyword)),
  }));

  const addKeyword = () => {
    const label = customKeyword.trim();
    if (!label) return;
    update((value) => value.keywords.some((keyword) => normalizeLabel(keyword.label) === normalizeLabel(label))
      ? value
      : { ...value, keywords: [...value.keywords, { label: label.slice(0, 300), origin: "user", kept: true }] });
    setCustomKeyword("");
  };

  const topics = classification ? [classification.primaryTopic, ...classification.alternatives].filter((topic): topic is ClassifiedTopic => Boolean(topic)) : [];

  return (
    <section aria-labelledby="picoc-step-field" className="space-y-6">
      <header>
        <p className="text-xs font-semibold text-primary">Research field</p>
        <h3 id="picoc-step-field" className="mt-1 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">Which research field does this review belong to?</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">OpenAlex suggests a topic from your title and abstract. Nothing is confirmed until you choose and confirm it.</p>
      </header>

      {draft.researchField ? (
        <div className="rounded-xl border border-primary/20 bg-primary-light/50 p-4">
          <p className="text-xs font-semibold text-primary">Confirmed field</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{draft.researchField.topic.label}</p>
          <p className="text-xs text-text-secondary">{[draft.researchField.domain?.label, draft.researchField.field?.label, draft.researchField.subfield?.label].filter(Boolean).join(" → ")}</p>
        </div>
      ) : null}

      <div className="space-y-5 rounded-xl border border-border bg-bg-primary/60 p-4 sm:p-5">
        <div>
          <label htmlFor="picoc-field-title" className="text-sm font-semibold text-text-primary">Title</label>
          <input id="picoc-field-title" value={title} maxLength={2000} onChange={(event) => editInput(setTitle)(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </div>
        <div>
          <label htmlFor="picoc-field-abstract" className="text-sm font-semibold text-text-primary">Abstract / description</label>
          <textarea id="picoc-field-abstract" value={abstract} rows={4} maxLength={2000} onChange={(event) => editInput(setAbstract)(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-border bg-surface-white px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
          <p className="mt-1.5 text-xs text-text-secondary">{length}/2000 characters (minimum 20). A short or generic text may return no topic.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-white p-3 text-xs leading-5 text-text-secondary">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
          <span>Send this exact title and abstract to OpenAlex (an external service) to suggest topics and keywords. Consent is needed for each request and resets when you edit the text.</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!canClassify} onClick={() => void classify()} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-45">
            {classifying ? "Asking OpenAlex…" : "Get field suggestions"}
          </button>
          <button type="button" onClick={toggleBrowse} aria-label="Browse fields manually" aria-expanded={browsing} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface-white px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">Search OpenAlex fields</button>
        </div>
        {error ? <p role="alert" className="rounded-lg border border-error/20 bg-error/5 p-3 text-sm leading-5 text-error">{error} You can browse the OpenAlex fields manually instead.</p> : null}
      </div>

      {classification ? (
        <div className="space-y-3">
          {topics.length === 0 ? (
            <p role="status" className="rounded-lg border border-border bg-bg-secondary p-3 text-sm leading-5 text-text-primary">
              OpenAlex found no topic{classification.providerNote ? `: ${classification.providerNote}` : "."} Add a more specific description and try again, or browse manually.
            </p>
          ) : (
            <fieldset>
              <legend className="text-sm font-semibold text-text-primary">Suggested topics</legend>
              <div className="mt-3 space-y-2">
                {topics.map((topic, index) => (
                  <label key={topic.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 ${chosenTopicId === topic.id ? "border-primary bg-primary-light/50" : "border-border bg-surface-white hover:bg-bg-primary"}`}>
                    <input type="radio" name="picoc-topic-choice" checked={chosenTopicId === topic.id} onChange={() => setChosenTopicId(topic.id)} className="mt-1 h-4 w-4 shrink-0 accent-primary" />
                    <span>
                      <span className="block font-medium text-text-primary">{topic.label}{index === 0 && classification.primaryTopic ? " · primary suggestion" : ""}</span>
                      <span className="block text-xs text-text-secondary">{pathOf(topic)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {classification.keywords.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-text-primary">OpenAlex keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {classification.keywords.map((keyword) => {
                  const kept = keptKeywordIds.has(keyword.id);
                  return (
                    <button
                      key={keyword.id}
                      type="button"
                      aria-pressed={kept}
                      onClick={() => setKeptKeywordIds((current) => {
                        const next = new Set(current);
                        if (kept) next.delete(keyword.id); else next.add(keyword.id);
                        return next;
                      })}
                      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${kept ? "border-primary/20 bg-primary-light text-primary" : "border-border bg-surface-white text-text-muted line-through"}`}
                    >
                      {kept ? <FiCheck aria-hidden /> : <FiX aria-hidden />} {keyword.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {topics.length > 0 ? (
              <button type="button" disabled={!chosenTopicId} onClick={confirmSuggestion} className="min-h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45">
              Confirm selected topic
            </button>
          ) : null}
        </div>
      ) : null}

      {browsing ? (
        <div className="space-y-4 rounded-xl border border-border bg-bg-primary/60 p-4 sm:p-5">
          <div>
            <label htmlFor="picoc-openalex-search" className="text-sm font-semibold text-text-primary">Find a research field in OpenAlex</label>
            <p className="mt-1 text-xs leading-5 text-text-secondary">Choose a domain, then narrow the list to a field, subfield and topic. Search applies to the current level.</p>
            <div className="relative mt-3">
              <FiSearch aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="picoc-openalex-search"
                type="search"
                value={browseSearch}
                onChange={(event) => setBrowseSearch(event.target.value)}
                placeholder={`Search OpenAlex ${browseLevel}s`}
                aria-label={`Search OpenAlex ${browseLevel}s`}
                className="min-h-11 w-full rounded-lg border border-border bg-surface-white py-2 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {browseSearch ? (
                <button type="button" onClick={() => setBrowseSearch("")} aria-label="Clear OpenAlex search" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-bg-secondary hover:text-text-primary">
                  <FiX aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
          <nav aria-label="Taxonomy path" className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">
            <button type="button" onClick={startBrowse} className="rounded-md px-1 py-1 font-medium text-primary underline underline-offset-4">All domains</button>
            {browsePath.map((item) => <span key={item.id} className="inline-flex items-center gap-1">{"\u203a"} {item.label}</span>)}
          </nav>
          {browseError ? <p role="alert" className="rounded-lg border border-error/20 bg-error/5 p-3 text-sm text-error">{browseError}</p> : null}
          {browseLoading ? (
            <p role="status" className="flex items-center gap-2 py-2 text-sm text-text-secondary"><FiLoader aria-hidden className="animate-spin" /> Searching OpenAlex…</p>
          ) : browseItems.length ? (
            <ul aria-label={`OpenAlex ${browseLevel} results`} className="grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {browseItems.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => pick(item)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface-white px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                    <span>{item.label}</span>
                    {NEXT_LEVEL[item.level] ? <span aria-hidden className="shrink-0 text-text-muted">{"\u203a"}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-border bg-surface-white p-3 text-sm text-text-secondary">No matching OpenAlex {browseLevel}s. Try another search.</p>
          )}
          {browsedTopic ? (
            <button type="button" onClick={confirmBrowse} className="min-h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover">
              Confirm “{browsedTopic.label}”
            </button>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-sm font-semibold text-text-primary">Keywords kept for this review</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {draft.keywords.length === 0 ? <span className="text-xs italic text-text-muted">None yet</span> : null}
          {draft.keywords.map((keyword) => (
            <button
              key={keyword.label}
              type="button"
              aria-pressed={keyword.kept}
              onClick={() => toggleKeyword(keyword.label)}
              className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${keyword.kept ? "border-primary/20 bg-primary-light text-primary" : "border-border bg-bg-primary text-text-secondary line-through"}`}
            >
              {keyword.label} <span className="text-[10px] text-text-muted">· {keyword.origin === "openalex" ? "OpenAlex" : "You added"}</span>
            </button>
          ))}
        </div>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); addKeyword(); }}>
          <label htmlFor="picoc-custom-keyword" className="sr-only">Add a keyword</label>
          <input id="picoc-custom-keyword" value={customKeyword} maxLength={300} onChange={(event) => setCustomKeyword(event.target.value)} placeholder="Add a keyword" className="min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface-white px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
          <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover"><FiPlus aria-hidden /> Add</button>
        </form>
      </div>
    </section>
  );
};

export default FieldStep;
