import React from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiClock,
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
  Success: "bg-surface-white text-success border-border shadow-sm",
  Failed: "bg-surface-white text-error border-border shadow-sm",
};

const actionToneClasses: Record<AuditLogEntry["actionType"], string> = {
  create: "bg-surface-white text-success border-border shadow-sm",
  update: "bg-bg-secondary text-accent border-border shadow-sm",
  delete: "bg-surface-white text-error border-border shadow-sm",
  export: "bg-surface-white text-text-secondary border-border shadow-sm",
  access: "bg-surface-white text-text-primary border-border shadow-sm",
  review: "bg-bg-secondary text-accent border-border shadow-sm",
  system: "bg-surface-white text-text-secondary border-border shadow-sm",
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
      className="inline-flex items-center gap-1.5 uppercase tracking-[0.16em] text-inherit font-black"
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
  <div className="py-20 flex flex-col items-center justify-center text-center px-6">
    <div className="w-16 h-16 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
      <FiSearch className="w-7 h-7" />
    </div>
    <h4 className="text-lg font-black text-slate-900">
      No audit records found
    </h4>
    <p className="text-sm text-slate-500 max-w-md mt-2">
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
    <section className="bg-surface-white rounded-md border border-border shadow-none overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-5 border-b border-border bg-surface-white">
        <div>
          <h3 className="text-lg font-serif font-bold text-text-primary tracking-tight">
            Audit log entries
          </h3>
          <p className="text-sm text-text-secondary font-medium">
            Showing {pageStart} - {pageEnd} of {totalCount} records
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <FiClock className="w-4 h-4 text-accent" />
          Live audit data
        </div>
      </div>

      <div className="hidden xl:block overflow-x-auto">
        <Table className="min-w-7xl">
          <TableHeader className="bg-slate-50/90 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead className="px-6 py-5 text-[11px] text-slate-400">
                <SortHeader
                  label="Timestamp"
                  field="timestamp"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] text-slate-400">
                <SortHeader
                  label="User"
                  field="user"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] text-slate-400">
                <SortHeader
                  label="Action"
                  field="action"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] text-slate-400">
                <SortHeader
                  label="Resource Type"
                  field="resourceType"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] text-slate-400">
                <SortHeader
                  label="Resource ID"
                  field="resourceId"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] text-slate-400">
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
                    "group transition-all duration-200",
                    entry.importance === "high"
                      ? "bg-error/5 hover:bg-error/10"
                      : "hover:bg-bg-secondary/40",
                  )}
                >
                  <TableCell className="px-6 py-5">
                    <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                      {formatAuditDateTime(entry.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-800 group-hover:text-accent transition-colors">
                        {entry.user}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400">
                        {entry.ipAddress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="space-y-2">
                      <div
                        className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.16em] border",
                          actionToneClasses[entry.actionType],
                        )}
                      >
                        {entry.actionType}
                      </div>
                      <div className="text-sm font-medium text-slate-700 line-clamp-2">
                        {entry.action}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="text-sm font-semibold text-slate-700">
                      {entry.resourceType}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="font-mono text-sm font-semibold text-slate-700">
                      {entry.resourceId}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span
                      className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.16em] border",
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

      <div className="xl:hidden divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-md bg-slate-100/80 animate-pulse h-36"
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
                "w-full text-left px-5 py-4 transition-all",
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
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.16em] border",
                        statusClasses[entry.status],
                      )}
                    >
                      {entry.status}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.16em] border",
                        actionToneClasses[entry.actionType],
                      )}
                    >
                      {entry.actionType}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 line-clamp-1">
                    {entry.action}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {entry.user} • {entry.resourceType} {entry.resourceId}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-5 border-t border-slate-100 bg-slate-50/60">
          <div className="text-sm font-medium text-slate-500">
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
