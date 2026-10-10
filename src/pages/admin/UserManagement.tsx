import React, { useState, useMemo } from "react";
import {
  FiSearch,
  FiUserPlus,
  FiMail,
  FiUser,
  FiShield,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiActivity,
} from "react-icons/fi";
import { cn } from "../../utils/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import Tooltip from "../../components/ui/Tooltip";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorBanner from "./components/ErrorBanner";
import ActionButton from "../../components/admin/slr-projects/ActionButton";
import {
  useUsers,
  useToggleUserStatusMutation,
  useExportUsersMutation,
} from "../../hooks/useUsers";
import AddUserModal from "../../components/admin/user-management/AddUserModal";
import UpdateUserModal from "../../components/admin/user-management/UpdateUserModal";
import ChangePreviewModal from "../../components/admin/user-management/ChangePreviewModal";
import StatusConfirmModal from "../../components/admin/user-management/StatusConfirmModal";
import type { User } from "../../types/user";
import { toastSuccess, toastError } from "../../utils/toast";

// Helper Components
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  // Standardize role to title case for style matching
  const displayRole =
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

  const styles: Record<string, string> = {
    Admin: "bg-sky-50 text-sky-700 ring-sky-200",
    Teacher: "bg-slate-50 text-slate-700 ring-slate-200",
    Student: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };

  const icons: Record<string, React.ReactNode> = {
    Admin: <FiShield size={10} />,
    Teacher: <FiUser size={10} />,
    Student: <FiActivity size={10} />,
  };

  const style =
    styles[displayRole] ||
    "bg-slate-50 text-slate-700 border-slate-100 ring-slate-500/10";
  const icon = icons[displayRole] || <FiUser size={10} />;

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset",
        style,
      )}
    >
      {icon}
      {displayRole}
    </span>
  );
};

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset",
        isActive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-50 text-slate-600 ring-slate-200",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isActive
            ? "bg-emerald-500"
            : "bg-slate-400",
        )}
      />
      {isActive ? "Active" : "Deactivated"}
    </span>
  );
};

const UserManagement: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Update user states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [oldUser, setOldUser] = useState<User | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { toggleStatus, isLoading: isStatusLoading } =
    useToggleUserStatusMutation();
  const { exportUsers, isLoading: isExporting } = useExportUsersMutation();

  const handleExportClick = async () => {
    try {
      await exportUsers(undefined);
      toastSuccess(
        "Export Successful",
        "Your user account data has been downloaded.",
      );
    } catch {
      toastError("Export Failed", "Could not generate user account file.");
    }
  };

  const handleEditClick = (user: User) => {
    setOldUser(user);
    setSelectedUser(user);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = (updatedUser: User) => {
    setSelectedUser(updatedUser);
    setIsPreviewModalOpen(true);
  };

  const handleStatusToggleClick = (user: User) => {
    setSelectedUser(user);
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!selectedUser) return;

    try {
      const result = await toggleStatus(selectedUser.id);
      if (result.isSuccess) {
        toastSuccess(
          selectedUser.isActive ? "Account Deactivated" : "Account Activated",
          `User ${selectedUser.fullName} status has been updated.`,
        );
        setIsStatusModalOpen(false);
      } else {
        toastError(
          "Action Failed",
          result.message || "Could not update user status.",
        );
      }
    } catch {
      toastError("System Error", "An unexpected error occurred.");
    }
  };

  // Params for hook
  const params = useMemo(
    () => ({
      search: searchTerm || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      pageNumber,
      pageSize,
    }),
    [searchTerm, statusFilter, pageNumber, pageSize],
  );

  // Data Hook
  const {
    users,
    data: paginatedData,
    isLoading,
    isError,
    error,
  } = useUsers(params);

  // Derived values
  const totalCount = paginatedData?.totalCount || 0;
  const totalPages = paginatedData?.totalPages || 0;
  const itemsStart = (pageNumber - 1) * pageSize + 1;
  const itemsEnd = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-2">
      {/* 💎 Page Header 💎 */}
      <div className="flex flex-col gap-5 border-b border-border pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Account administration</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-text-primary sm:text-[32px]">
            System Users
          </h1>
          <p className="mt-1.5 text-[14px] leading-6 text-text-secondary">
            Manage user accounts, roles, and system access permissions.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[590px]">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap xl:justify-end">
          <div className="group relative min-w-0 flex-1 sm:min-w-[230px]">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" />
            <input
              type="text"
              placeholder="Search by identity or email..."
              className="h-11 w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-[13px] text-text-secondary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/[0.08]"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1); // Reset to page 1 on search
              }}
            />
          </div>

          <Tooltip content="Filter by user status" position="bottom">
            <Select
              className="w-full sm:w-[170px]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageNumber(1); // Reset to page 1 on filter
              }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active Only" },
                { value: "inactive", label: "Deactivated" },
              ]}
            />
          </Tooltip>

          <Tooltip content="Download User File (XLSX)" position="bottom">
            <Button
              variant="secondary"
              className="h-11 gap-2"
              onClick={handleExportClick}
              disabled={isExporting}
            >
              {isExporting ? <LoadingSpinner size="sm" /> : <FiDownload size={16} />}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </Tooltip>
          </div>
          <Tooltip content="Create a new system user account" position="left">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="h-11 w-full gap-2 sm:ml-auto sm:w-fit"
            >
              <FiUserPlus size={16} />
              Add user
            </Button>
          </Tooltip>
        </div>
      </div>

      {isError && (
        <ErrorBanner
          message={error}
          fallback="An error occurred while fetching users."
        />
      )}

      {/* 📦 Master Table Container (Desktop) 📦 */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(23,50,71,0.025)] lg:block">
        <div className="overflow-x-auto">
          <Table className="relative">
            <TableHeader className="sticky top-0 z-10 border-b border-border bg-bg-primary">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  Personal Information
                </TableHead>
                <TableHead className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  Username
                </TableHead>
                <TableHead className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  Access Role
                </TableHead>
                <TableHead className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  Account Status
                </TableHead>
                <TableHead className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  Administrative Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(pageSize)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={5} className="px-5 py-4">
                        <div className="h-12 w-full rounded-lg bg-bg-primary" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : users.length > 0 ? (
                users.map((user: User) => (
                  <TableRow
                     key={user.id}
                     className="group transition-colors hover:bg-bg-primary"
                  >
                    {/* User Profile Cell */}
                    <TableCell className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary-light text-[13px] font-semibold text-accent">
                            {user.fullName.charAt(0)}
                          </div>
                          {user.isActive && (
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="truncate text-[13px] font-semibold tracking-tight text-text-secondary transition-colors group-hover:text-accent">
                            {user.fullName}
                          </div>
                          <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-text-muted">
                            <FiMail size={12} className="shrink-0 text-text-muted" />
                            <span className="truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Username/Identity Cell */}
                    <TableCell className="px-5 py-4 text-center">
                      <div className="inline-flex max-w-full items-center rounded-md border border-border bg-bg-primary px-2.5 py-1.5">
                        <span className="truncate text-[11px] font-semibold text-text-secondary">
                          @{user.username}
                        </span>
                      </div>
                    </TableCell>

                    {/* Role Cell */}
                    <TableCell className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </TableCell>

                    {/* Status Cell */}
                    <TableCell className="px-5 py-4">
                      <div>
                        <StatusBadge isActive={user.isActive} />
                      </div>
                    </TableCell>

                    {/* Actions Cell */}
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={FiEdit3}
                          label="Modify Profile"
                          className="hover:bg-primary-light"
                          onClick={() => handleEditClick(user)}
                        />

                        <div className="mx-1 h-4 w-px bg-border" />

                        {user.isActive ? (
                          <ActionButton
                            icon={FiXCircle}
                            label="Deactivate Access"
                            variant="destructive"
                            className="hover:bg-rose-50"
                            onClick={() => handleStatusToggleClick(user)}
                          />
                        ) : (
                          <ActionButton
                            icon={FiCheckCircle}
                            label="Reactivate Access"
                            className="text-success hover:bg-bg-secondary hover:text-accent"
                            onClick={() => handleStatusToggleClick(user)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400 font-medium"
                  >
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 📉 Table Footer (Desktop) 📉 */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-bg-primary px-5 py-4 md:flex-row sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                Total Registry
              </p>
              <p className="text-[11px] font-medium text-text-secondary">
                Showing {itemsStart}–{itemsEnd} of {totalCount} Accounts
              </p>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted">
                Per page:
              </span>
              <Select
                className="w-[76px] [&>button]:h-9 [&>button]:rounded-lg [&>button]:px-2.5 [&>button]:text-[11px]"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                options={[
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary transition hover:text-accent disabled:pointer-events-none disabled:opacity-40"
              disabled={pageNumber === 1 || isLoading}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            >
              <FiChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-1.5 px-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageToShow = i + 1;
                if (totalPages > 5 && pageNumber > 3) {
                  pageToShow = Math.min(pageNumber - 2 + i, totalPages - 4 + i);
                }
                return (
                  <button
                    key={pageToShow}
                    type="button"
                    onClick={() => setPageNumber(pageToShow)}
                    className={cn(
                      "h-9 min-w-9 rounded-xl border px-2 text-[11px] font-semibold transition-colors",
                      pageNumber === pageToShow
                        ? "border-accent bg-primary text-white"
                        : "border-border bg-white text-text-secondary hover:bg-primary-light",
                    )}
                  >
                    {pageToShow}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary transition hover:text-accent disabled:pointer-events-none disabled:opacity-40"
              disabled={
                pageNumber === totalPages || totalPages === 0 || isLoading
              }
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 📱 Mobile User Cards (lg hidden) 📱 */}
      <div className="space-y-3 px-1 lg:hidden">
        {isLoading ? (
          Array(pageSize)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border bg-white p-4"
              >
                <div className="h-20 w-full rounded-lg bg-bg-primary" />
              </div>
            ))
        ) : users.length > 0 ? (
          users.map((user: User) => (
            <div
              key={user.id}
              className="space-y-4 rounded-xl border border-border bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-primary-light text-[13px] font-semibold text-accent">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="truncate text-[13px] font-semibold text-text-secondary">
                      {user.fullName}
                    </h4>
                    <p className="truncate text-[10px] font-medium text-text-muted">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <RoleBadge role={user.role} />
              </div>

              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex min-w-0 items-center gap-2 text-[12px] text-text-secondary">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-text-muted">
                    <FiMail size={14} />
                  </div>
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge isActive={user.isActive} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditClick(user)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[11px] font-semibold text-accent transition hover:bg-primary-light"
                  >
                    <FiEdit3 size={16} />
                    Edit
                  </button>
                  {user.isActive ? (
                    <button
                      type="button"
                      onClick={() => handleStatusToggleClick(user)}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <FiXCircle size={16} />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusToggleClick(user)}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <FiCheckCircle size={16} />
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-border bg-white px-5 py-12 text-center text-[12px] text-text-muted">
            No users found. Try changing your search or status filter.
          </div>
        )}

        {/* Mobile Pagination Placeholder */}
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            type="button"
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-text-secondary disabled:opacity-40"
            disabled={pageNumber === 1 || isLoading}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            <FiChevronLeft size={20} />
          </button>
          <span className="text-[11px] font-medium text-text-secondary">
            Page {pageNumber} of {totalPages || 1}
          </span>
          <button
            type="button"
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-text-secondary disabled:opacity-40"
            disabled={
              pageNumber === totalPages || totalPages === 0 || isLoading
            }
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 🆕 Registration Modal 🆕 */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      {/* 📝 Update Profile Modal 📝 */}
      <UpdateUserModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        user={selectedUser}
        onSuccess={handleUpdateSuccess}
      />

      {/* ✨ Success Preview Modal ✨ */}
      <ChangePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        oldData={oldUser}
        newData={selectedUser}
      />

      {/* 🛡️ Status Toggle Confirmation 🛡️ */}
      <StatusConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        user={selectedUser}
        onConfirm={handleConfirmStatusToggle}
        isLoading={isStatusLoading}
      />
    </div>
  );
};

export default UserManagement;
