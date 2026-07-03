import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { useMyProjects } from "../../hooks/useProjects";
import type { Project, ProjectStatus } from "../../types/project";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ProjectUtilityBar from "../../components/projects/ProjectUtilityBar";
import ProjectTable from "../../components/projects/ProjectTable";
import { TableSkeleton } from "../../components/ui/Skeleton";
import {
  setCurrentProject,
  clearProjectMember,
} from "../../redux/slices/projectSlice";

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

  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;

  const filteredProjects = useMemo(() => {
    const list = projects || [];
    if (!searchQuery) return list;
    return list.filter((project: Project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [projects, searchQuery]);

  const handleChecklistClick = (projectId: string) => {
    navigate(`/projects/${projectId}/checklists`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Utility Bar */}
      <ProjectUtilityBar onSearchChange={setSearchQuery} />

      <main className="flex-1 px-6 py-6">
        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap items-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-secondary mr-2">
            Filter:
          </span>
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
          <div className="ml-auto text-[11px] uppercase tracking-[0.15em] text-text-secondary">
            {totalCount} {totalCount === 1 ? "project" : "projects"}
          </div>
        </div>

        {error && (
          <div className="bg-surface-white border border-accent text-accent px-4 py-3 rounded-[4px] mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Project Table or Skeleton */}
        <div className="border border-border rounded-[4px] overflow-hidden">
          {isLoading && !data ? (
            <TableSkeleton rows={pageSize} />
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
          <div className="mt-8 flex justify-center items-center gap-2">
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
