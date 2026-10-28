import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { isTopOverlay, pushOverlay, removeOverlay } from "../../utils/overlayStack";
import gsap from "gsap";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExited?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  side?: "left" | "right";
  className?: string;
  contentClassName?: string;
  hideHeader?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  onExited,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-md",
  side = "right",
  className,
  contentClassName,
  hideHeader = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const drawerId = useId();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const onExitedRef = useRef(onExited);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    onExitedRef.current = onExited;
  }, [onClose, onExited]);

  useEffect(() => {
    if (!isOpen) return;

    setShouldRender(true);
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pushOverlay(drawerId);
    const frame = window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && drawerRef.current?.contains(activeElement)) return;
      drawerRef.current
        ?.querySelector<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )
        ?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopOverlay(drawerId)) return;
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      removeOverlay(drawerId);
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen, drawerId]);

  // Handle Animations
  useEffect(() => {
    if (!containerRef.current || !backdropRef.current || !drawerRef.current)
      return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches ?? false;

    if (reduceMotion) {
      gsap.killTweensOf([
        containerRef.current,
        backdropRef.current,
        drawerRef.current,
      ]);
      if (isOpen) {
        gsap.set(containerRef.current, { visibility: "visible" });
        gsap.set(backdropRef.current, { opacity: 1 });
        gsap.set(drawerRef.current, { x: 0 });
      } else if (shouldRender) {
        gsap.set(containerRef.current, { visibility: "hidden" });
        setShouldRender(false);
        onExitedRef.current?.();
      }
      return;
    }

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
          onExitedRef.current?.();
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
        "fixed inset-0 z-(--z-index-drawer) overflow-hidden",
        className,
      )}
      style={{ visibility: "hidden" }}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-text-primary/40"
        aria-hidden="true"
        onClick={() => {
          if (isTopOverlay(drawerId)) onCloseRef.current();
        }}
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
          role="dialog"
          aria-modal="true"
          aria-labelledby={title && !hideHeader ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          aria-label={hideHeader ? (typeof title === "string" ? title : "Side panel") : title ? undefined : "Side panel"}
          className={cn(
            "pointer-events-auto flex h-full w-[calc(100vw-2.5rem)] flex-col bg-surface-white shadow-[0_16px_48px_rgba(18,35,49,0.16)] transform-gpu will-change-transform",
            side === "left" ? "rounded-r-xl" : "rounded-l-xl",
            maxWidth,
          )}
        >
          {!hideHeader && (
            <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-border bg-surface-white px-6 py-5">
              <div className="flex-1 space-y-1 pr-4">
                <div id={titleId} className="text-[18px] font-semibold leading-snug text-text-primary">
                  {title}
                </div>
                {description && (
                  <div id={descriptionId} className="text-sm leading-relaxed text-text-secondary">
                    {description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onCloseRef.current()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>
          )}

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
