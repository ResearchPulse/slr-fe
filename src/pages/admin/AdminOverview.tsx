import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiActivity,
  FiAlertCircle,
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
import Button from "../../components/ui/Button";

const actionDotClasses: Record<AuditLogEntry["actionType"], string> = {
  create: "bg-success",
  update: "bg-accent",
  delete: "bg-error",
  export: "bg-text-secondary",
  access: "bg-primary",
  review: "bg-warning",
  system: "bg-primary",
};

const statusClasses: Record<Project["statusText"], string> = {
  Draft: "bg-bg-secondary text-text-secondary ring-border",
  Active: "bg-primary-light text-primary ring-primary/20",
  Completed: "bg-success/10 text-success ring-success/20",
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

const getQueryErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : typeof error === "string" ? error : undefined;

const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
  } = useUsers({
    pageNumber: 1,
    pageSize: 5,
  });
  const {
    projects,
    data: projectsData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects({ pageNumber: 1, pageSize: 5 });
  const {
    data: auditLogsResponse,
    isLoading: isAuditLoading,
    isError: isAuditError,
    error: auditError,
    refetch: refetchAuditLogs,
  } = useAdminAuditLogs({ pageNumber: 1, pageSize: 5 });
  const {
    data: sourcesResponse,
    isLoading: isSourcesLoading,
    isError: isSourcesError,
    error: sourcesError,
  } = useQuery({
    queryKey: ["master-sources", "overview"],
    queryFn: () => masterSourceService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const usersUnavailable = isUsersError && !usersData;
  const projectsUnavailable = isProjectsError && !projectsData;
  const auditUnavailable = isAuditError && !auditLogsResponse;
  const sourcesUnavailable = isSourcesError && !sourcesResponse;
  const totalUsers = usersData?.totalCount ?? 0;
  const totalProjects = projectsData?.totalCount ?? 0;
  const totalAuditLogs = auditLogsResponse?.data?.totalCount ?? 0;
  const totalSources = sourcesResponse?.data?.length ?? 0;
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
      error: usersUnavailable,
      errorMessage: getQueryErrorMessage(usersError),
      path: "/admin/users",
      icon: FiUsers,
      iconClass: "text-primary bg-primary/10",
    },
    {
      label: "SLR projects",
      detail: "All registered projects",
      value: totalProjects,
      loading: isProjectsLoading,
      error: projectsUnavailable,
      errorMessage: getQueryErrorMessage(projectsError),
      path: "/admin/projects",
      icon: FiFolder,
      iconClass: "text-primary bg-primary/10",
    },
    {
      label: "Audit events",
      detail: "Recorded system events",
      value: totalAuditLogs,
      loading: isAuditLoading,
      error: auditUnavailable,
      errorMessage: getQueryErrorMessage(auditError),
      path: "/admin/audit-logs",
      icon: FiFileText,
      iconClass: "text-warning bg-warning/10",
    },
    {
      label: "Search sources",
      detail: "Configured sources",
      value: totalSources,
      loading: isSourcesLoading,
      error: sourcesUnavailable,
      errorMessage: getQueryErrorMessage(sourcesError),
      path: "/admin/master-sources",
      icon: FiDatabase,
      iconClass: "text-success bg-success/10",
    },
  ];

  const displayName = user?.name?.trim().split(/\s+/)[0] || "Admin";

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-2">
      <section className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-text-primary sm:text-[34px]">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-text-secondary">
            A clear view of SLRS accounts, literature review projects, and recent system activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            onClick={() => navigate("/admin/projects")}
            size="md"
            variant="primary"
            className="min-h-11 px-4"
          >
            <FiFolder size={15} />
            Manage projects
          </Button>
          <Button
            type="button"
            onClick={() => navigate("/admin/audit-logs")}
            size="md"
            variant="secondary"
            className="min-h-11 px-4"
          >
            <FiActivity size={15} className="text-accent" />
            View audit logs
          </Button>
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
              className="group rounded-xl border border-border bg-white p-5 text-left transition-[border-color,background-color] duration-150 motion-reduce:transition-none hover:border-primary/50 hover:bg-primary-light/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">{stat.label}</p>
                  <p className="mt-1.5 text-[12px] text-text-muted">{stat.detail}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-5 text-[31px] font-semibold leading-none tracking-[-0.04em] text-text-primary">
                {stat.loading ? (
                  <span className="inline-block h-8 w-12 rounded bg-bg-secondary align-middle motion-safe:animate-pulse motion-reduce:animate-none" />
                ) : stat.error ? (
                  <span className="text-base font-medium tracking-normal text-text-secondary" title={stat.errorMessage || "Could not load this count"}>Unavailable</span>
                ) : (
                  stat.value.toLocaleString()
                )}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,1fr)]">
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(23,50,71,0.025)]">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-accent"><FiFolder size={17} /></span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-text-primary">Recent SLR projects</h2>
                <p className="mt-0.5 text-[12px] text-text-muted">Latest projects registered in SLRS</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate("/admin/projects")} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[11px] font-bold text-accent transition-colors motion-reduce:transition-none hover:bg-bg-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              View all <FiArrowRight size={14} />
            </button>
          </div>

          <div className="px-5 sm:px-6">
            {isProjectsLoading ? (
              <div className="space-y-3 py-5" aria-label="Loading projects">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[62px] rounded-lg bg-bg-primary motion-safe:animate-pulse motion-reduce:animate-none" />)}
              </div>
            ) : projectsUnavailable ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center" role="alert">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-error/5 text-error"><FiAlertCircle size={19} /></span>
                <p className="mt-3 text-[13px] font-semibold text-text-primary">Couldn’t load projects</p>
                <p className="mt-1 max-w-sm text-[12px] leading-5 text-text-secondary">{projectsError || "Project data is temporarily unavailable."}</p>
                <Button variant="secondary" size="md" className="mt-4 min-h-11" onClick={() => void refetchProjects()}>Try again</Button>
              </div>
            ) : recentProjects.length ? (
              <div className="divide-y divide-border">
                {recentProjects.map((project) => (
                  <button key={project.id} type="button" onClick={() => navigate("/admin/projects")} className="group flex w-full items-center justify-between gap-3 py-4 text-left transition-colors motion-reduce:transition-none hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-text-secondary transition-colors group-hover:text-accent">{project.title}</span>
                      <span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-text-muted">
                        <span className="truncate">{project.domain || "Unspecified domain"}</span>
                        <span aria-hidden="true" className="shrink-0">·</span>
                        <span className="shrink-0">{formatDate(project.modifiedAt || project.createdAt)}</span>
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusClasses[project.statusText as Project["statusText"]] || "bg-bg-secondary text-text-secondary ring-border"}`}>
                      {project.statusText || "Unknown"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-primary text-text-muted"><FiFolder size={19} /></span>
                <p className="mt-3 text-[13px] font-semibold text-text-secondary">No projects yet</p>
                <p className="mt-1 text-[12px] text-text-muted">Projects will appear here when they are registered.</p>
              </div>
            )}
          </div>
          {!isProjectsLoading && recentProjects.length > 0 && (
            <div className="border-t border-border px-5 py-3 text-[11px] text-text-muted sm:px-6">
              Showing {recentProjects.length} of {totalProjects.toLocaleString()} projects
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(23,50,71,0.025)]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-accent"><FiActivity size={17} /></span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-text-primary">Recent activity</h2>
                <p className="mt-0.5 text-[12px] text-text-muted">Latest recorded audit events</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate("/admin/audit-logs")} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[11px] font-bold text-accent transition-colors motion-reduce:transition-none hover:bg-bg-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              All logs <FiArrowRight size={14} />
            </button>
          </div>

          <div className="px-5 sm:px-6">
            {isAuditLoading ? (
              <div className="space-y-4 py-5" aria-label="Loading activity">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[58px] rounded-lg bg-bg-primary motion-safe:animate-pulse motion-reduce:animate-none" />)}
              </div>
            ) : auditUnavailable ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center" role="alert">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-error/5 text-error"><FiAlertCircle size={19} /></span>
                <p className="mt-3 text-[13px] font-semibold text-text-primary">Couldn’t load activity</p>
                <p className="mt-1 max-w-sm text-[12px] leading-5 text-text-secondary">{auditError || "Audit activity is temporarily unavailable."}</p>
                <Button variant="secondary" size="md" className="mt-4 min-h-11" onClick={() => void refetchAuditLogs()}>Try again</Button>
              </div>
            ) : recentLogs.length ? (
              <div className="divide-y divide-border">
                {recentLogs.map((log) => (
                  <button key={log.id} type="button" onClick={() => navigate("/admin/audit-logs")} className="flex w-full gap-3.5 py-4 text-left transition-colors motion-reduce:transition-none hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40">
                    <span className="relative flex w-3 shrink-0 justify-center pt-1.5">
                      <span className={`relative z-10 h-2 w-2 rounded-full ring-4 ring-white ${actionDotClasses[log.actionType]}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-2 text-[12px] font-semibold leading-[1.55] text-text-secondary">{log.action}</span>
                      <span className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-text-muted">
                        <span className="truncate">{log.user || "Unknown user"}</span>
                        <time className="shrink-0" dateTime={log.timestamp}>{formatActivityTime(log.timestamp)}</time>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-primary text-text-muted"><FiFileText size={19} /></span>
                <p className="mt-3 text-[13px] font-semibold text-text-secondary">No activity recorded</p>
                <p className="mt-1 text-[12px] text-text-muted">New audit events will show up here.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
