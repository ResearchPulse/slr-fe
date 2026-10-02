import React from "react";
import { FiArrowLeft, FiEdit3, FiSettings } from "react-icons/fi";
import { getProjectRoleLabel, type Project } from "../../../types/project";

interface ProjectHeaderProps {
  project: Project;
  isLeader?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSettings?: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  isLeader = false,
  onBack,
  onEdit,
  onSettings,
}) => {
  const displayCode = project.code || project.id.slice(0, 8).toUpperCase();
  const displayTitle =
    project.title ||
    (project as Project & { name?: string }).name ||
    "Systematic Literature Review";
  const roleLabel = isLeader
    ? "Project leader"
    : getProjectRoleLabel(project.role ?? project.roleText) === "Unknown role"
      ? "Project member"
      : getProjectRoleLabel(project.role ?? project.roleText);

  return (
    <div className="mb-5 space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 py-1 text-sm text-text-secondary transition-colors hover:text-accent"
      >
        <FiArrowLeft size={16} />
        Back to projects
      </button>

      <header className="rounded-2xl border border-border bg-white px-5 py-5 sm:px-7 sm:py-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span className="font-mono text-xs">{displayCode}</span>
              <span aria-hidden="true">·</span>
              <span>{roleLabel}</span>
            </div>
            <h1 className="max-w-5xl break-words text-[30px] font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl">
              {displayTitle}
            </h1>
            {project.description && (
              <p className="mt-2 max-w-[72ch] text-sm leading-6 text-text-secondary sm:text-base">
                {project.description}
              </p>
            )}
            {!isLeader && (
              <div className="mt-4 max-w-2xl border-l-2 border-border pl-3 text-sm leading-5 text-text-secondary">
                <p>
                  Your project role is {getProjectRoleLabel(project.role ?? project.roleText)}. Only the project leader can edit setup or activate this review.
                </p>
                <p className="mt-1">
                  {project.leader?.fullName
                    ? `Current leader: ${project.leader.fullName}${project.leader.email ? ` (${project.leader.email})` : ""}.`
                    : "Contact the current project leader to request the leader role."}
                </p>
              </div>
            )}
            {!isLeader && (
              <p className="mt-3 text-sm text-text-secondary">
                You are a project member. Project setup and activation controls are available to the project leader
                {project.leader?.fullName ? `, ${project.leader.fullName}` : ""}.
                {project.leader?.email ? ` Contact ${project.leader.email} to request changes.` : " Contact the project leader to request access or changes."}
              </p>
            )}
          </div>

          {isLeader && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-primary"
              >
                <FiEdit3 size={15} /> Edit project
              </button>
              {onSettings && (
                <button
                  type="button"
                  title="Project settings"
                  aria-label="Project settings"
                  onClick={onSettings}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary"
                >
                  <FiSettings size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default ProjectHeader;
