import React, { type ReactNode } from "react";
import { FiArrowDown, FiArrowUp, FiFileText, FiSearch } from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import Pagination from "../../../../components/ui/Pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../../../components/ui/Table";
import type { AuditLogEntry, AuditLogSortField } from "../../../../types/auditLog";
import { formatAuditDateTime } from "../utils";

interface AuditLogTableProps {
  toolbar?: ReactNode;
  logs: AuditLogEntry[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  sortField: AuditLogSortField;
  sortDirection: "asc" | "desc";
  onSortChange: (field: AuditLogSortField) => void;
  onPageChange: (page: number) => void;
  onRowClick: (entry: AuditLogEntry) => void;
}

const statusClasses: Record<AuditLogEntry["status"], string> = {
  Success: "border-success/20 bg-success/10 text-success",
  Failed: "border-error/20 bg-error/10 text-error",
};

const actionToneClasses: Record<AuditLogEntry["actionType"], string> = {
  create: "border-success/20 bg-success/10 text-success",
  update: "border-border bg-bg-secondary text-primary",
  delete: "border-error/20 bg-error/10 text-error",
  export: "border-border bg-bg-primary text-text-secondary",
  access: "border-border bg-bg-primary text-text-primary",
  review: "border-border bg-bg-secondary text-primary",
  system: "border-border bg-bg-primary text-text-secondary",
};

const SortHeader: React.FC<{
  label: string;
  field: AuditLogSortField;
  currentField: AuditLogSortField;
  currentDirection: "asc" | "desc";
  onSortChange: (field: AuditLogSortField) => void;
}> = ({ label, field, currentField, currentDirection, onSortChange }) => {
  const isActive = currentField === field;
  return (
    <button
      type="button"
      onClick={() => onSortChange(field)}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-sm text-inherit font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {label}
      {isActive ? currentDirection === "asc" ? <FiArrowUp className="h-3.5 w-3.5" /> : <FiArrowDown className="h-3.5 w-3.5" /> : (
        <FiArrowUp aria-hidden="true" className="h-3 w-3 text-text-muted opacity-50" />
      )}
    </button>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-accent">
      <FiSearch className="h-5 w-5" />
    </div>
    <h4 className="text-sm font-semibold text-text-primary">No audit records found</h4>
    <p className="mt-1.5 max-w-md text-xs text-text-secondary">
      Try widening the date range, clearing a filter, or searching with a different resource ID.
    </p>
  </div>
);

const AuditLogTable: React.FC<AuditLogTableProps> = ({
  toolbar,
  logs,
  isLoading,
  totalCount,
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  sortField,
  sortDirection,
  onSortChange,
  onPageChange,
  onRowClick,
}) => {
  const sortableHead = (label: string, field: AuditLogSortField) => (
    <TableHead className="px-3 py-2 text-[11px] font-semibold normal-case tracking-normal text-text-secondary">
      <SortHeader
        label={label}
        field={field}
        currentField={sortField}
        currentDirection={sortDirection}
        onSortChange={onSortChange}
      />
    </TableHead>
  );

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface-white">
      {toolbar}

      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold text-text-primary">Activity records</h3>
        <span className="rounded-full bg-bg-primary px-2.5 py-1 text-xs font-medium text-text-secondary">
          {totalCount} {totalCount === 1 ? "record" : "records"}
        </span>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <Table className="w-full min-w-[980px] table-fixed">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[34%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[8%]" />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-bg-primary">
            <TableRow className="cursor-default hover:bg-transparent">
              {sortableHead("Timestamp", "timestamp")}
              {sortableHead("User", "user")}
              {sortableHead("Action", "action")}
              {sortableHead("Resource Type", "resourceType")}
              {sortableHead("Resource ID", "resourceId")}
              {sortableHead("Status", "status")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index} className="cursor-default hover:bg-transparent">
                  <TableCell colSpan={6} className="px-5 py-3">
                    <div className="h-11 rounded-md bg-bg-secondary motion-safe:animate-pulse motion-reduce:animate-none" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length ? (
              logs.map((entry) => (
                <TableRow
                  key={entry.id}
                  tabIndex={0}
                  aria-label={`View audit details: ${entry.action} by ${entry.user}`}
                  onClick={() => onRowClick(entry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(entry);
                    }
                  }}
                  className={cn(
                    "group cursor-pointer border-b border-border bg-surface-white motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                    entry.importance === "high" ? "bg-error/[0.035] hover:bg-error/[0.07]" : "hover:bg-bg-primary/70",
                  )}
                >
                  <TableCell className="px-3 py-3">
                    <div className="whitespace-nowrap text-[13px] font-medium text-text-primary transition-colors group-hover:text-accent">
                      {formatAuditDateTime(entry.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="truncate text-[13px] font-medium text-text-primary transition-colors group-hover:text-accent" title={entry.user}>{entry.user}</div>
                      <div className="truncate text-[11px] text-text-secondary" title={entry.ipAddress}>{entry.ipAddress}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className={cn("mt-0.5 inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize", actionToneClasses[entry.actionType])}>
                        {entry.actionType}
                      </span>
                      <div className="line-clamp-2 min-w-0 text-[13px] text-text-secondary" title={entry.action}>{entry.action}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="truncate text-[13px] text-text-primary" title={entry.resourceType}>{entry.resourceType}</div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="truncate font-mono text-xs text-text-secondary" title={entry.resourceId}>{entry.resourceId}</div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium", statusClasses[entry.status])}>
                      {entry.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="p-0"><EmptyState /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border xl:hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-28 rounded-lg bg-bg-secondary motion-safe:animate-pulse motion-reduce:animate-none" />)}
          </div>
        ) : logs.length ? logs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onRowClick(entry)}
            className={cn(
              "min-h-11 w-full px-4 py-3 text-left motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
              entry.importance === "high" ? "bg-error/5 hover:bg-error/10" : "bg-surface-white hover:bg-bg-secondary/30",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize", statusClasses[entry.status])}>{entry.status}</span>
                  <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize", actionToneClasses[entry.actionType])}>{entry.actionType}</span>
                </div>
                <div className="line-clamp-2 text-[13px] font-medium text-text-primary">{entry.action}</div>
                <div className="break-words text-xs text-text-secondary">{entry.user} · {entry.resourceType} {entry.resourceId}</div>
                <div className="text-xs text-text-secondary">{formatAuditDateTime(entry.timestamp)}{entry.ipAddress ? ` · ${entry.ipAddress}` : ""}</div>
              </div>
              <FiFileText aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
            </div>
          </button>
        )) : <EmptyState />}
      </div>

      {!isLoading && (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="text-xs text-text-secondary">Showing {pageStart}–{pageEnd} of {totalCount}</div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </section>
  );
};

export default AuditLogTable;
