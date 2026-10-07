import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import Select from "../../../../components/ui/Select";
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

const fieldClassName =
  "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/10";

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
};

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const DatePickerField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState<React.CSSProperties>({});
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDate(value) ?? new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    if (!isOpen) return;
    const updateCalendarPosition = () => {
      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const calendarHeight = 370;
      const calendarWidth = 296;
      const opensAbove =
        bounds.bottom + calendarHeight > window.innerHeight &&
        bounds.top > calendarHeight;
      setCalendarPosition({
        left: Math.max(12, Math.min(bounds.left, window.innerWidth - calendarWidth - 12)),
        top: opensAbove
          ? Math.max(8, bounds.top - calendarHeight - 8)
          : Math.min(bounds.bottom + 8, window.innerHeight - calendarHeight - 8),
      });
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !wrapperRef.current?.contains(target) &&
        !calendarRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    updateCalendarPosition();
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updateCalendarPosition);
    window.addEventListener("scroll", updateCalendarPosition, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updateCalendarPosition);
      window.removeEventListener("scroll", updateCalendarPosition, true);
    };
  }, [isOpen]);

  const selectedDate = parseDate(value);
  const today = new Date();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const displayValue = selectedDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(selectedDate)
    : "Select a date";
  const firstWeekday = new Date(year, month, 1).getDay();
  const calendarDays = Array.from({ length: 42 }, (_, index) =>
    new Date(year, month, index - firstWeekday + 1),
  );

  const shiftMonth = (amount: number) => {
    setVisibleMonth(new Date(year, month + amount, 1));
  };

  const chooseDate = (date: Date) => {
    onChange(toDateValue(date));
    setIsOpen(false);
  };

  return (
    <div className="relative min-w-0" ref={wrapperRef}>
      <span className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </span>
      <button
        type="button"
        aria-label={`${label}: ${displayValue}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          if (!isOpen) {
            const date = selectedDate ?? new Date();
            setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
          }
          setIsOpen((open) => !open);
        }}
        className={`${fieldClassName} flex h-11 items-center justify-between gap-3 text-left ${!selectedDate ? "text-text-secondary" : ""}`}
      >
        <span>{displayValue}</span>
        <FiCalendar className="h-4 w-4 shrink-0 text-text-secondary" />
      </button>

      {isOpen && createPortal(
        <div
          ref={calendarRef}
          role="dialog"
          aria-label={`${label} calendar`}
          style={calendarPosition}
          className="fixed z-[6000] w-[296px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-white p-4 shadow-[0_12px_32px_rgba(18,35,49,0.14)]"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">
              {monthLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-text-secondary">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="py-2">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((date, index) => {
              const dateValue = toDateValue(date);
              const isCurrentMonth = date.getMonth() === month;
              const isSelected = dateValue === value;
              const isToday = toDateValue(date) === toDateValue(today);
              return (
                <button
                  key={`${dateValue}-${index}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => chooseDate(date)}
                  className={cn(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors",
                    isSelected
                      ? "bg-accent font-semibold text-white"
                      : isCurrentMonth
                        ? "text-text-primary hover:bg-bg-secondary"
                        : "text-text-secondary/50 hover:bg-bg-primary",
                    isToday && !isSelected && "font-semibold ring-1 ring-border",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => chooseDate(today)}
              className="rounded-md px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-bg-secondary"
            >
              Today
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
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
  const userOptions = [
    { value: "all", label: "All users" },
    ...users.map((user) => ({ value: user, label: user })),
  ];

  return (
    <section className="rounded-xl border border-border bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-text-primary">Filter activity</h2>
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary",
          )}
        >
          <FiRefreshCw className="w-4 h-4" />
          Reset filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">
            Search
          </span>
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search by user or resource ID"
              className={cn(fieldClassName, "pl-10")}
            />
          </div>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">
            User
          </span>
          <div className="w-full [&>div]:block [&>div]:w-full">
          <Select
            value={selectedUser}
            onChange={(event) => onSelectedUserChange(event.target.value)}
            options={userOptions}
            placeholder="All users"
          />
          </div>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">
            Action
          </span>
          <div className="w-full [&>div]:block [&>div]:w-full">
          <Select
            value={selectedActionType}
            onChange={(event) => onSelectedActionTypeChange(event.target.value)}
            options={AUDIT_LOG_ACTION_OPTIONS.slice(1)}
            placeholder="All actions"
          />
          </div>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">
            Status
          </span>
          <div className="w-full [&>div]:block [&>div]:w-full">
          <Select
            value={selectedStatus}
            onChange={(event) => onSelectedStatusChange(event.target.value)}
            options={AUDIT_LOG_STATUS_OPTIONS.slice(1)}
            placeholder="All statuses"
          />
          </div>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePickerField
          label="Date from"
          value={startDate}
          onChange={onStartDateChange}
        />
        <DatePickerField label="Date to" value={endDate} onChange={onEndDateChange} />

      </div>
    </section>
  );
};

export default AuditLogFilters;
