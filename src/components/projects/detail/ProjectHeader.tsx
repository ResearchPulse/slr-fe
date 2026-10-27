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
  const displayTitle =
    project.title ||
    (project as Project & { name?: string }).name ||
    "Systematic Literature Review";

  return (
    <div className="mb-6 space-y-3 sm:mb-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
      >
        <FiArrowLeft size={16} />
        Back to projects
      </button>

      <header className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-6">
        <div className="min-w-0">
          {project.domain && (
            <p className="mb-2 text-xs font-medium leading-4 text-primary">
              {project.domain}
            </p>
          )}
          <h1 className="max-w-5xl break-words text-2xl font-semibold leading-tight tracking-tight text-text-primary sm:text-[28px] sm:leading-[1.25]">
            {displayTitle}
          </h1>
          {project.description && (
            <p className="mt-2.5 max-w-5xl break-words text-sm leading-6 text-text-secondary">
              {project.description}
            </p>
          )}
          {!isLeader && (
            <div className="mt-3 max-w-2xl border-l-2 border-primary/30 pl-3 text-xs leading-5 text-text-secondary">
              <p>
                Your project role is {getProjectRoleLabel(project.role ?? project.roleText)}. Only the project leader can edit setup or activate this review.
              </p>
              <p className="mt-0.5">
                {project.leader?.fullName
                  ? `Current leader: ${project.leader.fullName}${project.leader.email ? ` (${project.leader.email})` : ""}.`
                  : "Contact the current project leader to request the leader role."}
              </p>
            </div>
          )}
        </div>

        {(isLeader || onSettings) && (
          <div className="flex shrink-0 items-center gap-2 md:pt-1">
            {isLeader && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                <FiEdit3 size={15} aria-hidden="true" /> Edit project
              </button>
            )}
            {onSettings && (
              <button
                type="button"
                title="Project settings"
                aria-label="Project settings"
                onClick={onSettings}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-white text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                <FiSettings size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </header>
    </div>
  );
};

export default ProjectHeader;
