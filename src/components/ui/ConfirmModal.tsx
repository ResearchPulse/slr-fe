import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { FiAlertTriangle } from "react-icons/fi";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "danger",
}) => {
  const variantStyles = {
    danger: {
      iconBg: "bg-error/10",
      iconColor: "text-error",
      confirmVariant: "danger" as const,
      confirmClassName: "",
    },
    warning: {
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      confirmVariant: "primary" as const,
      confirmClassName: "bg-warning hover:bg-warning/90 focus:ring-warning/20",
    },
    info: {
      iconBg: "bg-primary-light",
      iconColor: "text-accent",
      confirmVariant: "primary" as const,
      confirmClassName: "",
    },
  };

  const style = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center space-y-6">
        <div
          className={`w-20 h-20 ${style.iconBg} rounded-full flex items-center justify-center`}
        >
          <FiAlertTriangle className={`w-10 h-10 ${style.iconColor}`} />
        </div>

        <div className="space-y-2">
          <p className="text-text-secondary font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3 w-full pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={style.confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className={`flex-1 ${style.confirmClassName}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
