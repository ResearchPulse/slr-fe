import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from "../../utils/cn";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  position?: "top" | "bottom";
  className?: string;
  contentClassName?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = "left",
  position = "bottom",
  className,
  contentClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleDropdown = () => setIsOpen((open) => !open);
  const accessibleTrigger = React.isValidElement<React.HTMLAttributes<HTMLElement>>(trigger)
    ? React.cloneElement(trigger, {
        "aria-expanded": isOpen,
        "aria-controls": contentId,
        ...(trigger.type === "div"
          ? { role: "button", tabIndex: 0 }
          : {}),
        onClick: (event) => {
          trigger.props.onClick?.(event);
          toggleDropdown();
        },
        onKeyDown: (event) => {
          trigger.props.onKeyDown?.(event);
          if (
            event.key === "ArrowDown" ||
            (trigger.type === "div" &&
              (event.key === "Enter" || event.key === " "))
          ) {
            event.preventDefault();
            setIsOpen(true);
          }
        },
      })
    : trigger;

  const alignments = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  const positions = {
    bottom: "top-full mt-2 origin-top",
    top: "bottom-full mb-2 origin-bottom",
  };

  return (
    <div
      className={cn("relative inline-block text-left", className)}
      ref={dropdownRef}
    >
      {accessibleTrigger}

      {isOpen && (
        <div
          id={contentId}
          className={cn(
            "dropdown-scroll-area absolute z-(--z-index-dropdown) ui-popover-enter max-h-72 overflow-y-auto rounded-xl border border-border focus:outline-none",
            !contentClassName?.includes("bg-") && "bg-surface-white",
            !contentClassName?.includes("w-") && "w-56",
            !contentClassName?.includes("shadow-") &&
              "shadow-[0_8px_24px_rgba(18,35,49,0.10)]",
            !contentClassName?.includes("p-") && "py-1",
            alignments[align],
            positions[position],
            contentClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  icon,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "flex min-h-11 w-full items-center px-4 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-primary-light hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none",
        className,
      )}
      type={props.type ?? "button"}
      role={props.role ?? "menuitem"}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="mr-3 text-text-muted group-hover:text-primary">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

export { Dropdown, DropdownItem };
