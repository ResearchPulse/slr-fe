import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiFileText,
  FiDatabase,
  FiArrowRight,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiExternalLink,
} from "react-icons/fi";
import { SiTask } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../../utils/cn";
import { useUsers } from "../../hooks/useUsers";
import { useProjects } from "../../hooks/useProjects";
import { useAdminAuditLogs } from "../../hooks/useAuditLogs";
import { masterSourceService } from "../../services/masterSourceService";

const actionToneClasses: Record<string, string> = {
  create: "bg-success/10 text-success border-success/20",
  update: "bg-primary-light text-primary border-primary/20",
  delete: "bg-rose-50 text-rose-700 border-rose-200",
  export: "bg-bg-secondary text-text-secondary border-border",
  access: "bg-primary-light text-primary border-primary/20",
  review: "bg-warning/10 text-warning border-warning/20",
  system: "bg-bg-secondary text-text-secondary border-border",
};

const AdminOverview: React.FC = () => {
  const navigate = useNavigate();

  // 1. Fetch Users
  const { data: usersData, isLoading: isUsersLoading } = useUsers({
    pageNumber: 1,
    pageSize: 5,
  });

  // 2. Fetch Projects
  const {
    projects,
    data: projectsData,
    isLoading: isProjectsLoading,
  } = useProjects({
    pageNumber: 1,
    pageSize: 5,
  });

  // 3. Fetch Audit Logs
  const { data: auditLogsResponse, isLoading: isAuditLoading } =
    useAdminAuditLogs({
      pageNumber: 1,
      pageSize: 5,
    });

  // 4. Fetch Master Sources Count
  const { data: sourcesResponse, isLoading: isSourcesLoading } = useQuery({
    queryKey: ["master-sources", "overview"],
    queryFn: () => masterSourceService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const totalUsers = usersData?.totalCount || 0;
  const totalProjects = projectsData?.totalCount || 0;
  const totalAuditLogs = auditLogsResponse?.data?.totalCount || 0;
  const totalSources = sourcesResponse?.data?.length || 0;

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: isUsersLoading ? "..." : totalUsers.toLocaleString(),
        change: "Active Members",
        tone: "indigo",
        path: "/admin/users",
        icon: <FiUsers className="w-5 h-5 text-primary" />,
      },
      {
        label: "Active Projects",
        value: isProjectsLoading ? "..." : totalProjects.toLocaleString(),
        change: "Under Review",
        tone: "emerald",
        path: "/admin/projects",
        icon: <SiTask className="w-5 h-5 text-success" />,
      },
      {
        label: "Audit Events",
        value: isAuditLoading ? "..." : totalAuditLogs.toLocaleString(),
        change: "Real-time Trails",
        tone: "amber",
        path: "/admin/audit-logs",
        icon: <FiFileText className="w-5 h-5 text-warning" />,
      },
      {
        label: "Search Sources",
        value: isSourcesLoading ? "..." : totalSources.toLocaleString(),
        change: "Connected DBs",
        tone: "blue",
        path: "/admin/master-sources",
        icon: <FiDatabase className="w-5 h-5 text-primary" />,
      },
    ],
    [
      totalUsers,
      totalProjects,
      totalAuditLogs,
      totalSources,
      isUsersLoading,
      isProjectsLoading,
      isAuditLoading,
      isSourcesLoading,
    ],
  );

  const recentLogs = useMemo(
    () => auditLogsResponse?.data?.items?.slice(0, 5) || [],
    [auditLogsResponse],
  );

  const recentProjects = useMemo(
    () => projects?.slice(0, 5) || [],
    [projects],
  );

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h3 className="text-[28px] sm:text-[34px] font-semibold text-text-primary tracking-[-0.01em]">
            Welcome back, Admin
          </h3>
          <p className="text-text-secondary text-sm">
            Overview of systematic reviews, researcher activity, and system integrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/projects")}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-[8px] bg-primary text-surface-white text-[13px] font-medium hover:bg-primary-hover transition-colors"
          >
            <SiTask className="w-3.5 h-3.5" />
            Manage projects
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/audit-logs")}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-[8px] bg-surface-white border border-border text-[13px] font-medium text-text-primary hover:bg-bg-secondary transition-colors"
          >
            <FiClock className="w-3.5 h-3.5 text-text-muted" />
            Audit console
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            onClick={() => navigate(stat.path)}
            className="bg-surface-white p-5 rounded-[12px] border border-border transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-[0_2px_8px_rgba(18,35,49,0.06)] cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[12px] font-medium text-text-muted group-hover:text-primary transition-colors">
                {stat.label}
              </span>
              <div className="w-9 h-9 rounded-[10px] bg-primary-light flex items-center justify-center group-hover:scale-105 transition-transform">
                {stat.icon}
              </div>
            </div>

            <div className="flex items-end justify-between mt-2">
              <span className="text-[28px] font-semibold text-text-primary leading-none tracking-[-0.01em]">
                {stat.value}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg-secondary text-text-secondary">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Content Area: 2-Column Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Recent SLR Projects (7 cols) */}
        <div className="xl:col-span-7 bg-surface-white rounded-md border border-border shadow-none overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-bg-secondary flex items-center justify-center border border-border text-accent">
                  <SiTask size={16} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-text-primary tracking-tight">
                    Active SLR Projects
                  </h4>
                  <p className="text-[12px] text-text-secondary">
                    Latest systematic reviews registered in the system
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/projects")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline uppercase tracking-wider"
              >
                View All
                <FiArrowRight size={13} />
              </button>
            </div>

            <div className="p-6">
              {isProjectsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-16 rounded-md bg-slate-50 animate-pulse border border-border"
                    />
                  ))}
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate("/admin/projects")}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group cursor-pointer hover:bg-bg-secondary/30 px-2 rounded transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <h5 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                          {p.title}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span className="truncate max-w-[200px] sm:max-w-[320px]">
                            {p.domain || "General Domain"}
                          </span>
                          <span>•</span>
                          <span>{formatDate(p.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-surface-white text-[#2d5a2d] border-border shadow-xs">
                          {p.statusText || "Active"}
                        </span>
                        <FiExternalLink className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-text-secondary">
                  <SiTask className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No projects found</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-3 border-t border-border bg-bg-secondary/40 flex items-center justify-between text-xs text-text-secondary">
            <span>Showing top {recentProjects.length} of {totalProjects} projects</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <FiCheckCircle size={13} />
              Database Synchronized
            </span>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed (5 cols) */}
        <div className="xl:col-span-5 bg-surface-white rounded-md border border-border shadow-none overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-bg-secondary flex items-center justify-center border border-border text-accent">
                  <FiActivity size={16} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-text-primary tracking-tight">
                    Recent Activity
                  </h4>
                  <p className="text-[12px] text-text-secondary">
                    Live system audit events & user actions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/audit-logs")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline uppercase tracking-wider"
              >
                All Logs
                <FiArrowRight size={13} />
              </button>
            </div>

            <div className="p-6">
              {isAuditLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-14 rounded-md bg-slate-50 animate-pulse border border-border"
                    />
                  ))}
                </div>
              ) : recentLogs.length > 0 ? (
                <div className="space-y-4">
                  {recentLogs.map((log) => {
                    const badgeClass =
                      actionToneClasses[log.actionType] ||
                      "bg-slate-50 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={log.id}
                        onClick={() => navigate("/admin/audit-logs")}
                        className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-accent/40 hover:bg-bg-secondary/20 transition-all cursor-pointer group"
                      >
                        <span
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border shrink-0 mt-0.5",
                            badgeClass,
                          )}
                        >
                          {log.actionType}
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                            {log.action}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-text-secondary">
                            <span className="truncate max-w-[160px] font-medium">
                              {log.user}
                            </span>
                            <span className="shrink-0">{formatDate(log.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-text-secondary">
                  <FiFileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-3 border-t border-border bg-bg-secondary/40 flex items-center justify-between text-xs text-text-secondary">
            <span>Tracking security & compliance</span>
            <span className="text-accent font-bold hover:underline cursor-pointer" onClick={() => navigate("/admin/audit-logs")}>
              Export Audit Trail →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
