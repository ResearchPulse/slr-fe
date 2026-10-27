import { createPortal } from "react-dom";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Label from "./Label";
import { cn } from "../../utils/cn";

export interface DatePickerProps {
  id?: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  errorMessage?: string;
  containerClassName?: string;
  labelClassName?: string;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function sameDay(a: Date | null, b: Date): boolean {
  return Boolean(
    a &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate(),
  );
}

export default function DatePicker({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  errorMessage,
  containerClassName,
  labelClassName,
  className,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? `date-picker-${generatedId}`;
  const errorId = `${inputId}-error`;
  const selectedDate = parseDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({ left: 8, top: 8 });
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = parseDate(value) ?? new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(1 - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const width = Math.min(296, window.innerWidth - 16);
      const height = popoverRef.current?.getBoundingClientRect().height ?? 390;
      const left = Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8));
      const belowTop = bounds.bottom + 8;
      const aboveTop = bounds.top - height - 8;
      const top = belowTop + height <= window.innerHeight - 8
        ? belowTop
        : aboveTop >= 8
          ? aboveTop
          : Math.max(8, window.innerHeight - height - 8);
      setPosition({ left, top, width });
    };
    updatePosition();

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target) &&
        !popoverRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const openCalendar = () => {
    if (disabled) return;
    const initialDate = selectedDate ?? new Date();
    setVisibleMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    setIsOpen((open) => !open);
  };

  const chooseDate = (date: Date) => {
    onChange(toDateValue(date));
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("min-w-0", containerClassName)}>
      <Label htmlFor={inputId} className={cn("mb-1.5", labelClassName)}>
        {label}
        {required && <span aria-hidden="true" className="ml-1 text-error">*</span>}
      </Label>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${selectedDate ? formatDate(selectedDate) : "not set"}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-required={required || undefined}
        aria-invalid={Boolean(errorMessage) || undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        onClick={openCalendar}
        className={cn(
          "flex h-11 min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-surface-white px-3.5 text-left text-sm outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-bg-secondary disabled:text-text-muted motion-reduce:transition-none",
          errorMessage ? "border-error focus-visible:border-error focus-visible:ring-error/20" : "border-border",
          selectedDate ? "text-text-primary" : "text-text-muted",
          className,
        )}
      >
        <span>{selectedDate ? formatDate(selectedDate) : "mm/dd/yyyy"}</span>
        <FiCalendar aria-hidden="true" className="h-4 w-4 shrink-0 text-text-secondary" />
      </button>
      {errorMessage && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error">
          {errorMessage}
        </p>
      )}

      {isOpen && !disabled && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`${label} calendar`}
          data-date-picker-calendar="true"
          style={position}
          className="ui-popover-enter fixed z-(--z-index-popover) rounded-xl border border-border bg-surface-white p-3 shadow-[0_8px_24px_rgba(18,35,49,0.12)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary" aria-live="polite">
              {visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                <FiChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center" aria-label="Days of the week">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="flex h-8 items-center justify-center text-[11px] font-medium text-text-secondary">{weekday}</span>
            ))}
            {calendarDays.map((date) => {
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = sameDay(selectedDate, date);
              const isToday = sameDay(today, date);
              return (
                <button
                  key={toDateValue(date)}
                  type="button"
                  aria-label={date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  aria-pressed={isSelected}
                  onClick={() => chooseDate(date)}
                  className={cn(
                    "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none",
                    isSelected
                      ? "bg-primary font-semibold text-white"
                      : isToday
                        ? "border border-primary/40 font-semibold text-primary"
                        : isCurrentMonth
                          ? "text-text-primary hover:bg-primary-light"
                          : "text-text-muted hover:bg-bg-secondary",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => { onChange(""); setIsOpen(false); }}
              className="min-h-9 rounded-md px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => chooseDate(today)}
              className="min-h-9 rounded-md px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
            >
              Today
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
