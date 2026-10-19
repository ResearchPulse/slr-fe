import { useState } from "react";
import {
  FiClock,
  FiXCircle,
  FiCheckCircle,
  FiBell,
  FiTrash2,
} from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import LoadingSpinner from "../../../ui/LoadingSpinner";
import {
  useProjectInvitations,
  useCancelInvitation,
} from "../../../../hooks/useProjects";
import {
  ProjectRole,
  InvitationStatus,
  getProjectRoleLabel,
  type ProjectInvitation,
} from "../../../../types/project";
import { toastSuccess, toastError } from "../../../../utils/toast";
import { getErrorMessage } from "../../../../utils/errorUtils";
import Tooltip from "../../../ui/Tooltip";
import CancelInvitationConfirm from "./CancelInvitationConfirm";

interface SentInvitationsProps {
  projectId: string;
}

const getStatusBadge = (status: number) => {
  switch (status) {
    case InvitationStatus.Pending:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-warning">
          <FiClock size={10} />
          Pending
        </span>
      );
    case InvitationStatus.Accepted:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-success">
          <FiCheckCircle size={10} />
          Accepted
        </span>
      );
    case InvitationStatus.Rejected:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-error/20 bg-error/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-error">
          <FiXCircle size={10} />
          Rejected
        </span>
      );
    case InvitationStatus.Cancelled:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-text-secondary">
          <FiTrash2 size={10} />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-text-secondary">
          Expired
        </span>
      );
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function SentInvitations({ projectId }: SentInvitationsProps) {
  const { invitations, isLoading, refetch } = useProjectInvitations(projectId);
  const { cancelInvitation, isCancelling } = useCancelInvitation(projectId);
  const [invitationToCancel, setInvitationToCancel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleConfirmCancel = async () => {
    if (!invitationToCancel) return;

    try {
      await cancelInvitation(invitationToCancel.id);
      toastSuccess(
        `Invitation for ${invitationToCancel.name} has been cancelled.`,
      );
      setInvitationToCancel(null);
      refetch();
    } catch (error: unknown) {
      toastError(getErrorMessage(error, "Failed to cancel invitation."));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <LoadingSpinner size="md" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
          Loading invitations...
        </p>
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-secondary/50 px-8 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-white text-text-secondary shadow-none">
          <FiBell size={24} />
        </div>
        <h4 className="text-sm font-black uppercase tracking-tight text-text-primary">
          No Active Invitations
        </h4>
        <p className="mt-1 max-w-[200px] text-[11px] font-medium text-text-secondary">
          You haven't sent any invitations for this project yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300 motion-reduce:animate-none">
      <div className="flex items-center justify-between px-2">
        <h6 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
          Status Overview ({invitations.length})
        </h6>
      </div>

      <div className="grid gap-3">
        {invitations.map((inv: ProjectInvitation) => (
          <div
            key={inv.id}
            className="group min-w-0 rounded-xl border border-border bg-surface-white p-4 transition-colors hover:border-primary/35"
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                  {inv.invitedUserFullName[0].toUpperCase()}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="break-words text-sm font-black tracking-tight text-text-primary">
                      {inv.invitedUserFullName}
                    </p>
                    <span
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        inv.role === ProjectRole.Owner
                          ? "bg-bg-secondary text-accent"
                          : "bg-bg-secondary text-text-secondary",
                      )}
                    >
                      {getProjectRoleLabel(inv.role)}
                    </span>
                  </div>
                  <p className="break-all text-[10px] font-medium text-text-secondary sm:break-normal">
                    {inv.invitedUserEmail}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-end sm:gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                    Sent Date
                  </p>
                  <p className="text-[10px] font-bold italic text-text-primary">
                    {formatDate(inv.createdAt)}
                  </p>
                </div>
                <div className="flex min-w-0 justify-start sm:min-w-[100px] sm:justify-end">
                  {getStatusBadge(inv.status)}
                </div>

                {inv.status === InvitationStatus.Pending && (
                  <Tooltip content="Cancel Invitation" position="left">
                    <button
                      type="button"
                      aria-label={`Cancel invitation to ${inv.invitedUserFullName}`}
                      onClick={() =>
                        setInvitationToCancel({
                          id: inv.id,
                          name: inv.invitedUserFullName,
                        })
                      }
                      disabled={isCancelling}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-90 motion-reduce:active:scale-100 motion-reduce:transition-none"
                    >
                      <FiXCircle size={18} />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CancelInvitationConfirm
        isOpen={!!invitationToCancel}
        invitedUserName={invitationToCancel?.name}
        onConfirm={handleConfirmCancel}
        onCancel={() => setInvitationToCancel(null)}
        isSubmitting={isCancelling}
      />
    </div>
  );
}
