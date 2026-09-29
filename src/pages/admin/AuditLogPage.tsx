import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";
import { cn } from "../../utils/cn";
import { toastSuccess } from "../../utils/toast";
import type {
  AuditLogEntry,
  AuditLogExportFormat,
  AuditLogFiltersState,
  AuditLogSortField,
} from "../../types/auditLog";
import { AUDIT_LOG_PAGE_SIZE } from "./auditLogs/constants";
import {
  buildAuditLogExportContent,
  buildAuditLogFileName,
  downloadFile,
  filterAuditLogs,
  formatRangeLabel,
  sortAuditLogs,
} from "./auditLogs/utils";
import AuditLogFilters from "./auditLogs/components/AuditLogFilters";
import AuditLogTable from "./auditLogs/components/AuditLogTable";
import AuditLogDetailModal from "./auditLogs/components/AuditLogDetailModal";
import AuditLogExportDialog from "./auditLogs/components/AuditLogExportDialog";

import { useAdminAuditLogs } from "../../hooks/useAuditLogs";

interface SummaryCardProps {
  label: string;
  value: string;
  helperText: string;
  tone: "indigo" | "emerald" | "rose" | "amber";
  icon: React.ReactNode;
}

const summaryToneClasses: Record<
  SummaryCardProps["tone"],
  { container: string; icon: string }
> = {
  indigo: {
    container: "border-border bg-surface-white shadow-sm",
    icon: "bg-bg-secondary text-accent border border-border",
  },
  emerald: {
    container: "border-border bg-surface-white shadow-sm",
    icon: "bg-bg-secondary text-[#2d5a2d] border border-border",
  },
  rose: {
    container: "border-border bg-surface-white shadow-sm",
    icon: "bg-bg-secondary text-[#7a0000] border border-border",
  },
  amber: {
    container: "border-border bg-surface-white shadow-sm",
    icon: "bg-bg-secondary text-text-secondary border border-border",
  },
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  helperText,
  tone,
  icon,
}) => {
  const classes = summaryToneClasses[tone];

  return (
    <article
      className={cn(
        "rounded-md border bg-surface-white p-5 shadow-none transition-all hover:shadow-none",
        classes.container,
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-md flex items-center justify-center mb-4",
          classes.icon,
        )}
      >
        {icon}
      </div>
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-500">{helperText}</p>
    </article>
  );
};

const initialFilters: AuditLogFiltersState = {
  searchTerm: "",
  user: "all",
  actionType: "all",
  status: "all",
  startDate: "",
  endDate: "",
};

const AuditLogPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFiltersState>(initialFilters);
  const [sortField, setSortField] = useState<AuditLogSortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null,
  );
  const [isExportOpen, setIsExportOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      pageNumber: currentPage,
      pageSize: AUDIT_LOG_PAGE_SIZE,
    };
    if (filters.searchTerm) params.search = filters.searchTerm;
    if (filters.actionType !== "all") params.actionType = filters.actionType;
    if (filters.status !== "all") params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  }, [currentPage, filters]);

  const { data: auditLogsResponse, isLoading: isLoadingLogs } =
    useAdminAuditLogs(queryParams);

  const isPageLoading = isLoading || isLoadingLogs;

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const logs = useMemo(
    () => auditLogsResponse?.data?.items || [],
    [auditLogsResponse],
  );

  const users = useMemo(() => {
    return Array.from(new Set(logs.map((entry) => entry.user))).sort(
      (left, right) => left.localeCompare(right),
    );
  }, [logs]);

  const filteredLogs = useMemo(() => {
    // If backend pagination is active, skip local filtering for items from API to avoid double filter
    if (auditLogsResponse?.data?.items) return auditLogsResponse.data.items;
    return filterAuditLogs(logs, filters);
  }, [filters, logs, auditLogsResponse]);
  const sortedLogs = useMemo(() => {
    if (auditLogsResponse?.data?.items) return auditLogsResponse.data.items;
    return sortAuditLogs(filteredLogs, sortField, sortDirection);
  }, [filteredLogs, sortDirection, sortField, auditLogsResponse]);

  const totalCount = auditLogsResponse?.data?.totalCount ?? sortedLogs.length;
  const totalPages =
    auditLogsResponse?.data?.totalPages ??
    Math.max(1, Math.ceil(totalCount / AUDIT_LOG_PAGE_SIZE));

  const activePage = Math.min(currentPage, totalPages);
  const pageStart =
    totalCount === 0 ? 0 : (activePage - 1) * AUDIT_LOG_PAGE_SIZE + 1;
  const pageEnd = Math.min(activePage * AUDIT_LOG_PAGE_SIZE, totalCount);

  const pageLogs = useMemo(() => {
    if (auditLogsResponse?.data?.items) return auditLogsResponse.data.items;
    const startIndex = (activePage - 1) * AUDIT_LOG_PAGE_SIZE;
    return sortedLogs.slice(startIndex, startIndex + AUDIT_LOG_PAGE_SIZE);
  }, [activePage, sortedLogs, auditLogsResponse]);

  const highRiskCount = useMemo(
    () => filteredLogs.filter((entry) => entry.importance === "high").length,
    [filteredLogs],
  );
  const failedCount = useMemo(
    () => filteredLogs.filter((entry) => entry.status === "Failed").length,
    [filteredLogs],
  );

  const uniqueActors = useMemo(
    () => new Set(filteredLogs.map((entry) => entry.user)).size,
    [filteredLogs],
  );

  const handleFilterUpdate = (
    key: keyof AuditLogFiltersState,
    value: string,
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const handleSortChange = (field: AuditLogSortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "timestamp" ? "desc" : "asc");
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleExport = (request: {
    format: AuditLogExportFormat;
    startDate: string;
    endDate: string;
  }) => {
    const exportLogs = filterAuditLogs(logs, {
      ...filters,
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (exportLogs.length === 0) {
      throw new Error("No audit logs match the selected export range.");
    }

    const { content, mimeType } = buildAuditLogExportContent(
      exportLogs,
      request.format,
    );
    const fileName = buildAuditLogFileName(
      request.format,
      request.startDate,
      request.endDate,
    );

    downloadFile(content, fileName, mimeType);

    toastSuccess(
      "Export completed",
      `${exportLogs.length} audit log records were downloaded as ${request.format.toUpperCase()}.`,
    );
  };

  const activeRangeLabel = formatRangeLabel(filters.startDate, filters.endDate);

  if (isPageLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <FiRefreshCw className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm font-medium text-slate-500">
            Loading audit history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-secondary text-accent text-[10px] font-black uppercase tracking-[0.22em]">
            <FiFilter className="w-3 h-3" />
            Admin Audit Console
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-serif font-bold text-text-primary tracking-tight">
              Audit Logs
            </h3>
            <p className="text-text-secondary text-sm sm:text-base font-medium max-w-2xl">
              Review system activity, inspect event metadata, and export
              compliance-ready audit trails from mock frontend data.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-md border border-border bg-surface-white px-4 py-3 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Current range
            </div>
            <div className="text-sm font-bold text-text-primary mt-1">
              {activeRangeLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-surface-white text-sm font-bold hover:bg-[#7a0000] hover:shadow-sm transition-all active:scale-95"
          >
            <FiDownload className="w-4 h-4" />
            Export Logs
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-md bg-surface-white border border-border text-text-primary text-sm font-bold hover:bg-bg-secondary hover:text-accent transition-all"
          >
            <FiRefreshCw className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Visible records"
          value={String(totalCount)}
          tone="indigo"
          helperText="Records after filters and search are applied."
          icon={<FiClock className="w-5 h-5" />}
        />
        <SummaryCard
          label="Unique actors"
          value={String(uniqueActors)}
          tone="emerald"
          helperText="Distinct users represented in the current result set."
          icon={<FiCheckCircle className="w-5 h-5" />}
        />
        <SummaryCard
          label="Failed events"
          value={String(failedCount)}
          tone="rose"
          helperText="Entries that ended in a failed status."
          icon={<FiXCircle className="w-5 h-5" />}
        />
        <SummaryCard
          label="Important actions"
          value={String(highRiskCount)}
          tone="amber"
          helperText="Deletes and exports are highlighted as high risk."
          icon={<FiAlertTriangle className="w-5 h-5" />}
        />
      </div>

      <AuditLogFilters
        searchTerm={filters.searchTerm}
        users={users}
        selectedUser={filters.user}
        selectedActionType={filters.actionType}
        selectedStatus={filters.status}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onSearchTermChange={(value) => handleFilterUpdate("searchTerm", value)}
        onSelectedUserChange={(value) => handleFilterUpdate("user", value)}
        onSelectedActionTypeChange={(value) =>
          handleFilterUpdate("actionType", value)
        }
        onSelectedStatusChange={(value) => handleFilterUpdate("status", value)}
        onStartDateChange={(value) => handleFilterUpdate("startDate", value)}
        onEndDateChange={(value) => handleFilterUpdate("endDate", value)}
        onReset={handleResetFilters}
      />

      <AuditLogTable
        logs={pageLogs}
        isLoading={isLoading}
        totalCount={totalCount}
        currentPage={activePage}
        totalPages={totalPages}
        pageStart={pageStart}
        pageEnd={pageEnd}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onPageChange={setCurrentPage}
        onRowClick={setSelectedEntry}
      />

      <AuditLogDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />

      <AuditLogExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultStartDate={filters.startDate}
        defaultEndDate={filters.endDate}
        onExport={handleExport}
      />
    </div>
  );
};

export default AuditLogPage;
