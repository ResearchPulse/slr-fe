import { useState, useMemo, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiHelpCircle, FiZap } from "react-icons/fi";
import type {
  LeaderQAPaperResponse,
  QualityAssessmentStrategy,
  QualityAssessmentResolutionRequest,
  AutomateQualityAssessmentResponse,
  QualityAssessmentDecisionItemResponse,
} from "../../../../types/qualityAssessment";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../redux/store";
import type { ReviewerDecisionPayload } from "./ReviewerQAPanel";
import type { HighlightData } from "../sections/QAPapersTabContent";

interface LeaderQAPanelProps {
  paper: LeaderQAPaperResponse;
  strategies: QualityAssessmentStrategy[];
  onResolve: (
    data: Omit<
      QualityAssessmentResolutionRequest,
      "qualityAssessmentProcessId" | "paperId"
    >,
    decisionData?: { notes: string | null; items: ReviewerDecisionPayload[] },
  ) => void;
  onAiAnalyze?: (paperId: string) => Promise<AutomateQualityAssessmentResponse>;
  isResolving?: boolean;
  activeCriterionId?: string | null;
  onSelectCriterion?: (id: string | null) => void;
  highlightsByCriterion?: Record<string, HighlightData[]>;
  canEdit?: boolean;
  activeTab?: "reviewers" | "my-assessment";
  onTabChange?: (tab: "reviewers" | "my-assessment") => void;
}

export default function LeaderQAPanel({
  paper,
  strategies,
  onResolve,
  onAiAnalyze,
  isResolving,
  activeCriterionId,
  onSelectCriterion,
  highlightsByCriterion,
  canEdit = true,
  activeTab: externalActiveTab,
  onTabChange,
}: LeaderQAPanelProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [internalActiveTab, setInternalActiveTab] = useState<
    "reviewers" | "my-assessment"
  >("reviewers");
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = (tab: "reviewers" | "my-assessment") => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const [finalDecision, setFinalDecision] = useState<number | null>(
    paper.resolution?.finalDecision ?? null,
  );
  const [resolutionNotes, setResolutionNotes] = useState(
    paper.resolution?.resolutionNotes ?? "",
  );

  // Leader's own assessment state
  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        value: number;
        comment?: string;
        id?: string;
        pdfHighlightCoordinates?: string;
      }
    >
  >({});
  const [notes, setNotes] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiAnalyze = async () => {
    if (!onAiAnalyze || !paper.paperId) return;
    setIsAiLoading(true);
    try {
      const aiResponse = await onAiAnalyze(paper.paperId);
      const { pageWidth, pageHeight, decisionItems } = aiResponse;
      const newAnswers = { ...answers };
      decisionItems.forEach((item) => {
        // Normalize pdfHighlightCoordinates using pageWidth/pageHeight
        let normalizedCoords = item.pdfHighlightCoordinates;
        if (normalizedCoords && pageWidth && pageHeight) {
          normalizedCoords = normalizedCoords
            .split(";")
            .filter(Boolean)
            .map((segment) => {
              // Grobid gave coords in pdf units and started page index at 1, reactpdfviewer using 0-based page index and persentages
              const [page, x, y, h, w] = segment.split(",").map(Number);
              const normPage = page - 1; // Convert to 0-based page index
              const normX = (x / pageWidth) * 100;
              const normY = (y / pageHeight) * 100;
              const normH = (h / pageHeight) * 100;
              const normW = (w / pageWidth) * 100;
              return `${normPage},${normX},${normY},${normH},${normW}`;
            })
            .join(";");
        }

        newAnswers[item.qualityCriterionId] = {
          value: item.value,
          comment: `${item.comment}`,
          id: answers[item.qualityCriterionId]?.id,
          pdfHighlightCoordinates: normalizedCoords,
        };
        console.log("AI Analysis Result:", newAnswers[item.qualityCriterionId]);
      });
      setAnswers(newAnswers);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (!paper || !currentUser) return;
    const initialAnswers: Record<
      string,
      {
        value: number;
        comment?: string;
        id?: string;
        pdfHighlightCoordinates?: string;
      }
    > = {};

    // Find leader's own decision if it exists
    const myDecision = paper.decisions?.find(
      (d) => d.reviewerId === currentUser.id,
    );
    myDecision?.decisionItems?.forEach((item) => {
      if (item.qualityCriterionId && item.value !== null) {
        initialAnswers[item.qualityCriterionId] = {
          value: Number(item.value),
          comment: item.comment || "",
          id: item.id || undefined,
          pdfHighlightCoordinates: item.pdfHighlightCoordinates || "",
        };
      }
    });

    setAnswers(initialAnswers);
    setNotes("");
    setFinalDecision(paper.resolution?.finalDecision ?? null);
    setResolutionNotes(paper.resolution?.resolutionNotes ?? "");
  }, [paper, currentUser]);

  const handleResolve = () => {
    // Only lock submit button when no resolution selected
    if (finalDecision === null) return;

    // Prepare decision items
    const decisionItems: ReviewerDecisionPayload[] = Object.keys(answers).map(
      (critId) => {
        const a = answers[critId];
        let highlightStr = a.pdfHighlightCoordinates;

        if (highlightsByCriterion?.[critId]) {
          // Flatten the areas and map to format: page,x,y,height,width
          highlightStr = highlightsByCriterion[critId]
            .flatMap((r) => r.areas)
            .map(
              (a) => `${a.pageIndex},${a.left},${a.top},${a.height},${a.width}`,
            )
            .join(";");
        }

        return {
          criterionId: critId,
          itemId: a.id,
          value: a.value,
          comment: a.comment,
          pdfHighlightCoordinates: highlightStr,
        };
      },
    );

    const hasMadeDecisions = decisionItems.length > 0;

    onResolve(
      {
        finalDecision,
        finalScore: 0,
        resolutionNotes,
      },
      hasMadeDecisions ? { notes, items: decisionItems } : undefined,
    );
  };

  const handleAnswer = (criterionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || {}),
        value,
      },
    }));
  };

  const handleComment = (criterionId: string, comment: string) => {
    setAnswers((prev) => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || { value: 2 }),
        comment,
      },
    }));
  };

  // Group reviewers' decisions by criterion ID
  const criteriaDecisions = useMemo(() => {
    const map: Record<string, Record<string, QualityAssessmentDecisionItemResponse>> = {};
    if (!paper.decisions) return map;

    paper.decisions.forEach((decision) => {
      decision.decisionItems?.forEach((item) => {
        if (!map[item.qualityCriterionId]) {
          map[item.qualityCriterionId] = {};
        }
        map[item.qualityCriterionId][decision.reviewerId] = item;
      });
    });
    return map;
  }, [paper.decisions]);

  const criteriaList = strategies.flatMap((s) =>
    s.checklists.flatMap((cl) =>
      cl.criteria.map((c) => ({
        ...c,
        checklistName: cl.name,
        strategyName: s.description,
      })),
    ),
  );

  return (
    <div className="relative flex h-full flex-col bg-surface-white">
      <div className="flex shrink-0 border-b border-border bg-bg-primary/60 px-2 pt-2">
        <button
          className={`flex-1 rounded-t-lg py-2.5 text-xs font-semibold transition-colors focus:outline-none ${
            activeTab === "reviewers"
              ? "bg-surface-white text-primary shadow-[0_-1px_0_0_#DCE4E9,1px_0_0_0_#DCE4E9,-1px_0_0_0_#DCE4E9]"
              : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("reviewers")}
        >
          Reviewers' Decisions
        </button>
        <button
          className={`flex-1 rounded-t-lg py-2.5 text-xs font-semibold transition-colors focus:outline-none ${
            activeTab === "my-assessment"
              ? "bg-surface-white text-primary shadow-[0_-1px_0_0_#DCE4E9,1px_0_0_0_#DCE4E9,-1px_0_0_0_#DCE4E9]"
              : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("my-assessment")}
        >
          My Assessment
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pb-24">
        {activeTab === "reviewers" ? (
          <>
            <div className="space-y-4 pb-4">
              {criteriaList.map((crit, idx) => {
                const decisionsForCrit =
                  criteriaDecisions[crit.criterionId] || {};

                // Group reviewers by their choice
                const groupedDecisions = {
                  yes: [] as Array<{
                    reviewer: (typeof paper.reviewers)[0];
                    decision: QualityAssessmentDecisionItemResponse | undefined;
                  }>,
                  no: [] as Array<{
                    reviewer: (typeof paper.reviewers)[0];
                    decision: QualityAssessmentDecisionItemResponse | undefined;
                  }>,
                  unclear: [] as Array<{
                    reviewer: (typeof paper.reviewers)[0];
                    decision: QualityAssessmentDecisionItemResponse | undefined;
                  }>,
                  unanswered: [] as Array<{
                    reviewer: (typeof paper.reviewers)[0];
                    decision: QualityAssessmentDecisionItemResponse | undefined;
                  }>,
                };

                paper.reviewers.forEach((reviewer) => {
                  const decision = decisionsForCrit[reviewer.id];
                  const val =
                    decision?.value !== null && decision?.value !== undefined
                      ? Number(decision.value)
                      : null;

                  if (val === 0)
                    groupedDecisions.yes.push({ reviewer, decision });
                  else if (val === 1)
                    groupedDecisions.no.push({ reviewer, decision });
                  else if (val === 2)
                    groupedDecisions.unclear.push({ reviewer, decision });
                  else groupedDecisions.unanswered.push({ reviewer, decision });
                });

                const comments = paper.reviewers
                  .map((r) => ({
                    reviewer: r,
                    decision: decisionsForCrit[r.id],
                  }))
                  .filter((d) => d.decision?.comment);

                return (
                  <div
                    key={crit.criterionId}
                    onClick={() => onSelectCriterion?.(crit.criterionId)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${activeCriterionId === crit.criterionId ? "border-primary/30 bg-primary-light/70" : "border-border bg-bg-primary hover:border-primary/20"}`}
                  >
                    <p className="text-xs font-medium text-text-primary mb-3">
                      {idx + 1}. {crit.question}
                    </p>

                    <div className="flex flex-col gap-3">
                      {/* Grouped Choices */}
                      <div className="flex flex-wrap gap-2">
                        {/* Yes Group */}
                        {groupedDecisions.yes.length > 0 && (
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-1.5 rounded-xl">
                            <FiCheckCircle className="text-emerald-500 w-3.5 h-3.5" />
                            <span className="text-xs font-medium text-emerald-700 mr-1">
                              Yes
                            </span>
                            <div className="flex -space-x-1.5">
                              {groupedDecisions.yes.map(({ reviewer }) => (
                                <div
                                  key={reviewer.id}
                                  className="relative group shrink-0"
                                >
                                  <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-white ring-1 ring-emerald-200">
                                    <span className="text-[9px] font-bold leading-none text-emerald-700">
                                      {(reviewer.fullname || reviewer.username)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-max bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-none whitespace-nowrap">
                                    {reviewer.fullname || reviewer.username}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Group */}
                        {groupedDecisions.no.length > 0 && (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-2 py-1.5 rounded-xl">
                            <FiXCircle className="text-rose-500 w-3.5 h-3.5" />
                            <span className="text-xs font-medium text-rose-700 mr-1">
                              No
                            </span>
                            <div className="flex -space-x-1.5">
                              {groupedDecisions.no.map(({ reviewer }) => (
                                <div
                                  key={reviewer.id}
                                  className="relative group shrink-0"
                                >
                                  <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-white ring-1 ring-rose-200">
                                    <span className="text-[9px] font-bold leading-none text-rose-700">
                                      {(reviewer.fullname || reviewer.username)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-max bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-none whitespace-nowrap">
                                    {reviewer.fullname || reviewer.username}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unclear Group */}
                        {groupedDecisions.unclear.length > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded-xl">
                            <FiHelpCircle className="text-amber-500 w-3.5 h-3.5" />
                            <span className="text-xs font-medium text-amber-700 mr-1">
                              Unclear
                            </span>
                            <div className="flex -space-x-1.5">
                              {groupedDecisions.unclear.map(({ reviewer }) => (
                                <div
                                  key={reviewer.id}
                                  className="relative group shrink-0"
                                >
                                  <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-white ring-1 ring-amber-200">
                                    <span className="text-[9px] font-bold leading-none text-amber-700">
                                      {(reviewer.fullname || reviewer.username)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-max bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-none whitespace-nowrap">
                                    {reviewer.fullname || reviewer.username}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comments List */}
                      {comments.length > 0 && (
                        <div className="flex flex-col gap-1.5 pl-1 border-l-2 border-border mt-1">
                          {comments.map(({ reviewer, decision }) => (
                            <div
                              key={reviewer.id}
                              className="flex items-start gap-2 text-xs"
                            >
                              <span className="font-medium text-text-primary whitespace-nowrap mt-0.5">
                                {reviewer.username}:
                              </span>
                              <span className="text-text-secondary italic">
                                "{decision.comment}"
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4 pb-4">
            {onAiAnalyze && canEdit && (
              <button
                onClick={handleAiAnalyze}
                disabled={isAiLoading}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                <FiZap className={isAiLoading ? "animate-pulse" : ""} />
                {isAiLoading
                  ? "AI is analyzing..."
                  : "Ask AI to assist with Assessment"}
              </button>
            )}
            {criteriaList.map((crit, idx) => {
              const currentAns = answers[crit.criterionId];
              const isSelected = !!currentAns;

              return (
                <div
                  key={crit.criterionId}
                  onClick={() => onSelectCriterion?.(crit.criterionId)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${
                    activeCriterionId === crit.criterionId
                      ? "bg-primary-light/70 border-primary/30"
                      : "bg-bg-primary border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-text-secondary mt-0.5">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary leading-relaxed mb-3">
                        {crit.question}
                      </p>

                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnswer(crit.criterionId, 0);
                          }}
                          disabled={!canEdit}
                          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs font-medium border transition-colors ${
                            currentAns?.value === 0
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                              : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"
                          } ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <FiCheckCircle
                            className={
                              currentAns?.value === 0
                                ? "text-emerald-500"
                                : "text-text-secondary"
                            }
                          />
                          Yes
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnswer(crit.criterionId, 1);
                          }}
                          disabled={!canEdit}
                          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs font-medium border transition-colors ${
                            currentAns?.value === 1
                              ? "bg-rose-50 border-rose-500 text-rose-700"
                              : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"
                          } ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <FiXCircle
                            className={
                              currentAns?.value === 1
                                ? "text-rose-500"
                                : "text-text-secondary"
                            }
                          />
                          No
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnswer(crit.criterionId, 2);
                          }}
                          disabled={!canEdit}
                          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs font-medium border transition-colors ${
                            currentAns?.value === 2
                              ? "bg-amber-50 border-amber-500 text-amber-700"
                              : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"
                          } ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <FiHelpCircle
                            className={
                              currentAns?.value === 2
                                ? "text-amber-500"
                                : "text-text-secondary"
                            }
                          />
                          Unclear
                        </button>
                      </div>

                      {isSelected && (
                        <div>
                          <textarea
                            value={currentAns?.comment || ""}
                            onChange={(e) =>
                              handleComment(crit.criterionId, e.target.value)
                            }
                            placeholder="Add your reasoning..."
                            className="w-full resize-none rounded-xl border border-border bg-surface-white px-3 py-2 text-xs outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                            rows={2}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!canEdit}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h3 className="text-sm font-semibold text-text-primary border-b pb-2 pt-2">
          Final Resolution
        </h3>

        <div className="space-y-4 pb-20">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Final Decision
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFinalDecision(1)}
                className={`p-2 rounded-xl text-xs font-medium border text-center transition ${finalDecision === 1 ? "bg-surface-white border-green-500 text-green-700" : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"}`}
                disabled={!canEdit}
              >
                High Quality
              </button>
              <button
                onClick={() => setFinalDecision(0)}
                className={`p-2 rounded-xl text-xs font-medium border text-center transition ${finalDecision === 0 ? "bg-surface-white border-red-500 text-red-700" : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"}`}
                disabled={!canEdit}
              >
                Low Quality
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Resolution Notes
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              placeholder="Add reasoning for this resolution..."
              className="w-full px-3 py-1.5 text-xs border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-accent/30"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-surface-white p-4 shadow-[0_-4px_12px_-6px_rgba(18,35,49,0.16)]">
        <button
          onClick={handleResolve}
          disabled={isResolving || finalDecision === null || !canEdit}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResolving ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
