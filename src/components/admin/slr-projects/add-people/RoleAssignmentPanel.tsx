import { FiUser, FiShield, FiCheck } from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import Tooltip from "../../../ui/Tooltip";

interface User {
  id: string;
  fullName: string;
  userName: string;
  email: string;
}

interface RoleAssignmentPanelProps {
  selectedUser: User | null | undefined;
  previewRole: "Lecturer" | "Reviewer";
  canAssignLeaderRole?: boolean;
  isLeaderResolved?: boolean;
  currentLeader?: unknown;
  onRoleChange: (role: "Lecturer" | "Reviewer") => void;
  onRemoveFromWaitlist: (userId: string) => void;
  getInitials: (name: string) => string;
  hideLeaderRole?: boolean;
  disableMemberRole?: boolean;
}

export default function RoleAssignmentPanel({
  selectedUser,
  previewRole,
  onRoleChange,
  onRemoveFromWaitlist,
  getInitials,
}: RoleAssignmentPanelProps) {
  if (!selectedUser) {
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-slate-100 rounded-xl p-10 text-center">
        <p className="text-xs font-bold text-slate-400">Select a person to assign a project role.</p>
      </div>
    );
  }

  const choices = [
    { role: "Lecturer" as const, description: "Searches literature and imports research papers.", icon: FiUser },
    { role: "Reviewer" as const, description: "Reviews papers and submits accept or reject decisions.", icon: FiShield },
  ];

  return (
    <div className="bg-surface-white border border-slate-100 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center text-xs font-black shrink-0">
            {getInitials(selectedUser.fullName)}
          </div>
          <div className="min-w-0">
            <h6 className="text-xs font-black text-slate-800 truncate">{selectedUser.fullName}</h6>
            <p className="text-[10px] text-slate-400 truncate">{selectedUser.email}</p>
          </div>
        </div>
        <Tooltip content="Remove from invitation list" position="left">
          <button onClick={() => onRemoveFromWaitlist(selectedUser.id)} className="p-2 text-slate-400 hover:text-red-500">×</button>
        </Tooltip>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project role</p>
        {choices.map(({ role, description, icon: Icon }) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl border text-left",
              previewRole === role ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100",
            )}
          >
            <span className="flex items-center gap-3">
              <Icon size={16} />
              <span>
                <span className="block text-xs font-bold text-slate-700">{role}</span>
                <span className="block text-[10px] text-slate-400">{description}</span>
              </span>
            </span>
            {previewRole === role && <FiCheck className="text-indigo-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}
