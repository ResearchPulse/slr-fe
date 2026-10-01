import { useState } from "react";
import { FiXCircle } from "react-icons/fi";
import Modal from "../../../ui/Modal";
import Button from "../../../ui/Button";

import { useRejectInvitation } from "../../../../hooks/useProjects";
import { toastSuccess, toastError } from "../../../../utils/toast";

interface RejectInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitationId: string;
  onSuccess?: () => void;
}

export default function RejectInvitationModal({
  isOpen,
  onClose,
  invitationId,
  onSuccess,
}: RejectInvitationModalProps) {
  const [message, setMessage] = useState("");
  const { rejectInvitation, isRejecting } = useRejectInvitation();

  const handleReject = async () => {
    try {
      await rejectInvitation({ invitationId, message });
      toastSuccess("Invitation declined successfully.");
      onSuccess?.();
      onClose();
    } catch (error) {
      toastError("Failed to decline invitation.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decline Invitation">
      <div className="p-6">
        <div className="w-16 h-16 bg-bg-secondary text-error rounded-md flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
          <FiXCircle size={32} />
        </div>
        <p className="text-center text-text-secondary font-medium mb-4">
          Please provide a reason for declining this invitation (optional).
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="w-full h-32 p-4 bg-surface-white border border-border rounded-md text-sm font-medium focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all resize-none mb-6 shadow-sm"
        />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            className="flex-1 bg-accent hover:bg-primary-hover text-surface-white shadow-sm"
            onClick={handleReject}
            disabled={isRejecting}
          >
            {isRejecting ? "Declining..." : "Submit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
