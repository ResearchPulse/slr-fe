import React, { useEffect, useId, useRef, useState } from "react";
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
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [isEntered, setIsEntered] = useState(false);

  // Callbacks passed inline by modal consumers change identity on every render.
  // Keep the latest callback without restarting the focus/scroll lifecycle.
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    setIsEntered(false);
    const frame = window.requestAnimationFrame(() => setIsEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    // Closed modals must not touch body scroll, or a re-render of an always-mounted
    // closed modal would unlock scrolling while another modal is open.
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && modalRef.current?.contains(activeElement)) return;
      modalRef.current
        ?.querySelector<HTMLElement>(
          '[autofocus], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        )
        ?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !modalRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !modalRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen, closeOnEsc]);

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
      {/* Backdrop with clean fade */}
      <div
        className={cn(
          "fixed inset-0 bg-text-primary/40 transition-opacity duration-200 ease-out motion-reduce:transition-none",
          isEntered ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />

      {/* Modal/Drawer Content container with 60fps GPU acceleration */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden bg-surface-white shadow-[0_16px_48px_rgba(18,35,49,0.16)] transform-gpu will-change-transform",
          mode === "drawer" 
            ? cn(
                "h-full max-h-screen rounded-none transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isEntered ? "translate-x-0" : "translate-x-full",
              )
            : cn(
                "max-h-[calc(100dvh-2rem)] rounded-xl transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                isEntered
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-2 scale-[0.985] opacity-0",
              ),
          sizeStyles[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-border shrink-0">
          <div className="space-y-1">
            <div id={titleId} className="text-[18px] font-semibold text-text-primary leading-snug">
              {title}
            </div>
            {description && (
              <div id={descriptionId} className="text-sm text-text-secondary">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close dialog"
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
