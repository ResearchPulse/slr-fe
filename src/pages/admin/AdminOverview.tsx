import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiActivity,
  FiArrowRight,
  FiDatabase,
  FiFileText,
  FiFolder,
  FiUsers,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { useUsers } from "../../hooks/useUsers";
import { useProjects } from "../../hooks/useProjects";
import { useAdminAuditLogs } from "../../hooks/useAuditLogs";
import { masterSourceService } from "../../services/masterSourceService";
import type { RootState } from "../../redux/store";
import type { AuditLogEntry } from "../../types/auditLog";
import type { Project } from "../../types/project";

const actionDotClasses: Record<AuditLogEntry["actionType"], string> = {
  create: "bg-emerald-500",
  update: "bg-blue-500",
  delete: "bg-rose-500",
  export: "bg-slate-500",
  access: "bg-violet-500",
  review: "bg-amber-500",
  system: "bg-sky-500",
};

const statusClasses: Record<Project["statusText"], string> = {
  Draft: "bg-slate-50 text-slate-600 ring-slate-200",
  Active: "bg-sky-50 text-sky-700 ring-sky-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const formatDate = (value?: string) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatActivityTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};

const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: usersData, isLoading: isUsersLoading } = useUsers({
    pageNumber: 1,
    pageSize: 5,
  });
  const {
    projects,
    data: projectsData,
    isLoading: isProjectsLoading,
  } = useProjects({ pageNumber: 1, pageSize: 5 });
  const { data: auditLogsResponse, isLoading: isAuditLoading } =
    useAdminAuditLogs({ pageNumber: 1, pageSize: 5 });
  const { data: sourcesResponse, isLoading: isSourcesLoading } = useQuery({
    queryKey: ["master-sources", "overview"],
    queryFn: () => masterSourceService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const totalUsers = usersData?.totalCount || 0;
  const totalProjects = projectsData?.totalCount || 0;
  const totalAuditLogs = auditLogsResponse?.data?.totalCount || 0;
  const totalSources = sourcesResponse?.data?.length || 0;
  const recentProjects = useMemo(() => projects?.slice(0, 5) || [], [projects]);
  const recentLogs = useMemo(
    () => auditLogsResponse?.data?.items?.slice(0, 5) || [],
    [auditLogsResponse],
  );

  const stats = [
    {
      label: "Total users",
      detail: "Registered accounts",
      value: totalUsers,
      loading: isUsersLoading,
      path: "/admin/users",
      icon: FiUsers,
      iconClass: "text-sky-700 bg-sky-50",
    },
    {
      label: "SLR projects",
      detail: "All registered projects",
      value: totalProjects,
      loading: isProjectsLoading,
      path: "/admin/projects",
      icon: FiFolder,
      iconClass: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Audit events",
      detail: "Recorded system events",
      value: totalAuditLogs,
      loading: isAuditLoading,
      path: "/admin/audit-logs",
      icon: FiFileText,
      iconClass: "text-amber-700 bg-amber-50",
    },
    {
      label: "Search sources",
      detail: "Configured sources",
      value: totalSources,
      loading: isSourcesLoading,
      path: "/admin/master-sources",
      icon: FiDatabase,
      iconClass: "text-emerald-700 bg-emerald-50",
    },
  ];

  const displayName = user?.name?.trim().split(/\s+/)[0] || "Admin";

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-2">
      <section className="flex flex-col justify-between gap-5 border-b border-[#E3EAEE] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#087BC1]">
            Admin overview
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#173247] sm:text-[34px]">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#71838F]">
            A clear view of SLRS accounts, literature review projects, and recent system activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/admin/projects")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#087BC1] px-4 text-[12px] font-semibold text-white shadow-[0_2px_5px_rgba(8,123,193,0.16)] transition-colors hover:bg-[#066CA9]"
          >
            <FiFolder size={15} />
            Manage projects
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/audit-logs")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DCE6EC] bg-white px-4 text-[12px] font-semibold text-[#29485C] transition-colors hover:border-[#B9CEDB] hover:bg-[#F8FBFD]"
          >
            <FiActivity size={15} className="text-[#087BC1]" />
            View audit logs
          </button>
        </div>
      </section>

      <section aria-label="System totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              type="button"
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="group rounded-xl border border-[#E0E8ED] bg-white p-5 text-left shadow-[0_2px_8px_rgba(23,50,71,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[#C8DCE8] hover:shadow-[0_8px_22px_rgba(23,50,71,0.06)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#768995]">{stat.label}</p>
                  <p className="mt-1.5 text-[12px] text-[#98A6AE]">{stat.detail}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-[11px] ${stat.iconClass}`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-5 text-[31px] font-semibold leading-none tracking-[-0.04em] text-[#173247]">
                {stat.loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-[#EDF2F5] align-middle" /> : stat.value.toLocaleString()}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,1fr)]">
        <div className="overflow-hidden rounded-xl border border-[#E0E8ED] bg-white shadow-[0_2px_8px_rgba(23,50,71,0.025)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#E8EEF2] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EEF6FB] text-[#087BC1]"><FiFolder size={17} /></span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#173247]">Recent SLR projects</h2>
                <p className="mt-0.5 text-[12px] text-[#82929C]">Latest projects registered in SLRS</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate("/admin/projects")} className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-[#087BC1] hover:text-[#066CA9]">
              View all <FiArrowRight size={14} />
            </button>
          </div>

          <div className="px-5 sm:px-6">
            {isProjectsLoading ? (
              <div className="space-y-3 py-5" aria-label="Loading projects">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[62px] animate-pulse rounded-lg bg-[#F4F7F9]" />)}
              </div>
            ) : recentProjects.length ? (
              <div className="divide-y divide-[#E9EEF1]">
                {recentProjects.map((project) => (
                  <button key={project.id} type="button" onClick={() => navigate("/admin/projects")} className="group flex w-full items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-[#FAFCFD]">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-[#29485C] transition-colors group-hover:text-[#087BC1]">{project.title}</span>
                      <span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-[#82929C]">
                        <span className="truncate">{project.domain || "Unspecified domain"}</span>
                        <span aria-hidden="true" className="shrink-0">·</span>
                        <span className="shrink-0">{formatDate(project.modifiedAt || project.createdAt)}</span>
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusClasses[project.statusText as Project["statusText"]] || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                      {project.statusText || "Unknown"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1F6F9] text-[#82929C]"><FiFolder size={19} /></span>
                <p className="mt-3 text-[13px] font-semibold text-[#29485C]">No projects yet</p>
                <p className="mt-1 text-[12px] text-[#82929C]">Projects will appear here when they are registered.</p>
              </div>
            )}
          </div>
          {!isProjectsLoading && recentProjects.length > 0 && (
            <div className="border-t border-[#E9EEF1] px-5 py-3 text-[11px] text-[#82929C] sm:px-6">
              Showing {recentProjects.length} of {totalProjects.toLocaleString()} projects
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E0E8ED] bg-white shadow-[0_2px_8px_rgba(23,50,71,0.025)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E8EEF2] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EEF6FB] text-[#087BC1]"><FiActivity size={17} /></span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#173247]">Recent activity</h2>
                <p className="mt-0.5 text-[12px] text-[#82929C]">Latest recorded audit events</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate("/admin/audit-logs")} className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-[#087BC1] hover:text-[#066CA9]">
              All logs <FiArrowRight size={14} />
            </button>
          </div>

          <div className="px-5 sm:px-6">
            {isAuditLoading ? (
              <div className="space-y-4 py-5" aria-label="Loading activity">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[58px] animate-pulse rounded-lg bg-[#F4F7F9]" />)}
              </div>
            ) : recentLogs.length ? (
              <div className="divide-y divide-[#E9EEF1]">
                {recentLogs.map((log) => (
                  <button key={log.id} type="button" onClick={() => navigate("/admin/audit-logs")} className="flex w-full gap-3.5 py-4 text-left transition-colors hover:bg-[#FAFCFD]">
                    <span className="relative flex w-3 shrink-0 justify-center pt-1.5">
                      <span className={`relative z-10 h-2 w-2 rounded-full ring-4 ring-white ${actionDotClasses[log.actionType]}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-2 text-[12px] font-semibold leading-[1.55] text-[#29485C]">{log.action}</span>
                      <span className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[#8A9AA3]">
                        <span className="truncate">{log.user || "Unknown user"}</span>
                        <time className="shrink-0" dateTime={log.timestamp}>{formatActivityTime(log.timestamp)}</time>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1F6F9] text-[#82929C]"><FiFileText size={19} /></span>
                <p className="mt-3 text-[13px] font-semibold text-[#29485C]">No activity recorded</p>
                <p className="mt-1 text-[12px] text-[#82929C]">New audit events will show up here.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
