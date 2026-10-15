import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useProject } from "../../hooks/useProjects";
import { useProjectMutations } from "../../hooks/useProjects";
import { getProjectRoleLabel } from "../../types/project";
import Button from "../../components/ui/Button";
import ProjectMembersModal from "../../components/admin/slr-projects/ProjectMembersModal";
import {
  FiExternalLink,
  FiSettings,
  FiUsers,
  FiArrowLeft,
  FiCheckCircle,
  FiCpu,
} from "react-icons/fi";
import ProjectAgentAssignments from "../../components/projects/ProjectAgentAssignments";
import ReviewerProjectAgentCard from "../../components/projects/detail/ReviewerProjectAgentCard";

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { project, refetch } = useProject(id);
  const { completeProject, isCompleting } = useProjectMutations();

  const [activeTab, setActiveTab] = useState<"general" | "members" | "agents">("general");
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const handleComplete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure all review processes are completed?"))
      return;
    try {
      await completeProject(id);
      await refetch();
      navigate(`/projects/${id}`);
    } catch {
      // handled by mutation
    }
  };

  const isLeader = project?.isLeader === true ||
    getProjectRoleLabel(project?.role ?? project?.roleText) === "Project Leader";

  const settingsTab = project && !isLeader ? "agents" : activeTab;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Navigation / Header */}
        <div className="mb-7 flex flex-col justify-between gap-5 border-b border-border pb-6 md:flex-row md:items-end sm:mb-8 sm:pb-8">
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="group inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FiArrowLeft
                className="group-hover:-translate-x-1 transition-transform"
                size={14}
              />
              Back to project
            </button>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Project settings
              </p>
              <h1 className="text-[28px] font-semibold leading-tight text-text-primary sm:text-[32px]">
                Settings
              </h1>
            </div>
            <p className="text-sm text-text-secondary">
              Configure and manage your project preferences
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full shrink-0 lg:w-56">
            <nav aria-label="Project settings" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-white p-1 lg:flex-col">
              {isLeader && (
                <>
                  <button
                    onClick={() => setActiveTab("general")}
                    aria-pressed={settingsTab === "general"}
                    className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 lg:w-full ${
                      settingsTab === "general"
                        ? "bg-primary-light text-primary-hover"
                        : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                    }`}
                  >
                    <FiSettings
                      size={14}
                      className={
                        settingsTab === "general"
                          ? "text-primary"
                          : "text-text-secondary"
                      }
                    />
                    General
                  </button>
                  <button
                    onClick={() => setActiveTab("members")}
                    aria-pressed={settingsTab === "members"}
                    className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 lg:w-full ${
                      settingsTab === "members"
                        ? "bg-primary-light text-primary-hover"
                        : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                    }`}
                  >
                    <FiUsers
                      size={14}
                      className={
                        settingsTab === "members"
                          ? "text-primary"
                          : "text-text-secondary"
                      }
                    />
                    Members
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab("agents")}
                aria-pressed={settingsTab === "agents"}
                className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 lg:w-full ${
                  settingsTab === "agents"
                    ? "bg-primary-light text-primary-hover"
                    : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                }`}
              >
                <FiCpu
                  size={14}
                  className={
                      settingsTab === "agents"
                      ? "text-primary"
                      : "text-text-secondary"
                  }
                />
                AI Agents
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-6">
            {settingsTab === "general" ? (
              <div className="space-y-6">
                {/* General Settings Card */}
                <div className="overflow-hidden rounded-xl border border-border bg-surface-white">
                  <div className="px-6 py-4 border-b border-border bg-bg-primary">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">
                      Project Status Actions
                    </p>
                    <p className="text-text-secondary text-xs mt-1">
                      Lifecycle management for your systematic review
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Complete Project */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="max-w-md">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-text-secondary font-medium mb-3">
                          <FiCheckCircle size={12} />
                          Finalization
                        </div>
                        <h3 className="text-[15px] font-medium text-text-primary mb-2">
                          Complete Project
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed">
                          Mark all review processes as finished. This signals
                          that the systematic review has reached its formal
                          conclusion.
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleComplete}
                        disabled={isCompleting}
                        className="min-w-[160px] shrink-0"
                      >
                        {isCompleting ? "Processing..." : "Mark as Completed"}
                      </Button>
                    </div>

                    <div className="h-[1px] bg-border" />
                  </div>
                </div>
              </div>
            ) : settingsTab === "members" ? (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-xl border border-border bg-surface-white">
                  <div className="px-6 py-4 border-b border-border bg-bg-primary">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">
                      Team Members
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary">
                        <FiUsers size={14} />
                      </div>
                      <div>
                        <h2 className="text-[15px] font-medium text-text-primary mb-1">
                          Manage Members
                        </h2>
                        <p className="text-text-secondary text-sm">
                          Control access and assign roles to your research team
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-bg-primary p-5">
                      <p className="text-text-secondary text-sm leading-relaxed mb-5">
                        Add researchers, screeners, and reviewers to your
                        project. Define their permission levels to ensure data
                        integrity and workflow efficiency.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setIsMemberModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        Open Member Manager
                        <FiExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : settingsTab === "agents" ? (
              isLeader ? (
                <ProjectAgentAssignments projectId={id} />
              ) : (
                <ReviewerProjectAgentCard projectId={id || ""} />
              )
            ) : null}
          </main>
        </div>

        {isLeader && (
          <ProjectMembersModal
            isOpen={isMemberModalOpen}
            onClose={() => setIsMemberModalOpen(false)}
            projectId={id}
            projectName={project?.title ?? ""}
          />
        )}
      </div>
    </div>
  );
}
