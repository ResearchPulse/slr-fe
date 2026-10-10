import React, { useState } from "react";
import { FileText, Settings, ArrowRight } from "lucide-react";
import { ChecklistTemplateModal } from "./StuSeChecklistTemplateModal";
import { ProcessSettingsModal } from "./StuSeSettingsModal";
import { ReviewerProgressModal } from "./StuSeReviewerProgressModal";
import { UserCheck, BarChart2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../../../utils/cn";

interface ActionTabProps {
  isDisabled?: boolean;
}

export const ActionTab: React.FC<ActionTabProps> = ({ isDisabled }) => {
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const navigate = useNavigate();
  const { projectId, processId, screeningProcessId } = useParams();

  const actions = [
    {
      title: "Checklist Template",
      description:
        "Define the eligibility criteria and checklist structure for reviewers.",
      icon: FileText,
      iconTone: "bg-primary-light text-accent",
      onClick: () => setIsChecklistOpen(true),
    },
    {
      title: "Exclusion Codes",
      description: "Manage the reasons reviewers can use to exclude papers.",
      icon: Settings,
      iconTone: "bg-slate-100 text-slate-600",
      onClick: () => setIsSettingsOpen(true),
    },
    {
      title: "Reviewer Progress",
      description:
        "Monitor reviewer workloads and real-time screening completion status.",
      icon: UserCheck,
      iconTone: "bg-emerald-50 text-emerald-600",
      onClick: () => setIsProgressOpen(true),
    },
    {
      title: "View paper statistic",
      description:
        "View detailed statistics and metrics for the screening process.",
      icon: BarChart2,
      iconTone: "bg-primary-light text-accent",
      onClick: () => {
        if (!isDisabled)
          navigate(
            `/projects/${projectId}/processes/${processId}/screening/${screeningProcessId}/papers-statistic`,
          );
      },
    },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {/* Action Strategies */}
        <div className="grid gap-2.5">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => !isDisabled && action.onClick()}
              disabled={isDisabled}
              className={cn(
                "group flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-surface-white p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20",
                !isDisabled
                  ? "hover:border-accent hover:bg-primary-light/40"
                  : "opacity-60 cursor-not-allowed",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  action.iconTone,
                )}
              >
                <action.icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold leading-5 text-slate-800 transition-colors group-hover:text-accent">
                  {action.title}
                </h4>
                <p className="mt-1 text-[11px] leading-4 text-text-secondary">
                  {action.description}
                </p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-accent" />
            </button>
          ))}
        </div>

        {/* Helper Note */}
        <div className="mt-2 rounded-xl border border-dashed border-border bg-bg-secondary p-3">
          <p className="text-[9px] font-medium text-center uppercase leading-4 tracking-[0.12em] text-text-secondary">
            These actions are primary for leaders to setup and maintain the
            review integrity
          </p>
        </div>
      </div>

      {/* Modals */}
      <ChecklistTemplateModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
      />
      <ProcessSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <ReviewerProgressModal
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
      />
    </div>
  );
};
