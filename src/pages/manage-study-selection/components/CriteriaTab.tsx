import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  ListChecks,
} from "lucide-react";
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
}

export const CriteriaTab: React.FC<CriteriaTabProps> = ({
  projectId,
}) => {
  const [showPicoc, setShowPicoc] = useState(true);
  const [showRq, setShowRq] = useState(true);
  const [showCriteria, setShowCriteria] = useState(true);

  const { picocs, isLoading: picocLoading } = useProjectPicocs(projectId);
  const { researchQuestions, isLoading: rqLoading } =
    useProjectResearchQuestions(projectId);
  const { data: criteria, isLoading: criteriaLoading } =
    useSelectionCriteria(projectId);

  const isLoading = picocLoading || rqLoading || criteriaLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full px-1">
      {/* PICOC Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowPicoc(!showPicoc)}
          className="flex items-center justify-between w-full text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] hover:text-text-secondary transition-colors group"
        >
          <span>Project Reference</span>
          {showPicoc ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {showPicoc && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ProjectPICOCElement picocs={picocs} isCompact={true} />
          </div>
        )}
      </div>

      {/* RQ Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowRq(!showRq)}
          className="flex items-center justify-between w-full text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] hover:text-text-secondary transition-colors group"
        >
          <span>Scientific Basis</span>
          {showRq ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {showRq && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ProjectResearchQuestions
              researchQuestions={researchQuestions}
              isCompact={true}
            />
          </div>
        )}
      </div>

      {/* Criteria Groups Section */}
      <div className="space-y-3 pb-4">
        <button
          onClick={() => setShowCriteria(!showCriteria)}
          className="flex items-center justify-between w-full text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] hover:text-text-secondary transition-colors group"
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

        {showCriteria && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {criteria && criteria.length > 0 ? (
              criteria.map((group) => (
                <div
                  key={group.criteriaId}
                  className="bg-surface-white border border-border rounded-[4px] overflow-hidden shadow-none hover:shadow-none transition-shadow-none"
                >
                  <div className="p-3 bg-bg-secondary border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <ListChecks className="w-3.5 h-3.5 text-accent" />
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight line-clamp-1">
                        {group.description || "Criteria Group"}
                      </h4>
                    </div>
                  </div>

                  <div className="p-3 space-y-4">
                    {/* Inclusion */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
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
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
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
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 uppercase tracking-widest">
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
                              <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
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
              <div className="py-8 text-center bg-bg-secondary rounded-[4px] border border-dashed border-border text-text-secondary text-xs italic">
                No selection criteria defined.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
