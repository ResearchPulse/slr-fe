import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "../../utils/cn";

export interface SidebarItem {
    icon: IconType;
    label: string;
    path: string;
    onClick?: () => void;
}

interface SidebarProps {
    items: SidebarItem[];
    footerItems?: SidebarItem[];
    isCollapsed: boolean;
    onToggle: () => void;
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
    items,
    footerItems,
    isCollapsed,
    onToggle,
    className,
}) => {
    const location = useLocation();

    const renderItem = (item: SidebarItem) => {
        const isActive = location.pathname === item.path;
        const commonClasses = cn(
            "flex items-center gap-3 p-3 transition-all group overflow-hidden whitespace-nowrap w-full text-left relative",
            isActive
                ? "text-[#111111] bg-[#F4F0E8]"
                : "text-[#5C5C5C] hover:text-[#111111] hover:bg-[#F4F0E8]/60"
        );

        const content = (
            <>
                {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#5B0000]" />
                )}
                <item.icon
                    className={cn(
                        "w-4 h-4 shrink-0 transition-opacity duration-200",
                        isActive ? "text-[#111111]" : "text-[#5C5C5C] group-hover:text-[#111111]"
                    )}
                />
                <span
                    className={cn(
                        "text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 ease-in-out",
                        isCollapsed ? "opacity-0 invisible -translate-x-4 w-0" : "opacity-100 visible translate-x-0"
                    )}
                >
                    {item.label}
                </span>
            </>
        );

        if (item.onClick) {
            return (
                <button key={item.label} onClick={item.onClick} className={commonClasses}>
                    {content}
                </button>
            );
        }

        return (
            <Link key={item.path} to={item.path} className={commonClasses}>
                {content}
            </Link>
        );
    };

    return (
        <aside
            className={cn(
                "flex flex-col bg-[#ECE8E1] border-r border-[#D8D2C8] transition-all duration-500 ease-in-out relative z-30",
                isCollapsed ? "w-16" : "w-64",
                className
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3.5 top-8 w-7 h-7 bg-[#F4F0E8] border border-[#D8D2C8] rounded-[4px] flex items-center justify-center text-[#5C5C5C] hover:text-[#111111] transition-colors z-40 cursor-pointer"
            >
                {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
                {items.map(renderItem)}
            </nav>

            {/* Footer Items */}
            {footerItems && footerItems.length > 0 && (
                <div className="px-3 pb-4 border-t border-[#D8D2C8] pt-3 space-y-0.5">
                    {footerItems.map(renderItem)}
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
