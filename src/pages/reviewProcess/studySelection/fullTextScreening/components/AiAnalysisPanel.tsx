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
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import { MarkdownContent } from "../../../../../components/ui/MarkdownContent";
import type { AiAnalysisResult, FullTextPaper, MatchStatus } from "../types";
import { MATCH_STATUS_CONFIG } from "../constants";
import { cn } from "../../../../../utils/cn";
import ReviewerAiAgentPanel from "../../components/ReviewerAiAgentPanel";

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
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

      const ctx = gsap.context(() => {
        // Main sections entrance
        gsap.from(".analysis-card", {
          y: 6,
          opacity: 0,
          duration: 0.2,
          stagger: 0.03,
          ease: "power2.out",
        });

        // Score bar animation
        gsap.from(".score-bar-fill", {
          width: 0,
          duration: 0.25,
          ease: "power2.out",
        });

        // Small status cue, kept in step with the result reveal.
        gsap.from(".status-icon", {
          opacity: 0,
          duration: 0.15,
          stagger: 0.02,
        });
      }, resultsRef);

      return () => ctx.revert();
    }
  }, [aiAnalysis]);

  if (!paper) {
    return (
      <div className="flex flex-col h-full bg-bg-secondary/50">
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="w-16 h-16 bg-surface-white rounded-xl shadow-none flex items-center justify-center mb-4 border border-border">
            <FiCpu className="h-8 w-8 text-text-muted" />
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
    <div className="flex h-full min-h-0 flex-col bg-bg-secondary/30">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 custom-scrollbar">
        <ReviewerAiAgentPanel paper={paper} stage="FULL_TEXT" />
        <details className="overflow-hidden rounded-lg border border-border bg-surface-white">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none">
            <span>Additional local analysis</span>
            <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-text-tertiary">
              {aiAnalysis ? "Results available" : isAnalyzing ? "Running" : "Optional"}
              <FiChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
          </summary>
          <div className="space-y-4 border-t border-border p-3">
        {/* Run Analysis Button */}
        {!aiAnalysis && !isAnalyzing && (
          <div className="analysis-card bg-surface-white p-6 rounded-xl border border-border shadow-none text-center">
            <div className="w-12 h-12 bg-bg-secondary text-accent rounded-xl flex items-center justify-center mx-auto mb-4">
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
              type="button"
              onClick={() => !isDisabled && runAiAnalysis(paper.id)}
              disabled={isDisabled}
              className={cn(
                "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none",
                !isDisabled
                  ? "bg-primary hover:bg-primary-hover active:scale-[0.98] motion-reduce:active:scale-100"
                  : "bg-bg-secondary text-text-muted cursor-not-allowed shadow-none",
              )}
            >
              <FiCpu className="w-4 h-4" />
              {isDisabled ? "Analysis Disabled" : "Run AI Analysis"}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="bg-surface-white p-10 rounded-xl border border-border shadow-none flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <LoadingSpinner size="lg" />
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
            <div className="analysis-card bg-surface-white rounded-xl border border-border shadow-none overflow-hidden">
              <div
                className={cn(
                  "px-5 py-4 flex items-center justify-between border-b border-border",
                  getRecommendationBg(output.recommendation),
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-xl text-white shadow-none status-icon",
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
                  <div className="rounded-xl border border-success/20 bg-surface-white/50 p-3">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-success">
                      Inclusion Matches
                    </p>
                    <p className="text-lg font-black text-success">
                      {output.inclusionMatches}
                    </p>
                  </div>
                  <div className="rounded-xl border border-error/20 bg-surface-white/50 p-3">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-error">
                      Exclusion Violations
                    </p>
                    <p className="text-lg font-black text-error">
                      {output.exclusionMatches}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Exclusions Highlight */}
            {output.exclusionHighlights &&
              output.exclusionHighlights.length > 0 && (
                <div className="analysis-card rounded-xl border border-error/20 bg-error/5 p-5 shadow-none">
                  <div className="mb-3 flex items-center gap-2 text-error">
                    <FiAlertTriangle className="w-4 h-4 status-icon" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest">
                      Critical Exclusions Detected
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {output.exclusionHighlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-xs font-medium leading-relaxed text-error"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-error" />
                        <MarkdownContent content={h} variant="red" inline />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* AI Reasoning (Markdown) */}
            <div className="analysis-card bg-surface-white rounded-xl border border-border shadow-none overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg-secondary/30">
                <div className="flex items-center gap-2 text-accent">
                  <FiMessageSquare className="w-4 h-4 status-icon" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest">
                    Evidence-Based Reasoning
                  </h4>
                </div>
                <FiShield className="h-3.5 w-3.5 text-text-muted" />
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
                <div className="h-px flex-1 bg-border" />
              </div>

              {output.criteriaGroupResults &&
                output.criteriaGroupResults.map((group, idx) => (
                  <div
                    key={idx}
                    className="analysis-card bg-surface-white rounded-xl border border-border shadow-none overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={Boolean(expandedGroups[idx])}
                      onClick={() => toggleGroup(idx)}
                      className="flex min-h-11 w-full items-center justify-between px-5 py-4 transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 motion-reduce:transition-none"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-xl bg-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-secondary">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <span className="text-xs font-bold leading-snug text-text-primary">
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
                      <div className="px-5 pb-5 pt-1 space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-reduce:animate-none">
                        {/* Inclusion */}
                        {group.inclusionResults &&
                          group.inclusionResults.length > 0 && (
                            <div className="space-y-2">
                              <p className="ml-1 text-[9px] font-black uppercase tracking-widest text-success">
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
                              <p className="ml-1 text-[9px] font-black uppercase tracking-widest text-error">
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
        </details>
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
        "p-3 rounded-xl border text-xs transition-colors",
        type === "inclusion"
          ? isMatch
            ? "bg-surface-white/40 border-border/50 shadow-none"
            : "bg-bg-secondary border-border"
          : isMatch
            ? "bg-error/5 border-error/20 shadow-none"
            : "bg-bg-secondary border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <p
          className={cn(
            "font-medium leading-relaxed",
            isMatch
              ? type === "inclusion"
                ? "text-success"
                : "text-error"
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
        <div className="mt-2.5 rounded-xl border border-error/15 bg-surface-white/80 p-2.5">
          <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-error opacity-80">
            <FiActivity className="w-2.5 h-2.5" />
            Evidence Highlight
          </p>
          <MarkdownContent
            content={highlight}
            variant="red"
            className="text-[10.5px] italic leading-relaxed text-error/80"
            inline
          />
        </div>
      )}
    </div>
  );
}

// Helper functions for aesthetics
function getRecommendationBg(rec: string | undefined) {
  if (!rec) return "bg-bg-secondary text-text-primary";
  const r = rec.toLowerCase();
  if (r.includes("include")) return "bg-success/10 text-success";
  if (r.includes("exclude")) return "bg-error/5 text-error";
  if (r.includes("uncertain")) return "bg-warning/10 text-warning";
  return "bg-bg-secondary text-text-primary";
}

function getRecommendationIconBg(rec: string | undefined) {
  if (!rec) return "bg-text-muted";
  const r = rec.toLowerCase();
  if (r.includes("include")) return "bg-success";
  if (r.includes("exclude")) return "bg-error";
  if (r.includes("uncertain")) return "bg-warning";
  return "bg-text-muted";
}

function getRecommendationIcon(rec: string | undefined) {
  if (!rec) return <FiHelpCircle className="w-4 h-4" />;
  const r = rec.toLowerCase();
  if (r.includes("include")) return <FiCheck className="w-4 h-4" />;
  if (r.includes("exclude")) return <FiX className="w-4 h-4" />;
  return <FiHelpCircle className="w-4 h-4" />;
}

function getScoreColor(score: number) {
  if (score >= 0.7) return "text-success";
  if (score < 0.4) return "text-error";
  return "text-warning";
}

function getScoreBg(score: number) {
  if (score >= 0.7) return "bg-success";
  if (score < 0.4) return "bg-error";
  return "bg-warning";
}
