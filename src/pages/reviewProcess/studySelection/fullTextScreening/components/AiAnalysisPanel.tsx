import { useState, useLayoutEffect, useRef } from "react";
import {
  FiCpu,
  FiCheck,
  FiX,
  FiHelpCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiMessageSquare,
  FiActivity,
  FiShield,
  FiAward,
} from "react-icons/fi";
import gsap from "gsap";
import { MarkdownContent } from "../../../../../components/ui/MarkdownContent";
import type { AiAnalysisResult, FullTextPaper, MatchStatus } from "../types";
import { MATCH_STATUS_CONFIG } from "../constants";
import { cn } from "../../../../../utils/cn";

interface AiAnalysisPanelProps {
  paper: FullTextPaper | null;
  aiAnalysis: AiAnalysisResult | null;
  isAnalyzing: boolean;
  runAiAnalysis: (paperId: string) => void;
  isDisabled?: boolean;
}

const mapMatchStatus = (status: string | undefined): MatchStatus => {
  if (!status) return "unknown";
  const normalized = status.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "match") return "match";
  if (normalized === "notmatch") return "not_match";
  return "unknown";
};

export default function AiAnalysisPanel({
  paper,
  aiAnalysis,
  isAnalyzing,
  runAiAnalysis,
  isDisabled = false,
}: AiAnalysisPanelProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {},
  );

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useLayoutEffect(() => {
    if (aiAnalysis && resultsRef.current) {
      const ctx = gsap.context(() => {
        // Main sections entrance
        gsap.from(".analysis-card", {
          y: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        });

        // Score bar animation
        gsap.from(".score-bar-fill", {
          width: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.5)",
          delay: 0.3,
        });

        // Icon pops
        gsap.from(".status-icon", {
          scale: 0,
          rotation: -45,
          duration: 0.6,
          ease: "back.out(1.7)",
          stagger: 0.05,
        });
      }, resultsRef);

      return () => ctx.revert();
    }
  }, [aiAnalysis]);

  if (!paper) {
    return (
      <div className="flex flex-col h-full bg-bg-secondary/50">
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="w-16 h-16 bg-surface-white rounded-[4px] shadow-none flex items-center justify-center mb-4 border border-border">
            <FiCpu className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-text-primary font-semibold mb-2">
            Ready to Analyze
          </h3>
          <p className="text-sm text-text-secondary max-w-[200px]">
            Select a paper from the queue to start AI-powered full-text
            evaluation.
          </p>
        </div>
      </div>
    );
  }

  const output = aiAnalysis?.aiOutput;

  return (
    <div className="flex flex-col bg-bg-secondary/30">
      {/* Header */}
      <div className="px-5 py-4 bg-surface-white border-b border-border/60 sticky top-0 z-10 backdrop-blur-md bg-surface-white/90">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-bg-secondary rounded-[4px]">
              <FiCpu className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              AI Assistant
            </h2>
          </div>
          {aiAnalysis && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-bg-secondary rounded-full text-[10px] font-medium text-text-secondary">
              <FiActivity className="w-3 h-3" />
              Analyzed
            </div>
          )}
        </div>
        <p className="text-[11px] text-text-secondary font-medium">
          Full-text evidence-based evaluation & deterministic scoring
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Run Analysis Button */}
        {!aiAnalysis && !isAnalyzing && (
          <div className="analysis-card bg-surface-white p-6 rounded-[4px] border border-border shadow-none text-center">
            <div className="w-12 h-12 bg-bg-secondary text-accent rounded-[4px] flex items-center justify-center mx-auto mb-4">
              <FiAward className="w-6 h-6" />
            </div>
            <h4 className="text-text-primary font-bold mb-1">
              Full-Text Analysis
            </h4>
            <p className="text-xs text-text-secondary mb-6 px-4">
              Our AI will evaluate this paper against all inclusion and
              exclusion criteria based on extracted evidence chunks.
            </p>
            <button
              onClick={() => !isDisabled && runAiAnalysis(paper.id)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-bold text-sm rounded-[4px] transition-all shadow-none",
                !isDisabled
                  ? "bg-accent hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200"
                  : "bg-slate-300 cursor-not-allowed shadow-none",
              )}
            >
              <FiCpu className="w-4 h-4" />
              {isDisabled ? "Analysis Disabled" : "Run AI Analysis"}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="bg-surface-white p-10 rounded-[4px] border border-border shadow-none flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <FiCpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-primary">
                Evaluating Full-Text...
              </p>
              <p className="text-[11px] text-text-secondary mt-1">
                Applying protocol logic and scanning evidence chunks
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {aiAnalysis && output && (
          <div ref={resultsRef} className="space-y-4 pb-8">
            {/* Recommendation & Score Card */}
            <div className="analysis-card bg-surface-white rounded-[4px] border border-border shadow-none overflow-hidden">
              <div
                className={cn(
                  "px-5 py-4 flex items-center justify-between border-b border-border",
                  getRecommendationBg(output.recommendation),
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-[4px] text-white shadow-none status-icon",
                      getRecommendationIconBg(output.recommendation),
                    )}
                  >
                    {getRecommendationIcon(output.recommendation)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                      AI Recommendation
                    </p>
                    <p className="text-base font-black tracking-tight">
                      {output.recommendation}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    Relevance
                  </p>
                  <p
                    className={cn(
                      "text-xl font-black tracking-tighter",
                      getScoreColor(output.relevanceScore),
                    )}
                  >
                    {Math.round(output.relevanceScore * 100)}%
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full score-bar-fill rounded-full",
                      getScoreBg(output.relevanceScore),
                    )}
                    style={{ width: `${output.relevanceScore * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-surface-white/50 border border-green-100 rounded-[4px]">
                    <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-1">
                      Inclusion Matches
                    </p>
                    <p className="text-lg font-black text-green-700">
                      {output.inclusionMatches}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-white/50 border border-red-100 rounded-[4px]">
                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-1">
                      Exclusion Violations
                    </p>
                    <p className="text-lg font-black text-red-700">
                      {output.exclusionMatches}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Exclusions Highlight */}
            {output.exclusionHighlights &&
              output.exclusionHighlights.length > 0 && (
                <div className="analysis-card bg-rose-50 border border-rose-200 rounded-[4px] p-5 shadow-none">
                  <div className="flex items-center gap-2 mb-3 text-rose-700">
                    <FiAlertTriangle className="w-4 h-4 status-icon" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest">
                      Critical Exclusions Detected
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {output.exclusionHighlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-xs font-medium text-rose-900 leading-relaxed"
                      >
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full" />
                        <MarkdownContent content={h} variant="red" inline />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* AI Reasoning (Markdown) */}
            <div className="analysis-card bg-surface-white rounded-[4px] border border-border shadow-none overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg-secondary/30">
                <div className="flex items-center gap-2 text-accent">
                  <FiMessageSquare className="w-4 h-4 status-icon" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest">
                    Evidence-Based Reasoning
                  </h4>
                </div>
                <FiShield className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="p-5">
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <MarkdownContent
                    content={output.reasoning}
                    variant="blue"
                    className="text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
                  Criteria Breakdown
                </h4>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {output.criteriaGroupResults &&
                output.criteriaGroupResults.map((group, idx) => (
                  <div
                    key={idx}
                    className="analysis-card bg-surface-white rounded-[4px] border border-border shadow-none overflow-hidden"
                  >
                    <button
                      onClick={() => toggleGroup(idx)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-[4px] bg-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-secondary">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <span className="text-xs font-bold text-slate-800 leading-snug">
                          {group.description || "Criteria Group"}
                        </span>
                      </div>
                      {expandedGroups[idx] ? (
                        <FiChevronUp className="text-text-secondary" />
                      ) : (
                        <FiChevronDown className="text-text-secondary" />
                      )}
                    </button>

                    {expandedGroups[idx] && (
                      <div className="px-5 pb-5 pt-1 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Inclusion */}
                        {group.inclusionResults &&
                          group.inclusionResults.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest ml-1">
                                Inclusion Criteria
                              </p>
                              {group.inclusionResults.map((res, i) => (
                                <CriteriaRow
                                  key={i}
                                  rule={res.rule}
                                  match={res.match}
                                  type="inclusion"
                                />
                              ))}
                            </div>
                          )}

                        {/* Exclusion */}
                        {group.exclusionResults &&
                          group.exclusionResults.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest ml-1">
                                Exclusion Criteria
                              </p>
                              {group.exclusionResults.map((res, i) => (
                                <CriteriaRow
                                  key={i}
                                  rule={res.rule}
                                  match={res.match}
                                  highlight={res.highlight}
                                  type="exclusion"
                                />
                              ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriaRow({
  rule,
  match,
  highlight,
  type,
}: {
  rule: string;
  match: string;
  highlight?: string | null;
  type: "inclusion" | "exclusion";
}) {
  const status = mapMatchStatus(match);
  const cfg = MATCH_STATUS_CONFIG[status];
  const isMatch = status === "match";

  return (
    <div
      className={cn(
        "p-3 rounded-[4px] border text-xs transition-colors",
        type === "inclusion"
          ? isMatch
            ? "bg-surface-white/40 border-border/50 shadow-none"
            : "bg-bg-secondary border-border"
          : isMatch
            ? "bg-rose-50/50 border-rose-200/50 shadow-none"
            : "bg-bg-secondary border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <p
          className={cn(
            "font-medium leading-relaxed",
            isMatch
              ? type === "inclusion"
                ? "text-green-800"
                : "text-rose-800"
              : "text-text-secondary",
          )}
        >
          {rule}
        </p>
        <div
          className={cn(
            "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter",
            cfg.bg,
            cfg.color,
            "shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-black/5",
          )}
        >
          {status === "match" && <FiCheck className="w-2.5 h-2.5" />}
          {status === "not_match" && <FiX className="w-2.5 h-2.5" />}
          {status === "unknown" && <FiHelpCircle className="w-2.5 h-2.5" />}
          {cfg.label}
        </div>
      </div>
      {highlight && (
        <div className="mt-2.5 p-2.5 bg-surface-white/80 border border-rose-100/60 rounded-[4px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 opacity-80">
            <FiActivity className="w-2.5 h-2.5" />
            Evidence Highlight
          </p>
          <MarkdownContent
            content={highlight}
            variant="red"
            className="text-[10.5px] leading-relaxed italic text-rose-900/80"
            inline
          />
        </div>
      )}
    </div>
  );
}

// Helper functions for aesthetics
function getRecommendationBg(rec: string | undefined) {
  if (!rec) return "bg-slate-500/10 text-text-primary";
  const r = rec.toLowerCase();
  if (r.includes("include")) return "bg-green-500/10 text-green-700";
  if (r.includes("exclude")) return "bg-rose-500/10 text-rose-700";
  if (r.includes("uncertain")) return "bg-amber-500/10 text-amber-700";
  return "bg-slate-500/10 text-text-primary";
}

function getRecommendationIconBg(rec: string | undefined) {
  if (!rec) return "bg-slate-500";
  const r = rec.toLowerCase();
  if (r.includes("include")) return "bg-green-500 shadow-green-200";
  if (r.includes("exclude")) return "bg-rose-500 shadow-rose-200";
  if (r.includes("uncertain")) return "bg-amber-500 shadow-amber-200";
  return "bg-slate-500";
}

function getRecommendationIcon(rec: string | undefined) {
  if (!rec) return <FiHelpCircle className="w-4 h-4" />;
  const r = rec.toLowerCase();
  if (r.includes("include")) return <FiCheck className="w-4 h-4" />;
  if (r.includes("exclude")) return <FiX className="w-4 h-4" />;
  return <FiHelpCircle className="w-4 h-4" />;
}

function getScoreColor(score: number) {
  if (score >= 0.7) return "text-green-600";
  if (score < 0.4) return "text-rose-600";
  return "text-amber-600";
}

function getScoreBg(score: number) {
  if (score >= 0.7) return "bg-green-500";
  if (score < 0.4) return "bg-rose-500";
  return "bg-amber-500";
}
