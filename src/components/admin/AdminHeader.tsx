import React, { useMemo } from "react";
import { FiMenu } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import type { RootState } from "../../redux/store";
import AdminNotification from "./AdminNotification";

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const titles: Record<string, string> = {
      "/admin": "Dashboard",
      "/admin/audit-logs": "Audit Logs",
      "/admin/projects": "SLR Projects",
      "/admin/users": "Users Management",
      "/admin/master-sources": "Search Sources",
      "/admin/analytics": "Analytics",
      "/admin/settings": "System Settings",
      "/admin/profile": "My Profile",
    };

    return titles[location.pathname] || "Dashboard";
  }, [location.pathname]);

  const getUserInitials = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : "";
  };

  return (
    <header className="h-16 bg-surface-white border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-text-secondary hover:text-accent hover:bg-bg-primary rounded-[4px] transition-all lg:hidden"
          aria-label="Toggle Menu"
        >
          <FiMenu className="w-6 h-6" />
        </button>
        <h2 className="font-cormorant text-2xl font-normal text-text-primary tracking-tight">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* <div className="hidden md:flex relative group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:border-indigo-100 focus:bg-surface-white focus:ring-4 focus:ring-indigo-50/50 rounded-[4px] text-sm transition-all outline-none border w-64"
          />
        </div> */}

        <AdminNotification />

        <div className="h-8 w-px bg-bg-secondary mx-1"></div>

        <div className="flex items-center gap-3 p-1">
          <div className="hidden sm:block text-right ml-2">
            <p className="text-[13px] font-medium text-text-primary leading-tight tracking-wide">
              {user?.name || "Admin Account"}
            </p>
            <p className="text-[10px] uppercase font-medium text-text-secondary tracking-[0.2em] mt-0.5">
              {user?.role || "Super Admin"}
            </p>
          </div>
          <div className="h-9 w-9 rounded-[4px] bg-accent text-bg-primary flex items-center justify-center font-medium text-sm shadow-none ring-1 ring-border">
            {user?.name ? getUserInitials(user.name) : "AD"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
