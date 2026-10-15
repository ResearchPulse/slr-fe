import React from "react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import type { User } from "../../../types/user";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";

interface ChangePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldData: User | null;
  newData: User | null;
}

const ChangePreviewModal: React.FC<ChangePreviewModalProps> = ({
  isOpen,
  onClose,
  oldData,
  newData,
}) => {
  if (!oldData || !newData) return null;

  const changes = [
    { label: "Full Name", old: oldData.fullName, new: newData.fullName },
    { label: "Email", old: oldData.email, new: newData.email },
    { label: "Username", old: oldData.username, new: newData.username },
  ].filter((item) => item.old !== item.new);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Updated Successfully"
      description="The following changes have been recorded in the system."
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/10 p-4 text-success">
          <FiCheckCircle className="shrink-0" size={20} />
          <p className="text-xs font-semibold">
            Admin authorization confirmed. Records updated.
          </p>
        </div>

        <div className="space-y-3">
          {changes.length > 0 ? (
            changes.map((change, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-bg-primary p-4 transition-colors hover:border-primary/30 hover:bg-surface-white"
              >
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                  {change.label}
                </p>
                <div className="flex items-center gap-3">
                  <span className="max-w-[120px] truncate text-sm font-medium text-text-secondary line-through">
                    {change.old}
                  </span>
                  <FiArrowRight className="shrink-0 text-primary" />
                  <span className="truncate rounded-lg border border-border bg-surface-white px-3 py-1 text-sm font-semibold text-text-primary">
                    {change.new}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-sm font-medium italic text-text-secondary">
                No structural changes detected (data remained identical).
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Acknowledge Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePreviewModal;
