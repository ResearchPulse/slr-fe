import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import AdminProfileRedirect from "../components/profile/AdminProfileRedirect";
import MainLayout from "../layouts/MainLayout";
import ProjectLayout from "../layouts/ProjectLayout";
import ProtectedRoute from "./ProtectedRoute";
import ProtectedRouteForProject from "../components/routes/ProtectedRouteForProject";
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Lazy loaded page components
const HomePage = lazy(() => import("../pages/home/HomePage"));
const ProjectListPage = lazy(() => import("../pages/projects/ProjectListPage"));
const ProjectDetailPage = lazy(() => import("../pages/projects/ProjectDetailPage"));
const ProjectSettingsPage = lazy(() => import("../pages/projects/ProjectSettingsPage"));
const ReviewProcessWorkspace = lazy(() => import("../pages/reviewProcess/ReviewProcessWorkspace"));
const IdentificationPhaseWorkspace = lazy(() => import("../pages/reviewProcess/IdentificationPhaseWorkspace"));
const PrismaReportWorkspace = lazy(() => import("../pages/reviewProcess/prismaReport/PrismaReportWorkspace"));
const FullTextScreeningWorkspace = lazy(() => import("../pages/reviewProcess/studySelection/fullTextScreening/FullTextScreeningWorkspace"));
const QualityAssessmentWorkspace = lazy(() => import("../pages/reviewProcess/qualityAssessment/QualityAssessmentWorkspace"));
const SynthesisPhaseWorkspace = lazy(() => import("../pages/reviewProcess/synthesisExecution/SynthesisPhaseWorkspace"));
const InvitationDetailPage = lazy(() => import("../pages/invitations/InvitationDetailPage"));
const DataExtractionPhaseWorkspace = lazy(() => import("../pages/reviewProcess/dataExtraction/DataExtractionPhaseWorkspace"));
const ExtractionGridWorkspace = lazy(() => import("../pages/reviewProcess/dataExtraction/components/gridWorkspace/ExtractionGridWorkspace"));
const MyProfilePage = lazy(() => import("../pages/profile/MyProfilePage"));
const ChecklistDashboardWrapper = lazy(() => import("../pages/checklist/ChecklistDashboardWrapper"));
const ChecklistEditorPage = lazy(() => import("../pages/checklist/ChecklistEditorPage"));
const ProjectAuditLogPage = lazy(() => import("../pages/projects/ProjectAuditLogPage"));
const PaperDetailsPage = lazy(() => import("../pages/projects/PaperDetailsPage"));
const ManageStudySelectionPage = lazy(() => import("../pages/manage-study-selection/ManageStudySelectionPage"));
const ScreeningPhaseRouter = lazy(() => import("../pages/reviewProcess/studySelection/ScreeningPhaseRouter"));
const StuSePaperStatisticPage = lazy(() => import("../pages/manage-study-selection/StuSePaperStatisticPage"));

function MainRoutes() {
  const { user } = useSelector((state: RootState) => state.auth);
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-bg-primary">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Home Page */}
          <Route index element={<HomePage />} />

          {/* Profile Page */}
          <Route
            path="profile"
            element={
              user?.role === "Admin" ? (
                <AdminProfileRedirect />
              ) : (
                <MyProfilePage />
              )
            }
          />

          {/* Project Routes */}
          <Route>
            <Route element={<ProtectedRoute />}>
              <Route path="projects" element={<ProjectLayout />}>
              <Route index element={<ProjectListPage />} />
              <Route path=":id/*" element={<ProjectDetailPage />} />
              <Route path=":id/settings" element={<ProjectSettingsPage />} />

              {/* Checklist Routes */}
              <Route
                path=":projectId/checklists"
                element={<ChecklistDashboardWrapper />}
              />
              <Route
                path=":projectId/checklists/:checklistId"
                element={<ChecklistEditorPage />}
              />

              {/* Canonical Project-Centric Routes (FR-G0-01) */}
              <Route path=":projectId/workspace" element={<ReviewProcessWorkspace />} />
              <Route path=":projectId/identification" element={<IdentificationPhaseWorkspace />} />
              <Route path=":projectId/screening" element={<ScreeningPhaseRouter />} />
              <Route path=":projectId/screening/dashboard" element={<ManageStudySelectionPage />} />
              <Route path=":projectId/screening/full-text" element={<FullTextScreeningWorkspace />} />
              <Route path=":projectId/quality-assessment" element={<QualityAssessmentWorkspace />} />
              <Route path=":projectId/extraction" element={<DataExtractionPhaseWorkspace />} />
              <Route path=":projectId/extraction/grid" element={<ExtractionGridWorkspace />} />
              <Route path=":projectId/synthesis/*" element={<SynthesisPhaseWorkspace />} />
              <Route path=":projectId/prisma-report" element={<PrismaReportWorkspace />} />

              {/* Review Process Workspace (Legacy paths kept for backward compatibility) */}
              <Route
                path=":projectId/processes/:processId"
                element={<ReviewProcessWorkspace />}
              />

              {/* Identification Phase — Leader and Member */}
              <Route
                element={
                  <ProtectedRouteForProject
                    allowedRoles={["OWNER", "ADMIN", 1, 2]}
                    redirectTo="/projects"
                    forbiddenTo="/projects"
                  />
                }
              >
                <Route
                  path=":projectId/processes/:processId/identification/:identificationPhaseId"
                  element={<IdentificationPhaseWorkspace />}
                />
              </Route>

              <Route
                path=":projectId/processes/:processId/screening/:screeningProcessId"
                element={
                  <ProtectedRouteForProject
                    allowedRoles={[1, 3]}
                    redirectTo="/projects"
                  />
                }
              >
                <Route index element={<ScreeningPhaseRouter />} />
                <Route path="dashboard" element={<ManageStudySelectionPage />} />
              </Route>

              <Route
                path=":projectId/processes/:processId/screening/:screeningProcessId/papers-statistic"
                element={
                  <ProtectedRouteForProject
                    allowedRoles={[1]}
                    redirectTo="/projects"
                  />
                }
              >
                <Route index element={<StuSePaperStatisticPage />} />
              </Route>

              <Route
                path=":projectId/processes/:processId/full-text-screening/:screeningProcessId"
                element={<FullTextScreeningWorkspace />}
              />
              {/* Quality Assessment Workspace */}
              <Route
                path=":projectId/processes/:processId/quality-assessment/:qualityAssessmentId"
                element={<QualityAssessmentWorkspace />}
              />
              <Route
                path=":projectId/processes/:processId/extraction"
                element={<DataExtractionPhaseWorkspace />}
              />
              <Route
                path=":projectId/processes/:processId/extraction/workspace/:studyId"
                element={<DataExtractionPhaseWorkspace />}
              />
              <Route
                path=":projectId/processes/:processId/extraction/grid"
                element={<ExtractionGridWorkspace />}
              />
              <Route
                path=":projectId/processes/:processId/synthesis/*"
                element={<SynthesisPhaseWorkspace />}
              />
              <Route
                path=":projectId/processes/:processId/prisma-report"
                element={<PrismaReportWorkspace />}
              />
              <Route
                path=":projectId/papers/:paperId"
                element={<PaperDetailsPage />}
              />
              <Route path=":id/audit-logs" element={<ProjectAuditLogPage />} />
              </Route>
            </Route>

            {/* Invitation Routes */}
            <Route path="invitations">
              <Route path=":invitationId" element={<InvitationDetailPage />} />
            </Route>
          </Route>

          {/* 404 Page */}
          {/* <Route path="*" element={<Navigate to="/404" replace />} /> */}
        </Route>
      </Routes>
    </Suspense>
  );
}

export default MainRoutes;
