import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TitleAbstractAssignmentTable from "../../../components/reviewProcess/leader/TitleAbstractAssignmentTable";
import FullTextAssignmentTable from "../../../components/reviewProcess/leader/FullTextAssignmentTable";
import gsap from "gsap";
import { Layout, FileText } from "lucide-react";

const AssignPapersPage: React.FC = () => {
  const { screeningProcessId } = useParams<{
    projectId: string;
    processId: string;
    screeningProcessId: string;
  }>();

  const [activeTab, setActiveTab] = useState<"title-abstract" | "full-text">(
    "title-abstract",
  );
  const [selectionMode, setSelectionMode] = useState<"quick" | "assignment">(
    "assignment",
  );

  // ---- Page entrance animation ----
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from(".page-content", {
      opacity: 0,
      y: 6,
      duration: 0.18,
      ease: "power2.out",
    });
  }, []);

  // ---- Handlers ----
  const handleTabChange = (tab: "title-abstract" | "full-text") => {
    setActiveTab(tab);
  };

  const handleModeChange = (mode: "quick" | "assignment") => {
    setSelectionMode(mode);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden page-content">
      <div className="flex-1 overflow-auto flex py-8 px-6 justify-center no-scrollbar">
        <div className="w-full max-w-7xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
              Selection Mode
            </h2>
            {selectionMode === "quick" && (
              <p className="text-xs text-text-secondary motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300 motion-reduce:animate-none">
                * Note:{" "}
                <span className="font-semibold text-accent">
                  Quick Decision
                </span>{" "}
                is available for any paper that does not yet have a final
                decision and is not yet assigned to any reviewer.
              </p>
            )}
            {selectionMode === "assignment" && (
              <p className="text-xs text-text-secondary motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300 motion-reduce:animate-none">
                * Note: You can only{" "}
                <span className="font-semibold text-accent">
                  Assign Reviewer
                </span>{" "}
                to papers that do not have a final decision.
              </p>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-surface-white p-1 rounded-xl border border-border shadow-none self-start">
            <button
              type="button"
              aria-pressed={selectionMode === "assignment"}
              onClick={() => handleModeChange("assignment")}
              className={`inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none ${
                selectionMode === "assignment"
                  ? "bg-primary text-white shadow-none shadow-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-primary"
              }`}
            >
              Assign Reviewer
            </button>
            <button
              type="button"
              aria-pressed={selectionMode === "quick"}
              onClick={() => handleModeChange("quick")}
              className={`inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none ${
                selectionMode === "quick"
                  ? "bg-primary text-white shadow-none shadow-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-primary"
              }`}
            >
              Quick Decision
            </button>
          </div>

          <div className="bg-surface-white rounded-xl shadow-none border border-border overflow-hidden flex flex-col flex-1 min-h-[500px]">
            {/* Tab Navigation */}
            <div className="bg-surface-white border-b border-border">
              <div className="flex px-4 sm:px-6">
                <button
                  type="button"
                  aria-pressed={activeTab === "title-abstract"}
                  onClick={() => handleTabChange("title-abstract")}
                  className={`inline-flex min-h-11 items-center border-b-2 px-5 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 motion-reduce:transition-none sm:px-8 ${
                    activeTab === "title-abstract"
                      ? "border-accent text-accent"
                      : "border-transparent text-text-secondary hover:text-text-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText
                      className={`w-4 h-4 ${activeTab === "title-abstract" ? "text-accent" : "text-text-secondary"}`}
                    />
                    TITLE/ABSTRACT SCREENING
                  </div>
                </button>
                <button
                  type="button"
                  aria-pressed={activeTab === "full-text"}
                  onClick={() => handleTabChange("full-text")}
                  className={`inline-flex min-h-11 items-center border-b-2 px-5 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 motion-reduce:transition-none sm:px-8 ${
                    activeTab === "full-text"
                      ? "border-accent text-accent"
                      : "border-transparent text-text-secondary hover:text-text-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layout
                      className={`w-4 h-4 ${activeTab === "full-text" ? "text-accent" : "text-text-secondary"}`}
                    />
                    FULL-TEXT SCREENING
                  </div>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
              {activeTab === "title-abstract" ? (
                <TitleAbstractAssignmentTable
                  studySelectionProcessId={screeningProcessId ?? ""}
                  selectionMode={selectionMode}
                />
              ) : (
                <FullTextAssignmentTable
                  studySelectionProcessId={screeningProcessId ?? ""}
                  selectionMode={selectionMode}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPapersPage;
