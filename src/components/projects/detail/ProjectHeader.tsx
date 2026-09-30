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

  return (
    <div className="space-y-4 mb-8">
      {/* Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium text-text-secondary hover:text-text-primary transition-colors group"
      >
        <FiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Back to Projects
      </button>

      {/* Project Card */}
      <div className="border border-border bg-surface-white">
        {/* Top Section: Identity & Actions */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-3 flex-1">
              {/* Code badge */}
              <span className="inline-block px-2 py-0.5 bg-text-primary text-bg-primary text-[10px] font-medium uppercase tracking-[0.15em]">
                {displayCode}
              </span>

              <h1 className="font-cormorant text-[32px] lg:text-[40px] font-normal text-text-primary leading-tight">
                {displayTitle}
              </h1>

              {project.description && (
                <p className="text-text-secondary text-sm leading-[1.7] max-w-2xl">
                  {project.description}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all border border-border"
              >
                <FiEdit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              {onSettings && (
                <button
                  title="Project settings"
                  onClick={onSettings}
                  className="p-2 hover:bg-bg-secondary transition-all border border-border text-text-secondary hover:text-text-primary"
                >
                  <FiSettings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Metadata Grid */}
        <div className="bg-bg-primary p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Domain */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <FiGlobe className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
                  Domain
                </span>
              </div>
              <p className="text-sm text-text-primary font-medium">
                {project.domain}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <FiActivity className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
                  Status
                </span>
              </div>
              <div>
                <span
                  className={`inline-block px-2 py-0.5 text-[11px] uppercase tracking-wider border font-medium ${
                    displayStatus === "Active"
                      ? "border-accent text-accent"
                      : displayStatus === "Completed"
                        ? "border-success text-success"
                        : "border-border text-text-secondary"
                  }`}
                >
                  {displayStatus}
                </span>
              </div>
            </div>

            {/* Created & Modified Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <FiCalendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
                  Created at
                </span>
              </div>
              <p className="text-sm text-text-primary">
                {formatDate(project.createdAt)}
              </p>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <FiCalendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
                  Modified at
                </span>
              </div>
              <p className="text-sm text-text-primary">
                {formatDate(project.modifiedAt || (project as any).updatedAt || project.createdAt)}
              </p>
            </div>

            {/* Leader Info */}
            <div className="space-y-1.5 lg:border-l lg:border-border lg:pl-6">
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-secondary block">
                Project Leader
              </span>
              {project.leader ? (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-accent flex items-center justify-center text-bg-primary text-xs font-medium shrink-0">
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
                <p className="text-sm text-text-muted italic">
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
