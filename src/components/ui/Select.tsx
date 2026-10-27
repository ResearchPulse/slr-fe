import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { cn } from "../../utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  containerClassName?: string;
  menuClassName?: string;
}

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

function optionsFromChildren(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  const visit = (nodes: React.ReactNode, group?: string) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement<{ children?: React.ReactNode; value?: string | number; label?: string; disabled?: boolean }>(child)) {
        return;
      }

      const childType = child.type;
      const childProps = child.props;
      if (childType === "option") {
        const label = childProps.label ?? getNodeText(childProps.children);
        options.push({
          value: String(childProps.value ?? label),
          label,
          disabled: childProps.disabled,
          group,
        });
      } else if (childType === "optgroup") {
        const label = (child.props as { label?: string }).label;
        visit(childProps.children, label || group);
      } else if (childType === React.Fragment) {
        visit(childProps.children, group);
      }
    });
  };

  visit(children);
  return options;
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
    children,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    onKeyUp,
    id,
    ...props
  }, ref) => {
    const selectOptions = options ?? optionsFromChildren(children);
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
    const [uncontrolledValue, setUncontrolledValue] = useState(
      defaultValue ??
        (placeholder
          ? ""
          : (selectOptions.find((option) => !option.disabled)?.value ?? "")),
    );
    const selectedValue = value ?? uncontrolledValue;
    const selectedOption = selectOptions.find(
      (option) => String(option.value) === String(selectedValue),
    );
    const visibleOptions = searchable && searchTerm.trim()
      ? selectOptions.filter((option) => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      : selectOptions;

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

    const selectOption = (option: SelectOption) => {
      if (option.disabled) return;
      const nativeSelect = nativeSelectRef.current;
      if (nativeSelect) nativeSelect.value = option.value;
      setUncontrolledValue(option.value);
      setSearchTerm("");
      onChange?.({
        target: nativeSelect ?? { value: option.value },
        currentTarget: nativeSelect ?? { value: option.value },
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
        if (!visibleOptions.length) return;
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => {
          let next = index;
          for (let i = 0; i < visibleOptions.length; i += 1) {
            next = (next + direction + visibleOptions.length) % visibleOptions.length;
            if (!visibleOptions[next].disabled) return next;
          }
          return index;
        });
      }

      if ((event.key === "Enter" || event.key === " ") && isOpen) {
        event.preventDefault();
        if (visibleOptions[activeIndex]) selectOption(visibleOptions[activeIndex]);
      }

      props.onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLSelectElement>);
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown" && visibleOptions.length) {
        event.preventDefault();
        const firstEnabledIndex = visibleOptions.findIndex((option) => !option.disabled);
        setActiveIndex(Math.max(0, firstEnabledIndex));
        menuRef.current?.querySelector<HTMLButtonElement>("[role='option']:not(:disabled)")?.focus();
      } else if (event.key === "Enter" && visibleOptions.length) {
        event.preventDefault();
        selectOption(visibleOptions[Math.min(activeIndex, visibleOptions.length - 1)]);
      }
    };

    return (
      <div
        className={cn(
          "relative inline-block min-w-0",
          /\bw-full\b/.test(className ?? "") && "w-full",
          containerClassName,
        )}
      >
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
          {selectOptions.map((option, index) => (
            <option
              key={`${option.group ?? ""}:${option.value}:${index}`}
              value={option.value}
              disabled={option.disabled}
            >
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
          title={props.title}
          onBlur={onBlur as unknown as React.FocusEventHandler<HTMLButtonElement>}
          onFocus={onFocus as unknown as React.FocusEventHandler<HTMLButtonElement>}
          onKeyUp={onKeyUp as unknown as React.KeyboardEventHandler<HTMLButtonElement>}
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
                "ui-popover-enter fixed z-(--z-index-popover) flex max-h-60 flex-col overflow-hidden rounded-xl border border-border bg-surface-white px-0 py-1.5 shadow-[0_8px_24px_rgba(18,35,49,0.10)]",
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
              <React.Fragment key={`${option.group ?? ""}:${option.value}:${index}`}>
                {option.group && option.group !== visibleOptions[index - 1]?.group && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    {option.group}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex w-full min-w-0 items-center px-3 text-left font-sans text-[13px] leading-5 text-text-primary transition-colors whitespace-normal break-words disabled:cursor-not-allowed disabled:opacity-50",
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
              </React.Fragment>
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
