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

  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === "admin") {
    return "Admin";
  }

  return role.trim();
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  const location = useLocation();

<<<<<<< HEAD
  // Stable key for the roles array so the effect below doesn't re-fire
  // (and re-toast) on every parent re-render that recreates the array.
  const allowedRolesKey = allowedRoles?.join(",");
  const isRoleAllowed = allowedRolesKey
    ? allowedRolesKey.split(",").includes(user?.role ?? "")
    : true;
=======
  const normalizedUserRole = normalizeRole(user?.role);

  const isRoleAllowed = useMemo(() => {
    // No role restriction for this route
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // A protected role route must reject users without a role
    if (!normalizedUserRole) {
      return false;
    }

    const normalizedAllowedRoles = allowedRoles.map((role) =>
      normalizeRole(role),
    );

    return normalizedAllowedRoles.includes(normalizedUserRole);
  }, [allowedRoles, normalizedUserRole]);
>>>>>>> origin/dev

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== "/") {
      toastWarning("Access Denied", "Please sign in to view this page");
<<<<<<< HEAD
    } else if (allowedRolesKey && !isRoleAllowed) {
=======
      return;
    }

    if (isAuthenticated && !isRoleAllowed) {
>>>>>>> origin/dev
      toastWarning(
        "Access Denied",
        "You do not have permission to view this page",
      );
    }
<<<<<<< HEAD
  }, [isAuthenticated, allowedRolesKey, isRoleAllowed, location.pathname]);
=======
  }, [
    isAuthenticated,
    isRoleAllowed,
    location.pathname,
  ]);
>>>>>>> origin/dev

  // User is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

<<<<<<< HEAD
=======
  // User is authenticated but does not have the required role
>>>>>>> origin/dev
  if (!isRoleAllowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;