import { FiTrash2 } from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import Tooltip from "../../../ui/Tooltip";

interface WaitlistUser {
  id: string;
  fullName: string;
  userName: string;
  role: "Reviewer";
}

interface InvitationWaitlistProps {
  users: WaitlistUser[];
  onRemove: (userId: string) => void;
  onSelect: (userId: string) => void;
  selectedUserId: string | null;
  getInitials: (name: string) => string;
}

export default function InvitationWaitlist({
  users,
  onRemove,
  onSelect,
  selectedUserId,
  getInitials,
}: InvitationWaitlistProps) {
  if (users.length === 0) return null;

  return (
    <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
            Invitation Waitlist
          </span>
        </div>
        <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[9px] font-black text-text-secondary">
          {users.length} {users.length === 1 ? "Person" : "People"}
        </span>
      </div>

      <div className="dropdown-scroll-area grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors duration-150 motion-reduce:transition-none",
              selectedUserId === user.id
                ? "border-accent/30 bg-primary-light"
                : "border-border bg-surface-white",
            )}
          >
            <button
              type="button"
              aria-pressed={selectedUserId === user.id}
              onClick={() => onSelect(user.id)}
              className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-[10px] font-black text-text-secondary transition-colors group-hover:bg-accent group-hover:text-white motion-reduce:transition-none">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="mb-1 truncate text-[11px] font-black leading-none text-text-primary">
                  {user.fullName}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider",
                      "bg-primary-light text-accent",
                    )}
                  >
                    {user.role}
                  </span>
                  <span className="text-[9px] font-bold italic text-text-secondary">
                    @{user.userName}
                  </span>
                </div>
              </div>
            </button>

            <Tooltip content="Remove from list" position="top">
              <button
                type="button"
                aria-label={`Remove ${user.fullName} from invitation list`}
                onClick={() => onRemove(user.id)}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-white hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                <FiTrash2 size={12} />
              </button>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
}
