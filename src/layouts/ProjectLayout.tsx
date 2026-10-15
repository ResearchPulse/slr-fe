import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCurrentProject } from "../redux/slices/projectSlice";
import { useProjectMember } from "../hooks/useProjectMember";

export default function ProjectLayout() {
  const dispatch = useDispatch();
  const { id, projectId } = useParams();
  const activeProjectId = projectId || id;

  // This ensures that currentProjectMember is always fetched and saved to Redux
  // whenever any subroute starting with /projects/{projectId} is accessed.
  // Handles reload/reconnect automatically via React Query.
  const { member, isLoading, isFetching } = useProjectMember(activeProjectId);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentProject());
    };
  }, [dispatch]);

  if (activeProjectId && (isLoading || (isFetching && !member))) {
    return (
      <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-text-secondary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Checking project access...
      </div>
    );
  }

  if (activeProjectId && !member) {
    return <Navigate to="/projects" replace />;
  }

  return <Outlet />;
}
