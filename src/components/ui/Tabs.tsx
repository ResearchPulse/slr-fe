import React, { useState } from "react";
import { cn } from "../../utils/cn";

export interface TabItem {
  id: string;
  label: string;
  compactLabel?: string;
  icon?: React.ElementType;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  "aria-label"?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  listClassName?: string;
  itemClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  "aria-label": ariaLabel = "Sections",
  activeTabId: externalActiveTabId,
  onTabChange,
  className,
  listClassName,
  itemClassName,
  contentClassName,
  children,
}) => {
  const [internalActiveTabId, setInternalActiveTabId] = useState(
    items.length > 0 ? items[0].id : "",
  );

  const activeTabId =
    externalActiveTabId !== undefined
      ? externalActiveTabId
      : internalActiveTabId;

  const handleTabClick = (id: string) => {
    if (externalActiveTabId === undefined) {
      setInternalActiveTabId(id);
    }
    if (onTabChange) {
      onTabChange(id);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "flex items-center gap-0 border-b border-border w-full overflow-x-auto no-scrollbar",
          listClassName,
        )}
      >
        {items.map((item) => {
          const isActive = activeTabId === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(item.id)}
              onKeyDown={(event) => {
                if (!items.length) return;
                let nextIndex: number | null = null;
                if (event.key === "ArrowRight") {
                  nextIndex = (items.findIndex(({ id }) => id === item.id) + 1) % items.length;
                } else if (event.key === "ArrowLeft") {
                  nextIndex = (items.findIndex(({ id }) => id === item.id) - 1 + items.length) % items.length;
                } else if (event.key === "Home") {
                  nextIndex = 0;
                } else if (event.key === "End") {
                  nextIndex = items.length - 1;
                }
                if (nextIndex === null) return;
                event.preventDefault();
                handleTabClick(items[nextIndex].id);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]
                  ?.focus();
              }}
              className={cn(
                "flex min-h-11 items-center gap-2 border-b-2 px-4 py-2.5 -mb-px text-[11px] font-medium uppercase tracking-[0.15em] whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                isActive
                  ? "text-text-primary border-accent"
                  : "text-text-secondary border-transparent hover:text-text-primary hover:border-border",
                itemClassName,
              )}
            >
              {Icon && (
                <Icon
                  size={14}
                  className={cn(
                    "transition-opacity duration-200",
                    isActive ? "opacity-100" : "opacity-50",
                  )}
                />
              )}
              {item.compactLabel ? (
                <>
                  <span className="tab-label-full">{item.label}</span>
                  <span className="tab-label-compact">{item.compactLabel}</span>
                </>
              ) : (
                item.label
              )}
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-medium min-w-[1.25rem] flex items-center justify-center",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "bg-bg-secondary text-text-secondary",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className={cn("w-full h-full", contentClassName)}>{children}</div>
    </div>
  );
};

export default Tabs;
