import React, { useState } from "react";
import ReviewNeedsTab from "./ReviewNeedsTab";
import DocumentsTab from "./DocumentsTab";
import ProjectTimetableTab from "./ProjectTimetableTab";
import type { Project } from "../../../types/project";

interface BusinessJustificationSectionProps {
  project: Project;
  projectId: string;
  isLeader: boolean;
  isProjectActive: boolean;
  reviewNeeds: any[];
  documents: any[];
  isUpdatingDates: boolean;
  handleSaveProjectDates: (payload: {
    id: string;
    startDate: string | null;
    endDate: string | null;
  }) => Promise<void>;
  setIsNeedModalOpen: (open: boolean) => void;
  setIsDocModalOpen: (open: boolean) => void;
  onSkip?: () => void;
}

const BusinessJustificationSection: React.FC<
  BusinessJustificationSectionProps
> = ({
  project,
  projectId,
  isLeader,
  isProjectActive,
  reviewNeeds,
  documents,
  isUpdatingDates,
  handleSaveProjectDates,
  setIsNeedModalOpen,
  setIsDocModalOpen,
  onSkip,
}) => {
  const [activeTab, setActiveTab] = useState<"needs" | "documents" | "dates">(
    "needs",
  );

  const bjTabs = [
    { key: "needs", label: "Review needs", count: reviewNeeds.length },
    { key: "documents", label: "Documents", count: documents.length },
    {
      key: "dates",
      label: "Timeline",
      count: project.startDate && project.endDate ? 1 : 0,
    },
  ] as const;

  return (
    <div>
      {!isProjectActive && onSkip && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-text-secondary transition-colors hover:text-accent"
          >
            Continue to activation →
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="mb-5 border-b border-border">
        <nav aria-label="Review justification sections" className="flex gap-6 overflow-x-auto">
          {bjTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                -mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium
                transition-colors
                ${
                  activeTab === tab.key
                    ? "text-accent border-accent"
                    : "text-text-secondary border-transparent hover:text-text-primary"
                }
              `}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-text-secondary">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === "needs" && (
          <ReviewNeedsTab
            reviewNeeds={reviewNeeds}
            onAdd={() => setIsNeedModalOpen(true)}
            isLeader={isLeader}
          />
        )}
        {activeTab === "documents" && (
          <DocumentsTab
            documents={documents}
            onAdd={() => setIsDocModalOpen(true)}
            isLeader={isLeader}
          />
        )}
        {activeTab === "dates" && projectId && (
          <ProjectTimetableTab
            key={`${project.startDate ?? ""}-${project.endDate ?? ""}`}
            projectId={projectId}
            startDate={project.startDate}
            endDate={project.endDate}
            isLeader={isLeader}
            isSaving={isUpdatingDates}
            onSave={handleSaveProjectDates}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessJustificationSection;
