import React from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiFileText,
  FiSearch,
} from "react-icons/fi";
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
import type {
  AuditLogEntry,
  AuditLogSortField,
} from "../../../../types/auditLog";
import { formatAuditDateTime } from "../utils";

interface AuditLogTableProps {
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
  Success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Failed: "bg-rose-50 text-rose-700 border-rose-100",
};

const actionToneClasses: Record<AuditLogEntry["actionType"], string> = {
  create: "bg-emerald-50 text-emerald-700 border-emerald-100",
  update: "bg-bg-secondary text-accent border-border",
  delete: "bg-rose-50 text-rose-700 border-rose-100",
  export: "bg-bg-primary text-text-secondary border-border",
  access: "bg-bg-primary text-text-primary border-border",
  review: "bg-bg-secondary text-accent border-border",
  system: "bg-bg-primary text-text-secondary border-border",
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
      className="inline-flex items-center gap-1.5 text-inherit font-medium"
    >
      {label}
      {isActive ? (
        currentDirection === "asc" ? (
          <FiArrowUp className="w-3.5 h-3.5" />
        ) : (
          <FiArrowDown className="w-3.5 h-3.5" />
        )
      ) : (
        <span className="text-slate-300">
          <FiArrowUp className="w-3 h-3 opacity-50" />
        </span>
      )}
    </button>
  );
};

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, index) => (
      <TableRow
        key={index}
        className="animate-pulse hover:bg-transparent cursor-default"
      >
        <TableCell colSpan={6} className="px-6 py-5">
          <div className="h-14 rounded-md bg-slate-100/80" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

const EmptyState = () => (
  <div className="py-16 flex flex-col items-center justify-center text-center px-6">
    <div className="w-12 h-12 rounded-xl bg-bg-secondary text-accent flex items-center justify-center mb-4">
      <FiSearch className="w-7 h-7" />
    </div>
    <h4 className="text-lg font-semibold text-text-primary">
      No audit records found
    </h4>
    <p className="text-sm text-text-secondary max-w-md mt-2">
      Try widening the date range, clearing a filter, or searching with a
      different resource ID.
    </p>
  </div>
);

const AuditLogTable: React.FC<AuditLogTableProps> = ({
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
  return (
    <section className="bg-surface-white rounded-xl border border-border overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-5 border-b border-border bg-surface-white">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Activity records
          </h3>
          <p className="text-sm text-text-secondary">
            {totalCount === 0 ? "No records" : `Showing ${pageStart}–${pageEnd}`} of {totalCount} records
          </p>
        </div>
      </div>

      <div className="hidden xl:block overflow-x-auto">
        <Table className="w-full min-w-[1160px] table-fixed">
          <TableHeader className="bg-bg-primary sticky top-0 z-10">
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead className="w-[16%] px-4 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                <SortHeader
                  label="Timestamp"
                  field="timestamp"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="w-[16%] px-4 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                <SortHeader
                  label="User"
                  field="user"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="w-[34%] px-4 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                <SortHeader
                  label="Action"
                  field="action"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="w-[13%] px-4 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                <SortHeader
                  label="Resource Type"
                  field="resourceType"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="w-[13%] px-4 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                <SortHeader
                  label="Resource ID"
                  field="resourceId"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="w-[8%] px-4 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                <SortHeader
                  label="Status"
                  field="status"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : logs.length > 0 ? (
              logs.map((entry) => (
                <TableRow
                  key={entry.id}
                  onClick={() => onRowClick(entry)}
                  className={cn(
                    "group border-b border-border bg-white transition-colors",
                    entry.importance === "high"
                      ? "border-l-2 border-l-rose-300 hover:bg-rose-50/40"
                      : "hover:bg-bg-primary/70",
                  )}
                >
                  <TableCell className="px-4 py-4">
                    <div className="whitespace-nowrap text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                      {formatAuditDateTime(entry.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                        {entry.user}
                      </div>
                      <div className="truncate text-xs text-text-secondary">
                        {entry.ipAddress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex min-w-0 items-start gap-2">
                      <div
                        className={cn(
                          "mt-0.5 inline-flex shrink-0 items-center rounded-md border px-2 py-1 text-xs font-medium capitalize",
                          actionToneClasses[entry.actionType],
                        )}
                      >
                        {entry.actionType}
                      </div>
                      <div className="min-w-0 text-sm text-text-secondary line-clamp-2">
                        {entry.action}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="truncate text-sm text-text-primary" title={entry.resourceType}>
                      {entry.resourceType}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="truncate font-mono text-xs text-text-secondary" title={entry.resourceId}>
                      {entry.resourceId}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
                        statusClasses[entry.status],
                      )}
                    >
                      {entry.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="xl:hidden divide-y divide-border">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg bg-bg-primary animate-pulse h-32"
              />
            ))}
          </div>
        ) : logs.length > 0 ? (
          logs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onRowClick(entry)}
              className={cn(
                "w-full text-left px-5 py-4 transition-colors",
                entry.importance === "high"
                  ? "bg-error/5 hover:bg-error/10"
                  : "bg-surface-white hover:bg-bg-secondary/30",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium capitalize",
                        statusClasses[entry.status],
                      )}
                    >
                      {entry.status}
                    </span>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium capitalize",
                        actionToneClasses[entry.actionType],
                      )}
                    >
                      {entry.actionType}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-text-primary line-clamp-1">
                    {entry.action}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {entry.user} • {entry.resourceType} {entry.resourceId}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatAuditDateTime(entry.timestamp)}
                  </div>
                </div>
                <FiFileText className="w-5 h-5 text-slate-300 shrink-0 mt-1" />
              </div>
            </button>
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-4 border-t border-border bg-bg-primary">
          <div className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </section>
  );
};

export default AuditLogTable;
