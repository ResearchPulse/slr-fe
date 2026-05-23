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
    border: "border-border",
    iconColor: "text-[#556B2F]", // muted olive
    icon: <HiCheckCircle className="w-5 h-5" />,
  },
  error: {
    bg: "bg-surface-white",
    border: "border-border",
    iconColor: "text-accent", // muted burgundy
    icon: <HiXCircle className="w-5 h-5" />,
  },
  warning: {
    bg: "bg-surface-white",
    border: "border-border",
    iconColor: "text-[#B8860B]", // muted amber
    icon: <HiExclamationTriangle className="w-5 h-5" />,
  },
  info: {
    bg: "bg-surface-white",
    border: "border-border",
    iconColor: "text-text-secondary",
    icon: <HiInformationCircle className="w-5 h-5" />,
  },
  loading: {
    bg: "bg-surface-white",
    border: "border-border",
    iconColor: "text-accent",
    icon: <CgSpinner className="w-5 h-5 animate-spin" />,
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
    const ctx = gsap.context(() => {
      if (t.visible) {
        // Entrance sequence
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: -20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            ease: "power3.out",
          },
        );

        // Icon pop effect
        gsap.fromTo(
          iconRef.current,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.35,
            ease: "back.out(1.7)",
            delay: 0.1,
          },
        );

        // Staggered text appearance
        gsap.fromTo(
          contentRef.current?.children || [],
          { y: 5, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out",
            delay: 0.15,
          },
        );

        // Removed Progress bar animation per editorial requirements
      } else {
        // Exit sequence
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -20,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.in",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [t.visible, t.duration, type]);

  // Hover Interactions
  const handleMouseEnter = () => {
    gsap.to(containerRef.current, {
      scale: 1.02,
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      duration: 0.15,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "max-w-sm w-full pointer-events-auto flex flex-col rounded-[4px] border shadow-none overflow-hidden",
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
            <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (onClose) onClose();
            toast.dismiss(t.id);
          }}
          className="ml-4 flex-shrink-0 text-text-secondary hover:text-text-primary focus:outline-none transition-colors"
        >
          <HiXMark className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
