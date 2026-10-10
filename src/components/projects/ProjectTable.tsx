import React, { useMemo, useState } from "react";
import { FiArrowDown, FiArrowUp, FiCheckSquare, FiEye } from "react-icons/fi";
import type { Project } from "../../types/project";
import { cn } from "../../utils/cn";
import Button from "../ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";

interface ProjectTableProps {
  projects: Project[];
  onView: (id: string) => void;
  onChecklistClick?: (projectId: string) => void;
}

type SortField = "title" | "domain" | "status" | "createdAt" | "modifiedAt";
type SortOrder = "asc" | "desc";

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const statusClass = (status: Project["statusText"]) => {
  if (status === "Active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Completed") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-border bg-bg-primary text-text-secondary";
};

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onView,
  onChecklistClick,
}) => {
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const sortedProjects = useMemo(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...projects].sort((left, right) => {
      const leftValue = left[sortField] ?? "";
      const rightValue = right[sortField] ?? "";
      if (sortField === "createdAt" || sortField === "modifiedAt") {
        return (new Date(String(leftValue)).getTime() - new Date(String(rightValue)).getTime()) * direction;
      }
      return String(leftValue).localeCompare(String(rightValue)) * direction;
    });
  }, [projects, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortLabel: React.FC<{ label: string; field: SortField }> = ({ label, field }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1.5 text-left font-medium text-text-secondary hover:text-text-primary"
    >
      {label}
      {sortField === field && (sortOrder === "asc" ? <FiArrowUp size={13} /> : <FiArrowDown size={13} />)}
    </button>
  );

  const handleChecklist = (event: React.MouseEvent, projectId: string) => {
    event.stopPropagation();
    onChecklistClick?.(projectId);
  };

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <Table className="w-full min-w-[1120px] table-fixed">
          <TableHeader className="bg-bg-primary">
            <TableRow className="cursor-default hover:bg-transparent">
              <TableHead className="w-[34%] px-5 py-3 text-xs font-semibold normal-case tracking-normal">Project</TableHead>
              <TableHead className="w-[11%] px-4 py-3 text-xs font-semibold normal-case tracking-normal">Status</TableHead>
              <TableHead className="w-[11%] px-4 py-3 text-xs font-semibold normal-case tracking-normal">Your role</TableHead>
              <TableHead className="w-[16%] px-4 py-3 text-xs font-semibold normal-case tracking-normal">Leader</TableHead>
              <TableHead className="w-[16%] px-4 py-3 text-xs font-semibold normal-case tracking-normal"><SortLabel label="Dates" field="modifiedAt" /></TableHead>
              <TableHead className="w-[12%] px-4 py-3 text-right text-xs font-semibold normal-case tracking-normal">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow
                key={project.id}
                onClick={() => onView(project.id)}
                className="group bg-surface-white transition-colors hover:bg-bg-primary/60"
              >
                <TableCell className="px-5 py-4">
                  <div className="truncate text-sm font-semibold text-text-primary group-hover:text-accent" title={project.title}>
                    {project.title}
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-text-secondary">
                    <span className="shrink-0 font-mono text-accent">{project.code}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{project.domain}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs font-medium", statusClass(project.statusText))}>
                    {project.statusText}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-text-primary">
                  {project.roleText || "Member"}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="block truncate text-sm text-text-primary" title={project.leader?.fullName}>
                    {project.leader?.fullName || "—"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4 text-xs leading-5 text-text-secondary">
                  <div>Created {formatDate(project.createdAt)}</div>
                  <div>Updated {formatDate(project.modifiedAt)}</div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {onChecklistClick && (
                      <button
                        type="button"
                        onClick={(event) => handleChecklist(event, project.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-secondary hover:text-accent"
                        title="Open checklists"
                        aria-label={`Open checklists for ${project.title}`}
                      >
                        <FiCheckSquare size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); onView(project.id); }}
                      className="inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-accent transition-colors hover:bg-bg-secondary"
                    >
                      <FiEye size={15} /> View
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sortedProjects.length === 0 && (
              <TableRow className="cursor-default hover:bg-transparent">
                <TableCell colSpan={6} className="p-10 text-center text-sm text-text-secondary">
                  No projects to show.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {sortedProjects.map((project) => (
          <article key={project.id} className="space-y-4 bg-surface-white p-4 sm:p-5">
            <button type="button" onClick={() => onView(project.id)} className="block w-full text-left">
              <div className="text-sm font-semibold text-text-primary">{project.title}</div>
              <div className="mt-1 text-xs text-text-secondary">
                <span className="font-mono text-accent">{project.code}</span> · {project.domain}
              </div>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs font-medium", statusClass(project.statusText))}>{project.statusText}</span>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary">{project.roleText || "Member"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
              <div><span className="block text-text-secondary">Leader</span><span className="mt-1 block truncate text-text-primary">{project.leader?.fullName || "—"}</span></div>
              <div><span className="block text-text-secondary">Updated</span><span className="mt-1 block text-text-primary">{formatDate(project.modifiedAt)}</span></div>
            </div>
            <div className="flex gap-2">
              {onChecklistClick && (
                <Button type="button" variant="secondary" size="sm" onClick={(event) => handleChecklist(event, project.id)} className="gap-2">
                  <FiCheckSquare size={15} /> Checklists
                </Button>
              )}
              <Button type="button" variant="primary" size="sm" onClick={() => onView(project.id)} className="gap-2">
                <FiEye size={15} /> View project
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export default ProjectTable;
