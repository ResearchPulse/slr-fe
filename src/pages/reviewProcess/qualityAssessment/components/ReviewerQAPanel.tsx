import { useState, useEffect } from "react";
import {
  FiCheck,
  FiX,
  FiHelpCircle,
  FiZap,
  FiMessageSquare,
} from "react-icons/fi";
import type {
  QAPaperResponse,
  QualityAssessmentStrategy,
  AutomateQualityAssessmentResponse,
} from "../../../../types/qualityAssessment";
import type { HighlightArea } from "@react-pdf-viewer/highlight";

interface HighlightData {
  areas: HighlightArea[];
  reviewerInitials: string;
  bgColor: string;
}

export interface ReviewerDecisionPayload {
  /** this is protocol.qualityCriterionId */
  criterionId: string;
  /**
   * this is the decision.decisionItem.Id
   * */
  itemId?: string;
  value: number;
  comment?: string;
  pdfHighlightCoordinates?: string;
}

interface ReviewerQAPanelProps {
  paper: QAPaperResponse;
  strategies: QualityAssessmentStrategy[];
  onSave: (notes: string | null, decisions: ReviewerDecisionPayload[]) => void;
  onAiAnalyze?: (paperId: string) => Promise<AutomateQualityAssessmentResponse>;
  isSaving?: boolean;
  activeCriterionId?: string | null;
  onSelectCriterion?: (id: string | null) => void;
  highlightsByCriterion?: Record<string, HighlightData[]>;
  canEdit?: boolean;
}

export default function ReviewerQAPanel({
  paper,
  strategies,
  onSave,
  onAiAnalyze,
  isSaving,
  activeCriterionId,
  onSelectCriterion,
  highlightsByCriterion,
  canEdit = true,
}: ReviewerQAPanelProps) {
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

  // Pre-fill existing decisions
  useEffect(() => {
    if (!paper) return;
    const initialAnswers: Record<
      string,
      {
        value: number;
        comment?: string;
        id?: string;
        pdfHighlightCoordinates?: string;
      }
    > = {};

    // We assume the reviewer sees their own decision (probably the first/only one in the array for their view)
    const myDecision = paper.decisions?.[0];
    myDecision?.decisionItems?.forEach((item) => {
      if (item.qualityCriterionId && item.value !== null) {
        initialAnswers[item.qualityCriterionId] = {
          value: Number(item.value),
          comment: item.comment || "",
          id: item.id || undefined,
          pdfHighlightCoordinates: item.pdfHighlightCoordinates || undefined,
        };
      }
    });

    setAnswers(initialAnswers);
    setNotes(""); // Reset notes since they are missing from QAPaper response currently
  }, [paper]);

  const handleAiAnalyze = async () => {
    if (!onAiAnalyze || !paper) return;
    try {
      setIsAiLoading(true);
      const aiResponse = await onAiAnalyze(paper.paperId);
      const { pageWidth, pageHeight, decisionItems } = aiResponse;

      if (decisionItems && decisionItems.length > 0) {
        setAnswers((prev) => {
          const newAnswers = { ...prev };
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
              ...newAnswers[item.qualityCriterionId],
              value: item.value,
              comment: item.comment,
              pdfHighlightCoordinates: normalizedCoords,
            };
          });
          return newAnswers;
        });
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelect = (criterionId: string, val: number) => {
    setAnswers((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], value: val },
    }));
  };

  const handleCommentChange = (criterionId: string, txt: string) => {
    setAnswers((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], comment: txt },
    }));
  };

  const handleSave = () => {
    const payload: ReviewerDecisionPayload[] = Object.keys(answers).map(
      (critId) => {
        let highlightStr = answers[critId].pdfHighlightCoordinates;
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
          itemId: answers[critId].id,
          value: answers[critId].value,
          comment: answers[critId].comment,
          pdfHighlightCoordinates: highlightStr,
        };
      },
    );
    onSave(notes || null, payload);
  };

  // Extract all criteria from strategies
  const criteriaList = strategies.flatMap((s) =>
    s.checklists.flatMap((cl) =>
      cl.criteria.map((c) => ({
        ...c,
        checklistName: cl.name,
        strategyName: s.description,
      })),
    ),
  );

  const hasResolution = !!paper.resolution;

  return (
    <div className="relative flex h-full flex-col bg-surface-white">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pb-24">
        {/* AI Advertisement Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary-light/70 p-4">
          <div className="mt-0.5 rounded-lg bg-surface-white p-2 text-primary shadow-sm">
            <FiZap className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-semibold text-text-primary">
              Stuck on a tricky paper?
            </h3>
            <p className="mb-3 text-xs leading-5 text-text-secondary">
              Use our AI Assistant to evaluate this paper against established
              criteria automatically.
            </p>
            <button
              onClick={handleAiAnalyze}
              disabled={isAiLoading || hasResolution}
              className="rounded-lg border border-primary/20 bg-surface-white px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAiLoading ? "Analyzing..." : "Analyze with AI Helper"}
            </button>
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-6 pb-20">
          {criteriaList.map((crit, idx) => {
            const currentAns = answers[crit.criterionId];
            const isYes = currentAns?.value === 0;
            const isNo = currentAns?.value === 1;
            const isUnclear = currentAns?.value === 2;
            const isActive = activeCriterionId === crit.criterionId;

            return (
              <div
                key={crit.criterionId}
                onClick={() => onSelectCriterion?.(crit.criterionId)}
                className={`cursor-pointer space-y-3 rounded-xl border p-4 transition-colors ${isActive ? "border-primary/30 bg-primary-light/70" : "border-border bg-bg-primary hover:border-primary/20"}`}
              >
                <div className="flex gap-2">
                  <span className="text-sm font-semibold text-text-secondary">
                    {idx + 1}.
                  </span>
                  <p className="text-sm font-medium text-text-primary">
                    {crit.question}
                  </p>
                </div>

                <div className="flex gap-2 pl-5">
                  <button
                    onClick={() => handleSelect(crit.criterionId, 0)}
                    disabled={hasResolution}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-medium border rounded-md transition ${isYes ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"} ${hasResolution ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <FiCheck /> Yes
                  </button>
                  <button
                    onClick={() => handleSelect(crit.criterionId, 1)}
                    disabled={hasResolution}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-medium border rounded-md transition ${isNo ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"} ${hasResolution ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <FiX /> No
                  </button>
                  <button
                    onClick={() => handleSelect(crit.criterionId, 2)}
                    disabled={hasResolution}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-medium border rounded-md transition ${isUnclear ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-surface-white border-border text-text-secondary hover:bg-bg-primary"} ${hasResolution ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <FiHelpCircle /> Unclear
                  </button>
                </div>

                <div className="pl-5 pt-1">
                  <div className="relative">
                    <FiMessageSquare className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={currentAns?.comment || ""}
                      onChange={(e) =>
                        handleCommentChange(crit.criterionId, e.target.value)
                      }
                      disabled={hasResolution}
                      className={`w-full rounded-lg border border-border py-2 pl-8 pr-3 text-xs outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 ${hasResolution ? "cursor-not-allowed bg-bg-primary opacity-50" : ""}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-surface-white p-4 shadow-[0_-4px_12px_-6px_rgba(18,35,49,0.16)]">
        <button
          onClick={handleSave}
          disabled={isSaving || !canEdit || hasResolution}
          className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Assessment"}
        </button>
      </div>
    </div>
  );
}
