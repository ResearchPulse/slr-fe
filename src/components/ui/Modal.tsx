import React, { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  bodyClassName?: string;
  description?: React.ReactNode;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  mode?: "modal" | "drawer";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
  bodyClassName,
  description,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  mode = "modal",
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
      className={cn(
        "fixed inset-0 z-(--z-index-modal) flex overflow-hidden",
        mode === "drawer" ? "justify-end" : "items-center justify-center p-4 sm:p-6"
      )}
      onClick={handleBackdropClick}
    >
      {/* Backdrop with frosted glass effect */}
      <div
        className="fixed inset-0 bg-text-primary/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        aria-hidden="true"
      />

      {/* Modal/Drawer Content container for scaling animation */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full bg-surface-white border border-border shadow-[0_8px_32px_rgba(18,35,49,0.12)] overflow-hidden transform transition-all z-10 flex flex-col",
          mode === "drawer"
            ? "h-full max-h-screen rounded-none border-l border-y-0 border-r-0 animate-in slide-in-from-right fade-in duration-300"
            : "rounded-[12px] max-h-[85vh] animate-in zoom-in-95 fade-in duration-300",
          sizeStyles[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-border shrink-0">
          <div className="space-y-1">
            <div className="text-[17px] font-semibold text-text-primary leading-snug tracking-[-0.01em]">
              {title}
            </div>
            {description && (
              <div className="text-sm text-text-secondary">{description}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-[8px] transition-colors"
          >
            <FiX size={18} />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Body Section */}
        <div className={cn("p-6 overflow-y-auto flex-1", bodyClassName)}>
          {children}
        </div>

        {/* Footer Section */}
        {footer && (
          <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-border bg-surface-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
