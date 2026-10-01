import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { FiSearch, FiFolder, FiPlus } from "react-icons/fi";
import { useMyProjects } from "../../hooks/useProjects";
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

type RoleFilter = "All" | "Owner" | "Lecturer" | "Reviewer";

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
  const pageSize = 10;

  const { data, projects, isLoading, error } = useMyProjects({
    pageNumber: currentPage,
    pageSize,
    status: statusFilter,
  });

  const { data: allProjectsData } = useMyProjects({
    pageNumber: 1,
    pageSize: 100,
  });

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

  const totalPages = roleFilter === "All"
    ? data?.totalPages || 1
    : Math.max(1, Math.ceil(roleFilteredResults.length / pageSize));

  const filteredProjects = useMemo(() => {
    if (roleFilter !== "All") {
      const start = (currentPage - 1) * pageSize;
      return roleFilteredResults.slice(start, start + pageSize);
    }

    let list = projects || [];
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
  }, [projects, roleFilter, roleFilteredResults, currentPage, pageSize, statusFilter, searchQuery]);

  const handleChecklistClick = (projectId: string) => {
    navigate(`/projects/${projectId}/checklists`);
  };

  const hasNoResults = !isLoading && filteredProjects.length === 0;

  return (
    <div className="min-h-[calc(100vh-72px)] bg-bg-primary">
      <main className="mx-auto w-full max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-1 text-[28px] font-semibold leading-tight tracking-tight text-text-primary sm:text-[32px]">
              {roleFilter === "All" ? "Research Projects" : `${roleFilter === "Owner" ? "Leader" : roleFilter} Projects`}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              {roleFilter === "Reviewer"
                ? "Your review assignments and the projects where you contribute screening, assessment, and extraction."
                : roleFilter === "Lecturer"
                  ? "Projects where you support the research team and contribute to the review workflow."
                  : roleFilter === "Owner"
                    ? "Projects you lead, with setup, team coordination, and review process controls."
                    : "Your research workspace, organized around the role you hold in each project."}
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2">
            <FiPlus size={16} /> Create project
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2" aria-label="Filter projects by role">
          {([
            { value: "All", label: "All roles" },
            { value: "Owner", label: "Leader" },
            { value: "Lecturer", label: "Lecturer" },
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
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                  roleFilter === value
                    ? "border-accent bg-bg-secondary font-medium text-accent"
                    : "border-border bg-white text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                }`}
              >
                {label}
                <span className={`rounded-md px-1.5 py-0.5 text-xs ${roleFilter === value ? "bg-white text-accent" : "bg-bg-primary text-text-secondary"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="relative w-full sm:max-w-sm">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
              size={14}
            />
            <Input
              placeholder="Search projects..."
              className="h-10 rounded-lg border-border bg-white pl-9 text-sm focus:border-accent focus:ring-1 focus:ring-accent"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-bg-primary p-1">
            {([undefined, "Draft", "Active", "Completed"] as (ProjectStatus | undefined)[]).map((status) => (
              <button
                key={status ?? "All"}
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`min-h-8 rounded-md px-3 text-xs font-medium transition-colors ${statusFilter === status ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              >
                {status ?? "All"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Projects Table or Skeleton */}
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          {isLoading && !data ? (
            <TableSkeleton rows={pageSize} />
          ) : hasNoResults ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-bg-primary text-text-secondary">
                <FiFolder className="w-5 h-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                No projects yet
              </h3>
              <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
                {searchQuery || statusFilter
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
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
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
                        onClick={() => setCurrentPage(page)}
                        disabled={isLoading}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
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
    </div>
  );
}
