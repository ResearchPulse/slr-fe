import React, { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  description?: React.ReactNode;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className,
  description,
  closeOnOutsideClick = true,
  closeOnEsc = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (
      closeOnOutsideClick &&
      modalRef.current &&
      !modalRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-(--z-index-modal) flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with frosted glass effect */}
      <div
        className="fixed inset-0 bg-text-primary/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        aria-hidden="true"
      />

      {/* Modal Content container for scaling animation */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full bg-surface-white rounded-[4px] border border-border shadow-lg overflow-hidden transform transition-all z-10 animate-in zoom-in-95 fade-in duration-300",
          sizeStyles[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-border">
          <div className="space-y-1">
            <div className="text-[18px] font-medium text-text-primary leading-snug">
              {title}
            </div>
            {description && (
              <div className="text-sm text-text-secondary">{description}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-[4px] transition-colors"
          >
            <FiX size={18} />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Body Section */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
