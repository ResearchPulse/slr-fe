import React, { useState, useMemo } from "react";
import {
  FiEye,
  FiUsers,
  FiEdit3,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiDownload,
  FiInfo,
  FiPlus,
  FiX,
} from "react-icons/fi";

import { FaRegTrashAlt } from "react-icons/fa";
import { SiTask } from "react-icons/si";
import { cn } from "../../utils/cn";
import ActionButton from "../../components/admin/slr-projects/ActionButton";
import Tooltip from "../../components/ui/Tooltip";
import Select from "../../components/ui/Select";
import ProjectFormModal from "../../components/admin/slr-projects/ProjectFormModal";
import ProjectMembersModal from "../../components/admin/slr-projects/ProjectMembersModal";
import {
  useProjects,
  useProjectMutations,
  useExportProjectsMutation,
} from "../../hooks/useProjects";
import type { ProjectStatus } from "../../types/project";
import toast from "react-hot-toast";

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const styles = {
    Draft: "bg-slate-50 text-slate-600 ring-slate-200",
    Active: "bg-sky-50 text-sky-700 ring-sky-200",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset",
        styles[status],
      )}
    >
      {status}
    </span>
  );
};

const SLRProjectManagement: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<
    string | undefined
  >();
  const [viewingProject, setViewingProject] = useState<
    { id: string; title: string } | undefined
  >();
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Hooks
  const {
    projects,
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch, // Added refetch to update data after form submission
  } = useProjects({
    pageNumber,
    pageSize,
    status: statusFilter,
  });

  const { deleteProject } = useProjectMutations();

  const { exportProjects, isLoading: isExporting } =
    useExportProjectsMutation();

  const handleExportClick = async () => {
    try {
      await exportProjects(undefined);
      toast.success("Export successful! Your file is downloading.");
    } catch (err) {
      toast.error("Export failed. Please try again.");
    }
  };

  // Local filtering for speed as per user request
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const lowSearch = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(lowSearch) ||
        (p.domain && p.domain.toLowerCase().includes(lowSearch)),
    );
  }, [projects, searchTerm]);

  // Derived
  const totalCount = paginatedData?.totalCount || 0;
  const totalPages = paginatedData?.totalPages || 0;
  const itemsStart = (pageNumber - 1) * pageSize + 1;
  const itemsEnd = Math.min(pageNumber * pageSize, totalCount);

  // Handlers

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to PERMANENTLY delete this project?",
      )
    )
      return;
    try {
      await deleteProject(id);
      toast.success("Project deleted successfully");
    } catch (err) {
      // Error toast handled in hook
    }
  };



  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingProjectId(undefined);
    refetch(); // Refresh project list after successful form submission
  };

  const handleCreateProjectClick = () => {
    setEditingProjectId(undefined); // Ensure no project is being edited
    setIsViewOnly(false);
    setIsFormModalOpen(true);
  };

  const handleEditProjectClick = (projectId: string) => {
    setEditingProjectId(projectId);
    setIsViewOnly(false);
    setIsFormModalOpen(true);
  };

  const handleViewProjectClick = (projectId: string) => {
    setEditingProjectId(projectId);
    setIsViewOnly(true);
    setIsFormModalOpen(true);
  };

  const handleMembersClick = (projectId: string, title: string) => {
    setViewingProject({ id: projectId, title });
    setIsMembersModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-2">
      {/* Page Header */}
      <div className="flex flex-col gap-5 border-b border-[#E3EAEE] pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#087BC1]">Project management</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#173247] sm:text-[32px]">
            SLR Projects
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#71838F]">
            Manage and monitor systematic literature review workflows across the
            system.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[590px]">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap xl:justify-end">
          <div className="group relative min-w-0 flex-1 sm:min-w-[230px]">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A2AD] transition-colors group-focus-within:text-[#087BC1]" />
            <input
              type="text"
              placeholder="Search projects..."
              className="h-11 w-full rounded-[9px] border border-[#DCE6EC] bg-white py-2.5 pl-10 pr-10 text-[13px] text-[#29485C] outline-none transition focus:border-[#8DBDD8] focus:ring-4 focus:ring-[#087BC1]/[0.08]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                type="button"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#91A2AD] transition-colors hover:text-[#087BC1]"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          <Tooltip content="Filter project list by status" position="bottom">
            <Select
              className="w-full sm:w-[170px]"
              value={statusFilter || ""}
              onChange={(e) => {
                setStatusFilter((e.target.value as ProjectStatus) || undefined);
                setPageNumber(1);
              }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "Draft", label: "Draft" },
                { value: "Active", label: "Active" },
                { value: "Completed", label: "Completed" },
              ]}
            />
          </Tooltip>
          <Tooltip
            content="Download project report as Excel (XLSX)"
            position="bottom"
          >
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#DCE6EC] bg-white px-4 text-[12px] font-semibold text-[#29485C] shadow-[0_1px_3px_rgba(23,50,71,0.04)] transition hover:border-[#B9CEDB] hover:bg-[#F8FBFD] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleExportClick}
              disabled={isExporting}
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiDownload size={16} />
              )}
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </Tooltip>
          </div>
        <Tooltip
          content="Launch a new Systematic Literature Review project"
          position="left"
        >
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-[#087BC1] px-5 text-[12px] font-semibold text-white shadow-[0_2px_5px_rgba(8,123,193,0.16)] transition hover:bg-[#066CA9] sm:ml-auto sm:w-fit"
            onClick={handleCreateProjectClick}
          >
            <FiPlus
              size={20}
              className="transition-transform duration-200"
            />
            Create new project
          </button>
        </Tooltip>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
          {error ||
            "An error occurred while fetching projects. Please try again."}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-[#E0E8ED] bg-white shadow-[0_2px_8px_rgba(23,50,71,0.025)]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[1080px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[33%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#E8EEF2] bg-[#F8FAFC]">
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#82929C]">
                  <Tooltip content="The unique identifier or project code for this workspace.">
                    <div className="flex items-center gap-1.5 cursor-help uppercase">
                      Code
                      <FiInfo size={12} className="text-slate-300" />
                    </div>
                  </Tooltip>
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#82929C]">
                  <Tooltip content="Refers to the project title, domain classification, and brief summary of the systematic literature review.">
                    <div className="flex items-center gap-1.5 cursor-help uppercase">
                      Description
                      <FiInfo size={12} className="text-slate-300" />
                    </div>
                  </Tooltip>
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#82929C]">
                  <Tooltip content="The project owner, who holds the project Leader role.">
                    <div className="flex items-center gap-1.5 cursor-help uppercase">
                      Project owner
                      <FiInfo size={12} className="text-slate-300" />
                    </div>
                  </Tooltip>
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#82929C]">
                  Status
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#82929C]">
                  <Tooltip content="Completed steps out of total steps in the review workflow">
                    <div className="flex items-center justify-center gap-1.5 cursor-help">
                      Processes
                      <FiInfo size={12} className="text-slate-300" />
                    </div>
                  </Tooltip>
                </th>
                <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#82929C]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EEF1]">
              {isLoading ? (
                Array(pageSize)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-5 py-5">
                        <div className="h-12 w-full rounded-lg bg-[#F4F7F9]" />
                      </td>
                    </tr>
                  ))
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="group transition-colors hover:bg-[#FAFCFD]"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md border border-[#E0E8ED] bg-[#F4F7F9] px-2 py-1 text-[10px] font-bold tracking-[0.04em] text-[#536B7A]">
                        {project.code}
                      </span>
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Tooltip content={project.title}>
                            <h4 className="line-clamp-1 text-[13px] font-semibold text-[#29485C] transition-colors group-hover:text-[#087BC1]">
                              {project.title}
                            </h4>
                          </Tooltip>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 pt-0.5 text-[10px] text-[#82929C]">
                          <span className="max-w-[150px] truncate rounded bg-[#F1F5F7] px-1.5 py-0.5 font-semibold text-[#627987]">
                            {project.domain}
                          </span>

                          {project.description && (
                            <Tooltip content={project.description}>
                              <span className="line-clamp-1 font-normal text-[#98A6AE]">
                                {project.description}
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {project.leader ? (
                        <Tooltip content={`${project.leader.fullName} (@${project.leader.username || "username"})${project.leader.email ? ` • ${project.leader.email}` : ""}`}>
                          <span className="block truncate text-[12px] font-semibold leading-tight text-[#536B7A]">
                              {project.leader.fullName}
                          </span>
                        </Tooltip>
                      ) : (
                        <span className="text-[10px] font-medium text-[#9AA8B0]">
                          Owner unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={project.statusText} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      {typeof project.completedProcesses === "number" &&
                      typeof project.totalProcesses === "number" ? (
                        <span
                          aria-label={`${project.completedProcesses} of ${project.totalProcesses} review phases completed`}
                          className="whitespace-nowrap rounded-md border border-[#E8EEF2] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-semibold text-[#536B7A]"
                        >
                          <span className="text-[#087BC1]">{project.completedProcesses}</span>
                          <span className="mx-1 text-[#B3C0C7]">/</span>
                          <span>{project.totalProcesses}</span>
                        </span>
                      ) : (
                        <span
                          title="Workflow progress is not available for this project."
                          aria-label="Workflow progress unavailable"
                          className="text-[12px] text-[#98A6AE]"
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-0.5 transition-opacity">
                        <ActionButton
                          icon={FiEye}
                          label="View Detail"
                          onClick={() => handleViewProjectClick(project.id)}
                        />
                        <ActionButton
                          icon={FiUsers}
                          label="Members"
                          onClick={() =>
                            handleMembersClick(project.id, project.title)
                          }
                        />
                        <ActionButton
                          icon={FiEdit3}
                          label="Edit Info"
                          onClick={() => handleEditProjectClick(project.id)}
                        />
                        <div className="mx-1 h-4 w-px bg-[#E3EAEE]" />

                        <ActionButton
                          icon={FaRegTrashAlt}
                          label="Delete"
                          variant="destructive"
                          onClick={() => handleDelete(project.id)}
                        />

                        <div className="lg:hidden ml-1">
                          <ActionButton icon={FiMoreVertical} label="More" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-projects">
                  <td
                    colSpan={6}
                    className="bg-white px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF6FB] text-[#087BC1]">
                        <SiTask size={21} />
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <h5 className="text-[15px] font-semibold tracking-[-0.02em] text-[#29485C]">
                          No projects found
                        </h5>
                        <p className="text-[12px] leading-5 text-[#82929C]">
                          No projects match these filters. Adjust your search or create a project.
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter(undefined);
                          }}
                          className="h-9 rounded-lg border border-[#DCE6EC] bg-white px-3.5 text-[11px] font-semibold text-[#536B7A] transition hover:bg-[#F8FAFC]"
                        >
                          Clear filters
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateProjectClick}
                          className="h-9 rounded-lg bg-[#087BC1] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#066CA9]"
                        >
                          Create project
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#E8EEF2] bg-[#FBFCFD] px-5 py-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-4">
            <p className="text-[11px] font-medium text-[#82929C]">
              Showing{" "}
              <span className="font-semibold text-[#29485C]">
                {totalCount > 0 ? itemsStart : 0}-{itemsEnd}
              </span>{" "}
              of <span className="font-semibold text-[#29485C]">{totalCount}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[#82929C]">
                Per page:
              </span>
              <Select
                className="w-[76px] [&>button]:h-9 [&>button]:rounded-lg [&>button]:px-2.5 [&>button]:text-[11px]"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                options={[
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content="Previous Page">
              <button
                type="button"
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6EC] bg-white text-[#71838F] transition hover:border-[#B9CEDB] hover:text-[#087BC1] disabled:pointer-events-none disabled:opacity-40"
                disabled={pageNumber === 1 || isLoading}
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
              >
                <FiChevronLeft size={18} />
              </button>
            </Tooltip>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Simple sliding window for pagination if many pages
                let pageToShow = i + 1;
                if (totalPages > 5 && pageNumber > 3) {
                  pageToShow = Math.min(pageNumber - 2 + i, totalPages - 4 + i);
                }

                return (
                  <button
                    key={pageToShow}
                    type="button"
                    onClick={() => setPageNumber(pageToShow)}
                    className={cn(
                      "h-9 min-w-9 rounded-lg border px-2 text-[11px] font-semibold transition-colors",
                      pageNumber === pageToShow
                        ? "border-[#087BC1] bg-[#087BC1] text-white"
                        : "border-[#DCE6EC] bg-white text-[#536B7A] hover:bg-[#F1F7FA]",
                    )}
                  >
                    {pageToShow}
                  </button>
                );
              })}
            </div>

            <Tooltip content="Next Page">
              <button
                type="button"
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6EC] bg-white text-[#71838F] transition hover:border-[#B9CEDB] hover:text-[#087BC1] disabled:pointer-events-none disabled:opacity-40"
                disabled={
                  pageNumber === totalPages || totalPages === 0 || isLoading
                }
                onClick={() =>
                  setPageNumber((prev) => Math.min(totalPages, prev + 1))
                }
              >
                <FiChevronRight size={18} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="px-1 text-center text-[10px] text-[#98A6AE] lg:hidden">
        Scroll the table horizontally to see all columns.
      </div>

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProjectId(undefined);
        }}
        projectId={editingProjectId}
        isViewOnly={isViewOnly}
        onSuccess={handleFormSuccess}
      />

      {/* Project Members Modal */}
      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => {
          setIsMembersModalOpen(false);
          setViewingProject(undefined);
        }}
        projectId={viewingProject?.id}
        projectName={viewingProject?.title}
      />
    </div>
  );
};

export default SLRProjectManagement;
