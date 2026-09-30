import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { FiSearch, FiFolder } from "react-icons/fi";
import { useMyProjects } from "../../hooks/useProjects";
import type { Project, ProjectStatus } from "../../types/project";
import Input from "../../components/ui/Input";
import ProjectTable from "../../components/projects/ProjectTable";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { cn } from "../../utils/cn";
import {
  setCurrentProject,
  clearProjectMember,
} from "../../redux/slices/projectSlice";

/** Quiet stat item — the number is the focus, the label recedes. */
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[28px] sm:text-[32px] leading-none font-semibold text-text-primary tabular-nums">
        {value}
      </span>
      <span className="text-[13px] text-text-secondary">{label}</span>
    </div>
  );
}

/** Quiet option in the status filter group. Active state is soft blue, never a heavy button. */
function FilterOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-4 rounded-[8px] text-sm font-medium transition-colors duration-150",
        active
          ? "bg-primary-light text-primary"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      {children}
    </button>
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

  const totalPages = data?.totalPages || 1;
  const allList = allProjectsData?.items || [];
  const totalCount = (data as any)?.allTotalCount ?? allProjectsData?.totalCount ?? allList.length;
  const activeCount = (data as any)?.activeCount ?? allList.filter((p: Project) => p.statusText === "Active").length;
  const completedCount = (data as any)?.completedCount ?? allList.filter((p: Project) => p.statusText === "Completed").length;

  const filteredProjects = useMemo(() => {
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
  }, [projects, statusFilter, searchQuery]);

  const handleChecklistClick = (projectId: string) => {
    navigate(`/projects/${projectId}/checklists`);
  };

  const hasNoResults = !isLoading && filteredProjects.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Page Header */}
        <header className="mb-10 lg:mb-12">
          <h1 className="text-[34px] sm:text-[40px] lg:text-[46px] font-semibold tracking-[-0.01em] leading-[1.1] text-text-primary mb-3">
            Research projects
          </h1>
          <p className="text-base text-text-secondary leading-relaxed">
            Manage and organize your systematic literature reviews.
          </p>
        </header>

        {/* Summary strip — numbers separated by hairlines, no cards */}
        <div className="flex mb-10 lg:mb-12">
          <div className="flex-1 pr-6 sm:pr-10">
            <StatItem label="Total projects" value={totalCount} />
          </div>
          <div className="flex-1 px-6 sm:px-10 border-l border-border">
            <StatItem label="Active" value={activeCount} />
          </div>
          <div className="flex-1 pl-6 sm:pl-10 border-l border-border">
            <StatItem label="Completed" value={completedCount} />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          {/* Search */}
          <div className="relative w-full sm:w-[340px]">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              size={15}
            />
            <Input
              placeholder="Search projects..."
              className="pl-10 h-12 text-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter — quiet segmented group */}
          <div
            className="flex items-center gap-1 sm:ml-auto"
            role="group"
            aria-label="Filter by status"
          >
            <FilterOption
              active={statusFilter === undefined}
              onClick={() => {
                setStatusFilter(undefined);
                setCurrentPage(1);
              }}
            >
              All
            </FilterOption>
            {(["Draft", "Active", "Completed"] as ProjectStatus[]).map(
              (status) => (
                <FilterOption
                  key={status}
                  active={statusFilter === status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status}
                </FilterOption>
              ),
            )}
          </div>
        </div>

        {error && (
          <div className="bg-primary-light border-l-[3px] border-primary text-text-primary px-4 py-3 rounded-[8px] mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Projects Table or Skeleton */}
        <div className="border border-border rounded-[12px] overflow-hidden bg-surface-white">
          {isLoading && !data ? (
            <TableSkeleton rows={pageSize} />
          ) : hasNoResults ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <FiFolder className="w-8 h-8 text-text-muted mb-5" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No projects yet
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
                {searchQuery || statusFilter
                  ? "No projects match your search or filter. Try different keywords or clear the filters."
                  : "You haven't created or joined any projects yet. Ask a project leader to invite you, or set up your first review."}
              </p>
            </div>
          ) : (
            // contain:paint keeps the wide table's scrollable overflow from
            // leaking to the document on small screens (Chromium quirk with
            // border-collapse tables) while overflow-x-auto keeps it scrollable
            <div className="overflow-x-auto [contain:paint]">
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
            </div>
          )}
        </div>

        {/* Pagination — quiet text controls, current page marked softly */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-wrap justify-center items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="h-9 px-3 rounded-[8px] text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150"
            >
              ← Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return page === currentPage ? (
                      <span
                        key={page}
                        aria-current="page"
                        className="h-9 min-w-9 px-3 inline-flex items-center justify-center rounded-[8px] text-sm font-medium bg-primary-light text-primary"
                      >
                        {page}
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={isLoading}
                        className="h-9 min-w-9 px-3 rounded-[8px] text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150"
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span
                        key={page}
                        className="h-9 px-2 inline-flex items-center text-text-muted text-sm"
                      >
                        …
                      </span>
                    );
                  }
                  return null;
                },
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="h-9 px-3 rounded-[8px] text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150"
            >
              Next →
            </button>

            <span className="ml-4 text-[13px] text-text-muted">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
