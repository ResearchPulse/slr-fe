import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    error,
    options,
    placeholder,
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
    const nativeSelectRef = useRef<HTMLSelectElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const [activeIndex, setActiveIndex] = useState(0);
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
    const selectedValue = value ?? uncontrolledValue;
    const selectedOption = options.find(
      (option) => String(option.value) === String(selectedValue),
    );

    React.useImperativeHandle(ref, () => nativeSelectRef.current as HTMLSelectElement);

    const updateMenuPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const menuHeight = menuRef.current?.getBoundingClientRect().height ?? 0;
      const opensAbove = bounds.bottom + menuHeight > window.innerHeight && bounds.top > menuHeight;

      setMenuStyle({
        left: bounds.left,
        minWidth: bounds.width,
        top: opensAbove ? bounds.top - menuHeight - 6 : bounds.bottom + 6,
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

    const selectOption = (option: (typeof options)[number]) => {
      const nativeSelect = nativeSelectRef.current;
      if (nativeSelect) nativeSelect.value = option.value;
      setUncontrolledValue(option.value);
      onChange?.({
        target: { value: option.value },
        currentTarget: { value: option.value },
      } as React.ChangeEvent<HTMLSelectElement>);
      setIsOpen(false);
      triggerRef.current?.focus();
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
        setActiveIndex((index) => (index + direction + options.length) % options.length);
      }

      if ((event.key === "Enter" || event.key === " ") && isOpen) {
        event.preventDefault();
        selectOption(options[activeIndex]);
      }
    };

    return (
      <div className="relative inline-block min-w-0">
        <select
          ref={nativeSelectRef}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          value={selectedValue}
          onChange={onChange}
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
          disabled={props.disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${selectId}-options`}
          aria-invalid={error || undefined}
          onClick={() => {
            if (!isOpen) {
              const selectedIndex = options.findIndex(
                (option) => String(option.value) === String(selectedValue),
              );
              setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
            }
            setIsOpen((open) => !open);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-[9px] border bg-surface-white px-3.5 text-left font-sans text-sm text-text-primary",
            "transition-colors duration-150 focus:outline-none focus:ring-4 focus:ring-primary-light focus:border-accent",
            "hover:border-text-secondary disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-border",
            className,
          )}
        >
          <span className={cn(!selectedOption && "text-text-secondary")}>
            {selectedOption?.label ?? placeholder ?? "Select an option"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-150",
              isOpen && "rotate-180 text-accent",
            )}
          />
        </button>
        {isOpen &&
          createPortal(
            <div
              ref={menuRef}
              id={`${selectId}-options`}
              role="listbox"
              aria-label={props["aria-label"]}
              className="fixed z-[1000] max-h-60 overflow-auto rounded-[9px] border border-border bg-surface-white p-1.5 shadow-[0_8px_24px_rgba(18,35,49,0.10)]"
              style={menuStyle}
            >
              {options.map((option, index) => {
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
                      "flex h-9 w-full items-center rounded-[6px] px-2 text-left font-sans text-sm text-text-primary transition-colors",
                      "hover:bg-primary-light hover:text-accent",
                      (isSelected || activeIndex === index) && "bg-primary-light text-accent",
                      isSelected && "font-semibold",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
