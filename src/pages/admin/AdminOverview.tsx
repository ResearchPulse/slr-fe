import React, { useMemo } from "react";
import { FiGrid } from "react-icons/fi";
import { cn } from "../../utils/cn";
import { useUsers } from "../../hooks/useUsers";
import { useProjects } from "../../hooks/useProjects";

const AdminOverview: React.FC = () => {
  const { data: usersData, isLoading: isUsersLoading } = useUsers({
    pageNumber: 1,
    pageSize: 1,
  });
  const { data: projectsData, isLoading: isProjectsLoading } = useProjects({
    pageNumber: 1,
    pageSize: 1,
  });

  const stats = useMemo(() => {
    const totalUsers = usersData?.totalCount || 0;
    const totalProjects = projectsData?.totalCount || 0;

    return [
      {
        label: "Total Users",
        value: isUsersLoading ? "..." : totalUsers.toLocaleString(),
        change: "Total",
        color: "indigo",
      },
      {
        label: "Active Projects",
        value: isProjectsLoading ? "..." : totalProjects.toLocaleString(),
        change: "Active",
        color: "emerald",
      },
      // { label: "System Uptime", value: "99.9%", change: "Stable", color: "blue" },
      // { label: "Pending Tickets", value: "0", change: "-0", color: "rose" },
    ];
  }, [usersData, projectsData, isUsersLoading, isProjectsLoading]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Welcome */}
      <div className="space-y-2 mb-8">
        <h3 className="font-cormorant text-3xl sm:text-4xl font-normal text-text-primary tracking-tight">
          Welcome back, Admin
        </h3>
        <p className="text-text-secondary text-sm">
          Here's what happening with your system today.
        </p>
      </div>

      {/* Grid for Placeholder Stats <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-surface-white p-6 rounded-[4px] border border-border shadow-none transition-all duration-300 group cursor-default"
          >
            <p className="text-[11px] font-medium text-text-secondary uppercase tracking-[0.2em] mb-4 group-hover:text-text-primary transition-colors">
              {stat.label}
            </p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-normal text-text-primary font-cormorant">
                {stat.value}
              </span>
              <span
                className={cn(
                  "text-xs font-bold px-2 py-1 rounded-[4px]",
                  stat.change.startsWith("+") ||
                    stat.change === "Active" ||
                    stat.change === "Stable" ||
                    stat.change === "Total"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-50 text-slate-600",
                )}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-surface-white rounded-md border border-border min-h-[400px] flex items-center justify-center relative overflow-hidden group">
        <div className="text-center z-10">
          <div className="w-16 h-16 bg-bg-secondary text-text-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-border transition-transform">
            <FiGrid size={24} />
          </div>
          <h4 className="font-cormorant text-2xl font-normal text-text-primary mb-2">Content Area</h4>
          <p className="text-text-secondary text-[13px] max-w-[280px] mx-auto leading-relaxed">
            This workspace is ready for your dynamic management components and tables.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
