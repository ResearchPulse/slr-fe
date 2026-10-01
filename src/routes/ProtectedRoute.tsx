import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";
import type { RootState } from "../redux/store";
import { toastWarning } from "../utils/toast";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const normalizeRole = (role?: string | null) => {
  if (!role) return null;
  return role.trim().toLowerCase();
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  const location = useLocation();

  const normalizedUserRole = normalizeRole(user?.role);

  const isRoleAllowed = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (!normalizedUserRole) {
      return false;
    }

    const normalizedAllowedRoles = allowedRoles.map((role) =>
      normalizeRole(role),
    );

    return normalizedAllowedRoles.includes(normalizedUserRole);
  }, [allowedRoles, normalizedUserRole]);

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/") {
      toastWarning("Access Denied", "Please sign in to view this page");
      return;
    }

    if (isAuthenticated && !isRoleAllowed) {
      toastWarning(
        "Access Denied",
        "You do not have permission to view this page",
      );
    }
  }, [isAuthenticated, isRoleAllowed, location.pathname]);

  // User is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  // User is authenticated but does not have the required role
  if (!isRoleAllowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
