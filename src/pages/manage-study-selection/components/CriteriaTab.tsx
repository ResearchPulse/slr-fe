import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  ListChecks,
  Pencil,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import ProjectPICOCElement from "../../../components/reviewProcess/leader/ProjectPICOCElement";
import ProjectResearchQuestions from "../../../components/reviewProcess/leader/ProjectResearchQuestions";
import {
  useProjectPicocs,
  useProjectResearchQuestions,
} from "../../../hooks/useProjects";
import { useSelectionCriteria } from "../../../hooks/useSelectionCriteria";

interface CriteriaTabProps {
  projectId?: string;
  screeningProcessId?: string;
  onEditCriteria?: () => void;
}

export const CriteriaTab: React.FC<CriteriaTabProps> = ({
  projectId,
  screeningProcessId,
  onEditCriteria,
}) => {
  const [showPicoc, setShowPicoc] = useState(true);
  const [showRq, setShowRq] = useState(true);
  const [showCriteria, setShowCriteria] = useState(true);

  const { picocs, isLoading: picocLoading } = useProjectPicocs(projectId);
  const { researchQuestions, isLoading: rqLoading } =
    useProjectResearchQuestions(projectId);
  const { data: criteria, isLoading: criteriaLoading } =
    useSelectionCriteria(screeningProcessId);

  const isLoading = picocLoading || rqLoading || criteriaLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-150 motion-reduce:animate-none">
      {/* PICOC Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowPicoc(!showPicoc)}
          className="group flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        >
          <span>Project Reference</span>
          {showPicoc ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {showPicoc && (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
            <ProjectPICOCElement picocs={picocs} isCompact={true} />
          </div>
        )}
      </div>

      {/* RQ Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowRq(!showRq)}
          className="group flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        >
          <span>Scientific Basis</span>
          {showRq ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {showRq && (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
            <ProjectResearchQuestions
              researchQuestions={researchQuestions}
              isCompact={true}
            />
          </div>
        )}
      </div>

      {/* Criteria Groups Section */}
      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowCriteria(!showCriteria)}
            className="group flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-lg px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <div className="flex items-center gap-2">
              <span>Selection Criteria</span>
              {criteria && criteria.length > 0 && (
                <span className="bg-bg-secondary text-text-secondary px-1.5 py-0.5 rounded-full text-[8px] tracking-normal">
                  {criteria.length}
                </span>
              )}
            </div>
            {showCriteria ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {onEditCriteria && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onEditCriteria}
              className="min-h-11 shrink-0 px-3 py-1.5 text-xs"
            >
              <Pencil className="mr-1.5 h-3 w-3" />
              Edit
            </Button>
          )}
        </div>

        {showCriteria && (
          <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
            {criteria && criteria.length > 0 ? (
              criteria.map((group) => (
                <div
                  key={group.criteriaId}
                  className="bg-surface-white border border-border rounded-xl overflow-hidden shadow-none hover:shadow-none transition-shadow-none"
                >
                  <div className="p-3 bg-bg-secondary border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <ListChecks className="w-3.5 h-3.5 text-accent" />
                      <h4 className="line-clamp-1 text-[11px] font-bold uppercase tracking-tight text-text-primary">
                        {group.description || "Criteria Group"}
                      </h4>
                    </div>
                  </div>

                  <div className="p-3 space-y-4">
                    {/* Inclusion */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-success">
                        <CheckCircle className="w-3 h-3" />
                        Inclusion
                      </div>
                      <ul className="space-y-1.5">
                        {group.inclusionCriteria.length > 0 ? (
                          group.inclusionCriteria.map((c) => (
                            <li
                              key={c.inclusionId}
                              className="text-[11px] text-text-secondary leading-relaxed flex gap-2"
                            >
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success/70" />
                              {c.rule}
                            </li>
                          ))
                        ) : (
                          <li className="text-[10px] text-text-secondary italic">
                            No inclusion criteria
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Exclusion */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-error uppercase tracking-widest">
                        <XCircle className="w-3 h-3" />
                        Exclusion
                      </div>
                      <ul className="space-y-1.5">
                        {group.exclusionCriteria.length > 0 ? (
                          group.exclusionCriteria.map((c) => (
                            <li
                              key={c.exclusionId}
                              className="text-[11px] text-text-secondary leading-relaxed flex gap-2"
                            >
                              <span className="w-1 h-1 rounded-full bg-error mt-1.5 shrink-0" />
                              {c.rule}
                            </li>
                          ))
                        ) : (
                          <li className="text-[10px] text-text-secondary italic">
                            No exclusion criteria
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-bg-secondary rounded-xl border border-dashed border-border text-text-secondary text-xs italic">
                No selection criteria defined.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
