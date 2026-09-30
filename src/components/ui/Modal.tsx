import React, { useEffect, useRef, useState } from "react";
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
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsEntered(false);
    const frame = window.requestAnimationFrame(() => setIsEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

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
        className={cn(
          "fixed inset-0 bg-text-primary/45 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          isEntered ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />

      {/* Modal/Drawer Content container for scaling animation */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full bg-surface-white border border-border shadow-lg overflow-hidden z-10 flex flex-col transition-[opacity,transform] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          mode === "drawer" 
            ? cn(
                "h-full max-h-screen rounded-none border-l border-y-0 border-r-0",
                isEntered ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
              )
            : cn(
                "rounded-xl max-h-[85vh]",
                isEntered
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-2 scale-[0.985] opacity-0",
              ),
          sizeStyles[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-border shrink-0">
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
        <div className={cn("p-6 overflow-y-auto flex-1", bodyClassName)}>
          {children}
        </div>

        {/* Footer Section */}
        {footer && (
          <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-border bg-bg-secondary shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
