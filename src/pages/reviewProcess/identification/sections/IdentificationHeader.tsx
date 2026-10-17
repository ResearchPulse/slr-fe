// Page Header: Breadcrumb, title, status badge, and action buttons

import { FiDatabase, FiCheck, FiRefreshCw, FiFileText } from "react-icons/fi";
import Button from "../../../../components/ui/Button";
import PhaseStatusBadge from "../../../../components/reviewProcess/workflow/PhaseStatusBadge";
import type { PhaseStatus } from "../types";

interface IdentificationHeaderProps {
  phaseStatus: PhaseStatus;
  listLoading: boolean;
  statsLoading: boolean;
  onNavigateToProject: () => void;
  onBack: () => void;
  onRefreshData: () => void;
  onCompletePhase: () => void;
  onStartPhase: () => void;
  onReopenPhase: () => void;
}

export default function IdentificationHeader({
  phaseStatus,
  listLoading,
  statsLoading,
  onNavigateToProject,
  onBack,
  onRefreshData,
  onCompletePhase,
  onStartPhase,
  onReopenPhase,
}: IdentificationHeaderProps) {
  return (
    <div className="bg-surface-white border-b border-border shadow-none">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-secondary mb-4">
          <button
            onClick={onNavigateToProject}
            className="hover:text-text-primary transition-colors"
          >
            Project
          </button>
          <span>›</span>
          <button
            onClick={onBack}
            className="hover:text-text-primary transition-colors"
          >
            Review Process
          </button>
          <span>›</span>
          <span className="font-medium text-text-primary">
            Identification Phase
          </span>
        </nav>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-3">
              <FiDatabase className="w-7 h-7 text-accent" />
              <h1 className="review-process-header-title text-2xl font-bold text-text-primary">
                Identification Phase
              </h1>
              <PhaseStatusBadge
                status={
                  phaseStatus === "in-progress"
                    ? "InProgress"
                    : phaseStatus === "completed"
                      ? "Completed"
                      : "NotStarted"
                }
              />
            </div>

            <p className="text-text-secondary mb-4">
              Identify and import relevant records from multiple sources
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:flex-wrap md:justify-end">
            <Button
              variant="secondary"
              className="flex w-full items-center gap-2 md:w-auto"
              onClick={onRefreshData}
              disabled={listLoading || statsLoading}
            >
              <FiRefreshCw
                className={`w-4 h-4 ${listLoading || statsLoading ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
            {phaseStatus === "not-started" && (
              <Button
                className="flex w-full items-center gap-2 md:w-auto"
                onClick={onStartPhase}
              >
                <FiFileText className="w-4 h-4" />
                Start module
              </Button>
            )}
            {phaseStatus === "in-progress" && (
              <Button
                className="flex w-full items-center gap-2 md:w-auto"
                onClick={onCompletePhase}
              >
                <FiCheck className="w-4 h-4" />
                Complete module
              </Button>
            )}
            {phaseStatus === "completed" && (
              <Button
                variant="secondary"
                className="flex w-full items-center gap-2 md:w-auto"
                onClick={onReopenPhase}
              >
                <FiRefreshCw className="w-4 h-4" />
                Reopen module
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
