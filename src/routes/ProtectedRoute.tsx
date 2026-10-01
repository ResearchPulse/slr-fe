import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";
import type { RootState } from "../redux/store";
import { toastWarning } from "../utils/toast";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const location = useLocation();

  // Stable key for the roles array so the effect below doesn't re-fire
  // (and re-toast) on every parent re-render that recreates the array.
  const allowedRolesKey = allowedRoles?.join(",");
  const isRoleAllowed = allowedRolesKey
    ? allowedRolesKey.split(",").includes(user?.role ?? "")
    : true;

  useEffect(() => {
    // Only show "Access Denied" if we are actually trying to access a protected route
    // and we are definitely not authenticated or authorized.
    // We avoid showing it if the user just clicked "Logout" which clears isAuthenticated.
    if (!isAuthenticated && location.pathname !== "/") {
      toastWarning("Access Denied", "Please sign in to view this page");
    } else if (allowedRolesKey && !isRoleAllowed) {
      toastWarning(
        "Access Denied",
        "You do not have permission to view this page",
      );
    }
  }, [isAuthenticated, allowedRolesKey, isRoleAllowed, location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (!isRoleAllowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
