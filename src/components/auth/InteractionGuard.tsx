import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import type { RootState } from "../../redux/store";
import { toastWarning } from "../../utils/toast";

interface InteractionGuardProps {
  children: React.ReactNode;
}

/**
 * A guard component that prevents Admin users from interacting with Client-side pages.
 * Admins can only view content in client routes.
 */
const InteractionGuard: React.FC<InteractionGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const location = useLocation();

  // Check if current user is an Admin and NOT on an Admin-specific route
  const isAdminOnClientPage =
    isAuthenticated &&
    user?.role === "Admin" &&
    !location.pathname.startsWith("/admin");

  const handleCaptureInteraction = (
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    if (!isAdminOnClientPage) return;

    const target = e.target as HTMLElement;

    // 1. Identify interactive elements
    const interactiveElement = target.closest(
      "button, input, select, textarea, [role='button']",
    );
    const isLink = target.closest("a");

    // 2. We allow LINKS to let Admin browse
    if (isLink) return;

    // 3. For buttons and other interactive elements, we block them UNLESS they are specifically for navigation
    if (interactiveElement) {
      // Exceptions: Buttons that act like links (have a path/navigate behavior)
      // Often these are styled as buttons but their purpose is just "View" or "Details"
      const label = interactiveElement.textContent?.toLowerCase() || "";
      const isNavAction =
        label.includes("view") ||
        label.includes("details") ||
        label.includes("back") ||
        label.includes("dashboard");

      if (isNavAction) return;

      // Block form-mutating and action-oriented interactions
      e.preventDefault();
      e.stopPropagation();
      toastWarning(
        "Read-only Mode",
        "Only client can perform actions on these components.",
      );
    }
  };

  return (
    <div
      onClickCapture={handleCaptureInteraction}
      onKeyDownCapture={handleCaptureInteraction}
      className={isAdminOnClientPage ? "cursor-default" : ""}
    >
      {/* Visual banner for Read-only mode */}
      {isAdminOnClientPage && (
        <div className="bg-bg-primary border-b border-border px-4 py-3 text-center sticky top-[52px] md:top-[60px] z-[999] animate-in fade-in slide-in-from-top duration-300">
          <p className="text-[11px] font-medium text-text-primary uppercase tracking-[0.2em] flex items-center justify-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-80" />
            Admin Read-Only Mode
          </p>
        </div>
      )}
      {children}
    </div>
  );
};

export default InteractionGuard;
