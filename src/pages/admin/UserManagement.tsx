import React, { useState, useMemo } from "react";
import {
  FiSearch,
  FiUserPlus,
  FiMail,
  FiUser,
  FiShield,
  FiEdit3,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFilter,
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
    Admin: "bg-bg-secondary text-accent border-border shadow-sm",
    Teacher:
      "bg-surface-white text-text-primary border-border shadow-sm",
    Student:
      "bg-surface-white text-text-secondary border-border shadow-sm",
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
        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ring-1",
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
        "px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-2 w-fit",
        isActive
          ? "bg-surface-white text-success border-border shadow-sm"
          : "bg-surface-white text-text-secondary border-border opacity-80",
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isActive
            ? "bg-success shadow-[0_0_8px_rgba(22,163,74,0.5)] animate-pulse"
            : "bg-text-secondary",
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
    } catch (err) {
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
    } catch (err) {
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
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* 💎 Page Header 💎 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-serif font-bold text-text-primary tracking-tight">
            System Users
          </h3>
          <p className="text-text-secondary text-sm font-medium">
            Manage user accounts, roles, and system access permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search by identity or email..."
              className="pl-10 pr-4 py-2.5 bg-surface-white border border-border rounded-[4px] text-sm w-full sm:w-64 outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1); // Reset to page 1 on search
              }}
            />
          </div>

          <Tooltip content="Filter by user status" position="bottom">
            <Select
              className="w-44"
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
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-white border border-slate-200 text-slate-600 text-sm font-bold rounded-[4px] hover:bg-slate-50 transition-all active:scale-95 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportClick}
              disabled={isExporting}
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiDownload size={16} />
              )}
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex justify-end">
        <Tooltip content="Create a new system user account" position="left">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-surface-white text-sm font-bold rounded-[4px] hover:bg-primary-hover hover:shadow-sm transition-all active:scale-95 group"
          >
            <FiUserPlus
              size={20}
              className="group-hover:rotate-12 transition-transform"
            />
            Add New User
          </button>
        </Tooltip>
      </div>

      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-md text-rose-700 text-sm font-medium">
          {error || "An error occurred while fetching users."}
        </div>
      )}

      {/* 📦 Master Table Container (Desktop) 📦 */}
      <div className="hidden lg:block bg-surface-white rounded-md border border-slate-100 shadow-none overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent">
          <Table className="relative">
            <TableHeader className="bg-slate-50/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10 shadow-none">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Personal Information
                </TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">
                  Username
                </TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Access Role
                </TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Account Status
                </TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">
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
                      <TableCell colSpan={5} className="px-6 py-5">
                        <div className="h-14 bg-slate-50 rounded-md w-full" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : users.length > 0 ? (
                users.map((user: User) => (
                  <TableRow
                     key={user.id}
                     className="group hover:bg-bg-secondary/30 transition-all duration-300"
                  >
                    {/* User Profile Cell */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-5">
                        <div className="relative group/avatar">
                          <div className="w-14 h-14 rounded-[4px] bg-surface-white border border-border flex items-center justify-center text-accent font-serif font-bold text-xl shadow-sm group-hover:scale-105 transition-transform duration-500">
                            {user.fullName.charAt(0)}
                          </div>
                          {user.isActive && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-surface-white rounded-full shadow-sm" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="font-extrabold text-slate-900 tracking-tight group-hover:text-accent transition-colors text-base">
                            {user.fullName}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <FiMail size={13} className="text-slate-300" />
                            <span className="group-hover:text-slate-500 transition-colors uppercase tracking-tight">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Username/Identity Cell */}
                    <TableCell className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-surface-white border border-border rounded-[4px] group-hover:bg-bg-secondary group-hover:border-accent transition-all shadow-sm">
                        <span className="text-xs font-bold text-text-primary tracking-wider">
                          @{user.username}
                        </span>
                      </div>
                    </TableCell>

                    {/* Role Cell */}
                    <TableCell className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </TableCell>

                    {/* Status Cell */}
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1.5">
                        <StatusBadge isActive={user.isActive} />
                      </div>
                    </TableCell>

                    {/* Actions Cell */}
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 ">
                        <ActionButton
                          icon={FiEdit3}
                          label="Modify Profile"
                          className="hover:scale-110 active:scale-95"
                          onClick={() => handleEditClick(user)}
                        />

                        <div className="w-px h-6 bg-slate-100 mx-2 group-hover:bg-indigo-100 transition-colors" />

                        {user.isActive ? (
                          <ActionButton
                            icon={FiXCircle}
                            label="Deactivate Access"
                            variant="destructive"
                            className="hover:shadow-sm hover:text-error"
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
        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Total Registry
              </p>
              <p className="text-sm font-black text-slate-900 leading-none">
                Showing {itemsStart}–{itemsEnd} of {totalCount} Accounts
              </p>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                View Intensity:
              </span>
              <Select
                className="w-32"
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

          <div className="flex items-center gap-3">
            <button
              className="p-2.5 border border-slate-200 rounded-[4px] text-slate-400 hover:bg-surface-white hover:text-accent hover:border-indigo-100 hover:scale-105 transition-all disabled:opacity-30 shadow-none cursor-pointer"
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
                    onClick={() => setPageNumber(pageToShow)}
                    className={cn(
                      "w-10 h-10 text-xs font-bold rounded-[4px] transition-all duration-300 border",
                      pageNumber === pageToShow
                        ? "bg-accent text-surface-white shadow-sm border-accent scale-105"
                        : "bg-surface-white text-text-primary hover:bg-bg-secondary border-border shadow-sm",
                    )}
                  >
                    {pageToShow}
                  </button>
                );
              })}
            </div>

            <button
              className="p-2.5 border border-slate-200 rounded-[4px] bg-surface-white text-slate-600 hover:bg-slate-50 hover:text-accent hover:border-indigo-100 hover:scale-105 transition-all shadow-none cursor-pointer"
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
      <div className="lg:hidden space-y-4 px-2 -mx-2 pr-4">
        {isLoading ? (
          Array(pageSize)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-surface-white p-6 rounded-md border border-slate-100 animate-pulse"
              >
                <div className="h-20 bg-slate-50 rounded-md w-full" />
              </div>
            ))
        ) : users.length > 0 ? (
          users.map((user: User) => (
            <div
              key={user.id}
              className="bg-surface-white p-6 rounded-md border border-slate-100 shadow-none space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-none shadow-indigo-100">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 tracking-tight">
                      {user.fullName}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <RoleBadge role={user.role} />
              </div>

              <div className="space-y-3 pb-2">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-[4px] bg-slate-50 flex items-center justify-center text-slate-400">
                    <FiMail size={14} />
                  </div>
                  <span className="font-medium truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge isActive={user.isActive} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="p-3 bg-bg-secondary text-accent rounded-[4px] transition-all active:scale-90 font-bold text-xs flex items-center gap-2"
                  >
                    <FiEdit3 size={16} />
                    Edit
                  </button>
                  {user.isActive ? (
                    <button
                      onClick={() => handleStatusToggleClick(user)}
                      className="p-3 bg-rose-50 text-rose-500 rounded-[4px] transition-all active:scale-90 font-bold text-xs flex items-center gap-2"
                    >
                      <FiXCircle size={16} />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusToggleClick(user)}
                      className="p-3 bg-emerald-50 text-emerald-500 rounded-[4px] transition-all active:scale-90 font-bold text-xs flex items-center gap-2"
                    >
                      <FiCheckCircle size={16} />
                      Activate
                    </button>
                  )}
                </div>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-[4px] transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-90">
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-surface-white p-10 rounded-md border border-slate-100 text-center text-slate-400 font-medium">
            No users found.
          </div>
        )}

        {/* Mobile Pagination Placeholder */}
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-md text-slate-400 bg-surface-white shadow-none disabled:opacity-30"
            disabled={pageNumber === 1 || isLoading}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            <FiChevronLeft size={20} />
          </button>
          <span className="text-sm font-black text-slate-900">
            Page {pageNumber} of {totalPages || 1}
          </span>
          <button
            className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-md text-slate-600 bg-surface-white shadow-none disabled:opacity-30"
            disabled={
              pageNumber === totalPages || totalPages === 0 || isLoading
            }
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[
          {
            icon: <FiShield />,
            title: "Secure Access",
            desc: "All user data is encrypted and follows strict GDPR compliance for university standards.",
          },
          {
            icon: <FiActivity />,
            title: "Activity Monitoring",
            desc: "System track last login and basic session metrics to identify stale accounts.",
          },
          {
            icon: <FiFilter />,
            title: "Filtered Batching",
            desc: "Export and search tools support high-speed local processing for large datasets.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="flex gap-4 p-5 bg-slate-50/50 rounded-md border border-slate-100/50 group hover:bg-surface-white hover:shadow-none transition-all duration-500"
          >
            <div className="w-10 h-10 shrink-0 bg-surface-white border border-slate-100 rounded-[4px] flex items-center justify-center text-accent shadow-none group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {item.title}
              </h5>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
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
