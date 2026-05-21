import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Files,
  RefreshCw,
  Search,
  Zap,
  ArrowLeft,
} from "lucide-react";
import Button from "../../../../components/ui/Button";
import Checkbox from "../../../../components/ui/Checkbox";
import Card from "../../../../components/ui/Card";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";
import TemplateWizard from "../../../../components/projects/protocol/wizard/TemplateWizard";
import PaperViewerModal from "../../../../components/reviewProcess/leader/PaperViewerModal";
import Select from "../../../../components/ui/Select";
import BulkAssignmentPanelDataExtraction from "../../../../components/reviewProcess/leader/BulkAssignmentPanelDataExtraction";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { toastError } from "../../../../utils/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/Table";
import type { ExtractionPaperStatus, UseDataExtractionWorkspaceReturn } from "../types";
import type { PaperResponse } from "../../../../types/paper";
import {
  TargetReviewer,
  type ExtractionTemplateResponseDto,
} from "../../../../types/dataExtraction";
import { useReviewProcess } from "../../../../hooks/useReviewProcesses";
import { dataExtractionConductingService } from "../../../../services/dataExtractionConductingService";
import ExtractionStatusBadge from "./ExtractionStatusBadge";
import AssignReviewersModal from "./AssignReviewersModal";
import WorkloadSummaryCard from "./WorkloadSummaryCard";

interface DataExtractionDashboardProps {
  ws: UseDataExtractionWorkspaceReturn;
  dashboardPath: string;
}

interface DashboardTask {
  taskId: string;
  paperId: string;
  title: string;
  authors: string | null;
  publicationYear: number | null;
  reviewer1Id: string | null;
  reviewer1Status?: string | null;
  reviewer2Id: string | null;
  reviewer2Status?: string | null;
  status: ExtractionPaperStatus;
}

type DashboardStatusFilter = "all" | ExtractionPaperStatus;
type DashboardViewTab = "queue" | "workload";

interface ReviewerOption {
  value: string;
  label: string;
}

const STATUS_FILTER_OPTIONS: Array<{
  value: DashboardStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Statuses" },
  { value: "todo", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "awaiting-consensus", label: "Consensus" },
  { value: "completed", label: "Completed" },
];

function normalizeStatus(status: string): ExtractionPaperStatus {
  const normalized = status.trim().toLowerCase();

  if (normalized === "in-progress" || normalized === "inprogress") {
    return "in-progress";
  }

  if (normalized === "awaiting-consensus" || normalized === "awaitingconsensus") {
    return "awaiting-consensus";
  }

  if (normalized === "completed") {
    return "completed";
  }

  return "todo";
}

function mapStudyToPaperResponse(
  study: UseDataExtractionWorkspaceReturn["studies"][number],
): PaperResponse {
  const raw = study.raw;
  const fallbackTimestamp = new Date().toISOString();

  return {
    id: study.paperId,
    title: raw.title,
    authors: raw.authors,
    abstract: raw.abstract,
    doi: raw.doi,
    publicationType: raw.publicationType,
    publicationYear:
      raw.publicationYear === null || raw.publicationYear === undefined
        ? null
        : String(raw.publicationYear),
    publicationYearInt: raw.publicationYear,
    publicationDate: raw.publicationDate,
    volume: raw.volume,
    issue: raw.issue,
    pages: raw.pages,
    publisher: raw.publisher,
    language: raw.language,
    keywords: raw.keywords,
    url: raw.url,
    conferenceName: raw.conferenceName,
    conferenceLocation: raw.conferenceLocation,
    journal: raw.journal,
    journalIssn: raw.journalIssn,
    source: raw.source,
    pdfUrl: raw.pdfUrl,
    fullTextAvailable: !!raw.pdfUrl,
    createdAt: raw.publicationDate ?? fallbackTimestamp,
    modifiedAt: raw.publicationDate ?? fallbackTimestamp,
  };
}

function getInitials(name: string): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return parts[0].substring(0, 2).toUpperCase();
}

export default function DataExtractionDashboard({
  ws,
  dashboardPath,
}: DataExtractionDashboardProps) {
  const navigate = useNavigate();
  const { process } = useReviewProcess(ws.processId);
  const extractionProcessId = process?.dataExtractionProcess?.id;

  const reviewerOptions = useMemo<ReviewerOption[]>(
    () => [
      { value: "", label: "Unassigned" },
      ...ws.reviewerOptions.map((reviewer) => ({
        value: reviewer.id,
        label: reviewer.name.startsWith("@") ? reviewer.name : `@${reviewer.name}`,
      })),
    ],
    [ws.reviewerOptions],
  );

  const tasks = useMemo<DashboardTask[]>(
    () =>
      ws.dashboardTasks.map((task) => ({
        taskId: task.taskId,
        paperId: task.paperId,
        title: task.title,
        authors: task.authors ?? null,
        publicationYear: task.publicationYear ?? null,
        reviewer1Id: task.reviewer1Id ?? null,
        reviewer1Status: task.reviewer1Status ?? null,
        reviewer2Id: task.reviewer2Id ?? null,
        reviewer2Status: task.reviewer2Status ?? null,
        status: normalizeStatus(task.status),
      })),
    [ws.dashboardTasks],
  );
  const [selectedPaper, setSelectedPaper] = useState<PaperResponse | null>(null);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [isPaperDetailsOpen, setIsPaperDetailsOpen] = useState(false);
  const [reopenModalPaper, setReopenModalPaper] = useState<DashboardTask | null>(null);
  const [assignModalTask, setAssignModalTask] = useState<DashboardTask | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<DashboardViewTab>("queue");
  const [isCompletePhaseModalOpen, setIsCompletePhaseModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isTemplateWizardOpen, setIsTemplateWizardOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const [exportMenuPosition, setExportMenuPosition] = useState({
    top: 0,
    left: 0,
    minWidth: 0,
  });

  const isProcessCompleted = useMemo(() => {
    return ws.extractionProcessStatus.trim().toLowerCase() === "completed";
  }, [ws.extractionProcessStatus]);

  const canCompletePhase = useMemo(
    () =>
      (ws.extractionProcessStatus.trim().toLowerCase() === "inprogress" || ws.extractionProcessStatus.trim().toLowerCase() === "reopened") &&
      ws.summary.totalIncluded > 0,

    [ws.extractionProcessStatus, ws.summary.totalIncluded],
  );

  const totalPages = Math.max(1, ws.dashboardTotalPages);
  const safeCurrentPage = Math.min(Math.max(ws.pageNumber, 1), totalPages);

  const visibleRange = useMemo(() => {
    if (ws.dashboardTotalCount === 0 || tasks.length === 0) {
      return { start: 0, end: 0 };
    }

    const start = (safeCurrentPage - 1) * ws.pageSize + 1;
    const end = start + tasks.length - 1;

    return { start, end };
  }, [safeCurrentPage, tasks.length, ws.dashboardTotalCount, ws.pageSize]);

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  const paperDetailsById = useMemo(
    () =>
      ws.studies.reduce<Record<string, PaperResponse>>((accumulator, study) => {
        accumulator[study.paperId] = mapStudyToPaperResponse(study);
        return accumulator;
      }, {}),
    [ws.studies],
  );

  const reviewerLabelById = useMemo(
    () =>
      reviewerOptions.reduce<Record<string, string>>((accumulator, option) => {
        if (option.value) {
          accumulator[option.value] = option.label;
        }

        return accumulator;
      }, {}),
    [reviewerOptions],
  );

  const handleAssign = useCallback(
    (paperId: string, reviewer1Id: string, reviewer2Id: string) => {
      if (isProcessCompleted) {
        return;
      }

      ws.assignPaper(paperId, { reviewer1Id, reviewer2Id });
      setAssignModalTask(null);
    },
    [isProcessCompleted, ws],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      if (isProcessCompleted) {
        return;
      }

      ws.setSearchQuery(value);
      ws.setPageNumber(1);
    },
    [isProcessCompleted, ws],
  );

  const handleStatusFilterChange = useCallback(
    (value: DashboardStatusFilter) => {
      if (isProcessCompleted) {
        return;
      }

      ws.setStatusFilter(value);
      ws.setPageNumber(1);
    },
    [isProcessCompleted, ws],
  );

  const handleOpenWorkspace = useCallback(
    (paperId: string) => {
      if (isProcessCompleted) {
        return;
      }

      navigate(`${dashboardPath}/workspace/${paperId}`);
    },
    [dashboardPath, isProcessCompleted, navigate],
  );

  const handleOpenConsensusWorkspace = useCallback(
    async (paperId: string) => {
      if (isProcessCompleted) {
        return;
      }

      try {
        await ws.fetchConsensusWorkspace(paperId);
        navigate(`${dashboardPath}/workspace/${paperId}`);
      } catch (error) {
        toastError(
          "Failed to load consensus workspace",
          getErrorMessage(error, "Unable to load final consensus right now."),
        );
      }
    },
    [dashboardPath, isProcessCompleted, navigate, ws],
  );

  const handleOpenPaperDetails = useCallback(
    (paperId: string) => {
      if (isProcessCompleted) {
        return;
      }

      const paper = paperDetailsById[paperId];
      if (!paper) {
        return;
      }

      setSelectedPaper(paper);
      setIsPaperDetailsOpen(true);
    },
    [isProcessCompleted, paperDetailsById],
  );

  const handleClosePaperDetails = useCallback(() => {
    setIsPaperDetailsOpen(false);
    setSelectedPaper(null);
  }, []);

  const handleDownloadExcel = useCallback(async () => {
    if (!extractionProcessId || isProcessCompleted) {
      return;
    }

    setIsExportingExcel(true);
    setIsExportMenuOpen(false);

    try {
      const blob = await dataExtractionConductingService.exportExtractedData(extractionProcessId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Extraction_Data.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(
        "Download failed",
        getErrorMessage(error, "Unable to download the Excel file right now."),
      );
    } finally {
      setIsExportingExcel(false);
    }
  }, [extractionProcessId, isProcessCompleted]);

  const handleDownloadCsv = useCallback(async () => {
    if (!extractionProcessId || isProcessCompleted) {
      return;
    }

    setIsExportingCsv(true);
    setIsExportMenuOpen(false);

    try {
      const blob =
        await dataExtractionConductingService.exportExtractedDataCsv(extractionProcessId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Extraction_Data.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(
        "Download failed",
        getErrorMessage(error, "Unable to download the CSV file right now."),
      );
    } finally {
      setIsExportingCsv(false);
    }
  }, [extractionProcessId, isProcessCompleted]);

  const isExporting = isExportingExcel || isExportingCsv;

  const updateExportMenuPosition = useCallback(() => {
    if (!exportMenuRef.current) {
      return;
    }

    const rect = exportMenuRef.current.getBoundingClientRect();
    setExportMenuPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      minWidth: Math.max(rect.width, 224),
    });
  }, []);

  useLayoutEffect(() => {
    if (isExportMenuOpen) {
      updateExportMenuPosition();
    }
  }, [isExportMenuOpen, updateExportMenuPosition]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return;
    }

    const handlePositionUpdate = () => {
      updateExportMenuPosition();
    };

    window.addEventListener("scroll", handlePositionUpdate, true);
    window.addEventListener("resize", handlePositionUpdate);

    const handleClickOutside = (event: MouseEvent) => {
      if (!exportMenuRef.current || !exportMenuPanelRef.current) {
        return;
      }

      if (
        event.target instanceof Node &&
        !exportMenuRef.current.contains(event.target) &&
        !exportMenuPanelRef.current.contains(event.target)
      ) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handlePositionUpdate, true);
      window.removeEventListener("resize", handlePositionUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportMenuOpen, updateExportMenuPosition]);

  const handleConfirmCompletePhase = useCallback(async () => {
    if (isProcessCompleted) {
      return;
    }

    await ws.completePhase();
    setIsCompletePhaseModalOpen(false);
  }, [isProcessCompleted, ws]);

  const handleOpenGridWorkspace = useCallback(() => {
    if (isProcessCompleted) {
      return;
    }

    navigate(`${dashboardPath}/grid`);
  }, [dashboardPath, isProcessCompleted, navigate]);

  const handleReopenExtraction = useCallback(
    (paperId: string, target: TargetReviewer) => {
      if (isProcessCompleted) {
        return;
      }

      ws.reopenExtraction(paperId, target);
      setReopenModalPaper(null);
    },
    [isProcessCompleted, ws],
  );

  const isDirectExtraction =
    !!reopenModalPaper && !reopenModalPaper.reviewer1Id && !reopenModalPaper.reviewer2Id;

  const tableColSpan = ws.isCurrentUserLeader ? 5 : 4;

  const queryClient = useQueryClient();

  const eligiblePaperIds = useMemo(() => {
    return tasks.filter((t) => !t.reviewer1Id && !t.reviewer2Id).map((t) => t.paperId);
  }, [tasks]);

  const handleToggleSelectPaper = useCallback((paperId: string) => {
    if (isProcessCompleted) {
      return;
    }

    setSelectedPaperIds((current) =>
      current.includes(paperId) ? current.filter((id) => id !== paperId) : [...current, paperId],
    );
  }, [isProcessCompleted]);

  const handleSelectAllOnPage = useCallback(() => {
    if (isProcessCompleted) {
      return;
    }

    const currentPagePaperIds = eligiblePaperIds;
    setSelectedPaperIds((current) => {
      const allSelected = currentPagePaperIds.every((id) => current.includes(id));
      if (allSelected) {
        return current.filter((id) => !currentPagePaperIds.includes(id));
      }
      // add those that are not yet selected
      const combined = Array.from(new Set([...current, ...currentPagePaperIds]));
      return combined;
    });
  }, [eligiblePaperIds, isProcessCompleted]);

  

  const handleOpenCreateTemplate = useCallback(() => {
    if (isProcessCompleted) {
      return;
    }

    setIsTemplateWizardOpen(true);
  }, [isProcessCompleted]);

  useEffect(() => {
    if (isProcessCompleted) {
      setSelectedPaperIds([]);
      setIsExportMenuOpen(false);
      setAssignModalTask(null);
      setReopenModalPaper(null);
      setIsTemplateWizardOpen(false);
      setIsCompletePhaseModalOpen(false);
      setIsPaperDetailsOpen(false);
      setSelectedPaper(null);
    }
  }, [isProcessCompleted]);

  const handleTemplateWizardComplete = useCallback(
    async (savedTemplate: ExtractionTemplateResponseDto) => {
      setIsTemplateWizardOpen(false);
      await ws.refreshTemplates();

      if (savedTemplate.templateId) {
        ws.setSelectedTemplateId(savedTemplate.templateId);
      }
    },
    [ws],
  );

  const selectedTemplateLabel = ws.selectedTemplate
    ? ws.selectedTemplate.name || "Untitled template"
    : "No template selected";
  const templateActionLabel = ws.selectedTemplate ? "Edit Template" : "Define Template";

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 grid grid-cols-3 items-center flex-shrink-0 z-50 shadow-sm sticky top-16 sm:top-20">
        <div className="flex items-center gap-4">
          <button
            onClick={ws.handleBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
            title="Back to Process Workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none mb-1">
                Data Extraction Dashboard
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Conducting Phase • {ws.isCurrentUserLeader ? "Leader View" : "Reviewer View"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-self-center">
          {/* Center Content if any - currently matching StuSe style */}
        </div>

        <div className="flex items-center gap-4 justify-self-end">
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                Visible Studies
              </p>
              <p className="text-sm font-black text-slate-900 leading-none">
                {ws.dashboardTotalCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-slate-900">Manage Extraction Tasks</h2>
            <p className="text-sm text-slate-500 max-w-3xl">
              Assign reviewers, monitor double extraction progress, and move each included study
              into the extraction workspace.
            </p>
          </div>

          {ws.isCurrentUserLeader && (
            <div className="space-y-4">
              <Card className="rounded-2xl border border-indigo-100 bg-white/90 shadow-lg shadow-indigo-100/40">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                      Extraction Template
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">
                      {selectedTemplateLabel}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Leaders define and maintain the extraction template used by reviewers.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:w-80">
                      <div className="font-medium text-slate-900">Current template</div>
                      <div className="mt-1 truncate">{selectedTemplateLabel}</div>
                    </div>

                    <Button onClick={handleOpenCreateTemplate} disabled={isProcessCompleted}>
                      {templateActionLabel}
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Total Included"
                  value={ws.summary.totalIncluded}
                  subtitle="Studies ready for data extraction"
                  icon={<Files className="h-5 w-5" />}
                  iconClassName="bg-slate-100 text-slate-700"
                />
                <MetricCard
                  title="In Progress"
                  value={ws.summary.inProgress}
                  subtitle="Active reviewer work in flight"
                  icon={<Clock3 className="h-5 w-5" />}
                  iconClassName="bg-blue-50 text-blue-700"
                />
                <MetricCard
                  title="Awaiting Consensus"
                  value={ws.summary.awaitingConsensus}
                  subtitle="Needs adjudication or follow-up"
                  icon={<AlertTriangle className="h-5 w-5" />}
                  iconClassName="bg-amber-50 text-amber-700"
                  className="ring-1 ring-amber-200"
                />
                <MetricCard
                  title="Completed"
                  value={ws.summary.completed}
                  subtitle="Extraction finalized"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  iconClassName="bg-green-50 text-green-700"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-lg shadow-slate-200/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    Complete this phase to lock all extraction data.
                  </p>
                  <Button
                    variant="success"
                    onClick={() => setIsCompletePhaseModalOpen(true)}
                    disabled={isProcessCompleted || !canCompletePhase || ws.isCompleting}
                    isLoading={ws.isCompleting}
                  >
                    Complete Phase
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Card className="rounded-2xl border border-white/70 bg-white/85 p-2 shadow-xl shadow-slate-200/50 backdrop-blur">
            <div className="inline-flex w-full rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveViewTab("queue")}
                disabled={isProcessCompleted}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeViewTab === "queue"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Studies Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab("workload")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeViewTab === "workload"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Workload Summary
              </button>
            </div>
          </Card>

          {activeViewTab === "workload" ? (
            <WorkloadSummaryCard
              summary={ws.workloadSummary}
              isLoading={ws.isWorkloadLoading}
              isLeader={ws.isCurrentUserLeader}
              currentUserId={ws.currentUserId}
            />
          ) : null}

          {activeViewTab === "queue" ? (
            <>
              <Card className="relative z-30 rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={ws.searchQuery}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      placeholder="Search by study title or author"
                      disabled={isProcessCompleted}
                      className="pl-11"
                    />
                  </div>

                  <div className="w-full lg:w-64">
                    <Select
                      value={ws.statusFilter}
                      onChange={(event) =>
                        handleStatusFilterChange(event.target.value as DashboardStatusFilter)
                      }
                      options={STATUS_FILTER_OPTIONS}
                      disabled={isProcessCompleted}
                    />
                  </div>

                  {ws.isCurrentUserLeader && (
                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:ml-auto lg:w-auto">
                      <Button
                        variant="outline"
                        onClick={handleOpenGridWorkspace}
                          disabled={isProcessCompleted}
                        className="w-full lg:w-auto"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Open Grid
                      </Button>

                      <div className="relative z-50 w-full lg:w-auto" ref={exportMenuRef}>
                        <Button
                          onClick={() => setIsExportMenuOpen((current) => !current)}
                          disabled={isProcessCompleted || isExporting || !extractionProcessId}
                          className="w-full lg:w-auto"
                        >
                          {isExporting ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Export Data
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>

                        {isExportMenuOpen
                          ? createPortal(
                              <div
                                ref={exportMenuPanelRef}
                                className="fixed z-[9999] rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl"
                                style={{
                                  top: `${exportMenuPosition.top}px`,
                                  left: `${exportMenuPosition.left}px`,
                                  minWidth: `${exportMenuPosition.minWidth}px`,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={handleDownloadExcel}
                                  disabled={isExporting}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                                  <span className="truncate">Excel (.xlsx)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadCsv}
                                  disabled={isExporting}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <FileText className="h-4 w-4 flex-shrink-0 text-blue-600" />
                                  <span className="truncate">CSV (.csv)</span>
                                </button>
                              </div>,
                              document.body
                            )
                          : null}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-0 shadow-xl shadow-slate-200/50 backdrop-blur">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {ws.isCurrentUserLeader ? "Included Studies Queue" : "My Assigned Studies"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {ws.isCurrentUserLeader
                        ? "Assign reviewers and launch the extraction workspace for each paper."
                        : "Extract data from your assigned studies."}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    Showing {visibleRange.start}-{visibleRange.end} of {ws.dashboardTotalCount}{" "}
                    filtered studies
                  </p>
                </div>

                <div className="overflow-x-auto pb-32">
                  <Table className="min-w-[1060px]">
                    <TableHeader className="bg-slate-50/80">
                      <tr>
                        {ws.isCurrentUserLeader && (
                          <TableHead>
                            <Checkbox
                              aria-label="Select all unassigned papers on page"
                              disabled={isProcessCompleted || eligiblePaperIds.length === 0}
                              checked={eligiblePaperIds.length > 0 && eligiblePaperIds.every((id) => selectedPaperIds.includes(id))}
                              onChange={handleSelectAllOnPage}
                            />
                          </TableHead>
                        )}
                        <TableHead>Study</TableHead>
                        {ws.isCurrentUserLeader && <TableHead>Reviewers</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </tr>
                    </TableHeader>

                    <TableBody>
                      {ws.isDashboardLoading && tasks.length === 0 ? (
                        <TableRow className="cursor-default hover:bg-transparent">
                          <TableCell
                            colSpan={tableColSpan}
                            className="px-6 py-16 text-center text-sm text-slate-500"
                          >
                            Loading dashboard data...
                          </TableCell>
                        </TableRow>
                      ) : tasks.length === 0 ? (
                        <TableRow className="cursor-default hover:bg-transparent">
                          <TableCell colSpan={tableColSpan} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-md">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <Search className="h-5 w-5" />
                              </div>
                              <h3 className="mt-4 text-base font-semibold text-slate-900">
                                No studies match the current filters
                              </h3>
                              <p className="mt-2 text-sm text-slate-500">
                                Try a different search term or switch the status filter to see more
                                studies.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.map((task) => {
                          const assignedReviewerIds = [task.reviewer1Id, task.reviewer2Id].filter(
                            (id): id is string => Boolean(id),
                          );
                          
                          const canExtractTask = ws.canCurrentUserExtractPaper(task.paperId);

                          return (
                            <TableRow
                              key={task.taskId || task.paperId}
                              className="cursor-default hover:bg-slate-50/80"
                            >
                              {ws.isCurrentUserLeader && (
                                <TableCell className="w-12">
                                  <Checkbox
                                    aria-label={`Select paper ${task.title}`}
                                    checked={selectedPaperIds.includes(task.paperId)}
                                    onChange={() => handleToggleSelectPaper(task.paperId)}
                                    disabled={isProcessCompleted || Boolean(task.reviewer1Id || task.reviewer2Id)}
                                    title={
                                      task.reviewer1Id || task.reviewer2Id
                                        ? "Already assigned — bulk assign only unassigned papers"
                                        : "Select paper"
                                    }
                                  />
                                </TableCell>
                              )}

                              <TableCell className="min-w-[320px]">
                                <div>
                                  <p className="font-semibold text-slate-900">{task.title}</p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {task.authors ?? "Unknown authors"} •{" "}
                                    {task.publicationYear ?? "-"}
                                  </p>
                                </div>
                              </TableCell>

                              {ws.isCurrentUserLeader && (
                                <TableCell className="min-w-[260px]">
                                  {assignedReviewerIds.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {[
                                        { id: task.reviewer1Id, status: task.reviewer1Status },
                                        { id: task.reviewer2Id, status: task.reviewer2Status },
                                      ]
                                        .filter((r) => r.id)
                                        .map(({ id, status }) => {
                                          const reviewerId = id as string;
                                          const reviewerName = reviewerLabelById[reviewerId] ?? "@unknown";
                                          const isCompleted = (status ?? "").toLowerCase() === "completed";

                                          return (
                                            <span
                                              key={reviewerId}
                                              title={isCompleted ? "Completed" : "In Progress"}
                                              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold shadow-sm max-w-[220px] truncate ${
                                                isCompleted
                                                  ? "bg-green-50 text-green-700 border border-green-200"
                                                  : "bg-slate-50 text-slate-600 border border-slate-200 opacity-60"
                                              }`}
                                            >
                                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                                isCompleted ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                                              }`}>
                                                {getInitials(reviewerName)}
                                              </span>
                                              <span className="max-w-[140px] truncate">
                                                {reviewerName}
                                              </span>
                                            </span>
                                          );
                                        })}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-slate-400">Unassigned</span>
                                  )}
                                </TableCell>
                              )}

                              <TableCell>
                                <ExtractionStatusBadge status={task.status} />
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="relative flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="!px-2"
                                    onClick={() => handleOpenPaperDetails(task.paperId)}
                                    disabled={isProcessCompleted}
                                    title="View paper details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {task.status === "todo" ? (
                                    ws.isCurrentUserLeader ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => ws.handleOpenDirectWorkspace(task.paperId)}
                                          disabled={isProcessCompleted}
                                          title="Directly Extract Data (Bypass Reviewers)"
                                        >
                                          <Zap className="mr-1 h-4 w-4" />
                                          Direct
                                        </Button>
                                      </>
                                    ) : (
                                      <span className="text-sm font-medium text-slate-400">
                                        Leader assigns reviewers
                                      </span>
                                    )
                                  ) : task.status === "in-progress" ? (
                                    canExtractTask && ws.hasCurrentUserSubmitted(task.paperId) ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled
                                        className="border-slate-300 bg-slate-100 text-slate-500"
                                      >
                                        Submitted (Locked)
                                      </Button>
                                    ) : ws.isCurrentUserLeader ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setReopenModalPaper(task)}
                                          disabled={isProcessCompleted || ws.isReopeningExtraction}
                                        >
                                          Reopen
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => ws.handleOpenDirectWorkspace(task.paperId)}
                                          disabled={isProcessCompleted}
                                          title="Directly Extract Data"
                                        >
                                          <Zap className="mr-1 h-4 w-4" />
                                          Direct
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => handleOpenWorkspace(task.paperId)}
                                        disabled={isProcessCompleted || !canExtractTask}
                                      >
                                        Extract Data
                                      </Button>
                                    )
                                  ) : task.status === "awaiting-consensus" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleOpenConsensusWorkspace(task.paperId)}
                                        disabled={isProcessCompleted}
                                        className="bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-500/30"
                                      >
                                        Resolve
                                      </Button>

                                      {ws.isCurrentUserLeader ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setReopenModalPaper(task)}
                                            disabled={isProcessCompleted || ws.isReopeningExtraction}
                                          >
                                            Reopen
                                          </Button>
                                        </>
                                      ) : null}
                                    </>
                                  ) : task.status === "completed" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenConsensusWorkspace(task.paperId)}
                                        disabled={isProcessCompleted}
                                      >
                                        Final
                                      </Button>

                                      {ws.isCurrentUserLeader ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setReopenModalPaper(task)}
                                            disabled={isProcessCompleted || ws.isReopeningExtraction}
                                          >
                                            Reopen
                                          </Button>
                                        </>
                                      ) : null}
                                    </>
                                  ) : (
                                    <Button size="sm" variant="outline" disabled>
                                      Completed
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-slate-500">
                    Page {safeCurrentPage} of {totalPages} • Showing {visibleRange.start}-
                    {visibleRange.end} of {ws.dashboardTotalCount} studies
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessCompleted || safeCurrentPage === 1}
                      onClick={() => ws.setPageNumber(Math.max(safeCurrentPage - 1, 1))}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>

                    {pageNumbers.map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === safeCurrentPage ? "primary" : "outline"}
                        size="sm"
                        className="min-w-10"
                        disabled={isProcessCompleted}
                        onClick={() => ws.setPageNumber(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessCompleted || safeCurrentPage === totalPages}
                      onClick={() => ws.setPageNumber(Math.min(safeCurrentPage + 1, totalPages))}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </div>

      {selectedPaperIds.length > 0 && !isProcessCompleted ? (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-7xl px-6 pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500">
                Note: papers that already have assigned reviewers are excluded from bulk assignment.
              </div>
              <div className="text-xs text-slate-400">Only unassigned papers can be selected</div>
            </div>
            <BulkAssignmentPanelDataExtraction
              selectedPaperIds={selectedPaperIds}
              ws={ws}
              onAssignmentComplete={() => {
                // clear selection and refresh dashboard queries
                setSelectedPaperIds([]);
                queryClient.invalidateQueries({ queryKey: ["data-extraction-conducting", "dashboard"] });
                queryClient.invalidateQueries({ queryKey: ["data-extraction-conducting", "workload-summary"] });
              }}
            />
          </div>
        </div>
      ) : null}

        <PaperViewerModal
          paper={selectedPaper}
          isOpen={isPaperDetailsOpen}
          onClose={handleClosePaperDetails}
        />

        <AssignReviewersModal
          key={assignModalTask?.paperId ?? "assign-reviewers-modal"}
          isOpen={!!assignModalTask}
          onClose={() => setAssignModalTask(null)}
          task={assignModalTask}
          reviewerOptions={reviewerOptions}
          onAssign={({ reviewer1Id, reviewer2Id }) => {
            if (!assignModalTask) {
              return;
            }

            handleAssign(assignModalTask.paperId, reviewer1Id, reviewer2Id);
          }}
        />

        <Modal
          isOpen={isCompletePhaseModalOpen}
          onClose={() => setIsCompletePhaseModalOpen(false)}
          title="Complete Data Extraction Phase"
          description="Are you sure you want to complete this phase? All extraction data will be locked and cannot be edited without reopening."
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This action locks extraction submissions for this phase.
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setIsCompletePhaseModalOpen(false)}
                disabled={isProcessCompleted || ws.isCompleting}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleConfirmCompletePhase}
                isLoading={ws.isCompleting}
                disabled={isProcessCompleted || !canCompletePhase || ws.isCompleting}
              >
                Confirm Complete
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={!!reopenModalPaper}
          onClose={() => setReopenModalPaper(null)}
          title="Reopen Extraction Workspace"
          description={
            reopenModalPaper
              ? `Study: ${reopenModalPaper.title}`
              : "Select which reviewer extraction should be reopened."
          }
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Warning: Reopening an extraction will delete any previously saved consensus decisions
              for this study.
            </div>

            <div className="space-y-2">
              {isDirectExtraction ? (
                <Button
                  className="w-full"
                          // NOTE: `ws.reopenExtraction(paperId, target)` is the place to call
                          // backend logic that resets reviewer completion flags (e.g., isCompleted)
                          // so the UI will pick up the updated reviewer status after refresh.
                          onClick={() =>
                            reopenModalPaper
                              ? handleReopenExtraction(reopenModalPaper.paperId, TargetReviewer.Direct)
                              : undefined
                          }
                          disabled={isProcessCompleted || !reopenModalPaper || ws.isReopeningExtraction}
                  isLoading={ws.isReopeningExtraction}
                >
                  Reopen Direct Extraction
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full"
                    // Calling `handleReopenExtraction(..., TargetReviewer.Reviewer1)` should
                    // invoke backend logic (via `ws.reopenExtraction`) that marks reviewer1
                    // as not completed (e.g., isCompleted = false) so the dashboard tags
                    // will update to the pending state after refresh.
                    onClick={() =>
                      reopenModalPaper
                        ? handleReopenExtraction(reopenModalPaper.paperId, TargetReviewer.Reviewer1)
                        : undefined
                    }
                    disabled={isProcessCompleted || !reopenModalPaper || ws.isReopeningExtraction}
                    isLoading={ws.isReopeningExtraction}
                  >
                    Reopen Reviewer 1
                  </Button>

                  <Button
                    className="w-full"
                    // Calling `handleReopenExtraction(..., TargetReviewer.Reviewer2)` should
                    // invoke backend logic (via `ws.reopenExtraction`) that marks reviewer2
                    // as not completed (e.g., isCompleted = false) so the dashboard tags
                    // will update to the pending state after refresh.
                    onClick={() =>
                      reopenModalPaper
                        ? handleReopenExtraction(reopenModalPaper.paperId, TargetReviewer.Reviewer2)
                        : undefined
                    }
                    disabled={isProcessCompleted || !reopenModalPaper || ws.isReopeningExtraction}
                    isLoading={ws.isReopeningExtraction}
                  >
                    Reopen Reviewer 2
                  </Button>

                  <Button
                    className="w-full"
                    // Calling `handleReopenExtraction(..., TargetReviewer.Both)` should
                    // invoke backend logic (via `ws.reopenExtraction`) that marks both
                    // reviewers as not completed so the dashboard tags will update to
                    // pending state after refresh.
                    onClick={() =>
                      reopenModalPaper
                        ? handleReopenExtraction(reopenModalPaper.paperId, TargetReviewer.Both)
                        : undefined
                    }
                    disabled={isProcessCompleted || !reopenModalPaper || ws.isReopeningExtraction}
                    isLoading={ws.isReopeningExtraction}
                  >
                    Reopen Both
                  </Button>
                </>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                onClick={() => setReopenModalPaper(null)}
                disabled={isProcessCompleted || ws.isReopeningExtraction}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

      <Modal
        isOpen={isTemplateWizardOpen}
        onClose={() => setIsTemplateWizardOpen(false)}
        title="Define Data Extraction Template"
        description="Build the template that reviewers will use to extract data for this process."
        size="xl"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <TemplateWizard
            dataExtractionProcessId={extractionProcessId}
            projectId={ws.projectId}
            onComplete={(savedTemplate) => {
              void handleTemplateWizardComplete(savedTemplate);
            }}
            isViewOnly={!ws.isCurrentUserLeader || isProcessCompleted}
            existingTemplate={ws.selectedTemplate}
          />
        </div>
      </Modal>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconClassName: string;
  className?: string;
}

function MetricCard({ title, value, subtitle, icon, iconClassName, className }: MetricCardProps) {
  return (
    <Card
      className={`rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-slate-200/50 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClassName}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
