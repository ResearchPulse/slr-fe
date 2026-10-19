import { FiShield } from "react-icons/fi";
import Tooltip from "../../../ui/Tooltip";

interface User {
  id: string;
  fullName: string;
  userName: string;
  email: string;
}

interface RoleAssignmentPanelProps {
  selectedUser: User | null | undefined;
  onRemoveFromWaitlist: (userId: string) => void;
  getInitials: (name: string) => string;
}

export default function RoleAssignmentPanel({
  selectedUser,
  onRemoveFromWaitlist,
  getInitials,
}: RoleAssignmentPanelProps) {
  if (!selectedUser) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-xs font-bold text-text-secondary">Select a person to assign a project role.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center text-xs font-black shrink-0">
            {getInitials(selectedUser.fullName)}
          </div>
          <div className="min-w-0">
            <h6 className="truncate text-xs font-black text-text-primary">{selectedUser.fullName}</h6>
            <p className="truncate text-[10px] text-text-secondary">{selectedUser.email}</p>
          </div>
        </div>
        <Tooltip content="Remove from invitation list" position="left">
          <button
            type="button"
            aria-label={`Remove ${selectedUser.fullName} from invitation list`}
            onClick={() => onRemoveFromWaitlist(selectedUser.id)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            ×
          </button>
        </Tooltip>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Project role</p>
        <div className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <FiShield size={16} className="text-primary" />
          <span>
            <span className="block text-xs font-bold text-text-primary">Reviewer</span>
            <span className="block text-[10px] text-text-secondary">Reviews papers and submits decisions.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
