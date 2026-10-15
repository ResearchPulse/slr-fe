import React, { useState } from "react";
import axios from "axios";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";
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

  const loadLevel = async (level: TaxonomyLevel, parent?: TaxonomyItem) => {
    setBrowseError(null);
    try {
      const page = await picocWizardStateService.browseTaxonomy(projectId, level, parent?.id);
      setBrowseItems(page.items);
    } catch {
      setBrowseError("Could not load the OpenAlex taxonomy. Try again later.");
    }
  };

  const startBrowse = () => {
    setBrowsing(true);
    setBrowsePath([]);
    void loadLevel("domain");
  };

  const pick = (item: TaxonomyItem) => {
    const nextLevel = NEXT_LEVEL[item.level];
    const path = [...browsePath, item];
    setBrowsePath(path);
    if (nextLevel) void loadLevel(nextLevel, item);
    else setBrowseItems([]);
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
        <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary">Research field</p>
        <h3 id="picoc-step-field" className="mt-1 font-cormorant text-[28px] text-text-primary">Which research field does this review belong to?</h3>
        <p className="mt-1 text-sm text-text-secondary">OpenAlex suggests a topic from your title and abstract. Nothing is confirmed until you choose and confirm it.</p>
      </header>

      {draft.researchField ? (
        <div className="border border-text-primary bg-surface-white p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">Confirmed field</p>
          <p className="mt-1 text-sm font-medium text-text-primary">{draft.researchField.topic.label}</p>
          <p className="text-xs text-text-secondary">{[draft.researchField.domain?.label, draft.researchField.field?.label, draft.researchField.subfield?.label].filter(Boolean).join(" → ")}</p>
        </div>
      ) : null}

      <div className="space-y-3 border border-border bg-surface-white p-4">
        <div>
          <label htmlFor="picoc-field-title" className="text-sm font-medium text-text-primary">Title</label>
          <input id="picoc-field-title" value={title} maxLength={2000} onChange={(event) => editInput(setTitle)(event.target.value)} className="mt-1 w-full border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="picoc-field-abstract" className="text-sm font-medium text-text-primary">Abstract / description</label>
          <textarea id="picoc-field-abstract" value={abstract} rows={4} maxLength={2000} onChange={(event) => editInput(setAbstract)(event.target.value)} className="mt-1 w-full border border-border px-3 py-2 text-sm" />
          <p className="text-xs text-text-muted">{length}/2000 characters (minimum 20). A short or generic text may return no topic.</p>
        </div>
        <label className="flex items-start gap-2 text-xs text-text-secondary">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
          <span>Send this exact title and abstract to OpenAlex (an external service) to suggest topics and keywords. Consent is needed for each request and resets when you edit the text.</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!canClassify} onClick={() => void classify()} className="border border-text-primary bg-text-primary px-4 py-2 text-xs text-surface-white disabled:opacity-40">
            {classifying ? "Asking OpenAlex…" : "Get field suggestions"}
          </button>
          <button type="button" onClick={startBrowse} className="border border-border px-4 py-2 text-xs text-text-primary">Browse fields manually</button>
        </div>
        {error ? <p role="alert" className="text-sm text-text-primary">{error} You can browse the OpenAlex fields manually instead.</p> : null}
      </div>

      {classification ? (
        <div className="space-y-3">
          {topics.length === 0 ? (
            <p role="status" className="border border-border bg-bg-secondary p-3 text-sm text-text-primary">
              OpenAlex found no topic{classification.providerNote ? `: ${classification.providerNote}` : "."} Add a more specific description and try again, or browse manually.
            </p>
          ) : (
            <fieldset>
              <legend className="text-sm font-medium text-text-primary">Suggested topics</legend>
              <div className="mt-2 space-y-2">
                {topics.map((topic, index) => (
                  <label key={topic.id} className={`flex cursor-pointer gap-3 border p-3 text-sm ${chosenTopicId === topic.id ? "border-text-primary" : "border-border"}`}>
                    <input type="radio" name="picoc-topic-choice" checked={chosenTopicId === topic.id} onChange={() => setChosenTopicId(topic.id)} className="mt-1" />
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
                      className={`inline-flex items-center gap-1 border px-2 py-1 text-xs ${kept ? "border-text-primary text-text-primary" : "border-border text-text-muted line-through"}`}
                    >
                      {kept ? <FiCheck aria-hidden /> : <FiX aria-hidden />} {keyword.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {topics.length > 0 ? (
            <button type="button" disabled={!chosenTopicId} onClick={confirmSuggestion} className="border border-text-primary bg-text-primary px-4 py-2 text-xs text-surface-white disabled:opacity-40">
              Confirm selected topic
            </button>
          ) : null}
        </div>
      ) : null}

      {browsing ? (
        <div className="space-y-3 border border-border bg-surface-white p-4">
          <nav aria-label="Taxonomy path" className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">
            <button type="button" onClick={startBrowse} className="underline underline-offset-4">All domains</button>
            {browsePath.map((item) => <span key={item.id}>→ {item.label}</span>)}
          </nav>
          {browseError ? <p role="alert" className="text-sm">{browseError}</p> : null}
          <ul className="grid gap-2 md:grid-cols-2">
            {browseItems.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => pick(item)} className="w-full border border-border px-3 py-2 text-left text-sm hover:border-text-primary">{item.label}</button>
              </li>
            ))}
          </ul>
          {browsedTopic ? (
            <button type="button" onClick={confirmBrowse} className="border border-text-primary bg-text-primary px-4 py-2 text-xs text-surface-white">
              Confirm “{browsedTopic.label}”
            </button>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-sm font-medium text-text-primary">Keywords kept for this review</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {draft.keywords.length === 0 ? <span className="text-xs italic text-text-muted">None yet</span> : null}
          {draft.keywords.map((keyword) => (
            <button
              key={keyword.label}
              type="button"
              aria-pressed={keyword.kept}
              onClick={() => toggleKeyword(keyword.label)}
              className={`inline-flex items-center gap-1 border px-2 py-1 text-xs ${keyword.kept ? "border-text-primary text-text-primary" : "border-border text-text-muted line-through"}`}
            >
              {keyword.label} <span className="text-[10px] text-text-muted">· {keyword.origin === "openalex" ? "OpenAlex" : "You added"}</span>
            </button>
          ))}
        </div>
        <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); addKeyword(); }}>
          <label htmlFor="picoc-custom-keyword" className="sr-only">Add a keyword</label>
          <input id="picoc-custom-keyword" value={customKeyword} maxLength={300} onChange={(event) => setCustomKeyword(event.target.value)} placeholder="Add a keyword" className="min-w-0 flex-1 border border-border px-3 py-1.5 text-sm" />
          <button type="submit" className="inline-flex items-center gap-1 border border-text-primary px-3 py-1.5 text-xs"><FiPlus aria-hidden /> Add</button>
        </form>
      </div>
    </section>
  );
};

export default FieldStep;
