import React, { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import gsap from "gsap";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  side?: "left" | "right";
  className?: string;
  contentClassName?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-md",
  side = "right",
  className,
  contentClassName,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle Animations
  useEffect(() => {
    if (!containerRef.current || !backdropRef.current || !drawerRef.current)
      return;

    if (isOpen) {
      // Entrance Animation
      const tl = gsap.timeline();

      tl.set(containerRef.current, { visibility: "visible" })
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: "power2.out" },
        )
        .fromTo(
          drawerRef.current,
          { x: side === "left" ? "-100%" : "100%", force3D: true },
          { x: "0%", duration: 0.3, ease: "power2.out", force3D: true },
          "<",
        );
    } else if (shouldRender) {
      // Exit Animation
      const tl = gsap.timeline({
        onComplete: () => {
          setShouldRender(false);
          if (containerRef.current) {
            gsap.set(containerRef.current, { visibility: "hidden" });
          }
        },
      });

      tl.to(drawerRef.current, {
        x: side === "left" ? "-100%" : "100%",
        duration: 0.25,
        ease: "power2.in",
        force3D: true,
      }).to(
        backdropRef.current,
        { opacity: 0, duration: 0.2, ease: "power2.in" },
        "-=0.1",
      );
    }
  }, [isOpen, shouldRender, side]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-[var(--z-index-drawer)] overflow-hidden",
        className,
      )}
      style={{ visibility: "hidden" }}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={cn(
          "fixed inset-y-0 flex max-w-full outline-none",
          side === "left" ? "left-0 pr-10" : "right-0 pl-10",
        )}
      >
        <div
          ref={drawerRef}
          className={cn(
            "pointer-events-auto w-screen bg-surface-white border-l border-border shadow-2xl transform-gpu will-change-transform flex flex-col h-full",
            maxWidth,
          )}
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-border flex items-start justify-between sticky top-0 bg-surface-white z-10 shrink-0">
            <div className="flex-1 space-y-1 pr-4">
              <div className="text-[18px] font-semibold text-text-primary leading-snug">
                {title}
              </div>
              {description && (
                <div className="text-sm text-text-secondary leading-relaxed">
                  {description}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors shrink-0"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className={cn("flex-1 p-6 overflow-y-auto bg-surface-white", contentClassName)}>
            {children}
          </div>

          {/* Drawer Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-border bg-bg-secondary sticky bottom-0 z-10 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Drawer;
