import React, { useState } from "react";
import { cn } from "../../utils/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
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
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 border-b-2 -mb-px",
                isActive
                  ? "text-primary border-primary"
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
              {item.label}
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[11px] font-medium min-w-[1.25rem] flex items-center justify-center",
                    isActive
                      ? "bg-primary-light text-primary"
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
