import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface CalendarDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(date: Date | null): string {
  if (!date) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

const sameDay = (a: Date | null, b: Date) => Boolean(
  a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(),
);

export default function CalendarDatePicker({ label, value, onChange, disabled = false }: CalendarDatePickerProps) {
  const selectedDate = parseDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [opensAbove, setOpensAbove] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selectedDate ?? new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isOpen) return;
    const bounds = rootRef.current?.getBoundingClientRect();
    if (bounds) setOpensAbove(window.innerHeight - bounds.bottom < 340 && bounds.top > 340);
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [isOpen, value]);

  const moveMonth = (offset: number) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  };

  const chooseDate = (date: Date) => {
    onChange(toInputValue(date));
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${selectedDate ? displayDate(selectedDate) : "not set"}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-white px-4 text-left text-sm text-text-primary outline-none transition-colors hover:border-primary/40 focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-bg-primary disabled:text-text-muted"
      >
        <span className={selectedDate ? "text-text-primary" : "text-text-secondary"}>
          {selectedDate ? displayDate(selectedDate) : "mm/dd/yyyy"}
        </span>
        <FiCalendar aria-hidden="true" className="h-4 w-4 shrink-0 text-text-secondary" />
      </button>

      {isOpen && !disabled && (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          className={`absolute left-0 z-50 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-surface-white p-3 shadow-[0_8px_24px_rgba(18,35,49,0.10)] ${opensAbove ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary" aria-live="polite">
              {visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                <FiChevronLeft aria-hidden="true" />
              </button>
              <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center" aria-label={visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}>
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="flex h-8 items-center justify-center text-[11px] font-medium text-text-secondary">{weekday}</span>
            ))}
            {calendarDays.map((date) => {
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = sameDay(selectedDate, date);
              const isToday = sameDay(today, date);
              return (
                <button
                  key={toInputValue(date)}
                  type="button"
                  aria-label={date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  aria-pressed={isSelected}
                  onClick={() => chooseDate(date)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    isSelected
                      ? "bg-primary text-white"
                      : isToday
                        ? "border border-primary/40 font-semibold text-primary"
                        : isCurrentMonth
                          ? "text-text-primary hover:bg-primary-light"
                          : "text-text-muted hover:bg-bg-secondary"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
            <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="rounded-md px-2 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary">Clear</button>
            <button type="button" onClick={() => chooseDate(today)} className="rounded-md px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary-light">Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
