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

  const titleSizeClass =
    displayTitle.length > 130
      ? "text-2xl sm:text-[26px] font-bold leading-snug"
      : displayTitle.length > 80
        ? "text-[26px] sm:text-3xl font-bold leading-snug"
        : "text-[30px] sm:text-4xl font-semibold leading-tight";

  return (
    <div className="mb-5 space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
      >
        <FiArrowLeft size={16} />
        Back to projects
      </button>

      <header className="rounded-xl border border-border bg-surface-white px-5 py-5 shadow-sm sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {project.domain && (
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                <span>{project.domain}</span>
              </div>
            )}
            <h1 className={`w-full break-words tracking-tight text-text-primary ${titleSizeClass}`}>
              {displayTitle}
            </h1>
            {project.description && (
              <p className="mt-4 sm:mt-5 w-full break-words text-sm leading-relaxed text-text-secondary sm:text-base">
                {project.description}
              </p>
            )}
            {!isLeader && (
              <div className="mt-4 max-w-2xl rounded-lg border border-border bg-bg-secondary p-3 text-sm leading-5 text-text-secondary">
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
          </div>

          {(isLeader || onSettings) && (
            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
              {isLeader && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
                >
                  <FiEdit3 size={15} /> Edit project
                </button>
              )}
              {onSettings && (
                <button
                  type="button"
                  title="Project settings"
                  aria-label="Project settings"
                  onClick={onSettings}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
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
