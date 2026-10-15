import React from "react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import { FiAlertCircle, FiCheckCircle, FiXCircle } from "react-icons/fi";
import type { User } from "../../../types/user";

interface StatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
  isLoading: boolean;
}

const StatusConfirmModal: React.FC<StatusConfirmModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  isLoading,
}) => {
  if (!user) return null;

  const isActivating = !user.isActive;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isActivating ? "Activate User Account" : "Deactivate User Account"}
      description={
        isActivating
          ? "This will restore access for the user to login and interact with the system."
          : "This will temporarily suspend the user's access. They will be unable to login or perform actions."
      }
      size="sm"
    >
      <div className="space-y-6">
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${isActivating ? "border-success/20 bg-success/10 text-success" : "border-error/20 bg-error/10 text-error"}`}
        >
          {isActivating ? (
            <FiCheckCircle size={24} />
          ) : (
            <FiXCircle size={24} />
          )}
          <div>
            <p className="text-sm font-black">
              Target Account: {user.fullName}
            </p>
            <p className="text-xs font-medium opacity-80">@{user.username}</p>
          </div>
        </div>

        <div className="bg-bg-primary p-4 rounded-xl border border-border flex gap-3 text-text-secondary">
          <FiAlertCircle size={20} className="shrink-0 text-warning" />
          <p className="text-xs leading-relaxed font-medium">
            {isActivating
              ? "Activating this account will enable all standard permissions associated with their role."
              : "Deactivating this account is immediate. All active sessions will be invalidated on their next request."}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            variant={isActivating ? "success" : "danger"}
            className="min-w-[140px]"
          >
            {isActivating ? "Confirm Activation" : "Confirm Deactivation"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StatusConfirmModal;
