import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { FiSearch, FiFolder, FiPlus, FiRefreshCw, FiArchive, FiFilter } from "react-icons/fi";
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
import Select from "../../components/ui/Select";
import DataTableToolbar from "../../components/ui/DataTableToolbar";
import Pagination from "../../components/ui/Pagination";

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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
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
  const roleOptions = [
    { value: "All", label: `All roles (${allList.length})` },
    {
      value: "Project Leader",
      label: `Project Leader (${allList.filter((project: Project) => getProjectRoleLabel(project.role ?? project.roleText) === "Project Leader").length})`,
    },
    {
      value: "Reviewer",
      label: `Reviewer (${allList.filter((project: Project) => getProjectRoleLabel(project.role ?? project.roleText) === "Reviewer").length})`,
    },
  ];
  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "Draft", label: "Draft" },
    { value: "Active", label: "Active" },
    { value: "Completed", label: "Completed" },
  ];
  const activeFilterCount = [
    !showDeletedProjects && roleFilter !== "All",
    !showDeletedProjects && Boolean(statusFilter),
  ].filter(Boolean).length;
  const totalCount = showDeletedProjects
    ? deletedData?.totalCount || 0
    : roleFilter === "All"
      ? activeData?.totalCount || 0
      : roleFilteredResults.length;
  const pageStart = filteredProjects.length ? (currentPage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg-primary">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-text-primary">
              Research Projects
            </h1>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-text-secondary sm:text-sm">
              Your research workspace, organized around the role you hold in each project.
            </p>
          </div>
          {!showDeletedProjects && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-9 min-h-9 shrink-0 items-center gap-2 self-start sm:self-center"
            >
              <FiPlus size={16} /> Create project
            </Button>
          )}
        </header>

        <section className="overflow-hidden rounded-xl border border-border bg-surface-white">
          <DataTableToolbar
            search={(
              <div className="group relative w-full min-w-0 sm:max-w-[320px] sm:flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" />
                <Input
                  aria-label="Search projects"
                  placeholder="Search projects..."
                  value={searchQuery}
                  className="h-9 min-h-9 rounded-lg border-border bg-surface-white pl-9 text-[13px] transition-colors motion-reduce:transition-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
            filters={!showDeletedProjects ? (
              <div className="w-full min-w-0 sm:w-auto">
                <div className="hidden items-center gap-3 lg:flex">
                  <Select
                    aria-label="Filter projects by role"
                    value={roleFilter}
                    onChange={(event) => {
                      setRoleFilter(event.target.value as RoleFilter);
                      setCurrentPage(1);
                    }}
                    options={roleOptions}
                    className="h-9 min-h-9 w-full rounded-lg px-3 text-[13px] lg:w-[176px]"
                  />
                  <Select
                    aria-label="Filter projects by status"
                    value={statusFilter ?? "all"}
                    onChange={(event) => {
                      setStatusFilter(event.target.value === "all" ? undefined : event.target.value as ProjectStatus);
                      setCurrentPage(1);
                    }}
                    options={statusOptions}
                    className="h-9 min-h-9 w-full rounded-lg px-3 text-[13px] lg:w-[160px]"
                  />
                </div>
                <div className="lg:hidden">
                  <button
                    type="button"
                    aria-expanded={isMobileFiltersOpen}
                    aria-controls="project-list-filters"
                    onClick={() => setIsMobileFiltersOpen((open) => !open)}
                    className="inline-flex h-9 min-h-9 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <FiFilter className="h-3.5 w-3.5" aria-hidden="true" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-primary-light px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  {isMobileFiltersOpen && (
                    <div id="project-list-filters" className="mt-2 grid gap-2 sm:grid-cols-2">
                      <Select
                        aria-label="Filter projects by role"
                        value={roleFilter}
                        onChange={(event) => {
                          setRoleFilter(event.target.value as RoleFilter);
                          setCurrentPage(1);
                        }}
                        options={roleOptions}
                        className="h-9 min-h-9 w-full rounded-lg px-3 text-[13px]"
                      />
                      <Select
                        aria-label="Filter projects by status"
                        value={statusFilter ?? "all"}
                        onChange={(event) => {
                          setStatusFilter(event.target.value === "all" ? undefined : event.target.value as ProjectStatus);
                          setCurrentPage(1);
                        }}
                        options={statusOptions}
                        className="h-9 min-h-9 w-full rounded-lg px-3 text-[13px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : undefined}
            filterPlacement="left"
            actions={(
              <div className="inline-flex items-center rounded-lg bg-bg-primary p-0.5" role="group" aria-label="Project view">
                <button
                  type="button"
                  aria-pressed={!showDeletedProjects}
                  onClick={() => { setShowDeletedProjects(false); setCurrentPage(1); setIsMobileFiltersOpen(false); }}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${!showDeletedProjects ? "bg-surface-white text-accent shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
                >
                  Active
                </button>
                <button
                  type="button"
                  aria-pressed={showDeletedProjects}
                  onClick={() => { setShowDeletedProjects(true); setCurrentPage(1); setIsMobileFiltersOpen(false); }}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${showDeletedProjects ? "bg-surface-white text-accent shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
                >
                  <FiArchive size={13} aria-hidden="true" /> Deleted
                  {deletedData?.totalCount ? (
                    <span className="rounded-full bg-bg-secondary px-1.5 py-0.5 text-[10px]">
                      {deletedData.totalCount}
                    </span>
                  ) : null}
                </button>
              </div>
            )}
          />

          {(softDeleteError || restoreError) && (
            <div role="alert" className="mx-3 mt-3 rounded-lg border border-error/25 bg-error/5 px-3 py-2 text-[13px] text-error sm:mx-4">
              {softDeleteError || restoreError}
            </div>
          )}

          {error && data && (
            <div role="status" className="mx-3 mt-3 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-[13px] text-warning sm:mx-4">
              {error}
            </div>
          )}

          {isLoading && !data ? (
            <TableSkeleton rows={pageSize} />
          ) : error && !data ? (
            <div role="alert" className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 text-error">
                <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="mb-1 text-base font-semibold text-text-primary">
                Projects couldn’t be loaded
              </h2>
              <p className="mb-4 max-w-sm text-[13px] leading-5 text-text-secondary">
                {error || "Check your connection and try again."}
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : hasNoResults ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-primary text-text-secondary">
                <FiFolder className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="mb-1 text-base font-semibold text-text-primary">
                {showDeletedProjects
                  ? searchQuery ? "No deleted projects match your search" : "No deleted projects"
                  : searchQuery || statusFilter ? "No matching projects" : "No projects yet"}
              </h2>
              <p className="max-w-sm text-[13px] leading-5 text-text-secondary">
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
                const project = filteredProjects.find((projectItem: Project) => projectItem.id === id);
                if (project) {
                  dispatch(setCurrentProject({ id: project.id, title: project.title }));
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

          {!isLoading && !error && (
            <footer className="flex flex-col gap-2 border-t border-border bg-bg-primary/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p className="text-xs text-text-secondary">
                Showing {pageStart}–{pageEnd} of {totalCount} projects
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs text-text-secondary">Per page: {pageSize}</span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  disabled={isLoading}
                  compact
                />
              </div>
            </footer>
          )}
        </section>
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
