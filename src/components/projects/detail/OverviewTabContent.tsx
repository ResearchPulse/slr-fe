import React, { useState } from "react";
import ProjectSetupSection from "./ProjectSetupSection";
import BusinessJustificationSection from "./BusinessJustificationSection";
import type { Project } from "../../../types/project";
import {
  FiChevronDown,
  FiChevronUp,
  FiSettings,
  FiBriefcase,
} from "react-icons/fi";

interface OverviewTabContentProps {
  project: Project;
  projectId: string;
  isLeader: boolean;
  isProjectActive: boolean;
  isProjectSetupReady: boolean;
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
  onSetupSaved: () => void;
}

const OverviewTabContent: React.FC<OverviewTabContentProps> = (props) => {
  const [isSetupExpanded, setIsSetupExpanded] = useState(true);
  const [isBJExpanded, setIsBJExpanded] = useState(false);

  return (
    <div className="space-y-4 pb-12">
      {/* Project Setup Section */}
      <section className="border border-border bg-surface-white overflow-hidden">
        <button
          onClick={() => setIsSetupExpanded(!isSetupExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 text-left bg-bg-primary hover:bg-bg-secondary transition-colors border-b border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-border flex items-center justify-center text-text-secondary">
              <FiSettings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-text-primary">
                Project Setup
              </h2>
              <p className="text-[12px] text-text-secondary">
                Research scope, PICO-C and Questions
              </p>
            </div>
          </div>
          <div className="text-text-secondary">
            {isSetupExpanded ? (
              <FiChevronUp size={18} />
            ) : (
              <FiChevronDown size={18} />
            )}
          </div>
        </button>

        <div
          className={`transition-all duration-500 ease-in-out ${isSetupExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
        >
          <div className="p-6">
            <ProjectSetupSection
              projectId={props.projectId}
              isProjectSetupReady={props.isProjectSetupReady}
              onSetupSaved={props.onSetupSaved}
              embedded={true}
              hideEditButton={!props.isLeader}
            />
          </div>
        </div>
      </section>

      {/* Business Justification Section */}
      <section className="border border-border bg-surface-white overflow-hidden">
        <button
          onClick={() => setIsBJExpanded(!isBJExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 text-left bg-bg-primary hover:bg-bg-secondary transition-colors border-b border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-border flex items-center justify-center text-text-secondary">
              <FiBriefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-text-primary">
                Business Justification
              </h2>
              <p className="text-[12px] text-text-secondary">
                Governance, Review Needs and Documents
              </p>
            </div>
          </div>
          <div className="text-text-secondary">
            {isBJExpanded ? (
              <FiChevronUp size={18} />
            ) : (
              <FiChevronDown size={18} />
            )}
          </div>
        </button>

        <div
          className={`transition-all duration-500 ease-in-out ${isBJExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
        >
          <div className="p-6">
            <BusinessJustificationSection
              project={props.project}
              projectId={props.projectId}
              isLeader={props.isLeader}
              isProjectActive={props.isProjectActive}
              reviewNeeds={props.reviewNeeds}
              documents={props.documents}
              isUpdatingDates={props.isUpdatingDates}
              handleSaveProjectDates={props.handleSaveProjectDates}
              setIsNeedModalOpen={props.setIsNeedModalOpen}
              setIsDocModalOpen={props.setIsDocModalOpen}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default OverviewTabContent;
