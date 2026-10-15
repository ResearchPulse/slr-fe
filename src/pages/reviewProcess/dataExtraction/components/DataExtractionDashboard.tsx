import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Package,
  RefreshCw,
  Search,
  ArrowLeft,
  UserPlus,
  UsersRound,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../../../utils/cn";
import Button from "../../../../components/ui/Button";
import Checkbox from "../../../../components/ui/Checkbox";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";
import TemplateWizard from "../../../../components/projects/protocol/wizard/TemplateWizard";
import PaperViewerModal from "../../../../components/reviewProcess/leader/PaperViewerModal";
import Select from "../../../../components/ui/Select";
import BulkAssignmentPanelDataExtraction from "../../../../components/reviewProcess/leader/BulkAssignmentPanelDataExtraction";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { toastError } from "../../../../utils/toast";
import { formatAuthorPreview, formatAuthors } from "../../../../utils/formatAuthors";
import { formatDate } from "../../../../utils/dateFormat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/Table";
import type {
  ExtractionPaperStatus,
  UseDataExtractionWorkspaceReturn,
} from "../types";
import { normalizeExtractionStatus } from "../status";
import type { PaperResponse } from "../../../../types/paper";
import {
  TargetReviewer,
  type ExtractionTemplateResponseDto,
} from "../../../../types/dataExtraction";
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
  authorPreview: string | null;
  publicationYear: number | null;
  reviewer1Id: string | null;
  reviewer1Status?: string | null;
  reviewer2Id: string | null;
  reviewer2Status?: string | null;
  ownStatus?: string | null;
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

  const reviewerOptions = useMemo<ReviewerOption[]>(
    () => [
      { value: "", label: "Unassigned" },
      ...ws.reviewerOptions.map((reviewer) => ({
        value: reviewer.id,
        label: reviewer.name.startsWith("@")
          ? reviewer.name
          : `@${reviewer.name}`,
      })),
    ],
    [ws.reviewerOptions],
  );

  const tasks = useMemo<DashboardTask[]>(
    () =>
      ws.dashboardTasks.map((task) => {
        const citationAuthors = formatAuthors(task.citation?.authors);
        const authors = task.authors?.trim() || citationAuthors || null;

        return {
          taskId: task.taskId ?? task.paperId,
          paperId: task.paperId,
          title: task.title || task.citation?.title || "Untitled paper",
          authors,
          authorPreview: formatAuthorPreview(task.citation?.authors) || formatAuthorPreview(authors),
          publicationYear: task.publicationYear ?? task.citation?.year ?? null,
          reviewer1Id: task.reviewer1Id ?? null,
          reviewer1Status: task.reviewer1Status ?? null,
          reviewer2Id: task.reviewer2Id ?? null,
          reviewer2Status: task.reviewer2Status ?? null,
          ownStatus: task.ownStatus ?? null,
          status: normalizeExtractionStatus(task.status),
        };
      }),
    [ws.dashboardTasks],
  );
  const [selectedPaper, setSelectedPaper] = useState<PaperResponse | null>(
    null,
  );
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [isPaperDetailsOpen, setIsPaperDetailsOpen] = useState(false);
  const [reopenModalPaper, setReopenModalPaper] =
    useState<DashboardTask | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenTarget, setReopenTarget] = useState<TargetReviewer>(
    TargetReviewer.Reviewer1,
  );
  const [assignModalTask, setAssignModalTask] = useState<DashboardTask | null>(
    null,
  );
  const [activeViewTab, setActiveViewTab] = useState<DashboardViewTab>("queue");
  const [isCompletePhaseModalOpen, setIsCompletePhaseModalOpen] =
    useState(false);
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
      (ws.extractionProcessStatus.trim().toLowerCase() === "inprogress" ||
        ws.extractionProcessStatus.trim().toLowerCase() === "reopened") &&
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

  const reopenReviewer1Name = useMemo(() => {
    if (!reopenModalPaper?.reviewer1Id) return "Reviewer 1";
    return (
      reviewerLabelById[reopenModalPaper.reviewer1Id] ||
      reopenModalPaper.reviewer1Id
    );
  }, [reopenModalPaper, reviewerLabelById]);

  const reopenReviewer2Name = useMemo(() => {
    if (!reopenModalPaper?.reviewer2Id) return "Reviewer 2";
    return (
      reviewerLabelById[reopenModalPaper.reviewer2Id] ||
      reopenModalPaper.reviewer2Id
    );
  }, [reopenModalPaper, reviewerLabelById]);

  const handleInitiateReopen = useCallback((task: DashboardTask) => {
    setReopenReason("");
    setReopenTarget(TargetReviewer.Reviewer1);
    setReopenModalPaper(task);
  }, []);

  const handleAssign = useCallback(
    (paperId: string, reviewer1Id: string, reviewer2Id: string) => {
      if (isProcessCompleted) {
        return;
      }

      void ws.assignPaper(paperId, {
        reviewerIds: [reviewer1Id, reviewer2Id],
        templateId: ws.selectedTemplateId,
      });
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
      navigate(`${dashboardPath}/workspace/${paperId}`);
    },
    [dashboardPath, navigate],
  );

  const handleOpenConsensusWorkspace = useCallback(
    async (paperId: string) => {
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
    [dashboardPath, navigate, ws],
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

  const handleOpenTask = useCallback(
    (task: DashboardTask) => {
      if (isProcessCompleted) {
        return;
      }

      if (
        ws.isCurrentUserLeader &&
        (task.status === "in-progress" ||
          task.status === "awaiting-consensus" ||
          task.status === "completed") &&
        task.reviewer1Id &&
        task.reviewer2Id
      ) {
        void handleOpenConsensusWorkspace(task.paperId);
        return;
      }

      if (
        !ws.isCurrentUserLeader &&
        (ws.hasCurrentUserSubmitted(task.paperId) || ws.canCurrentUserExtractPaper(task.paperId))
      ) {
        handleOpenWorkspace(task.paperId);
        return;
      }

      handleOpenPaperDetails(task.paperId);
    },
    [
      handleOpenConsensusWorkspace,
      handleOpenPaperDetails,
      handleOpenWorkspace,
      isProcessCompleted,
      ws,
    ],
  );

  const handleDownloadJson = useCallback(async () => {
    if (!ws.projectId || isProcessCompleted) {
      return;
    }

    setIsExportingExcel(true);
    setIsExportMenuOpen(false);

    try {
      const blob = await dataExtractionConductingService.exportExtractedData(
        ws.projectId,
        "json",
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Extraction_Data.json";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(
        "Download failed",
        getErrorMessage(error, "Unable to download the JSON file right now."),
      );
    } finally {
      setIsExportingExcel(false);
    }
  }, [isProcessCompleted, ws.projectId]);
  const handleDownloadCsv = useCallback(async () => {
    if (!ws.projectId || isProcessCompleted) {
      return;
    }

    setIsExportingCsv(true);
    setIsExportMenuOpen(false);

    try {
      const blob =
        await dataExtractionConductingService.exportExtractedDataCsv(
          ws.projectId,
        );
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
  }, [isProcessCompleted, ws.projectId]);
  const handleReopenExtraction = useCallback(
    async (target: TargetReviewer) => {
      const reason = reopenReason.trim();
      if (
        isProcessCompleted ||
        !reopenModalPaper ||
        reason.length === 0
      ) {
        return;
      }

      const expectedVersion = await ws.fetchPaperVersion(
        reopenModalPaper.paperId,
      );
      if (expectedVersion === null) {
        return;
      }

      await ws.reopenExtraction(reopenModalPaper.paperId, {
        target,
        reason,
        expectedVersion,
      });
      setReopenModalPaper(null);
      setReopenReason("");
    },
    [isProcessCompleted, reopenModalPaper, reopenReason, ws],
  );


  const isExporting = isExportingExcel || isExportingCsv;

  const updateExportMenuPosition = useCallback(() => {
    if (!exportMenuRef.current) {
      return;
    }

    const rect = exportMenuRef.current.getBoundingClientRect();
    setExportMenuPosition({
      top: rect.bottom + 8,
      left: rect.left,
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


  const tableColSpan = ws.isCurrentUserLeader ? 5 : 4;


  const queryClient = useQueryClient();

  const eligiblePaperIds = useMemo(() => {
    return tasks
      .filter((t) => !t.reviewer1Id && !t.reviewer2Id)
      .map((t) => t.paperId);
  }, [tasks]);

  const handleToggleSelectPaper = useCallback(
    (paperId: string) => {
      if (isProcessCompleted) {
        return;
      }

      setSelectedPaperIds((current) =>
        current.includes(paperId)
          ? current.filter((id) => id !== paperId)
          : [...current, paperId],
      );
    },
    [isProcessCompleted],
  );

  const handleSelectAllOnPage = useCallback(() => {
    if (isProcessCompleted) {
      return;
    }

    const currentPagePaperIds = eligiblePaperIds;
    setSelectedPaperIds((current) => {
      const allSelected = currentPagePaperIds.every((id) =>
        current.includes(id),
      );
      if (allSelected) {
        return current.filter((id) => !currentPagePaperIds.includes(id));
      }
      // add those that are not yet selected
      const combined = Array.from(
        new Set([...current, ...currentPagePaperIds]),
      );
      return combined;
    });
  }, [eligiblePaperIds, isProcessCompleted]);

  const handleOpenCreateTemplate = useCallback(() => {
    if (isProcessCompleted || !ws.projectId) {
      return;
    }

    setIsTemplateWizardOpen(true);
  }, [isProcessCompleted, ws.projectId]);

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
  const templateActionLabel = ws.selectedTemplate
    ? "Edit Template"
    : "Define Template";
  const completedPercent =
    ws.summary.totalIncluded > 0
      ? Math.min(
          100,
          (ws.summary.completed / ws.summary.totalIncluded) * 100,
        )
      : 0;
  const isExtractionComplete =
    ws.summary.totalIncluded > 0 &&
    ws.summary.completed >= ws.summary.totalIncluded;
  const extractionStatusLabel =
    ws.extractionProcessStatus === "InProgress"
      ? "Active"
      : ws.extractionProcessStatus === "NotStarted"
        ? "Not started"
        : ws.extractionProcessStatus;

  return (
    <div className="min-h-full bg-bg-primary">
      <header className="border-b border-border bg-surface-white">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={ws.handleBack}
              className="shrink-0 rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              title="Back to Process Workspace"
              aria-label="Back to Process Workspace"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="review-process-header-title line-clamp-2 text-base font-semibold leading-5 text-text-primary sm:text-lg">
                {ws.selectedTemplate?.name || "Study extraction"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-secondary">
                  Data extraction / {ws.isCurrentUserLeader ? "Leader view" : "Reviewer view"}
                </span>
                <span className="h-1 w-1 rounded-full bg-text-muted" aria-hidden="true" />
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ws.extractionProcessStatus === "InProgress"
                      ? "bg-success/10 text-success"
                      : ws.extractionProcessStatus === "Completed"
                        ? "bg-primary-light text-primary"
                        : "bg-bg-secondary text-text-secondary"
                  }`}
                >
                  {extractionStatusLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-12 sm:pl-14 lg:gap-5 lg:pl-0">
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Studies</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {ws.dashboardTotalCount} visible
              </div>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Started</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(ws.extractionProcessStartedAt)}
              </div>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Last updated</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(ws.extractionProcessLastUpdatedAt)}
              </div>
            </div>
            {ws.isCurrentUserLeader && (
              <Button
                variant={
                  ws.summary.completed === ws.summary.totalIncluded &&
                  ws.summary.totalIncluded > 0
                    ? "success"
                    : "outline"
                }
                onClick={() => setIsCompletePhaseModalOpen(true)}
                disabled={
                  isProcessCompleted || !canCompletePhase || ws.isCompleting
                }
                isLoading={ws.isCompleting}
                size="sm"
                className="normal-case tracking-normal"
              >
                Complete phase
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1520px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">

        {ws.isCurrentUserLeader && (
          <div className="mb-5 space-y-4">
            <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                  Extraction form
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-semibold text-text-primary">
                    {selectedTemplateLabel}
                  </span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-secondary">
                    {ws.answerFields.length} fields
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleOpenCreateTemplate}
                disabled={isProcessCompleted}
                size="sm"
                className="normal-case tracking-normal"
              >
                {templateActionLabel}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </section>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Included"
                  value={ws.summary.totalIncluded}
                  icon={<FileCheck2 className="h-[18px] w-[18px]" aria-hidden="true" />}
                  tone="blue"
                />
                <MetricCard
                  title="In progress"
                  value={ws.summary.inProgress}
                  icon={<Clock3 className="h-[18px] w-[18px]" aria-hidden="true" />}
                  tone="amber"
                />
                <MetricCard
                  title="Awaiting consensus"
                  value={ws.summary.awaitingConsensus}
                  icon={<UsersRound className="h-[18px] w-[18px]" aria-hidden="true" />}
                  tone="purple"
                />
                <MetricCard
                  title="Completed"
                  value={ws.summary.completed}
                  icon={<CheckCircle2 className="h-[18px] w-[18px]" aria-hidden="true" />}
                  tone="emerald"
                />
              </div>

              <section className="rounded-xl border border-border bg-surface-white px-4 py-4 sm:px-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-semibold text-text-primary" role="heading" aria-level={3}>
                    Extraction Progress
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="text-text-secondary">
                      <span className="font-semibold tabular-nums text-text-primary">
                        {ws.summary.completed} / {ws.summary.totalIncluded}
                      </span>{" "}
                      completed
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        isExtractionComplete ? "text-success" : "text-primary"
                      }`}
                    >
                      {Math.round(completedPercent)}%
                    </span>
                    {isExtractionComplete && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Complete
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-bg-secondary"
                  role="progressbar"
                  aria-label="Extraction progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(completedPercent)}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                      isExtractionComplete ? "bg-success" : "bg-primary"
                    }`}
                    style={{ width: `${completedPercent}%` }}
                  />
                </div>
              </section>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-border">
          <h2 className="pb-3 text-lg font-semibold tracking-tight text-text-primary">
            Studies
          </h2>
          <div className="flex items-center gap-5" role="tablist" aria-label="Study views">
            <button
              type="button"
              role="tab"
              aria-selected={activeViewTab === "queue"}
              onClick={() => setActiveViewTab("queue")}
              disabled={isProcessCompleted}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors duration-150 ${
                activeViewTab === "queue"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              Studies queue
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeViewTab === "workload"}
              onClick={() => setActiveViewTab("workload")}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors duration-150 ${
                activeViewTab === "workload"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              Workload
            </button>
          </div>
        </div>

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
              <section className="overflow-hidden rounded-xl border border-border bg-surface-white">
                <div className="border-b border-border px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                    <Input
                      value={ws.searchQuery}
                      onChange={(event) =>
                        handleSearchChange(event.target.value)
                      }
                      placeholder="Search by study title or author"
                      disabled={isProcessCompleted}
                      className="pl-11"
                    />
                  </div>

                  <div className="w-full lg:w-64">
                    <Select
                      value={ws.statusFilter}
                      onChange={(event) =>
                        handleStatusFilterChange(
                          event.target.value as DashboardStatusFilter,
                        )
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

                      <div
                        className="relative w-full lg:w-auto"
                        ref={exportMenuRef}
                      >
                        <Button
                          onClick={() =>
                            setIsExportMenuOpen((current) => !current)
                          }
                          disabled={
                            isProcessCompleted ||
                            isExporting ||
                            !ws.projectId
                          }
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
                                className="fixed z-(--z-index-dropdown) rounded-xl border border-border bg-surface-white p-1.5 shadow-lg"
                                style={{
                                  top: `${exportMenuPosition.top}px`,
                                  left: `${exportMenuPosition.left}px`,
                                  minWidth: `${exportMenuPosition.minWidth}px`,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={handleDownloadJson}
                                  disabled={isExporting}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                                  <span className="truncate">JSON (.json)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadCsv}
                                  disabled={isExporting}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <FileText className="h-4 w-4 flex-shrink-0 text-accent" />
                                  <span className="truncate">CSV (.csv)</span>
                                </button>
                              </div>,
                              document.body,
                            )
                          : null}
                      </div>
                    </div>
                  )}
                  </div>
                  {selectedPaperIds.length > 0 && !isProcessCompleted ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-xs text-text-secondary">
                      Bulk assignment applies to unassigned studies only.
                    </p>
                    <BulkAssignmentPanelDataExtraction
                      selectedPaperIds={selectedPaperIds}
                      ws={ws}
                      onAssignmentComplete={() => {
                        setSelectedPaperIds([]);
                        queryClient.invalidateQueries({
                          queryKey: ["data-extraction-conducting", "dashboard"],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["data-extraction-conducting", "workload-summary"],
                        });
                      }}
                    />
                  </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                      {ws.isCurrentUserLeader
                        ? "Included Studies Queue"
                        : "My Assigned Studies"}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {ws.isCurrentUserLeader
                        ? "Assign reviewers and launch the extraction workspace for each paper."
                        : "Extract data from your assigned studies."}
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Showing {visibleRange.start}-{visibleRange.end} of{" "}
                    {ws.dashboardTotalCount} filtered studies
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-[1060px] table-fixed">
                    <colgroup>
                      {ws.isCurrentUserLeader && <col style={{ width: 52 }} />}
                      <col />
                      <col style={{ width: 208 }} />
                      <col style={{ width: 160 }} />
                      <col style={{ width: 256 }} />
                    </colgroup>
                    <TableHeader className="bg-bg-secondary/70">
                      <tr>
                        {ws.isCurrentUserLeader && (
                          <TableHead className="px-2 py-3.5 text-center">
                            <Checkbox
                              aria-label="Select all unassigned papers on page"
                              disabled={
                                isProcessCompleted ||
                                eligiblePaperIds.length === 0
                              }
                              checked={
                                eligiblePaperIds.length > 0 &&
                                eligiblePaperIds.every((id) =>
                                  selectedPaperIds.includes(id),
                                )
                              }
                              onChange={handleSelectAllOnPage}
                            />
                          </TableHead>
                        )}
                        <TableHead className="px-4 py-3.5 text-left">Study</TableHead>
                        <TableHead className="whitespace-nowrap px-4 py-3.5 text-left">Reviewers</TableHead>
                        <TableHead className="whitespace-nowrap px-4 py-3.5 text-center">Status</TableHead>
                        <TableHead className="whitespace-nowrap px-4 py-3.5 text-center">Action</TableHead>
                      </tr>
                    </TableHeader>

                    <TableBody>
                      {ws.isDashboardLoading && tasks.length === 0 ? (
                        <TableRow className="cursor-default hover:bg-transparent">
                          <TableCell
                            colSpan={tableColSpan}
                            className="px-6 py-12 text-center text-sm text-text-secondary"
                          >
                            Loading dashboard data...
                          </TableCell>
                        </TableRow>
                      ) : tasks.length === 0 ? (
                        <TableRow className="cursor-default hover:bg-transparent">
                          <TableCell
                            colSpan={tableColSpan}
                            className="px-6 py-12 text-center"
                          >
                            <div className="mx-auto max-w-md">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary text-text-secondary">
                                <Search className="h-5 w-5" />
                              </div>
                              <h3 className="mt-4 text-base font-semibold text-text-primary">
                                No studies match the current filters
                              </h3>
                              <p className="mt-2 text-sm text-text-secondary">
                                Try a different search term or switch the status
                                filter to see more studies.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.map((task) => {
                          const assignedReviewerIds = [
                            task.reviewer1Id,
                            task.reviewer2Id,
                          ].filter((id): id is string => Boolean(id));
                          const isAssignedToCurrentUser =
                            !ws.isCurrentUserLeader && task.ownStatus != null;

                          const canExtractTask = ws.canCurrentUserExtractPaper(
                            task.paperId,
                          );
                          const hasSubmittedExtraction =
                            !ws.isCurrentUserLeader &&
                            ws.hasCurrentUserSubmitted(task.paperId);

                          return (
                            <TableRow
                              key={task.taskId || task.paperId}
                              className="group cursor-pointer transition-colors hover:bg-primary-light/60"
                              onClick={(event) => {
                                const target = event.target as HTMLElement | null;
                                if (target?.closest("button, input, select, textarea, a, [role='button']")) {
                                  return;
                                }
                                handleOpenTask(task);
                              }}
                            >
                              {ws.isCurrentUserLeader && (
                              <TableCell className="px-2 py-3 text-center">
                                  <Checkbox
                                    aria-label={`Select paper ${task.title}`}
                                    checked={selectedPaperIds.includes(
                                      task.paperId,
                                    )}
                                    onChange={() =>
                                      handleToggleSelectPaper(task.paperId)
                                    }
                                    disabled={
                                      isProcessCompleted ||
                                      Boolean(
                                        task.reviewer1Id || task.reviewer2Id,
                                      )
                                    }
                                    title={
                                      task.reviewer1Id || task.reviewer2Id
                                        ? "Already assigned — bulk assign only unassigned papers"
                                        : "Select paper"
                                    }
                                  />
                                </TableCell>
                              )}

                              <TableCell className="px-4 py-3 text-left">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {hasSubmittedExtraction ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenWorkspace(task.paperId)
                                        }
                                        className="text-left text-sm font-semibold leading-5 text-text-primary transition-colors group-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                        aria-label={`Review submitted extraction: ${task.title}`}
                                      >
                                        {task.title}
                                      </button>
                                    ) : (
                                      <p className="text-sm font-semibold leading-5 text-text-primary transition-colors group-hover:text-primary">
                                        {task.title}
                                      </p>
                                    )}
                                  </div>
                                  <p
                                    className="mt-1 block max-w-full truncate text-xs text-text-secondary"
                                    title={task.authors ?? undefined}
                                  >
                                    {task.authorPreview ?? task.authors ?? "Unknown authors"} •{" "}
                                    {task.publicationYear ?? "-"}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell className="whitespace-nowrap px-4 py-3 text-left">
                                {assignedReviewerIds.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      {
                                        id: task.reviewer1Id,
                                        status: task.reviewer1Status,
                                      },
                                      {
                                        id: task.reviewer2Id,
                                        status: task.reviewer2Status,
                                      },
                                    ]
                                      .filter((r) => r.id)
                                      .map(({ id, status }) => {
                                        const reviewerId = id as string;
                                        const isCurrentUser =
                                          Boolean(ws.currentUserId) &&
                                          reviewerId === ws.currentUserId;
                                        const rawName =
                                          reviewerLabelById[reviewerId] ??
                                          "@unknown";
                                        const reviewerName = isCurrentUser
                                          ? `${rawName} (You)`
                                          : rawName;
                                        const isCompleted =
                                          (status ?? "").toLowerCase() ===
                                          "completed";

                                        return (
                                          <span
                                            key={reviewerId}
                                            title={
                                              isCompleted
                                                ? "Completed"
                                                : "In Progress"
                                            }
                                            className={`inline-flex max-w-[220px] items-center gap-2 truncate rounded-full border px-2 py-1 text-xs font-medium ${
                                              isCurrentUser
                                                ? "bg-primary-light text-accent border-accent/30 font-semibold"
                                                : isCompleted
                                                ? "bg-surface-white text-green-700 border border-border"
                                                : "bg-bg-secondary text-text-secondary border border-border opacity-60"
                                            }`}
                                          >
                                            <span
                                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                                isCurrentUser
                                                  ? "bg-primary text-white"
                                                  : isCompleted
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-primary-light text-accent"
                                              }`}
                                            >
                                              {getInitials(rawName)}
                                            </span>
                                            <span className="max-w-[140px] truncate">
                                              {reviewerName}
                                            </span>
                                          </span>
                                        );
                                      })}
                                  </div>
                                ) : isAssignedToCurrentUser ? (
                                  <span className="inline-flex items-center rounded-full border border-accent/30 bg-primary-light px-2.5 py-1 text-xs font-semibold text-accent">
                                    Assigned to you
                                  </span>
                                ) : (
                                  ws.isCurrentUserLeader ? (
                                    <button
                                      type="button"
                                      onClick={() => setAssignModalTask(task)}
                                      disabled={isProcessCompleted}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent transition-colors"
                                      title="Click to assign reviewers"
                                    >
                                      <UserPlus className="h-3 w-3" />
                                      Unassigned
                                    </button>
                                  ) : (
                                    <span className="text-sm text-text-secondary">
                                      Unassigned
                                    </span>
                                  )
                                )}
                              </TableCell>

                              <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                                <ExtractionStatusBadge status={task.status} />
                              </TableCell>

                              <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                                <div className="relative flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="!rounded-xl !px-2"
                                    onClick={() =>
                                      ws.isCurrentUserLeader &&
                                      task.status !== "todo" &&
                                      task.reviewer1Id &&
                                      task.reviewer2Id
                                        ? void handleOpenConsensusWorkspace(task.paperId)
                                        : handleOpenPaperDetails(task.paperId)
                                    }
                                    disabled={isProcessCompleted && !ws.isCurrentUserLeader}
                                    title={
                                      ws.isCurrentUserLeader &&
                                      task.status !== "todo" &&
                                      task.reviewer1Id &&
                                      task.reviewer2Id
                                        ? "View reviewer extraction"
                                        : "View paper details"
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {hasSubmittedExtraction ? (
                                    <span className="inline-flex items-center rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-xs font-semibold text-text-secondary">
                                      Submitted (Locked)
                                    </span>
                                  ) : task.status === "todo" ? (
                                    canExtractTask ? (
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() =>
                                          handleOpenWorkspace(task.paperId)
                                        }
                                        disabled={isProcessCompleted}
                                        className="!rounded-xl"
                                      >
                                        Extract
                                      </Button>
                                    ) : (
                                      <span className="text-sm font-medium text-text-secondary">
                                        {assignedReviewerIds.length > 0
                                          ? "Assigned to others"
                                          : "Leader assigns reviewers"}
                                      </span>
                                    )
                                  ) : task.status === "in-progress" ? (
                                    ws.isCurrentUserLeader ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleInitiateReopen(task)}
                                        disabled={
                                          isProcessCompleted ||
                                          ws.isReopeningExtraction
                                        }
                                      >
                                        Reopen
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleOpenWorkspace(task.paperId)
                                        }
                                        disabled={
                                          isProcessCompleted || !canExtractTask
                                        }
                                      >
                                        Extract Data
                                      </Button>
                                    )
                                  ) : task.status === "awaiting-consensus" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleOpenConsensusWorkspace(
                                            task.paperId,
                                          )
                                        }
                                        disabled={isProcessCompleted}
                                        className="!rounded-xl bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                      >
                                        Resolve
                                      </Button>

                                      {ws.isCurrentUserLeader ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleInitiateReopen(task)}
                                            disabled={
                                              isProcessCompleted ||
                                              ws.isReopeningExtraction
                                            }
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
                                        onClick={() =>
                                          handleOpenConsensusWorkspace(
                                            task.paperId,
                                          )
                                        }
                                        disabled={isProcessCompleted}
                                      >
                                        Final
                                      </Button>

                                      {ws.isCurrentUserLeader ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleInitiateReopen(task)}
                                            disabled={
                                              isProcessCompleted ||
                                              ws.isReopeningExtraction
                                            }
                                          >
                                            Reopen
                                          </Button>
                                        </>
                                      ) : null}
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled
                                    >
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

                <div className="flex flex-col gap-3 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between sm:px-6">
                  <p className="text-sm text-text-secondary">
                    Page {safeCurrentPage} of {totalPages} • Showing{" "}
                    {visibleRange.start}-{visibleRange.end} of{" "}
                    {ws.dashboardTotalCount} studies
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessCompleted || safeCurrentPage === 1}
                      onClick={() =>
                        ws.setPageNumber(Math.max(safeCurrentPage - 1, 1))
                      }
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>

                    {pageNumbers.map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={
                          pageNumber === safeCurrentPage ? "primary" : "outline"
                        }
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
                      disabled={
                        isProcessCompleted || safeCurrentPage === totalPages
                      }
                      onClick={() =>
                        ws.setPageNumber(
                          Math.min(safeCurrentPage + 1, totalPages),
                        )
                      }
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </section>
            </>
          ) : null}
      </div>

      <PaperViewerModal
        paper={selectedPaper}
        isOpen={isPaperDetailsOpen}
        onClose={handleClosePaperDetails}
        hideActions
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
              disabled={
                isProcessCompleted || !canCompletePhase || ws.isCompleting
              }
            >
              Confirm Complete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!reopenModalPaper}
        onClose={() => {
          if (!ws.isReopeningExtraction) {
            setReopenModalPaper(null);
            setReopenReason("");
          }
        }}
        title="Reopen Extraction Workspace"
        description="Select which reviewer's extraction should be unlocked and provide a required reason."
        size="md"
      >
        <div className="space-y-4">
          {/* Target Study Info Card */}
          {reopenModalPaper && (
            <div className="rounded-xl border border-border bg-bg-primary/50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                <FileText className="h-3.5 w-3.5 text-accent" />
                Target Study
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-text-primary">
                {reopenModalPaper.title}
              </p>
            </div>
          )}

          {/* Destructive Warning Box */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <span className="font-bold">Important Notice:</span> Reopening will unlock the selected extraction workspace and{" "}
              <strong className="font-bold text-amber-950">
                permanently delete
              </strong>{" "}
              any previously saved consensus decisions for this study.
            </div>
          </div>

          {/* Target Reviewer Selector */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-secondary">
              Select Extraction to Reopen <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setReopenTarget(TargetReviewer.Reviewer1)}
                disabled={ws.isReopeningExtraction}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                  reopenTarget === TargetReviewer.Reviewer1
                    ? "border-primary bg-primary-light/50 ring-1 ring-primary shadow-xs"
                    : "border-border bg-surface-white hover:border-primary/40 hover:bg-bg-primary/40",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Reviewer 1</span>
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                      reopenTarget === TargetReviewer.Reviewer1
                        ? "border-primary bg-primary"
                        : "border-border bg-surface-white",
                    )}
                  >
                    {reopenTarget === TargetReviewer.Reviewer1 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <span className="mt-1 line-clamp-1 text-[11px] font-medium text-text-secondary">
                  {reopenReviewer1Name}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReopenTarget(TargetReviewer.Reviewer2)}
                disabled={ws.isReopeningExtraction}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                  reopenTarget === TargetReviewer.Reviewer2
                    ? "border-primary bg-primary-light/50 ring-1 ring-primary shadow-xs"
                    : "border-border bg-surface-white hover:border-primary/40 hover:bg-bg-primary/40",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Reviewer 2</span>
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                      reopenTarget === TargetReviewer.Reviewer2
                        ? "border-primary bg-primary"
                        : "border-border bg-surface-white",
                    )}
                  >
                    {reopenTarget === TargetReviewer.Reviewer2 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <span className="mt-1 line-clamp-1 text-[11px] font-medium text-text-secondary">
                  {reopenReviewer2Name}
                </span>
              </button>
            </div>

            {/* Both Reviewers Option */}
            <button
              type="button"
              onClick={() => setReopenTarget(TargetReviewer.Both)}
              disabled={ws.isReopeningExtraction}
              className={cn(
                "mt-2.5 flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all",
                reopenTarget === TargetReviewer.Both
                  ? "border-primary bg-primary-light/50 ring-1 ring-primary shadow-xs"
                  : "border-border bg-surface-white hover:border-primary/40 hover:bg-bg-primary/40",
              )}
            >
              <div>
                <span className="text-xs font-bold text-text-primary">Both Reviewers</span>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  Unlocks both {reopenReviewer1Name} and {reopenReviewer2Name} for full re-extraction.
                </p>
              </div>
              <span
                className={cn(
                  "ml-3 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  reopenTarget === TargetReviewer.Both
                    ? "border-primary bg-primary"
                    : "border-border bg-surface-white",
                )}
              >
                {reopenTarget === TargetReviewer.Both && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
            </button>
          </div>

          {/* Reason Justification Textarea */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="reopen-reason-textarea"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
              >
                Reason for Reopening <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-text-muted">Required for Audit Trail</span>
            </div>
            <textarea
              id="reopen-reason-textarea"
              rows={2}
              className="w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              placeholder="Explain why this extraction workspace needs to be reopened..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              disabled={ws.isReopeningExtraction}
            />
            {!reopenReason.trim() ? (
              <p className="mt-2 text-xs font-medium text-amber-800">
                Please provide a justification to enable confirmation.
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                ✓ Justification provided ({reopenReason.trim().length} chars)
              </p>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setReopenModalPaper(null);
                setReopenReason("");
              }}
              disabled={ws.isReopeningExtraction}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleReopenExtraction(reopenTarget)}
              disabled={
                isProcessCompleted ||
                !reopenModalPaper ||
                !reopenReason.trim() ||
                ws.isReopeningExtraction
              }
              isLoading={ws.isReopeningExtraction}
              className="!rounded-xl bg-amber-600 text-white shadow-xs hover:bg-amber-700 focus-visible:ring-amber-500 disabled:!bg-bg-secondary disabled:!text-text-muted disabled:!border-border disabled:!opacity-100 disabled:!shadow-none"
            >
              <AlertTriangle className="mr-1.5 h-4 w-4" />
              Confirm Reopen
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
        className="!h-[90vh] !max-h-[90vh] !max-w-[1200px]"
        bodyClassName="!min-h-0 !overflow-hidden !p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          {ws.projectId ? (
            <TemplateWizard
              projectId={ws.projectId}
              existingTemplate={ws.selectedTemplate}
              onComplete={(savedTemplate) => {
                void handleTemplateWizardComplete(savedTemplate);
              }}
            />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  tone: "blue" | "amber" | "purple" | "emerald";
}

function MetricCard({ title, value, icon, tone }: MetricCardProps) {
  const toneStyles = {
    blue: {
      card: "border-border bg-surface-white",
      icon: "bg-primary-light text-primary",
      value: "text-primary",
    },
    amber: {
      card: "border-border bg-surface-white",
      icon: "bg-warning/10 text-warning",
      value: "text-warning",
    },
    purple: {
      card: "border-border bg-surface-white",
      icon: "bg-primary-light text-primary",
      value: "text-primary",
    },
    emerald: {
      card: "border-border bg-surface-white",
      icon: "bg-success/10 text-success",
      value: "text-success",
    },
  }[tone];

  return (
    <div
      className={`flex min-h-[112px] flex-col justify-between rounded-xl border p-4 shadow-[0_1px_2px_rgba(18,35,49,0.04)] ${toneStyles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="pt-1 text-xs font-semibold text-text-secondary">{title}</div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneStyles.icon}`}
        >
          {icon}
        </span>
      </div>
      <div className={`text-3xl font-semibold leading-none tracking-tight tabular-nums ${toneStyles.value}`}>
        {value}
      </div>
    </div>
  );
}
