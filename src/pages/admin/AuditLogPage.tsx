import React, { useEffect, useMemo, useState } from "react";
import {
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
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
      <div className="flex min-h-[50vh] items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <FiRefreshCw className="h-7 w-7 animate-spin text-accent" />
          <p className="text-sm font-medium text-slate-500">
            Loading audit history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-2">
      <div className="flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review recorded actions across the system.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm text-text-secondary">
            Range: <span className="text-text-primary">{activeRangeLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <FiDownload className="w-4 h-4" />
            Export
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary hover:text-accent"
          >
            <FiRefreshCw className="w-4 h-4" />
            Reset filters
          </button>
        </div>
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
