import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiFolder, FiUsers } from "react-icons/fi";
import { cn } from "../../utils/cn";
import { useUsers } from "../../hooks/useUsers";
import { useProjects } from "../../hooks/useProjects";

const AdminOverview: React.FC = () => {
  const {
    data: usersData,
    users,
    isLoading: isUsersLoading,
    isError: isUsersError,
  } = useUsers({ pageNumber: 1, pageSize: 5 });
  const {
    data: projectsData,
    projects,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useProjects({ pageNumber: 1, pageSize: 5 });

  const stats = [
    {
      label: "Total Users",
      value: isUsersLoading ? "…" : isUsersError ? "—" : (usersData?.totalCount ?? 0).toLocaleString(),
      badge: "Users",
    },
    {
      label: "Total Projects",
      value: isProjectsLoading ? "…" : isProjectsError ? "—" : (projectsData?.totalCount ?? 0).toLocaleString(),
      badge: "Projects",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2 mb-8">
        <h3 className="font-cormorant text-3xl sm:text-4xl font-normal text-text-primary tracking-tight">
          Welcome back, Admin
        </h3>
        <p className="text-text-secondary text-sm">
          Here's what's happening with your system today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-white p-6 rounded-[4px] border border-border"
          >
            <p className="text-[11px] font-medium text-text-secondary uppercase tracking-[0.2em] mb-4">
              {stat.label}
            </p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-normal text-text-primary font-cormorant">
                {stat.value}
              </span>
              <span className="text-xs font-bold px-2 py-1 rounded-[4px] bg-emerald-50 text-emerald-600">
                {stat.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-surface-white rounded-md border border-border overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiFolder className="text-accent" />
              <h4 className="font-semibold text-text-primary">Projects</h4>
            </div>
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
            >
              View all <FiArrowRight />
            </Link>
          </div>

          {isProjectsLoading ? (
            <div className="p-6 text-sm text-text-secondary">Loading projects…</div>
          ) : isProjectsError ? (
            <div className="p-6 text-sm text-red-600">Could not load projects.</div>
          ) : projects.length === 0 ? (
            <div className="p-6 text-sm text-text-secondary">No projects yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((project) => (
                <li key={project.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-text-primary truncate">
                      {project.title || "Untitled project"}
                    </p>
                    <p className="text-xs text-text-secondary mt-1 truncate">
                      {project.code || project.domain || "Systematic literature review"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                      project.statusText === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : project.statusText === "Completed"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {project.statusText || "Draft"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface-white rounded-md border border-border overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiUsers className="text-accent" />
              <h4 className="font-semibold text-text-primary">User Accounts</h4>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
            >
              View all <FiArrowRight />
            </Link>
          </div>

          {isUsersLoading ? (
            <div className="p-6 text-sm text-text-secondary">Loading users…</div>
          ) : isUsersError ? (
            <div className="p-6 text-sm text-red-600">Could not load users.</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm text-text-secondary">No users yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((user) => (
                <li key={user.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-bg-secondary text-accent flex items-center justify-center text-sm font-semibold">
                      {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-text-primary truncate">
                        {user.fullName || user.username || "Unnamed user"}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                      user.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminOverview;
