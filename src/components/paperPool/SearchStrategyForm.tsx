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
import { motion } from "framer-motion";
import toast from "react-hot-toast";
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
      toast.error("No PICOC framework defined for this project.");
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
        toast.success("PICOC analyzed. Keywords extracted successfully.");
      } else {
        toast.error(result.message || "Failed to analyze PICOC.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("An error occurred during PICOC analysis.");
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
      toast.error("Search query is required");
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
      toast.error("Keyword already exists");
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-surface-white h-full shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-surface-white sticky top-0 z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FiDatabase className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
                Search Strategy Builder
              </span>
            </div>
            <h2 className="text-2xl font-black text-text-primary">
              {source.name}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-bg-secondary p-1 rounded-[4px]">
              <button
                onClick={() => setMode("guided")}
                className={`px-4 py-1.5 rounded-[4px] text-xs font-bold transition-all ${mode === "guided" ? "bg-surface-white text-blue-600 shadow-none" : "text-text-secondary hover:text-text-primary"}`}
              >
                Guided
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`px-4 py-1.5 rounded-[4px] text-xs font-bold transition-all ${mode === "manual" ? "bg-surface-white text-blue-600 shadow-none" : "text-text-secondary hover:text-text-primary"}`}
              >
                Manual
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-secondary rounded-[4px] transition-colors text-text-secondary hover:text-text-primary"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 scrollbar-hide">
          {mode === "guided" ? (
            <>
              {/* Step 1: PICO Context Overview */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-primary font-bold">
                    <FiBookOpen className="text-blue-600" />
                    <h4>1. Project PICOC Framework</h4>
                  </div>
                  {(picocLoading || rqLoading) && (
                    <div className="text-[10px] text-text-secondary animate-pulse">
                      Loading...
                    </div>
                  )}
                </div>

                <div className="bg-blue-50/50 rounded-[4px] p-6 border border-blue-100/50">
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
                          <span className="text-[9px] font-black uppercase text-blue-400 block mb-1">
                            {key}
                          </span>
                          <p className="text-xs font-medium text-blue-900 line-clamp-2 leading-relaxed">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-primary font-bold">
                    <FiZap className="text-blue-600" />
                    <h4>2. Keyword Breakdown</h4>
                  </div>

                  <button
                    onClick={handleAnalyzePicoc}
                    disabled={isAnalyzing || picocs.length === 0 || !isLeader}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-bg-secondary disabled:text-text-secondary text-white rounded-[4px] text-xs font-bold transition-all shadow-none shadow-blue-500/20"
                  >
                    {isAnalyzing ? (
                      <FiRefreshCw className="animate-spin w-3 h-3" />
                    ) : (
                      <FiCpu className="w-3 h-3" />
                    )}
                    {hasAnalyzed
                      ? isLeader
                        ? "Re-generate with AI"
                        : "AI Analyzed"
                      : "AI Assist: Extract Keywords"}
                  </button>
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
                      className="bg-surface-white rounded-[4px] p-5 border border-border hover:border-blue-200 transition-all shadow-none"
                    >
                      <label className="text-[10px] font-black uppercase text-text-secondary mb-3 flex items-center gap-2">
                        <FiArrowRight className="text-blue-500" />
                        {type} Terms
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {keywords[type].map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-[4px] border border-blue-100"
                          >
                            {word}
                            {isLeader && (
                              <button
                                onClick={() => removeKeyword(type, idx)}
                                className="hover:text-rose-500"
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
                              className="flex-1 px-3 py-1.5 bg-bg-primary border-none rounded-[4px] text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => addKeyword(type)}
                              className="p-1.5 bg-bg-secondary rounded-[4px] hover:bg-bg-secondary"
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
                  <FiLayers className="text-blue-600" />
                  <h4>
                    3. Preview logic{" "}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-700 cursor-pointer"
                    >
                      {source.name}
                    </a>
                  </h4>
                </div>
                <div className="p-6 bg-gray-900 rounded-[4px] text-blue-100 space-y-4 font-mono text-xs">
                  {Object.entries(keywords)
                    .filter(([, terms]) => terms.length > 0)
                    .map(([key, terms], idx, arr) => {
                      const queryPart = `(${terms.join(" OR ")})`;
                      return (
                        <div key={key} className="group">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-2 min-w-0 flex-1">
                              <span className="text-blue-500 shrink-0">
                                {key.toUpperCase()}:
                              </span>
                              <span className="break-all">{queryPart}</span>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(queryPart);
                                toast.success(`Copied ${key} query!`);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface-white/10 rounded transition-all text-blue-400 shrink-0"
                            >
                              <FiCopy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {idx < arr.length - 1 && (
                            <div className="text-amber-500 my-2 font-black">
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
                  <FiSearch className="text-blue-600" />
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
                    className="w-full h-32 px-5 py-4 bg-bg-primary border border-border rounded-[4px] text-text-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner font-mono text-sm leading-relaxed disabled:opacity-75"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(strategy.query);
                        toast.success("Copied query!");
                      }}
                      className="p-2 bg-surface-white shadow-none border border-border rounded-[4px] text-text-secondary hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
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
                <FiEdit3 className="text-blue-600" />
                <h4>Manual Query Input</h4>
              </div>
              <textarea
                value={strategy.query}
                onChange={(e) =>
                  setStrategy({ ...strategy, query: e.target.value })
                }
                disabled={!isLeader}
                placeholder="Enter full search query..."
                className="w-full h-64 px-5 py-4 bg-bg-primary border-none rounded-[4px] text-text-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner disabled:opacity-75"
              />
            </section>
          )}

          <div className="h-px bg-bg-secondary w-full" />

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <FiLayers className="text-blue-600" />
                <h4>Fields</h4>
              </div>
              <div className="space-y-2">
                {FIELD_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-3 rounded-[4px] cursor-pointer hover:bg-bg-primary transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center ${strategy.fields.includes(option.id) ? "bg-blue-600 border-blue-600 text-white" : "border-border"}`}
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
                <FiCalendar className="text-blue-600" />
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
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-[4px] text-text-primary focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-75"
                />
                <input
                  type="text"
                  value={strategy.version}
                  onChange={(e) =>
                    setStrategy({ ...strategy, version: e.target.value })
                  }
                  disabled={!isLeader}
                  placeholder="Version (e.g. v1)"
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-[4px] text-text-primary focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-75"
                />
              </div>
            </section>
          </div>

          {/* Notes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-text-primary font-bold">
              <FiEdit3 className="text-blue-600" />
              <h4>Notes</h4>
            </div>
            <textarea
              value={strategy.notes || ""}
              onChange={(e) =>
                setStrategy({ ...strategy, notes: e.target.value })
              }
              disabled={!isLeader}
              placeholder="Add any additional notes about this search strategy..."
              className="w-full h-32 px-5 py-4 bg-bg-primary border-none rounded-[4px] text-text-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner disabled:opacity-75"
            />
          </section>

          {/* Filters */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-text-primary font-bold">
              <FiFilter className="text-blue-600" />
              <h4>Filters</h4>
            </div>
            <div className="bg-bg-primary rounded-[4px] p-6 grid grid-cols-2 gap-4 border border-border">
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
                className="px-4 py-3 bg-surface-white border-none rounded-[4px] focus:ring-2 focus:ring-blue-500 outline-none shadow-none disabled:opacity-75"
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
                className="px-4 py-3 bg-surface-white border-none rounded-[4px] focus:ring-2 focus:ring-blue-500 outline-none shadow-none disabled:opacity-75"
              />
              <select
                value={strategy.filters.language}
                onChange={(e) =>
                  setStrategy({
                    ...strategy,
                    filters: { ...strategy.filters, language: e.target.value },
                  })
                }
                disabled={!isLeader}
                className="px-4 py-3 bg-surface-white border-none rounded-[4px] focus:ring-2 focus:ring-blue-500 outline-none shadow-none disabled:opacity-75"
              >
                <option value="">Any Language</option>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <select
                value={strategy.filters.studyType}
                onChange={(e) =>
                  setStrategy({
                    ...strategy,
                    filters: { ...strategy.filters, studyType: e.target.value },
                  })
                }
                disabled={!isLeader}
                className="px-4 py-3 bg-surface-white border-none rounded-[4px] focus:ring-2 focus:ring-blue-500 outline-none shadow-none disabled:opacity-75"
              >
                <option value="">Any Study Type</option>
                {STUDY_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border bg-surface-white sticky bottom-0 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-bg-primary hover:bg-bg-secondary text-text-secondary rounded-[4px] font-bold transition-all"
          >
            {isLeader ? "Cancel" : "Close"}
          </button>
          {isLeader && (
            <button
              onClick={handleSave}
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[4px] font-bold transition-all shadow-none shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <FiCheck />
              Save Strategy
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
