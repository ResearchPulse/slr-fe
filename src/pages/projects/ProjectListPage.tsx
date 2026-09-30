import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { FiSearch, FiFolder, FiUsers, FiEye, FiShield } from "react-icons/fi";
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

type RoleFilter = "All" | "Owner" | "Lecturer" | "Reviewer";

/** Small summary card for the dashboard header. */
function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-surface-white border border-border rounded-[4px] px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.15em] text-text-secondary mb-1.5">
        {label}
      </p>
      <p className="font-cormorant text-[28px] leading-none text-text-primary">
        {value}
      </p>
    </div>
  );
}

export default function ProjectListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
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
  const totalCount = roleProjects.length;
  const activeCount = roleProjects.filter((p: Project) => p.statusText === "Active").length;
  const completedCount = roleProjects.filter((p: Project) => p.statusText === "Completed").length;

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
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-cormorant text-[32px] sm:text-[40px] font-normal text-text-primary leading-tight mb-2">
            {roleFilter === "All" ? "Research Projects" : `${roleFilter === "Owner" ? "Leader" : roleFilter} Projects`}
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            {roleFilter === "Reviewer"
              ? "Your review assignments and the projects where you contribute screening, assessment, and extraction."
              : roleFilter === "Lecturer"
                ? "Projects where you support the research team and contribute to the review workflow."
                : roleFilter === "Owner"
                  ? "Projects you lead, with setup, team coordination, and review process controls."
                  : "Your research workspace, organized around the role you hold in each project."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6" aria-label="Filter projects by role">
          {([
            { value: "All", label: "All roles", icon: FiUsers },
            { value: "Owner", label: "Leader", icon: FiShield },
            { value: "Lecturer", label: "Lecturer", icon: FiEye },
            { value: "Reviewer", label: "Reviewer", icon: FiEye },
          ] as const).map(({ value, label, icon: Icon }) => {
            const count = value === "All"
              ? allList.length
              : allList.filter((project: Project) => getProjectRoleLabel(project.role ?? project.roleText) === value).length;
            return (
              <button
                key={value}
                type="button"
                onClick={() => { setRoleFilter(value); setCurrentPage(1); }}
                aria-pressed={roleFilter === value}
                className={`inline-flex items-center gap-2 px-3 py-2 border rounded-[4px] text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  roleFilter === value
                    ? "bg-text-primary text-bg-primary border-text-primary"
                    : "bg-surface-white text-text-secondary border-border hover:border-accent hover:text-text-primary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}<span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <StatCard label="Total Projects" value={totalCount} />
          <StatCard label="Active" value={activeCount} />
          <StatCard label="Completed" value={completedCount} />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
              size={14}
            />
            <Input
              placeholder="Search projects..."
              className="pl-9 h-9 bg-surface-white border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-[4px] text-sm"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap items-center sm:ml-auto">
            <Button
              size="sm"
              variant={statusFilter === undefined ? "primary" : "outline"}
              onClick={() => {
                setStatusFilter(undefined);
                setCurrentPage(1);
              }}
            >
              All
            </Button>
            {(["Draft", "Active", "Completed"] as ProjectStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "primary" : "outline"}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status}
                </Button>
              ),
            )}
          </div>
        </div>

        {error && (
          <div className="bg-surface-white border border-accent text-accent px-4 py-3 rounded-[4px] mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Projects Table or Skeleton */}
        <div className="border border-border rounded-[4px] overflow-hidden bg-surface-white">
          {isLoading && !data ? (
            <TableSkeleton rows={pageSize} />
          ) : hasNoResults ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 border border-border rounded-[4px] flex items-center justify-center text-text-secondary mb-5">
                <FiFolder className="w-5 h-5" />
              </div>
              <h3 className="font-cormorant text-2xl font-normal text-text-primary mb-2">
                No projects yet
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
                {searchQuery || statusFilter
                  ? "No projects match your search or filter. Try different keywords or clear the filters."
                  : "You haven't created or joined any projects yet. Ask a project leader to invite you, or set up your first review."}
              </p>
            </div>
          ) : (
            <ProjectTable
              projects={filteredProjects}
              onView={(id) => {
                const project = projects.find((p: Project) => p.id === id);
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
          <div className="mt-8 flex flex-wrap justify-center items-center gap-2">
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

            <span className="ml-4 text-[11px] uppercase tracking-[0.15em] text-text-secondary">
              Page {currentPage} / {totalPages}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
