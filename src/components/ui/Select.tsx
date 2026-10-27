import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { cn } from "../../utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string; description?: string }[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  containerClassName?: string;
  menuClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    error,
    options,
    placeholder,
    searchable = false,
    searchPlaceholder = "Search options...",
    containerClassName,
    menuClassName,
    value,
    defaultValue,
    onChange,
    id,
    ...props
  }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const nativeSelectRef = useRef<HTMLSelectElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const [activeIndex, setActiveIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
    const selectedValue = value ?? uncontrolledValue;
    const selectedOption = options.find(
      (option) => String(option.value) === String(selectedValue),
    );
    const visibleOptions = searchable && searchTerm.trim()
      ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      : options;

    React.useImperativeHandle(ref, () => nativeSelectRef.current as HTMLSelectElement);

    const updateMenuPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const measuredHeight = menuRef.current?.getBoundingClientRect().height || 240;
      const viewportPadding = 8;
      const gap = 6;
      const availableBelow = Math.max(
        0,
        window.innerHeight - bounds.bottom - gap - viewportPadding,
      );
      const availableAbove = Math.max(0, bounds.top - gap - viewportPadding);
      const opensAbove = measuredHeight > availableBelow && availableAbove > availableBelow;
      const availableHeight = opensAbove ? availableAbove : availableBelow;
      const maxHeight = Math.max(96, Math.min(240, availableHeight));
      const renderedHeight = Math.min(measuredHeight, maxHeight);
      const maxWidth = Math.max(0, window.innerWidth - viewportPadding * 2);
      const width = Math.min(bounds.width, maxWidth);
      const centeredLeft = bounds.left + (bounds.width - width) / 2;

      setMenuStyle({
        left: Math.max(
          viewportPadding,
          Math.min(centeredLeft, window.innerWidth - width - viewportPadding),
        ),
        width,
        top: opensAbove
          ? Math.max(viewportPadding, bounds.top - renderedHeight - gap)
          : Math.max(
              viewportPadding,
              Math.min(
                bounds.bottom + gap,
                window.innerHeight - renderedHeight - viewportPadding,
              ),
            ),
        maxHeight,
      });
    };

    useEffect(() => {
      if (!isOpen) return;

      updateMenuPosition();
      const closeOnOutsideClick = (event: MouseEvent) => {
        if (
          !triggerRef.current?.contains(event.target as Node) &&
          !menuRef.current?.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      const reposition = () => updateMenuPosition();

      document.addEventListener("mousedown", closeOnOutsideClick);
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      return () => {
        document.removeEventListener("mousedown", closeOnOutsideClick);
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
      };
    }, [isOpen]);

    useEffect(() => {
      if (isOpen && searchable) {
        searchInputRef.current?.focus({ preventScroll: true });
        if (menuRef.current) menuRef.current.scrollTop = 0;
      }
    }, [isOpen, searchable]);

    const selectOption = (option: (typeof options)[number]) => {
      const nativeSelect = nativeSelectRef.current;
      if (nativeSelect) nativeSelect.value = option.value;
      setUncontrolledValue(option.value);
      setSearchTerm("");
      onChange?.({
        target: { value: option.value },
        currentTarget: { value: option.value },
      } as React.ChangeEvent<HTMLSelectElement>);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleNativeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (value === undefined) setUncontrolledValue(event.currentTarget.value);
      onChange?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => (index + direction + visibleOptions.length) % visibleOptions.length);
      }

      if ((event.key === "Enter" || event.key === " ") && isOpen) {
        event.preventDefault();
        if (visibleOptions[activeIndex]) selectOption(visibleOptions[activeIndex]);
      }
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown" && visibleOptions.length) {
        event.preventDefault();
        setActiveIndex(0);
        menuRef.current?.querySelector<HTMLButtonElement>("[role='option']")?.focus();
      } else if (event.key === "Enter" && visibleOptions.length) {
        event.preventDefault();
        selectOption(visibleOptions[Math.min(activeIndex, visibleOptions.length - 1)]);
      }
    };

    return (
      <div className={cn("relative inline-block min-w-0", containerClassName)}>
        <select
          ref={nativeSelectRef}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          value={selectedValue}
          onChange={handleNativeChange}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          aria-label={props["aria-label"]}
          disabled={props.disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${selectId}-listbox`}
          aria-invalid={error || undefined}
          onClick={() => {
            if (!isOpen) {
              setSearchTerm("");
              const selectedIndex = visibleOptions.findIndex(
                (option) => String(option.value) === String(selectedValue),
              );
              setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
            }
            setIsOpen((open) => !open);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-surface-white px-3.5 text-left font-sans text-sm text-text-primary",
            "transition-[color,background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2",
            "hover:border-text-secondary disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-error focus-visible:border-error focus-visible:ring-error/20"
              : "border-border focus-visible:border-primary focus-visible:ring-primary/20",
            className,
          )}
        >
          <span className={cn(!selectedOption && "text-text-secondary")}>
            {selectedOption?.label ?? placeholder ?? "Select an option"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-150 motion-reduce:transition-none",
              isOpen && "rotate-180 text-primary",
            )}
          />
        </button>
        {isOpen &&
          createPortal(
            <div
              ref={menuRef}
              id={`${selectId}-options`}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                "ui-popover-enter fixed z-(--z-index-popover) flex max-h-60 flex-col overflow-hidden rounded-xl bg-surface-white px-0 py-1.5 shadow-[0_8px_24px_rgba(18,35,49,0.10)]",
                menuClassName,
              )}
              style={menuStyle}
            >
              {searchable && <div className="shrink-0 border-b border-border bg-surface-white p-2">
                <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-bg-primary px-2.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
                  <FiSearch aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    role="searchbox"
                    aria-label={searchPlaceholder}
                    value={searchTerm}
                    onChange={(event) => { setSearchTerm(event.target.value); setActiveIndex(0); }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchPlaceholder}
                    className="h-full min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
                  />
                </div>
              </div>}
              <div id={`${selectId}-listbox`} role="listbox" aria-label={props["aria-label"]} className="dropdown-scroll-area min-h-0 w-full flex-1 overflow-y-auto px-0">
              {visibleOptions.map((option, index) => {
                const isSelected = String(option.value) === String(selectedValue);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={cn(
                      "flex w-full min-w-0 items-center px-2 text-left font-sans text-[13px] leading-5 text-text-primary transition-colors whitespace-normal break-words",
                      option.description ? "min-h-12 py-2" : "min-h-9 h-auto py-1.5",
                      "hover:bg-primary-light hover:text-accent",
                      (isSelected || activeIndex === index) && "bg-primary-light text-accent",
                      isSelected && "font-semibold",
                    )}
                  >
                    {option.description ? (
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="break-words">{option.label}</span>
                        <span className="text-xs font-normal leading-4 text-text-secondary">
                          {option.description}
                        </span>
                      </span>
                    ) : <span className="min-w-0 flex-1 break-words">{option.label}</span>}
                  </button>
                );
              })}
              {!visibleOptions.length && <p className="px-3 py-4 text-center text-xs text-text-tertiary">No matching options.</p>}
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
