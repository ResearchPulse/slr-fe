import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { GridFieldOptionDto } from "../../../../../types/dataExtraction";

interface MultiSelectDropdownProps {
  options: GridFieldOptionDto[];
  currentValue: string | null | undefined;
  onConfirm: (selectedOptions: string[]) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function parseCurrentValue(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default function MultiSelectDropdown({
  options,
  currentValue,
  onConfirm,
  onCancel,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(parseCurrentValue(currentValue)),
  );
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Calculate dropdown position when opened
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!triggerRef.current || !containerRef.current) {
        return;
      }

      const isClickOnTrigger = triggerRef.current.contains(
        event.target as Node,
      );
      const isClickOnContainer = containerRef.current.contains(
        event.target as Node,
      );

      if (!isClickOnTrigger && !isClickOnContainer) {
        onCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCancel]);

  const handleToggleOption = (optionValue: string) => {
    if (disabled) {
      return;
    }

    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(optionValue)) {
        next.delete(optionValue);
      } else {
        next.add(optionValue);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedValues));
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    if (disabled) {
      return;
    }

    if (selectedValues.size === options.length) {
      setSelectedValues(new Set());
    } else {
      setSelectedValues(new Set(options.map((opt) => opt.value)));
    }
  };

  const displayLabel =
    selectedValues.size === 0
      ? "Select options..."
      : selectedValues.size === options.length
        ? "All selected"
        : `${selectedValues.size} selected`;

  return (
    <div className="relative w-full">
      {/* Summary Display / Trigger */}
      <div
        ref={triggerRef}
        className="flex items-center gap-1 rounded-xl border border-accent bg-surface-white px-2 py-1 text-xs text-text-primary"
      >
        <ChevronDown className="h-3 w-3 flex-shrink-0 text-text-secondary" />
        <span className="min-w-0 flex-1 truncate text-text-secondary">
          {displayLabel}
        </span>
      </div>

      {/* Dropdown Menu - Portaled to document.body */}
      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            className="fixed z-(--z-index-dropdown) mt-1 rounded-xl border border-border bg-surface-white shadow-lg"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            <div className="max-h-48 overflow-y-auto p-1">
              {/* Select All Option */}
              <label className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-bg-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedValues.size === options.length && options.length > 0
                  }
                  onChange={handleSelectAll}
                  disabled={disabled || options.length === 0}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-text-primary focus:ring-slate-400 disabled:cursor-not-allowed"
                />
                <span className="text-xs font-semibold text-text-secondary">
                  Select All
                </span>
              </label>

              <div className="my-1 border-t border-border" />

              {/* Individual Options */}
              {options.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-text-secondary">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <label
                    key={option.optionId || option.value}
                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-bg-secondary cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.has(option.value)}
                      onChange={() => handleToggleOption(option.value)}
                      disabled={disabled}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-text-primary focus:ring-slate-400 disabled:cursor-not-allowed"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-text-primary">
                      {option.value}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-1 border-t border-border bg-bg-secondary p-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={disabled}
                className="flex-1 rounded px-2 py-1 text-xs font-medium text-text-secondary hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={disabled}
                className="flex-1 rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
