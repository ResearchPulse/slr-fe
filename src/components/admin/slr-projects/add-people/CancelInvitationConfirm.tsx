import ConfirmModal from "../../../ui/ConfirmModal";

interface CancelInvitationConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  invitedUserName?: string;
  isSubmitting?: boolean;
}

export default function CancelInvitationConfirm({
  isOpen,
  onConfirm,
  onCancel,
  invitedUserName,
  isSubmitting,
}: CancelInvitationConfirmProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Cancel invitation?"
      message={
        <>
          Are you sure you want to cancel the invitation for{" "}
          <span className="font-semibold text-text-primary">
            {invitedUserName || "this user"}
          </span>
          ? This action cannot be undone.
        </>
      }
      confirmText="Cancel invitation"
      cancelText="Keep invitation"
      isLoading={isSubmitting}
      variant="danger"
    />
  );
}
