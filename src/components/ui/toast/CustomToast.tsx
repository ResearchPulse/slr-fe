import React, { useLayoutEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import type { Toast } from "react-hot-toast";
import {
  HiCheckCircle,
  HiXCircle,
  HiInformationCircle,
  HiXMark,
} from "react-icons/hi2";
import { HiExclamationTriangle } from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { cn } from "../../../utils/cn";
import gsap from "gsap";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface CustomToastProps {
  t: Toast;
  type: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
}

const toastStyles: Record<
  ToastType,
  {
    bg: string;
    border: string;
    iconColor: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bg: "bg-surface-white",
    border: "border-success/25",
    iconColor: "text-success",
    icon: <HiCheckCircle className="w-5 h-5" />,
  },
  error: {
    bg: "bg-surface-white",
    border: "border-error/25",
    iconColor: "text-error",
    icon: <HiXCircle className="w-5 h-5" />,
  },
  warning: {
    bg: "bg-surface-white",
    border: "border-warning/25",
    iconColor: "text-warning",
    icon: <HiExclamationTriangle className="w-5 h-5" />,
  },
  info: {
    bg: "bg-surface-white",
    border: "border-primary/20",
    iconColor: "text-text-secondary",
    icon: <HiInformationCircle className="w-5 h-5" />,
  },
  loading: {
    bg: "bg-surface-white",
    border: "border-primary/20",
    iconColor: "text-accent",
    icon: <CgSpinner className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none" />,
  },
};

export const CustomToast: React.FC<CustomToastProps> = ({
  t,
  type,
  title,
  message,
  onClose,
}) => {
  const style = toastStyles[type];
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Entrance & Exit Animations
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches ?? false;
    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(containerRef.current, {
          opacity: t.visible ? 1 : 0,
          y: 0,
          scale: 1,
        });
        gsap.set(iconRef.current, { scale: 1, opacity: 1 });
        gsap.set(contentRef.current?.children || [], { y: 0, opacity: 1 });
        return;
      }

      if (t.visible) {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: -8, scale: 0.99 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.18,
            ease: "power2.out",
          },
        );
        gsap.set(iconRef.current, { scale: 1, opacity: 1 });
        gsap.set(contentRef.current?.children || [], { y: 0, opacity: 1 });
      } else {
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -8,
          scale: 0.99,
          duration: 0.15,
          ease: "power2.in",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [t.visible, t.duration, type]);

  // Hover Interactions
  const handleMouseEnter = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(containerRef.current, {
      scale: 1.005,
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      duration: 0.15,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(containerRef.current, {
        scale: 1,
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      });
      return;
    }

    gsap.to(containerRef.current, {
      scale: 1,
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      duration: 0.15,
      ease: "power2.in",
    });
  };

  return (
    <div
      ref={containerRef}
      role={type === "error" || type === "warning" ? "alert" : "status"}
      aria-live={type === "error" || type === "warning" ? "assertive" : "polite"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "max-w-sm w-full pointer-events-auto flex flex-col rounded-xl border shadow-none overflow-hidden",
        style.bg,
        style.border,
      )}
    >
      <div className="flex flex-1 w-full items-center p-3">
        <div
          ref={iconRef}
          className={cn("flex-shrink-0 mr-3", style.iconColor)}
        >
          {style.icon}
        </div>
        <div ref={contentRef} className="flex-1">
          <p className="text-[13px] font-medium text-text-primary tracking-wide line-clamp-1">
            {title}
          </p>
          {message && (
            <p className="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-line text-xs text-text-secondary">
              {message}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => {
            if (onClose) onClose();
            toast.dismiss(t.id);
          }}
          className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        >
          <HiXMark className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
