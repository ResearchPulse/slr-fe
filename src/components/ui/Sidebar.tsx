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
      "group relative flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none",
      isCollapsed && "justify-center px-2",
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
          <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted first:pt-1">{item.group}</p>
        )}
        {itemNode}
      </React.Fragment>
    );
  };

  return (
    <aside className={cn("relative z-30 flex shrink-0 flex-col border-r border-border bg-bg-secondary transition-[width] duration-200 ease-out motion-reduce:transition-none", isCollapsed ? "w-[76px]" : "w-[252px]", className)}>
      <div className={cn("flex h-[72px] shrink-0 items-center border-b border-border", isCollapsed ? "justify-center px-2" : "px-6")}>
        <Link to="/admin" className="flex min-h-11 min-w-0 flex-col justify-center" aria-label="SLRS Admin overview">
          <span className="block text-[21px] font-extrabold leading-none tracking-[0.05em] text-text-primary">SLR<span className="text-accent">S</span></span>
          {!isCollapsed && <span className="mt-1.5 block whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.1em] text-text-muted">Systematic Literature Review System</span>}
        </Link>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[60px] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-white text-text-secondary shadow-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        {isCollapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
      </button>

      <nav aria-label="Admin navigation" className={cn("no-scrollbar flex-1 overflow-y-auto py-4", isCollapsed ? "space-y-1 px-3" : "space-y-1 px-3.5")}>
        {items.map(renderItem)}
      </nav>

      {footerItems && footerItems.length > 0 && (
        <div className={cn("shrink-0 border-t border-border py-3", isCollapsed ? "space-y-1 px-3" : "space-y-1 px-3.5")}>
          {footerItems.map(renderItem)}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
