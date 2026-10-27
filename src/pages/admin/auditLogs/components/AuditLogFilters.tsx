import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import Select from "../../../../components/ui/Select";
import DatePicker from "../../../../components/ui/DatePicker";
import DataTableToolbar from "../../../../components/ui/DataTableToolbar";
import {
  AUDIT_LOG_ACTION_OPTIONS,
  AUDIT_LOG_STATUS_OPTIONS,
} from "../constants";

interface AuditLogFiltersProps {
  searchTerm: string;
  users: string[];
  selectedUser: string;
  selectedActionType: string;
  selectedStatus: string;
  startDate: string;
  endDate: string;
  onSearchTermChange: (value: string) => void;
  onSelectedUserChange: (value: string) => void;
  onSelectedActionTypeChange: (value: string) => void;
  onSelectedStatusChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
}

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
};
const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  searchTerm,
  users,
  selectedUser,
  selectedActionType,
  selectedStatus,
  startDate,
  endDate,
  onSearchTermChange,
  onSelectedUserChange,
  onSelectedActionTypeChange,
  onSelectedStatusChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
}) => {
  const [areMobileFiltersOpen, setAreMobileFiltersOpen] = useState(false);
  const activeFilterCount = [
    selectedUser !== "all",
    selectedActionType !== "all",
    selectedStatus !== "all",
    Boolean(startDate || endDate),
  ].filter(Boolean).length;
  const userOptions = [
    { value: "all", label: "All users" },
    ...users.map((user) => ({ value: user, label: user })),
  ];

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Filter by user"
        className="h-9 min-h-9 w-[140px] rounded-lg px-3 text-[13px]"
        value={selectedUser}
        onChange={(event) => onSelectedUserChange(event.target.value)}
        options={userOptions}
      />
      <Select
        aria-label="Filter by action"
        className="h-9 min-h-9 w-[130px] rounded-lg px-3 text-[13px]"
        value={selectedActionType}
        onChange={(event) => onSelectedActionTypeChange(event.target.value)}
        options={AUDIT_LOG_ACTION_OPTIONS}
      />
      <Select
        aria-label="Filter by status"
        className="h-9 min-h-9 w-[130px] rounded-lg px-3 text-[13px]"
        value={selectedStatus}
        onChange={(event) => onSelectedStatusChange(event.target.value)}
        options={AUDIT_LOG_STATUS_OPTIONS}
      />
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onApply={(start, end) => {
          onStartDateChange(start);
          onEndDateChange(end);
        }}
      />
    </div>
  );

  return (
    <DataTableToolbar
      search={
        <div className="group relative w-full min-w-0 sm:max-w-[300px]">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" />
          <input
            type="search"
            aria-label="Search audit logs by user or resource ID"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search user or resource ID..."
            className="h-10 min-h-10 w-full rounded-lg border border-border bg-surface-white py-2 pl-9 pr-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          />
        </div>
      }
      filters={
        <>
          <div className="hidden xl:block">{controls}</div>
          <div className="relative xl:hidden">
            <button
              type="button"
              aria-expanded={areMobileFiltersOpen}
              aria-controls="audit-log-mobile-filters"
              onClick={() => setAreMobileFiltersOpen((open) => !open)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 text-[13px] font-medium text-text-primary transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
            >
              <FiFilter aria-hidden="true" className="h-4 w-4 text-text-secondary" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-light px-1 text-[11px] font-semibold text-primary">
                  {activeFilterCount}
                </span>
              )}
              <FiChevronDown aria-hidden="true" className={cn("h-3.5 w-3.5 transition-transform motion-reduce:transition-none", areMobileFiltersOpen && "rotate-180")} />
            </button>
            <div id="audit-log-mobile-filters" className={cn("mt-2 w-full rounded-lg border border-border bg-bg-primary p-3", areMobileFiltersOpen ? "block" : "hidden")}>
                {controls}
            </div>
          </div>
        </>
      }
      filtersClassName="sm:w-full xl:w-auto"
      actions={
        <button
          type="button"
          onClick={() => { onReset(); setAreMobileFiltersOpen(false); }}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          <FiRefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          Reset filters
        </button>
      }
    />
  );
};

const DateRangePicker: React.FC<{
  startDate: string;
  endDate: string;
  onApply: (startDate: string, endDate: string) => void;
}> = ({ startDate, endDate, onApply }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    const bounds = triggerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const width = Math.min(320, window.innerWidth - 24);
    const height = 230;
    const opensAbove = bounds.bottom + height > window.innerHeight && bounds.top > height;
    setPopoverStyle({
      left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)),
      top: opensAbove
        ? Math.max(8, bounds.top - height - 8)
        : Math.min(bounds.bottom + 8, window.innerHeight - height - 8),
      width,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (target instanceof Element && target.closest("[data-date-picker-calendar]")) return;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const getDateLabel = (value: string) => {
    const date = parseDate(value);
    return date
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
      : "";
  };
  const rangeLabel = startDate || endDate
    ? [startDate && `From ${getDateLabel(startDate)}`, endDate && `To ${getDateLabel(endDate)}`].filter(Boolean).join(" · ")
    : "Date range";

  const openPicker = () => {
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setIsOpen((open) => !open);
  };

  const clearRange = () => {
    setDraftStartDate("");
    setDraftEndDate("");
    onApply("", "");
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={openPicker}
        className={cn(
          "inline-flex h-9 w-[176px] min-w-0 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 text-left text-[13px] transition-colors hover:border-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none",
          startDate || endDate ? "text-text-primary" : "text-text-secondary",
        )}
      >
        <FiCalendar aria-hidden="true" className="h-4 w-4 shrink-0 text-text-secondary" />
        <span className="min-w-0 flex-1 truncate">{rangeLabel}</span>
        <FiChevronDown aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0 transition-transform motion-reduce:transition-none", isOpen && "rotate-180")} />
      </button>
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Choose audit log date range"
          style={popoverStyle}
          className="fixed z-(--z-index-popover) rounded-xl border border-border bg-surface-white p-4 shadow-[0_8px_24px_rgba(18,35,49,0.12)]"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePicker
              label="Date from"
              value={draftStartDate}
              onChange={setDraftStartDate}
              containerClassName="min-w-0"
              labelClassName="text-xs text-text-secondary"
              className="h-10 min-h-10 rounded-lg px-2 text-xs"
            />
            <DatePicker
              label="Date to"
              value={draftEndDate}
              onChange={setDraftEndDate}
              containerClassName="min-w-0"
              labelClassName="text-xs text-text-secondary"
              className="h-10 min-h-10 rounded-lg px-2 text-xs"
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <button type="button" onClick={clearRange} className="inline-flex min-h-9 items-center rounded-md px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none">Clear</button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="inline-flex min-h-9 items-center rounded-md px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none">Cancel</button>
              <button
                type="button"
                onClick={() => { onApply(draftStartDate, draftEndDate); setIsOpen(false); }}
                className="inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default AuditLogFilters;
