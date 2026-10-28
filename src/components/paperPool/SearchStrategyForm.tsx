import Select from "../ui/Select";
import { useState, useMemo, useEffect } from "react";
import {
  FiX,
  FiCheck,
  FiCalendar,
  FiFilter,
  FiEdit3,
  FiDatabase,
  FiLayers,
  FiZap,
  FiCopy,
  FiBookOpen,
  FiArrowRight,
  FiPlus,
  FiCpu,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import { toastSuccess, toastError } from "../../utils/toast";
import type { SearchSourceDto } from "../../types/searchSource";
import type { SearchStrategyDto } from "./types/search-strategy";
import {
  useProjectPicocs,
  useProjectResearchQuestions,
} from "../../hooks/useProjects";
import { searchSourceService } from "../../services/searchSourceService";

interface SearchStrategyFormProps {
  projectId: string;
  source: SearchSourceDto;
  isOpen: boolean;
  onExited: () => void;
  onSave: (strategy: SearchStrategyDto) => void;
  onClose: () => void;
  isLeader?: boolean;
}

type StrategyMode = "guided" | "manual";

interface PicoKeywordState {
  population: string[];
  intervention: string[];
  comparison: string[];
  outcome: string[];
  context: string[];
}

const FIELD_OPTIONS = [
  { id: "title", label: "Title" },
  { id: "abstract", label: "Abstract" },
  { id: "keywords", label: "Keywords" },
  { id: "mesh", label: "MeSH" },
];

const LANGUAGE_OPTIONS = [
  "English",
  "Vietnamese",
  "Chinese",
  "French",
  "German",
  "Spanish",
];
const STUDY_TYPE_OPTIONS = [
  "Randomized Controlled Trial",
  "Systematic Review",
  "Meta-Analysis",
  "Cohort Study",
  "Case-Control Study",
];

export default function SearchStrategyForm({
  projectId,
  source,
  isOpen,
  onExited,
  onSave,
  onClose,
  isLeader = false,
}: SearchStrategyFormProps) {
  const existingStrategy = source.strategies?.[0];
  const { picocs, isLoading: picocLoading } = useProjectPicocs(projectId);
  const { isLoading: rqLoading } = useProjectResearchQuestions(projectId);

  const [mode, setMode] = useState<StrategyMode>("guided");
  const hasExistingKeywords = !!(
    existingStrategy?.populationKeywords?.length ||
    existingStrategy?.interventionKeywords?.length ||
    existingStrategy?.comparisonKeywords?.length ||
    existingStrategy?.outcomeKeywords?.length ||
    existingStrategy?.contextKeywords?.length
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(hasExistingKeywords);

  const [strategy, setStrategy] = useState<SearchStrategyDto>(
    existingStrategy || {
      sourceId: source.sourceId,
      url: source.url,
      query: "",
      fields: ["title", "abstract"],
      filters: {
        yearFrom: undefined,
        yearTo: undefined,
        language: "English",
        studyType: "",
      },
      dateSearched: new Date().toISOString().split("T")[0],
      version: "v1",
      notes: "",
    },
  );

  const [keywords, setKeywords] = useState<PicoKeywordState>({
    population: existingStrategy?.populationKeywords || [],
    intervention: existingStrategy?.interventionKeywords || [],
    comparison: existingStrategy?.comparisonKeywords || [],
    outcome: existingStrategy?.outcomeKeywords || [],
    context: existingStrategy?.contextKeywords || [],
  });

  // Sync keywords into strategy DTO
  useEffect(() => {
    setStrategy((prev) => ({
      ...prev,
      populationKeywords: keywords.population,
      interventionKeywords: keywords.intervention,
      comparisonKeywords: keywords.comparison,
      outcomeKeywords: keywords.outcome,
      contextKeywords: keywords.context,
    }));
  }, [keywords]);

  const [newKeywordInputs, setNewKeywordInputs] = useState<
    Record<string, string>
  >({
    population: "",
    intervention: "",
    comparison: "",
    outcome: "",
    context: "",
  });

  // Action: Analyze PICOC to Breakdown Keywords
  const handleAnalyzePicoc = async () => {
    if (picocs.length === 0) {
      toastError("No PICOC framework defined for this project.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const p = picocs[0];
      const result = await searchSourceService.analyzePicoc(projectId, {
        searchSourceId: source.sourceId,
        population: p.population,
        intervention: p.intervention,
        comparator: p.comparator,
        outcome: p.outcome,
        context: p.context,
      });

      if (result.isSuccess && result.data) {
        setKeywords({
          population: result.data.population || [],
          intervention: result.data.intervention || [],
          comparison: result.data.comparison || [],
          outcome: result.data.outcome || [],
          context: result.data.context || [],
        });

        if (result.data.generatedQuery) {
          setStrategy((prev) => ({
            ...prev,
            query: result.data.generatedQuery,
          }));
        }

        setHasAnalyzed(true);
        toastSuccess("PICOC analyzed. Keywords extracted successfully.");
      } else {
        toastError(result.message || "Failed to analyze PICOC.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toastError("An error occurred during PICOC analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Boolean Query
  const generatedQuery = useMemo(() => {
    const groups = Object.entries(keywords)
      .map(([, terms]) => {
        if (terms.length === 0) return null;
        const joined = terms.map((t: string) => `"${t}"`).join(" OR ");
        return terms.length > 1 ? `(${joined})` : joined;
      })
      .filter(Boolean);

    return groups.join(" AND ");
  }, [keywords]);

  // Adapt Query for specific databases
  const adaptedQuery = useMemo(() => {
    if (!generatedQuery) return "";
    const name = source.name.toLowerCase();

    if (name.includes("pubmed")) {
      return `(${generatedQuery})[Title/Abstract]`;
    }
    if (name.includes("scopus")) {
      return `TITLE-ABS-KEY(${generatedQuery})`;
    }
    if (name.includes("web of science")) {
      return `TS=(${generatedQuery})`;
    }
    return generatedQuery;
  }, [generatedQuery, source.name]);

  // Sync with strategy query
  useEffect(() => {
    if (mode === "guided" && hasAnalyzed) {
      setStrategy((prev) => ({ ...prev, query: adaptedQuery }));
    }
  }, [adaptedQuery, mode, hasAnalyzed]);

  const handleSave = () => {
    if (!strategy.query.trim()) {
      toastError("Search query is required");
      return;
    }

    // Double check keywords are synced before saving
    const finalStrategy = {
      ...strategy,
      populationKeywords: keywords.population,
      interventionKeywords: keywords.intervention,
      comparisonKeywords: keywords.comparison,
      outcomeKeywords: keywords.outcome,
      contextKeywords: keywords.context,
    };

    onSave(finalStrategy);
  };

  const addKeyword = (type: keyof PicoKeywordState) => {
    const value = newKeywordInputs[type].trim();
    if (!value) return;
    if (keywords[type].includes(value)) {
      toastError("Keyword already exists");
      return;
    }
    setKeywords((prev) => ({ ...prev, [type]: [...prev[type], value] }));
    setNewKeywordInputs((prev) => ({ ...prev, [type]: "" }));
  };

  const removeKeyword = (type: keyof PicoKeywordState, index: number) => {
    setKeywords((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const toggleField = (fieldId: string) => {
    setStrategy((prev) => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter((f) => f !== fieldId)
        : [...prev.fields, fieldId],
    }));
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      onExited={onExited}
      title={`Search Strategy Builder for ${source.name}`}
      hideHeader
      maxWidth="max-w-2xl"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex shrink-0 flex-col gap-4 border-b border-border bg-surface-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-accent mb-1">
              <FiDatabase className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
                Search Strategy Builder
              </span>
            </div>
            <h2 className="break-words text-xl font-black text-text-primary sm:text-2xl">
              {source.name}
            </h2>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-4">
            <div className="flex rounded-xl bg-bg-secondary p-1">
              <button
                type="button"
                onClick={() => setMode("guided")}
                aria-pressed={mode === "guided"}
                className={`min-h-11 rounded-xl px-3 text-xs font-bold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${mode === "guided" ? "bg-surface-white text-accent shadow-none" : "text-text-secondary hover:text-text-primary"}`}
              >
                Guided
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                aria-pressed={mode === "manual"}
                className={`min-h-11 rounded-xl px-3 text-xs font-bold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${mode === "manual" ? "bg-surface-white text-accent shadow-none" : "text-text-secondary hover:text-text-primary"}`}
              >
                Manual
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search strategy builder"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-4 py-5 scrollbar-hide sm:space-y-10 sm:px-8 sm:py-8">
          {mode === "guided" ? (
            <>
              {/* Step 1: PICO Context Overview */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-primary font-bold">
                    <FiBookOpen className="text-accent" />
                    <h4>1. Project PICOC Framework</h4>
                  </div>
                  {(picocLoading || rqLoading) && (
                    <div role="status" aria-live="polite" className="text-[10px] text-text-secondary motion-safe:animate-pulse motion-reduce:animate-none">
                      Loading...
                    </div>
                  )}
                </div>

                <div className="bg-primary-light/50 rounded-xl p-6 border border-accent/20">
                  {picocs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {[
                        "population",
                        "intervention",
                        "comparator",
                        "outcome",
                        "context",
                      ].map((key) => (
                        <div
                          key={key}
                          className={key === "context" ? "col-span-2" : ""}
                        >
                          <span className="mb-1 block text-[9px] font-black uppercase text-primary">
                            {key}
                          </span>
                          <p className="line-clamp-2 text-xs font-medium leading-relaxed text-text-primary">
                            {(picocs[0] as any)[key] || "Not specified"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary italic text-center py-4">
                      No PICOC defined for this project.
                    </p>
                  )}
                </div>
              </section>

              {/* Step 2: Breakdown & Refinement */}
              <section className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-text-primary font-bold">
                    <FiZap className="text-accent" />
                    <h4>2. Keyword Breakdown</h4>
                  </div>

                  <Button
                    onClick={handleAnalyzePicoc}
                    disabled={isAnalyzing || picocs.length === 0 || !isLeader}
                    aria-busy={isAnalyzing}
                    size="md"
                    className="w-full justify-center gap-2 sm:w-auto"
                  >
                    {isAnalyzing ? (
                      <FiRefreshCw aria-hidden="true" className="motion-safe:animate-spin motion-reduce:animate-none w-3 h-3" />
                    ) : (
                      <FiCpu className="w-3 h-3" />
                    )}
                    {hasAnalyzed
                      ? isLeader
                        ? "Re-generate with AI"
                        : "AI Analyzed"
                      : "AI Assist: Extract Keywords"}
                  </Button>
                </div>

                <div className="space-y-6">
                  {(
                    [
                      "population",
                      "intervention",
                      "comparison",
                      "outcome",
                      "context",
                    ] as const
                  ).map((type) => (
                    <div
                      key={type}
                      className="rounded-xl border border-border bg-surface-white p-5 shadow-none transition-colors hover:border-primary/30 motion-reduce:transition-none"
                    >
                      <label className="text-[10px] font-black uppercase text-text-secondary mb-3 flex items-center gap-2">
                        <FiArrowRight className="text-accent" />
                        {type} Terms
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {keywords[type].map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-accent/20 bg-primary-light px-3 py-1.5 text-xs font-bold text-accent"
                          >
                            {word}
                            {isLeader && (
                              <button
                                type="button"
                                onClick={() => removeKeyword(type, idx)}
                                aria-label={`Remove ${word} keyword`}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 motion-reduce:transition-none"
                              >
                                <FiX />
                              </button>
                            )}
                          </span>
                        ))}
                        {isLeader && (
                          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                            <input
                              type="text"
                              value={newKeywordInputs[type]}
                              onChange={(e) =>
                                setNewKeywordInputs((prev) => ({
                                  ...prev,
                                  [type]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" && addKeyword(type)
                              }
                              placeholder="Add synonym..."
                              className="min-h-11 flex-1 rounded-xl border border-border bg-surface-white px-3 text-xs text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                            />
                            <button
                              type="button"
                              onClick={() => addKeyword(type)}
                              aria-label={`Add ${type} keyword`}
                              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-bg-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Step 3: Logic & Query */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-text-primary font-bold">
                  <FiLayers className="text-accent" />
                  <h4>
                    3. Preview logic{" "}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline hover:text-primary-hover cursor-pointer"
                    >
                      {source.name}
                    </a>
                  </h4>
                </div>
                <div className="space-y-4 rounded-xl bg-text-primary p-6 font-mono text-xs text-bg-primary">
                  {Object.entries(keywords)
                    .filter(([, terms]) => terms.length > 0)
                    .map(([key, terms], idx, arr) => {
                      const queryPart = `(${terms.join(" OR ")})`;
                      return (
                        <div key={key} className="group">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-2 min-w-0 flex-1">
                              <span className="text-accent shrink-0">
                                {key.toUpperCase()}:
                              </span>
                              <span className="break-all">{queryPart}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(queryPart);
                                toastSuccess(`Copied ${key} query!`);
                              }}
                              aria-label={`Copy ${key} query`}
                              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-primary-light opacity-100 transition-colors hover:bg-surface-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 motion-reduce:transition-none"
                            >
                              <FiCopy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {idx < arr.length - 1 && (
                            <div className="my-2 font-black text-warning">
                              AND
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* Step 4: Final Search Query */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-text-primary font-bold">
                  <FiSearch className="text-accent" />
                  <h4>4. Final Search Query</h4>
                </div>
                <div className="relative group">
                  <textarea
                    value={strategy.query}
                    onChange={(e) =>
                      setStrategy((prev) => ({
                        ...prev,
                        query: e.target.value,
                      }))
                    }
                    disabled={!isLeader}
                    placeholder="The generated query will appear here..."
                    className="h-32 w-full resize-none rounded-xl border border-border bg-surface-white px-4 py-2.5 pr-16 font-mono text-sm leading-relaxed text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(strategy.query);
                        toastSuccess("Copied query!");
                      }}
                      aria-label="Copy search query"
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-surface-white text-text-secondary opacity-100 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 motion-reduce:transition-none"
                      title="Copy to clipboard"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-text-secondary px-2 italic">
                  Note: This query is what will be saved to your search
                  strategy.
                </p>
              </section>
            </>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <FiEdit3 className="text-accent" />
                <h4>Manual Query Input</h4>
              </div>
              <textarea
                value={strategy.query}
                onChange={(e) =>
                  setStrategy({ ...strategy, query: e.target.value })
                }
                disabled={!isLeader}
                placeholder="Enter full search query..."
                className="h-64 w-full resize-none rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
              />
            </section>
          )}

          <div className="h-px bg-bg-secondary w-full" />

          {/* Common Fields */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <FiLayers className="text-accent" />
                <h4>Fields</h4>
              </div>
              <div className="space-y-2">
                {FIELD_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-bg-primary transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center ${strategy.fields.includes(option.id) ? "bg-primary border-accent text-white" : "border-border"}`}
                      onClick={() => isLeader && toggleField(option.id)}
                    >
                      {strategy.fields.includes(option.id) && (
                        <FiCheck className="w-3 h-3" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {option.label}
                    </span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={strategy.fields.includes(option.id)}
                      onChange={() => isLeader && toggleField(option.id)}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <FiCalendar className="text-accent" />
                <h4>Metadata</h4>
              </div>
              <div className="space-y-4">
                <input
                  type="date"
                  value={strategy.dateSearched}
                  onChange={(e) =>
                    setStrategy({ ...strategy, dateSearched: e.target.value })
                  }
                  disabled={!isLeader}
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
                />
                <input
                  type="text"
                  value={strategy.version}
                  onChange={(e) =>
                    setStrategy({ ...strategy, version: e.target.value })
                  }
                  disabled={!isLeader}
                  placeholder="Version (e.g. v1)"
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
                />
              </div>
            </section>
          </div>

          {/* Notes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-text-primary font-bold">
              <FiEdit3 className="text-accent" />
              <h4>Notes</h4>
            </div>
            <textarea
              value={strategy.notes || ""}
              onChange={(e) =>
                setStrategy({ ...strategy, notes: e.target.value })
              }
              disabled={!isLeader}
              placeholder="Add any additional notes about this search strategy..."
              className="h-32 w-full resize-none rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
            />
          </section>

          {/* Filters */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-text-primary font-bold">
              <FiFilter className="text-accent" />
              <h4>Filters</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-bg-primary p-4 sm:grid-cols-2 sm:p-6">
              <input
                type="number"
                min={1900}
                max={2100}
                step={1}
                value={strategy.filters.yearFrom != null && strategy.filters.yearFrom >= 0 ? strategy.filters.yearFrom : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !/^\d{0,4}$/.test(value)) return;
                  setStrategy({
                    ...strategy,
                    filters: {
                      ...strategy.filters,
                      yearFrom: value ? parseInt(value, 10) : undefined,
                    },
                  });
                }}
                disabled={!isLeader}
                placeholder="Year From"
                className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
              />
              <input
                type="number"
                min={1900}
                max={2100}
                step={1}
                value={strategy.filters.yearTo != null && strategy.filters.yearTo >= 0 ? strategy.filters.yearTo : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !/^\d{0,4}$/.test(value)) return;
                  setStrategy({
                    ...strategy,
                    filters: {
                      ...strategy.filters,
                      yearTo: value ? parseInt(value, 10) : undefined,
                    },
                  });
                }}
                disabled={!isLeader}
                placeholder="Year To"
                className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
              />
              <Select
                value={strategy.filters.language}
                onChange={(e) =>
                  setStrategy({
                    ...strategy,
                    filters: { ...strategy.filters, language: e.target.value },
                  })
                }
                disabled={!isLeader}
                className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
              >
                <option value="">Any Language</option>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </Select>
              <Select
                value={strategy.filters.studyType}
                onChange={(e) =>
                  setStrategy({
                    ...strategy,
                    filters: { ...strategy.filters, studyType: e.target.value },
                  })
                }
                disabled={!isLeader}
                className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-75 motion-reduce:transition-none"
              >
                <option value="">Any Study Type</option>
                {STUDY_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex shrink-0 gap-3 border-t border-border bg-surface-white px-4 py-4 sm:gap-4 sm:px-8 sm:py-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {isLeader ? "Cancel" : "Close"}
          </Button>
          {isLeader && (
            <Button onClick={handleSave} className="flex-[2] gap-2">
              <FiCheck />
              Save Strategy
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
