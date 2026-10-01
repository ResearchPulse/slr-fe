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
      "/admin/templates": "Checklist Templates",
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
    <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-[#E3EAEE] bg-white/95 px-5 backdrop-blur-sm sm:px-7 lg:px-9">
      <div className="flex min-w-0 items-center gap-3.5">
        <button
          onClick={onMenuClick}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-[#617582] transition-colors hover:bg-[#F1F7FA] hover:text-primary lg:hidden"
          aria-label="Toggle Menu"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[9px] font-bold uppercase tracking-[0.13em] text-[#91A0A9] sm:block">Admin workspace</p>
          <h2 className="truncate text-[16px] font-bold tracking-[-0.02em] text-[#173247] sm:mt-0.5 sm:text-[18px]">{pageTitle}</h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
        <AdminNotification />

        <div className="mx-0.5 h-7 w-px bg-[#E3EAEE]"></div>

        <div className="flex items-center gap-2.5 rounded-lg py-1 pl-1 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[12px] font-bold leading-tight text-[#173247]">
              {user?.name || "Admin Account"}
            </p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8797A1]">
              {user?.role || "Super Admin"}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#087BC1] text-sm font-bold text-white">
            {user?.name ? getUserInitials(user.name) : "A"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
