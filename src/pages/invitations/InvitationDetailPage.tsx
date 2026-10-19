import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiUser,
  FiInfo,
  FiArrowLeft,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import { useInvitation } from "../../hooks/useProjects";
import { InvitationStatus, getProjectRoleLabel } from "../../types/project";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import AcceptInvitationModal from "../../components/admin/slr-projects/invitation/AcceptInvitationModal";
import RejectInvitationModal from "../../components/admin/slr-projects/invitation/RejectInvitationModal";

export default function InvitationDetailPage() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const { invitation, isLoading, error, refetch } = useInvitation(invitationId);

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const getStatusConfig = (status: number) => {
    switch (status) {
      case InvitationStatus.Pending:
        return {
          label: "Pending",
          icon: FiClock,
          color: "text-text-secondary",
          bg: "bg-bg-secondary",
          description: "This invitation is currently waiting for a response.",
        };
      case InvitationStatus.Accepted:
        return {
          label: "Accepted",
          icon: FiCheckCircle,
          color: "text-success",
          bg: "bg-success/10",
          description: "You have already joined this project.",
        };
      case InvitationStatus.Rejected:
        return {
          label: "Rejected",
          icon: FiXCircle,
          color: "text-error",
          bg: "bg-error/5",
          description: "This invitation was declined.",
        };
      case InvitationStatus.Cancelled:
        return {
          label: "Cancelled",
          icon: FiTrash2,
          color: "text-text-secondary",
          bg: "bg-bg-secondary",
          description: "This invitation was revoked by the sender.",
        };
      case InvitationStatus.Expired:
        return {
          label: "Expired",
          icon: FiAlertCircle,
          color: "text-warning",
          bg: "bg-warning/10",
          description: "This invitation has expired.",
        };
      default:
        return {
          label: "Expired",
          icon: FiAlertCircle,
          color: "text-text-secondary",
          bg: "bg-bg-secondary",
          description: "This invitation has expired.",
        };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-bg-primary">
        <LoadingSpinner size="lg" />
        <p role="status" className="mt-4 text-sm font-medium text-text-secondary">
          Fetching invitation details...
        </p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="mx-auto max-w-2xl bg-bg-primary px-4 py-12 sm:px-6 sm:py-16">
        <Card className="p-6 text-center sm:p-10" role="alert">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-error/5 text-error">
            <FiAlertCircle size={24} aria-hidden="true" />
          </div>

          <h2 className="mb-2 text-xl font-semibold text-text-primary">
            Invitation Not Found
          </h2>

          <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-text-secondary">
            The invitation link might be broken, expired, or you don't have
            permission to view it.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="primary"
            >
              Return Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const sc = getStatusConfig(invitation.status);
  const StatusIcon = sc.icon;

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-5 min-h-11 normal-case tracking-normal"
        >
          <FiArrowLeft aria-hidden="true" />
          Back
        </Button>

        <div className="grid gap-5">
          {/* Main Content Card */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border bg-bg-secondary px-5 py-6 sm:px-8 sm:py-7">
              <div>
                <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface-white px-3 py-1 text-xs font-medium text-text-secondary">
                  <FiInfo size={14} aria-hidden="true" />
                  Project Invitation
                </span>
                <h1 className="mb-2 break-words text-2xl font-bold leading-tight text-text-primary sm:text-[28px]">
                  {invitation.projectTitle}
                </h1>
                <p className="max-w-[65ch] text-sm leading-6 text-text-secondary">
                  You've been invited by{" "}
                  <span className="font-semibold text-text-primary">
                    {invitation.invitedByUserFullName}
                  </span>{" "}
                  to collaborate on this systematic literature review project.
                </p>
              </div>
            </div>

            <div className="bg-surface-white p-5 sm:p-8">
              <div className="grid gap-7">
                {/* Details Grid */}
                <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-secondary">
                      Your Assigned Role
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-accent">
                        <FiShield size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-text-primary">
                          {getProjectRoleLabel(invitation.role)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          Full collaboration access
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-secondary">
                      Invitation Status
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          sc.bg,
                          sc.color,
                        )}
                      >
                        <StatusIcon size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <p className={cn("text-base font-semibold", sc.color)}>
                          {sc.label}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {sc.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Timeline / Dates */}
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary">
                      <FiCalendar size={16} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-text-secondary">
                        Sent Date
                      </p>
                      <p className="text-sm font-medium text-text-primary">
                        {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary">
                      <FiClock size={16} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-text-secondary">
                        Expires On
                      </p>
                      <p className="text-sm font-medium text-text-primary">
                        {formatDate(invitation.expiredAt)}
                      </p>
                    </div>
                  </div>

                  {invitation.respondedAt && (
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-success">
                        <FiCheckCircle size={16} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-text-secondary">
                          Responded At
                        </p>
                        <p className="text-sm font-medium text-text-primary">
                          {formatDate(invitation.respondedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Overlay for Pending */}
            {invitation.status === InvitationStatus.Pending && (
              <div className="flex flex-col items-stretch justify-between gap-4 border-t border-border bg-bg-secondary p-5 sm:flex-row sm:items-center sm:px-8 sm:py-5">
                {/* Left Info */}
                <div className="flex items-center gap-3 text-text-secondary">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-white">
                    <FiUser size={18} aria-hidden="true" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-text-primary">
                      Respond to this invitation
                    </p>
                    <p className="font-medium">
                      Please accept or reject this request to continue.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="flex-1 sm:flex-none"
                  >
                    Reject
                  </Button>

                  <Button
                    onClick={() => setIsAcceptModalOpen(true)}
                    className="flex-1 sm:flex-none"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Additional Info / Help */}
          <div className="px-4 text-center">
            <p className="text-sm text-text-secondary">
              If you have questions about this invitation, please contact{" "}
                <span className="font-semibold text-text-primary">
                {invitation.invitedByUserFullName}
              </span>{" "}
              directly.
            </p>
          </div>
        </div>
      </div>

      <AcceptInvitationModal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        role={invitation.role}
        invitationId={invitation.id}
        onSuccess={() => {
          // Refetch invitation data to show updated status
          refetch();
        }}
      />

      <RejectInvitationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        invitationId={invitation.id}
        onSuccess={() => {
          // Refetch invitation data to show updated status
          refetch();
        }}
      />
    </div>
  );
}
