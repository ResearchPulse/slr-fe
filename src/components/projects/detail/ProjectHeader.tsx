import React from "react";
import type { Project } from "../../../types/project";
import {
  FiSettings,
  FiEdit3,
  FiArrowLeft,
  FiGlobe,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";

interface ProjectHeaderProps {
  project: Project;
  onBack: () => void;
  onEdit: () => void;
  onSettings?: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onBack,
  onEdit,
  onSettings,
}) => {
  const getInitials = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : "";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayCode = project.code || (project.id ? project.id.slice(0, 8).toUpperCase() : "PROJECT");
  const displayTitle = project.title || (project as any).name || "Systematic Literature Review";
  const displayStatus = project.statusText || (project.status === 2 ? "Completed" : "Active");

  const metaLabel =
    "text-[12px] font-medium text-text-muted flex items-center gap-1.5";

  return (
    <div className="space-y-4 mb-10">
      {/* Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-primary transition-colors group"
      >
        <FiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Back to projects
      </button>

      {/* Project header */}
      <div className="border border-border rounded-[12px] bg-surface-white overflow-hidden">
        {/* Top Section: Identity & Actions */}
        <div className="p-6 sm:p-8 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-3 flex-1">
              {/* Code — quiet metadata, not a badge */}
              <span className="font-mono text-[12px] text-text-muted">
                {displayCode}
              </span>

              <h1 className="text-[28px] sm:text-[34px] lg:text-[40px] font-semibold text-text-primary leading-[1.15] tracking-[-0.01em]">
                {displayTitle}
              </h1>

              {project.description && (
                <p className="text-text-secondary text-[15px] leading-[1.7] max-w-2xl">
                  {project.description}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 h-10 rounded-[8px] text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
              >
                <FiEdit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              {onSettings && (
                <button
                  title="Project settings"
                  onClick={onSettings}
                  className="p-2.5 h-10 w-10 flex items-center justify-center rounded-[8px] text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <FiSettings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Metadata Grid — quiet definitions on the page surface */}
        <div className="bg-bg-secondary/40 px-6 sm:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Domain */}
            <div className="space-y-1.5">
              <span className={metaLabel}>
                <FiGlobe className="w-3.5 h-3.5" />
                Domain
              </span>
              <p className="text-sm text-text-primary font-medium">
                {project.domain}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <span className={metaLabel}>
                <FiActivity className="w-3.5 h-3.5" />
                Status
              </span>
              <div>
                <span
                  className={`inline-block px-2.5 py-[3px] rounded-full text-[12px] font-medium leading-none ${
                    displayStatus === "Active"
                      ? "bg-primary-light text-primary"
                      : displayStatus === "Completed"
                        ? "bg-success/10 text-success"
                        : "bg-bg-secondary text-text-secondary"
                  }`}
                >
                  {displayStatus}
                </span>
              </div>
            </div>

            {/* Created & Modified Date */}
            <div className="space-y-2">
              <span className={metaLabel}>
                <FiCalendar className="w-3.5 h-3.5" />
                Dates
              </span>
              <p className="text-sm text-text-primary">
                <span className="text-text-muted text-[12px]">Created </span>
                {formatDate(project.createdAt)}
              </p>
              <p className="text-sm text-text-primary">
                <span className="text-text-muted text-[12px]">Modified </span>
                {formatDate(project.modifiedAt || (project as any).updatedAt || project.createdAt)}
              </p>
            </div>

            {/* Leader Info */}
            <div className="space-y-1.5 lg:border-l lg:border-border lg:pl-6">
              <span className={metaLabel}>Project leader</span>
              {project.leader ? (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary-light text-primary rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(project.leader.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {project.leader.fullName}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {project.leader.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  No leader assigned
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
