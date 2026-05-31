import {
  FiUser,
  FiShield,
  FiCheck,
  FiAlertTriangle,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import type { ResolvedLeader } from "../../../../utils/projectUtils";
import Tooltip from "../../../ui/Tooltip";

interface User {
  id: string;
  fullName: string;
  userName: string;
  email: string;
}

interface RoleAssignmentPanelProps {
  selectedUser: User | null | undefined;
  previewRole: "Leader" | "Member";
  canAssignLeaderRole: boolean;
  isLeaderResolved: boolean;
  currentLeader: ResolvedLeader | null;
  onRoleChange: (role: "Leader" | "Member") => void;
  onRemoveFromWaitlist: (userId: string) => void;
  getInitials: (name: string) => string;
  hideLeaderRole?: boolean;
  disableMemberRole?: boolean;
}

export default function RoleAssignmentPanel({
  selectedUser,
  previewRole,
  canAssignLeaderRole,
  isLeaderResolved,
  currentLeader,
  onRoleChange,
  onRemoveFromWaitlist,
  getInitials,
  hideLeaderRole = false,
  disableMemberRole = false,
}: RoleAssignmentPanelProps) {
  const isAdded = !!selectedUser;
  return (
    <div className="h-full">
      {selectedUser ? (
        <div className="bg-surface-white border border-slate-100 rounded-md p-5 space-y-5 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-md bg-accent text-white flex items-center justify-center text-xs font-black shrink-0">
                  {getInitials(selectedUser.fullName)}
                </div>
                <div className="min-w-0">
                  <h6 className="text-xs font-black text-slate-800 tracking-tight leading-none mb-1 truncate">
                    {selectedUser.fullName}
                  </h6>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                    <span className="italic text-accent/80">@{selectedUser.userName}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                    <span className="font-medium truncate">{selectedUser.email}</span>
                  </div>
                </div>
              </div>
              <Tooltip
                content={isAdded ? "Remove from waitlist" : "Dismiss preview"}
                position="left"
              >
                <button
                  onClick={() => onRemoveFromWaitlist(selectedUser.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-[4px] transition-all"
                >
                  <FiTrash2 size={14} />
                </button>
              </Tooltip>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Assign Permission Tier
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {!disableMemberRole && (
                  <button
                    onClick={() => onRoleChange("Member")}
                    className={cn(
                      "group flex items-center justify-between p-3.5 rounded-md border transition-all text-left",
                      previewRole === "Member"
                        ? "bg-indigo-50/50 border-indigo-200"
                        : "bg-surface-white border-slate-100 hover:border-slate-200",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-1.5 rounded-[4px] transition-colors",
                          previewRole === "Member"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-50 text-slate-400",
                        )}
                      >
                        <FiUser size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 tracking-tight leading-none mb-0.5">
                          Standard Member
                        </p>
                        <p className="text-[9px] font-medium text-slate-400">
                          Read & contribute access
                        </p>
                      </div>
                    </div>
                    {previewRole === "Member" && (
                      <FiCheck className="text-indigo-600" size={16} />
                    )}
                  </button>
                )}

                {!hideLeaderRole && (
                  <button
                    disabled={!canAssignLeaderRole && previewRole !== "Leader"}
                    onClick={() => onRoleChange("Leader")}
                    className={cn(
                      "group flex items-center justify-between p-3.5 rounded-md border transition-all text-left relative overflow-hidden",
                      previewRole === "Leader"
                        ? "bg-indigo-50/50 border-indigo-200"
                        : "bg-surface-white border-slate-100 hover:border-slate-200",
                      !canAssignLeaderRole &&
                        previewRole !== "Leader" &&
                        "opacity-60 cursor-not-allowed bg-slate-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-1.5 rounded-[4px] transition-colors",
                          previewRole === "Leader"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-50 text-slate-400",
                        )}
                      >
                        <FiShield size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 tracking-tight leading-none mb-0.5">
                          Lead Researcher
                        </p>
                        <p className="text-[9px] font-medium text-slate-400">
                          {!isLeaderResolved
                            ? "Checking leadership..."
                            : currentLeader?.type === "Accepted"
                              ? "Project already has a Leader"
                              : currentLeader?.type === "Pending"
                                ? "Leader invitation is pending"
                                : "Full workspace management"}
                        </p>
                      </div>
                    </div>
                    {previewRole === "Leader" ? (
                      <FiCheck className="text-indigo-600" size={16} />
                    ) : (
                      !canAssignLeaderRole &&
                      isLeaderResolved && (
                        <Tooltip
                          content={
                            currentLeader?.type === "Accepted"
                              ? "This project already has a Leader"
                              : "A Leader invitation is currently pending acceptance."
                          }
                        >
                          <FiAlertTriangle
                            className="text-amber-500"
                            size={12}
                          />
                        </Tooltip>
                      )
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50/40 border border-emerald-100/50 rounded-md text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            <FiCheck size={12} />
            <span>Đã thêm vào danh sách chờ</span>
          </div>

          <p className="text-[9px] text-slate-400 font-bold leading-relaxed italic text-center">
            Lời mời sẽ được gửi đi khi bạn nhấn nút gửi ở góc dưới.
          </p>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-100 rounded-md p-10 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center text-slate-300">
            <FiUsers size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Đang chờ lựa chọn
            </p>
            <p className="text-xs font-bold text-slate-300 italic">
              Chọn một tài khoản để thiết lập vai trò
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
