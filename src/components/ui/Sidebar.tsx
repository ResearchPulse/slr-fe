import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "../../utils/cn";

export interface SidebarItem {
  icon: IconType;
  label: string;
  path: string;
  group?: string;
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  footerItems?: SidebarItem[];
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ items, footerItems, isCollapsed, onToggle, className }) => {
  const location = useLocation();
  let previousGroup = "";

  const renderItem = (item: SidebarItem) => {
    const isActive = !item.onClick && (
      location.pathname === item.path ||
      (item.path !== "/admin" && location.pathname.startsWith(`${item.path}/`))
    );
    const showGroup = Boolean(item.group && item.group !== previousGroup);
    previousGroup = item.group || previousGroup;

    const commonClasses = cn(
      "group relative flex min-h-10 w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none",
      isCollapsed && "justify-center gap-0 px-2",
      isActive
        ? "bg-primary-light text-accent"
        : "text-text-secondary hover:bg-surface-white hover:text-text-primary",
    );

    const content = (
      <>
        <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-accent" : "text-text-muted group-hover:text-primary-hover")} />
        <span className={cn("truncate text-[13px] font-semibold transition-[opacity,width] duration-200 motion-reduce:transition-none", isCollapsed ? "invisible w-0 opacity-0" : "visible w-auto opacity-100")}>
          {item.label}
        </span>
      </>
    );

    const itemNode = item.onClick ? (
      <button key={item.label} type="button" onClick={item.onClick} title={isCollapsed ? item.label : undefined} aria-label={item.label} className={commonClasses}>
        {content}
      </button>
    ) : (
      <Link key={item.path} to={item.path} title={isCollapsed ? item.label : undefined} aria-label={item.label} aria-current={isActive ? "page" : undefined} className={commonClasses}>
        {content}
      </Link>
    );

    return (
      <React.Fragment key={item.path || item.label}>
        {showGroup && !isCollapsed && (
          <p className="px-2.5 pb-0.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted first:pt-1">{item.group}</p>
        )}
        {itemNode}
      </React.Fragment>
    );
  };

  return (
    <aside className={cn("relative z-30 flex shrink-0 flex-col border-r border-border bg-bg-secondary transition-[width] duration-200 ease-out motion-reduce:transition-none", isCollapsed ? "w-16" : "w-[216px]", className)}>
      <div className="flex h-[64px] shrink-0 items-center justify-center border-b border-border px-2">
        <Link to="/admin" className="flex min-h-10 w-full min-w-0 items-center justify-center overflow-hidden" aria-label="SLRS Admin overview">
          <img
            src={isCollapsed ? "/brand/logo-mark.png" : "/brand/logo-horizontal.png"}
            alt="SLRS"
            className="block h-8 max-w-full w-auto select-none object-contain object-left"
            draggable={false}
          />
        </Link>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[52px] z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-white text-text-secondary shadow-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        {isCollapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
      </button>

      <nav aria-label="Admin navigation" className={cn("custom-scrollbar flex-1 overflow-y-auto py-3", isCollapsed ? "space-y-0.5 px-2.5" : "space-y-0.5 px-3")}>
        {items.map(renderItem)}
      </nav>

      {footerItems && footerItems.length > 0 && (
        <div className={cn("shrink-0 border-t border-border py-2", isCollapsed ? "space-y-0.5 px-2.5" : "space-y-0.5 px-3")}>
          {footerItems.map(renderItem)}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
