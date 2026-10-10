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
    getProjectRoleLabel(project?.role ?? project?.roleText) === "Owner";

  if (project && !isLeader) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-xl border border-border bg-surface-white p-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-3">Project settings</p>
            <h1 className="font-cormorant text-3xl text-text-primary mb-3">Leader access required</h1>
            <p className="text-sm leading-relaxed text-text-secondary mb-6">
              Your role is {project.roleText || "Project Member"}. You can view project details and contribute to the review workflow, while project settings are managed by the leader.
            </p>
            <Button onClick={() => navigate(`/projects/${id}`)}>Back to project</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-border">
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="group flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-[11px] uppercase tracking-[0.2em] font-medium"
            >
              <FiArrowLeft
                className="group-hover:-translate-x-1 transition-transform"
                size={14}
              />
              Back to Project
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-2">
                Configuration
              </p>
              <h1 className="font-cormorant text-[40px] font-normal text-text-primary">
                Settings
              </h1>
            </div>
            <p className="text-text-secondary text-sm">
              Configure and manage your project preferences
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="flex lg:flex-col gap-0 overflow-hidden rounded-xl border border-border">
              <button
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-[0.15em] font-medium transition-all border-b border-border last:border-0 ${
                  activeTab === "general"
                    ? "bg-text-primary text-bg-primary"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                }`}
              >
                <FiSettings
                  size={14}
                  className={
                    activeTab === "general"
                      ? "text-bg-primary"
                      : "text-text-secondary"
                  }
                />
                General
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-[0.15em] font-medium transition-all border-b border-border last:border-0 ${
                  activeTab === "members"
                    ? "bg-text-primary text-bg-primary"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                }`}
              >
                <FiUsers
                  size={14}
                  className={
                    activeTab === "members"
                      ? "text-bg-primary"
                      : "text-text-secondary"
                  }
                />
                Members
              </button>
              <button
                onClick={() => setActiveTab("agents")}
                className={`flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-[0.15em] font-medium transition-all border-b border-border last:border-0 ${
                  activeTab === "agents"
                    ? "bg-text-primary text-bg-primary"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                }`}
              >
                <FiCpu size={14} className={activeTab === "agents" ? "text-bg-primary" : "text-text-secondary"} />
                AI Agents
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-6">
            {activeTab === "general" ? (
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
            ) : activeTab === "members" ? (
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
            ) : (
              <ProjectAgentAssignments projectId={id} />
            )}
          </main>
        </div>

        <ProjectMembersModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          projectId={id}
          projectName={project?.title ?? ""}
        />
      </div>
    </div>
  );
}
