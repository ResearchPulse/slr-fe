import React, { useState } from "react";
import Sidebar, { type SidebarItem } from "../../components/ui/Sidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import Drawer from "../../components/ui/Drawer";
import SystemSignature from "../../components/logo/SystemSignature";
import {
  FiGrid,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiHome,
  FiDatabase,
  FiFileText,
  FiUser,
} from "react-icons/fi";
import { SiTask } from "react-icons/si";
import { MdChecklist } from "react-icons/md";
import { useDispatch } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import SectionGuard from "../../components/auth/SectionGuard";

const AdminDashboard: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/signin");
  };

  const handleSwitchHome = () => {
    navigate("/");
  };

  const menuItems: SidebarItem[] = [
    { icon: FiGrid, label: "Overview", path: "/admin", group: "Main" },
    { icon: SiTask, label: "SLR Projects", path: "/admin/projects", group: "Main" },
    {
      icon: FiDatabase,
      label: "Search Sources",
      path: "/admin/master-sources",
      group: "Main",
    },
    { icon: FiUsers, label: "Users Management", path: "/admin/users", group: "Management" },
    {
      icon: MdChecklist,
      label: "Checklist Templates",
      path: "/admin/templates",
      group: "Management",
    },
    { icon: FiFileText, label: "Audit Logs", path: "/admin/audit-logs", group: "System" },
    { icon: FiSettings, label: "System Settings", path: "/admin/settings", group: "System" },
  ];

  const footerItems: SidebarItem[] = [
    {
      icon: FiHome,
      label: "Client Home",
      path: "/",
      onClick: handleSwitchHome,
    },
    {
      icon: FiUser,
      label: "My Profile",
      path: "/admin/profile",
    },
    {
      icon: FiLogOut,
      label: "Sign out",
      path: "",
      onClick: handleLogout,
    },
  ];

  return (
    <SectionGuard section="admin">
      <div className="relative flex h-screen overflow-hidden bg-[#F6F9FB]">
        {/* Mobile Sidebar (Drawer) */}
        <Drawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          side="left"
          maxWidth="max-w-[280px]"
          title={<SystemSignature primaryClassName="text-[#102B3D]" accentClassName="text-[#087BC1]" className="mb-0 text-xl" />}
        >
          <div className="flex flex-col h-full -mx-6 -my-8">
            <nav className="flex-1 space-y-1 px-4 py-5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      else navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-[#617582] transition-colors hover:bg-[#F1F7FA] hover:text-[#173247]"
                  >
                    <Icon className="h-[18px] w-[18px] opacity-70" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="space-y-1 border-t border-[#E9EEF1] p-4">
              {footerItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      else navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[12px] font-semibold text-[#71838F] transition-colors hover:bg-white hover:text-[#173247]"
                  >
                    <Icon className="h-[18px] w-[18px] opacity-70" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Drawer>

        {/* Desktop Sidebar */}
        <Sidebar
          className="hidden lg:flex"
          items={menuItems}
          footerItems={footerItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <AdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

          {/* Dynamic Content */}
          <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-7 sm:px-7 lg:px-9 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SectionGuard>
  );
};

export default AdminDashboard;
