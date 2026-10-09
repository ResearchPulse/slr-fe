import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Outlet, useLocation } from "react-router-dom";
import AdminAccessGuard from "../components/auth/AdminAccessGuard";
import SectionGuard from "../components/auth/SectionGuard";
import SignalRConnectionManager from "../components/SignalRConnectionManager";

export default function MainLayout() {
  const { pathname } = useLocation();
  const isScreeningWorkspace =
    /\/projects\/[^/]+\/(?:processes\/[^/]+\/)?screening(?:\/|$)/.test(
      pathname,
    );
  const isReviewProcessDashboard =
    /\/projects\/[^/]+\/processes\/[^/]+\/?$/.test(pathname);
  const isDataExtractionWorkspace =
    /\/projects\/[^/]+\/processes\/[^/]+\/extraction(?:\/|$)/.test(pathname);
  const isQualityAssessmentWorkspace =
    /\/projects\/[^/]+\/(?:processes\/[^/]+\/)?quality-assessment(?:\/|$)/.test(
      pathname,
    );
  const isSynthesisWorkspace =
    /\/projects\/[^/]+\/(?:processes\/[^/]+\/)?synthesis(?:\/|$)/.test(
      pathname,
    );
  const isPrismaReportWorkspace =
    /\/projects\/[^/]+\/(?:processes\/[^/]+\/)?prisma-report(?:\/|$)/.test(
      pathname,
    );

  return (
    <div
      className={
        isScreeningWorkspace
          ? "flex h-dvh min-h-0 flex-col overflow-hidden bg-bg-primary"
          : "flex min-h-screen flex-col bg-bg-primary"
      }
    >
      <SignalRConnectionManager />
      {!isScreeningWorkspace &&
        !isReviewProcessDashboard &&
        !isDataExtractionWorkspace &&
        !isQualityAssessmentWorkspace &&
        !isSynthesisWorkspace &&
        !isPrismaReportWorkspace && <Header />}
      <main
        className={
          isScreeningWorkspace
            ? "app-content min-h-0 flex-1 overflow-hidden overscroll-none"
            : `app-content flex-grow ${pathname === "/" ? "home-content" : "standard-content"}`
        }
      >
        <AdminAccessGuard />
        <SectionGuard section="client">
          {/* <InteractionGuard> */}
          <Outlet />
          {/* </InteractionGuard> */}
        </SectionGuard>
      </main>
      {!isScreeningWorkspace && <Footer />}
    </div>
  );
}
