import React, { useState } from "react";
import { FiChevronUp, FiChevronDown, FiCheckSquare } from "react-icons/fi";
import type { Project } from "../../types/project";
import { cn } from "../../utils/cn";
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

// Local overrides on the shared table primitives — quieter header, roomier rows
const thClass =
  "py-3.5 normal-case tracking-[0.02em] text-[12px] font-medium text-text-muted";
const tdClass = "py-5";

const renderSortIndicator = (
  activeField: SortField,
  sortField: SortField,
  sortOrder: SortOrder,
) => {
  if (sortField !== activeField) {
    return (
      <span className="w-4 h-4 opacity-0 group-hover/col:opacity-40 inline-flex flex-col items-center justify-center ml-1 text-text-muted">
        <FiChevronUp size={10} />
        <FiChevronDown size={10} />
      </span>
    );
  }

  return (
    <span className="ml-1 inline-flex text-primary">
      {sortOrder === "asc" ? (
        <FiChevronUp size={13} />
      ) : (
        <FiChevronDown size={13} />
      )}
    </span>
  );
};

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onView,
  onChecklistClick,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const toggleSelectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortableHead = (
    label: string,
    field: SortField,
    className?: string,
  ) => (
    <TableHead
      className={cn(thClass, "cursor-pointer group/col select-none", className)}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center transition-colors duration-150 hover:text-text-secondary">
        {label}
        {renderSortIndicator(field, sortField, sortOrder)}
      </span>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader className="bg-transparent">
        <TableRow className="hover:bg-transparent cursor-default">
          <TableHead className={cn(thClass, "w-12")}>
            <input
              type="checkbox"
              className="w-4 h-4 rounded-[3px] border-border text-accent focus:ring-accent"
              checked={
                selectedIds.size === projects.length && projects.length > 0
              }
              onChange={toggleSelectAll}
              aria-label="Select all projects"
            />
          </TableHead>
          {sortableHead("Code", "title")}
          {sortableHead("Name", "title")}
          {sortableHead("Domain", "domain")}
          {sortableHead("Status", "status")}
          <TableHead className={thClass}>Role</TableHead>
          <TableHead className={thClass}>Leader</TableHead>
          {sortableHead("Created", "createdAt")}
          {sortableHead("Modified", "modifiedAt")}
          <TableHead className={cn(thClass, "text-center")}>
            <span className="sr-only">Checklist</span>
          </TableHead>
          <TableHead className={cn(thClass, "text-right")}>
            <span className="sr-only">View</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/70">
        {projects.map((project) => (
          <TableRow
            key={project.id}
            className="hover:bg-bg-secondary/50"
            onClick={() => onView(project.id)}
          >
            <TableCell className={tdClass} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className="w-4 h-4 rounded-[3px] border-border text-accent focus:ring-accent"
                checked={selectedIds.has(project.id)}
                onChange={() => toggleSelectRow(project.id)}
                aria-label={`Select ${project.title}`}
              />
            </TableCell>
            <TableCell className={cn(tdClass, "font-mono text-[12px] text-text-muted whitespace-nowrap")}>
              {project.code}
            </TableCell>
            <TableCell
              className={cn(
                tdClass,
                "text-[15px] font-medium text-text-primary group-hover:text-accent transition-colors duration-150",
              )}
            >
              {project.title}
            </TableCell>
            <TableCell className={cn(tdClass, "text-[13px] text-text-secondary")}>
              {project.domain}
            </TableCell>
            <TableCell className={tdClass}>
              <span
                className={cn(
                  "inline-block px-2.5 py-[3px] rounded-full text-[12px] font-medium leading-none",
                  project.statusText === "Active"
                    ? "bg-primary-light text-primary"
                    : project.statusText === "Completed"
                      ? "bg-success/10 text-success"
                      : "bg-bg-secondary text-text-secondary",
                )}
              >
                {project.statusText}
              </span>
            </TableCell>
            <TableCell className={cn(tdClass, "text-[13px] text-text-secondary")}>
              {project.roleText || "Member"}
            </TableCell>
            <TableCell className={cn(tdClass, "whitespace-nowrap")}>
              {project.leader ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-[11px] font-semibold">
                    {project.leader.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] text-text-primary">
                    {project.leader.fullName}
                  </span>
                </div>
              ) : (
                <span className="text-text-muted text-[13px]">—</span>
              )}
            </TableCell>
            <TableCell
              className={cn(
                tdClass,
                "text-[13px] text-text-secondary whitespace-nowrap",
              )}
            >
              {new Date(project.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell
              className={cn(
                tdClass,
                "text-[13px] text-text-secondary whitespace-nowrap",
              )}
            >
              {new Date(project.modifiedAt).toLocaleDateString()}
            </TableCell>
            <TableCell
              className={cn(tdClass, "text-center")}
              onClick={(e) => e.stopPropagation()}
            >
              {onChecklistClick && (
                <button
                  onClick={() => onChecklistClick(project.id)}
                  className="inline-flex p-2 rounded-[8px] text-text-muted hover:text-primary hover:bg-primary-light transition-colors duration-150"
                  title="View checklists"
                  aria-label={`View checklists for ${project.title}`}
                >
                  <FiCheckSquare className="w-4 h-4" />
                </button>
              )}
            </TableCell>
            <TableCell
              className={cn(tdClass, "text-right")}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="text-[13px] font-medium text-text-secondary hover:text-primary transition-colors duration-150"
                onClick={() => onView(project.id)}
              >
                View →
              </button>
            </TableCell>
          </TableRow>
        ))}
        {projects.length === 0 && (
          <TableRow className="hover:bg-transparent cursor-default">
            <TableCell
              colSpan={11}
              className="p-12 text-center text-text-muted text-sm"
            >
              You don't have any projects or haven't joined any projects.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default ProjectTable;
