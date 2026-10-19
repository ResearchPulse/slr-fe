import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { FiSearch, FiFolder, FiPlus, FiRefreshCw, FiArchive } from "react-icons/fi";
import { useDeletedProjects, useMyProjects, useProjectMutations } from "../../hooks/useProjects";
import type { Project, ProjectStatus } from "../../types/project";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ProjectTable from "../../components/projects/ProjectTable";
import { TableSkeleton } from "../../components/ui/Skeleton";
import {
  setCurrentProject,
  clearProjectMember,
} from "../../redux/slices/projectSlice";
import { getProjectRoleLabel } from "../../types/project";
import ProjectFormModal from "../../components/admin/slr-projects/ProjectFormModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

type RoleFilter = "All" | "Project Leader" | "Reviewer";

export default function ProjectListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeletedProjects, setShowDeletedProjects] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const pageSize = 10;

  const {
    data: activeData,
    projects: activeProjects,
    isLoading: activeLoading,
    error: activeError,
    refetch: refetchActive,
  } = useMyProjects({
    pageNumber: currentPage,
    pageSize,
    status: statusFilter,
  });

  const {
    data: deletedData,
    projects: deletedProjects,
    isLoading: deletedLoading,
    error: deletedError,
    refetch: refetchDeleted,
  } = useDeletedProjects({
    pageNumber: currentPage,
    pageSize,
    search: searchQuery.trim() || undefined,
  }, showDeletedProjects);

  const { data: allProjectsData } = useMyProjects({
    pageNumber: 1,
    pageSize: 100,
  });

  const {
    softDeleteProject,
    isSoftDeleting,
    softDeleteError,
    restoreProject,
    restoreError,
  } = useProjectMutations();

  const data = showDeletedProjects ? deletedData : activeData;
  const isLoading = showDeletedProjects ? deletedLoading : activeLoading;
  const error = showDeletedProjects ? deletedError : activeError;
  const refetch = showDeletedProjects ? refetchDeleted : refetchActive;

  const allList = allProjectsData?.items || [];
  const roleProjects = useMemo(
    () => roleFilter === "All"
      ? allList
      : allList.filter((project: Project) => getProjectRoleLabel(project.role ?? project.roleText) === roleFilter),
    [allList, roleFilter],
  );
  const roleFilteredResults = useMemo(() => {
    let list = roleProjects;
    if (statusFilter) {
      list = list.filter((project: Project) =>
        project.statusText?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }
    if (searchQuery) {
      list = list.filter((project: Project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return list;
  }, [roleProjects, statusFilter, searchQuery]);

  const totalPages = showDeletedProjects
    ? Math.max(1, deletedData?.totalPages || 1)
    : roleFilter === "All"
      ? activeData?.totalPages || 1
      : Math.max(1, Math.ceil(roleFilteredResults.length / pageSize));

  const filteredProjects = useMemo(() => {
    if (showDeletedProjects) return deletedProjects;
    if (roleFilter !== "All") {
      const start = (currentPage - 1) * pageSize;
      return roleFilteredResults.slice(start, start + pageSize);
    }

    let list = activeProjects || [];
    if (statusFilter) {
      list = list.filter((project: Project) =>
        project.statusText?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }
    if (searchQuery) {
      list = list.filter((project: Project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return list;
  }, [activeProjects, deletedProjects, showDeletedProjects, roleFilter, roleFilteredResults, currentPage, pageSize, statusFilter, searchQuery]);

  const handleConfirmSoftDelete = async () => {
    if (!projectToDelete) return;
    try {
      await softDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
      setCurrentPage(1);
    } catch {
      // The mutation error is shown in the confirmation dialog.
    }
  };

  const handleRestoreProject = async (project: Project) => {
    setBusyProjectId(project.id);
    try {
      await restoreProject(project.id);
      setCurrentPage(1);
    } catch {
      // The mutation error is shown above the deleted-project table.
    } finally {
      setBusyProjectId(null);
    }
  };

  const handleChecklistClick = (projectId: string) => {
    navigate(`/projects/${projectId}/checklists`);
  };

  const hasNoResults = !isLoading && !error && filteredProjects.length === 0;

  return (
    <div className="min-h-[calc(100vh-72px)] bg-bg-primary">
      <main className="mx-auto w-full max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-1 text-[28px] font-semibold leading-tight tracking-tight text-text-primary sm:text-[32px]">
              {showDeletedProjects ? "Deleted projects" : roleFilter === "All" ? "Research Projects" : `${roleFilter} Projects`}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              {showDeletedProjects
                ? "Projects you deleted are kept here until you restore them. Project data remains available after restoration."
                : roleFilter === "Reviewer"
                ? "Your review assignments and the projects where you contribute screening, assessment, and extraction."
                : roleFilter === "Project Leader"
                  ? "Projects you lead, with setup, team coordination, and review process controls."
                  : "Your research workspace, organized around the role you hold in each project."}
            </p>
          </div>
          {!showDeletedProjects && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="inline-flex min-h-11 items-center gap-2">
              <FiPlus size={16} /> Create project
            </Button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {!showDeletedProjects && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects by role">
              {([
                { value: "All", label: "All roles" },
                { value: "Project Leader", label: "Project Leader" },
                { value: "Reviewer", label: "Reviewer" },
              ] as const).map(({ value, label }) => {
                const count = value === "All"
                  ? allList.length
                  : allList.filter((project: Project) => getProjectRoleLabel(project.role ?? project.roleText) === value).length;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRoleFilter(value); setCurrentPage(1); }}
                    aria-pressed={roleFilter === value}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                      roleFilter === value
                        ? "border-accent bg-bg-secondary font-medium text-accent"
                        : "border-border bg-surface-white text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                    }`}
                  >
                    {label}
                    <span className={`rounded-md px-1.5 py-0.5 text-xs ${roleFilter === value ? "bg-surface-white text-accent" : "bg-bg-primary text-text-secondary"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="inline-flex items-center rounded-xl border border-border bg-surface-white p-1" role="group" aria-label="Project view">
            <button
              type="button"
              aria-pressed={!showDeletedProjects}
              onClick={() => { setShowDeletedProjects(false); setCurrentPage(1); }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${!showDeletedProjects ? "bg-bg-secondary font-medium text-accent" : "text-text-secondary hover:text-text-primary"}`}
            >
              Active
            </button>
            <button
              type="button"
              aria-pressed={showDeletedProjects}
              onClick={() => { setShowDeletedProjects(true); setCurrentPage(1); }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${showDeletedProjects ? "bg-bg-secondary font-medium text-accent" : "text-text-secondary hover:text-text-primary"}`}
            >
              <FiArchive size={14} /> Deleted
              {deletedData?.totalCount ? <span className="rounded-md bg-surface-white px-1.5 py-0.5 text-xs">{deletedData.totalCount}</span> : null}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="relative w-full sm:max-w-sm">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
              size={14}
            />
            <Input
              aria-label="Search projects"
              placeholder="Search projects..."
              value={searchQuery}
              className="h-11 rounded-xl border-border bg-surface-white pl-9 text-sm transition-colors motion-reduce:transition-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {!showDeletedProjects && <div className="flex flex-wrap items-center gap-1 rounded-xl bg-bg-primary p-1">
            {([undefined, "Draft", "Active", "Completed"] as (ProjectStatus | undefined)[]).map((status) => (
              <button
                key={status ?? "All"}
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`min-h-11 rounded-md px-3 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${statusFilter === status ? "bg-surface-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              >
                {status ?? "All"}
              </button>
            ))}
          </div>}
        </div>

        {(softDeleteError || restoreError) && (
          <div role="alert" className="mb-4 rounded-lg border border-error/25 bg-error/5 px-4 py-3 text-sm text-error">
            {softDeleteError || restoreError}
          </div>
        )}

        {error && data && (
          <div role="status" className="mb-4 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
            {error}
          </div>
        )}

        {/* Projects Table or Skeleton */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface-white">
          {isLoading && !data ? (
            <TableSkeleton rows={pageSize} />
          ) : error && !data ? (
            <div role="alert" className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-error/10 text-error">
                <FiRefreshCw className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                Projects couldn’t be loaded
              </h3>
              <p className="mb-5 max-w-sm text-sm leading-relaxed text-text-secondary">
                {error || "Check your connection and try again."}
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : hasNoResults ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-bg-primary text-text-secondary">
                <FiFolder className="w-5 h-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                {showDeletedProjects
                  ? searchQuery ? "No deleted projects match your search" : "No deleted projects"
                  : searchQuery || statusFilter ? "No matching projects" : "No projects yet"}
              </h3>
              <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
                {showDeletedProjects
                  ? "Projects you move to Deleted will appear here, where you can restore them at any time."
                  : searchQuery || statusFilter
                  ? "No projects match your search or filter. Try different keywords or clear the filters."
                  : "You haven't created or joined any projects yet. Ask a project leader to invite you, or set up your first review."}
              </p>
            </div>
          ) : (
            <ProjectTable
              projects={filteredProjects}
              onView={(id) => {
                const project = filteredProjects.find((p: Project) => p.id === id);
                if (project) {
                  dispatch(
                    setCurrentProject({ id: project.id, title: project.title }),
                  );
                  // Clear stale membership so ProtectedRouteForProject fetches fresh data for this project
                  dispatch(clearProjectMember());
                }
                navigate(`/projects/${id}`);
              }}
              onChecklistClick={handleChecklistClick}
              onDelete={(project) => setProjectToDelete(project)}
              onRestore={handleRestoreProject}
              isDeletedView={showDeletedProjects}
              busyProjectId={busyProjectId}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-label="Previous page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="min-h-11"
            >
              ← Prev
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? "primary" : "outline"}
                        aria-current={page === currentPage ? "page" : undefined}
                        onClick={() => setCurrentPage(page)}
                        disabled={isLoading}
                        className="min-h-11 min-w-11 px-2"
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span
                        key={page}
                        className="px-2 py-1 text-text-secondary text-sm"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                },
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              aria-label="Next page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="min-h-11"
            >
              Next →
            </Button>

            <span className="ml-2 text-xs text-text-secondary">
              Page {currentPage} / {totalPages}
            </span>
          </div>
        )}
      </main>
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(project) => {
          dispatch(setCurrentProject({ id: project.id, title: project.title }));
          dispatch(clearProjectMember());
          navigate(`/projects/${project.id}`);
        }}
      />
      <ConfirmModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => { if (!isSoftDeleting) setProjectToDelete(null); }}
        onConfirm={() => void handleConfirmSoftDelete()}
        title="Move project to Deleted?"
        message={softDeleteError
          ? `${softDeleteError} Please try again.`
          : projectToDelete
            ? `“${projectToDelete.title}” will disappear from your active project list. Its review data will be kept, and you can restore it from the Deleted tab.`
            : "This project will be moved to Deleted."}
        confirmText="Move to Deleted"
        isLoading={isSoftDeleting}
        variant="danger"
      />
    </div>
  );
}
