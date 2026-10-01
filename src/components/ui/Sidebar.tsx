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
      "group relative flex min-h-10 w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left transition-colors duration-150",
      isCollapsed && "justify-center px-2",
      isActive
        ? "bg-[#EAF4FB] text-[#087BC1]"
        : "text-[#617582] hover:bg-white hover:text-[#173247]",
    );

    const content = (
      <>
        <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#087BC1]" : "text-[#80919B] group-hover:text-[#397FA8]")} />
        <span className={cn("truncate text-[13px] font-semibold transition-all duration-200", isCollapsed ? "invisible w-0 opacity-0" : "visible w-auto opacity-100")}>
          {item.label}
        </span>
        {isActive && !isCollapsed && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#087BC1]" />}
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
          <p className="px-3 pb-1 pt-5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#9AA8B0] first:pt-1">{item.group}</p>
        )}
        {itemNode}
      </React.Fragment>
    );
  };

  return (
    <aside className={cn("relative z-30 flex shrink-0 flex-col border-r border-[#E3EAEE] bg-[#F8FAFC] transition-[width] duration-200 ease-out", isCollapsed ? "w-[76px]" : "w-[252px]", className)}>
      <div className={cn("flex h-[82px] shrink-0 items-center border-b border-[#E9EEF1]", isCollapsed ? "justify-center px-2" : "px-6")}>
        <Link to="/admin" className="min-w-0" aria-label="SLRS Admin overview">
          <span className="block text-[21px] font-extrabold leading-none tracking-[0.05em] text-[#102B3D]">SLR<span className="text-[#087BC1]">S</span></span>
          {!isCollapsed && <span className="mt-1.5 block whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.12em] text-[#81919B]">Systematic Literature Review System</span>}
        </Link>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[68px] z-40 flex h-6 w-6 items-center justify-center rounded-full border border-[#DCE6EC] bg-white text-[#71838F] shadow-[0_2px_7px_rgba(19,43,60,0.08)] transition hover:text-primary"
      >
        {isCollapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
      </button>

      <nav aria-label="Admin navigation" className={cn("no-scrollbar flex-1 overflow-y-auto py-5", isCollapsed ? "space-y-1 px-3" : "space-y-1 px-3.5")}>
        {items.map(renderItem)}
      </nav>

      {footerItems && footerItems.length > 0 && (
        <div className={cn("shrink-0 border-t border-[#E9EEF1] py-3", isCollapsed ? "space-y-1 px-3" : "space-y-1 px-3.5")}>
          {footerItems.map(renderItem)}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
