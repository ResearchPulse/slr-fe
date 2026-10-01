import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiSave,
  FiEye,
  FiDownload,
  FiMenu,
  FiUpload,
  FiRefreshCw,
  FiFileText,
} from "react-icons/fi";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
import Drawer from "../ui/Drawer";
import CompletionProgress from "./CompletionProgress";
import SectionSidebar from "./SectionSidebar";
import ChecklistItem from "./ChecklistItem";
import SampleAnswerModal from "./SampleAnswerModal";
import ChecklistPdfPanel from "./ChecklistPdfPanel";
import {
  useChecklistData,
  useChecklistEditorState,
} from "../../hooks/useChecklistData";
import { useSignalRSubscription } from "../../hooks/useSignalR";
import { checklistApi } from "../../services/checklistService";
import { cn } from "../../utils/cn";
import type { HighlightArea } from "@react-pdf-viewer/highlight";
import { AutoFillStatus } from "../../types/signalr";
import type { ChecklistAutoFillStatusPayload } from "../../types/signalr";
import type {
  ChecklistItemResponse,
  ReviewChecklist,
  SampleAnswerData,
} from "../../types/checklist";

interface ChecklistDraftChange {
  itemTemplateId: string;
  reportLocation?: string;
  isReported?: boolean;
}

/** Status labels displayed in the UI for each auto-fill stage */
const AUTO_FILL_STAGE_LABELS: Record<string, string> = {
  [AutoFillStatus.Queued]: "Queued — waiting to start…",
  [AutoFillStatus.ExtractingText]: "Extracting text from PDF…",
  [AutoFillStatus.TextExtracted]: "Text extracted successfully",
  [AutoFillStatus.AnalyzingWithAI]: "Analyzing with AI…",
  [AutoFillStatus.SavingResults]: "Saving results…",
  [AutoFillStatus.Completed]: "Auto-fill complete!",
  [AutoFillStatus.Failed]: "Auto-fill failed",
};

interface AutoFillState {
  isActive: boolean;
  status: string | null;
  message: string | null;
  completionPercentage?: number | null;
  totalItems?: number | null;
  mappedItems?: number | null;
}

interface ChecklistEditorProps {
  checklist: ReviewChecklist | null;
  isLoading?: boolean;
  onSave?: (changes: ChecklistDraftChange[]) => Promise<void>;
  onGenerateReport?: (format: "word" | "pdf") => Promise<void>;
  /** Called when AI auto-fill completes so the parent can re-fetch checklist data */
  onAutoFillCompleted?: () => void;
}

/**
 * Main Checklist Editor Component
 * Professional form builder-style interface for PRISMA checklist completion
 */
const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  checklist,
  isLoading = false,
  onSave,
  onGenerateReport,
  onAutoFillCompleted,
}) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sampleAnswerData, setSampleAnswerData] =
    useState<SampleAnswerData | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sectionProgress,
    updateItemResponse,
    getItemResponse,
    hasDraftChanges,
    hasDraftChange,
    getDraftChangesToSubmit,
    clearDraftChanges,
    clearDraftChange,
  } = useChecklistData(checklist);

  const {
    activeSection,
    isSidebarCollapsed,
    isSaving,
    saveError,
    showSampleModal,
    setActiveSection,
    toggleSidebar,
    setSaving,
    setError,
    showSample,
    closeSample,
  } = useChecklistEditorState();

  // --- PDF panel state ---
  const [isPdfPanelOpen, setIsPdfPanelOpen] = useState(false);
  const [activePdfCoordinate, setActivePdfCoordinate] =
    useState<HighlightArea | null>(null);
  const [pdfWidth, setPdfWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 300;
      const sidebarWidth = isSidebarCollapsed ? 64 : 260;
      const minChecklistWidth = 450;
      const maxWidth = window.innerWidth - sidebarWidth - minChecklistWidth;
      setPdfWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isSidebarCollapsed]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (pdfWidth) {
        const sidebarWidth = isSidebarCollapsed ? 64 : 260;
        const minChecklistWidth = 350;
        const maxWidth = window.innerWidth - sidebarWidth - minChecklistWidth;
        if (pdfWidth > maxWidth) {
          setPdfWidth(Math.max(300, maxWidth));
        }
      }
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [pdfWidth, isSidebarCollapsed]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  // --- Auto-fill state ---
  const [autoFillState, setAutoFillState] = useState<AutoFillState>({
    isActive: false,
    status: null,
    message: null,
  });

  // ─── SignalR subscription for auto-fill status updates ────────────────────
  useSignalRSubscription(
    "OnChecklistAutoFillStatus",
    useCallback(
      (payload: ChecklistAutoFillStatusPayload) => {
        // Only process events for the current checklist
        if (!checklist || payload.reviewChecklistId !== checklist.id) return;

        const isTerminal =
          payload.status === AutoFillStatus.Completed ||
          payload.status === AutoFillStatus.Failed;

        setAutoFillState({
          isActive: !isTerminal,
          status: payload.status,
          message: payload.message,
          completionPercentage: payload.completionPercentage,
          totalItems: payload.totalItems,
          mappedItems: payload.mappedItems,
        });

        // When completed, notify parent to re-fetch data
        if (payload.status === AutoFillStatus.Completed) {
          onAutoFillCompleted?.();
        }
      },
      [checklist?.id, onAutoFillCompleted],
    ),
  );

  // Auto-dismiss the status banner after terminal states
  useEffect(() => {
    if (
      autoFillState.status === AutoFillStatus.Completed ||
      autoFillState.status === AutoFillStatus.Failed
    ) {
      const timeout = setTimeout(
        () => {
          setAutoFillState((prev) => ({ ...prev, isActive: false }));
        },
        autoFillState.status === AutoFillStatus.Completed ? 5000 : 10000,
      );
      return () => clearTimeout(timeout);
    }
  }, [autoFillState.status]);

  // ─── Auto-fill handler ───────────────────────────────────────────────────
  const handleAutoFill = useCallback(
    async (file: File) => {
      if (!checklist) return;

      // Validate file
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB.");
        return;
      }

      try {
        setError(null);
        setAutoFillState({
          isActive: true,
          status: AutoFillStatus.Queued,
          message: "Uploading PDF…",
        });

        // POST the PDF — backend returns 202 Accepted immediately
        const initialStatus = await checklistApi.autoFillChecklist(
          checklist.id,
          file,
        );

        // Update with the server-confirmed initial status
        setAutoFillState({
          isActive: true,
          status: initialStatus.status,
          message: initialStatus.message,
        });

        // From here, SignalR takes over with real-time updates
      } catch (error) {
        setAutoFillState({
          isActive: false,
          status: AutoFillStatus.Failed,
          message:
            error instanceof Error
              ? error.message
              : "Failed to start auto-fill",
        });
        setError(
          error instanceof Error
            ? error.message
            : "Failed to start auto-fill. Please try again.",
        );
      }
    },
    [checklist, setError],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleAutoFill(file);
      }
      // Reset input so re-selecting the same file works
      e.target.value = "";
    },
    [handleAutoFill],
  );

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave || !hasDraftChanges) return;

    try {
      setSavingItemId(null);
      setSaving(true);
      setError(null);
      const changes = getDraftChangesToSubmit();
      await onSave(changes);
      clearDraftChanges();
      setLastSavedAt(new Date().toISOString());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save changes",
      );
    } finally {
      setSaving(false);
    }
  }, [
    clearDraftChanges,
    getDraftChangesToSubmit,
    hasDraftChanges,
    onSave,
    setError,
    setSaving,
  ]);

  const handleSaveItem = useCallback(
    async (itemTemplateId: string) => {
      if (!onSave || !hasDraftChange(itemTemplateId)) return;

      const response = getItemResponse(itemTemplateId);
      if (!response) return;

      try {
        setSavingItemId(itemTemplateId);
        setSaving(true);
        setError(null);
        await onSave([
          {
            itemTemplateId,
            reportLocation: response.reportLocation,
            isReported: response.isReported,
          },
        ]);
        clearDraftChange(itemTemplateId);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to save item",
        );
      } finally {
        setSaving(false);
        setSavingItemId(null);
      }
    },
    [
      clearDraftChange,
      getItemResponse,
      hasDraftChange,
      onSave,
      setError,
      setSaving,
    ],
  );

  const handleGenerateReport = useCallback(
    async (format: "word" | "pdf") => {
      if (!onGenerateReport) return;

      try {
        setSaving(true);
        await onGenerateReport(format);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to generate report",
        );
      } finally {
        setSaving(false);
      }
    },
    [onGenerateReport, setError, setSaving],
  );

  const handleShowSampleAnswer = useCallback(
    (item: {
      itemNumber: string;
      topic: string;
      defaultSampleAnswer?: string | null;
    }) => {
      setSampleAnswerData({
        itemNumber: item.itemNumber,
        topic: item.topic,
        sampleAnswer:
          item.defaultSampleAnswer?.trim() ||
          "No sample answer is available for this checklist item yet.",
        explanation: item.defaultSampleAnswer
          ? "This sample answer is pulled from the checklist template and can be used as a guide."
          : undefined,
      });
      showSample(item.itemNumber);
    },
    [showSample],
  );

  const handleNavigateToPdf = useCallback((coordinateString: string) => {
    const coors = coordinateString
      .split(";")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .flatMap((entry) => {
        const parts = entry.split(",").map((part) => Number(part.trim()));
        if (parts.length < 5 || parts.some((part) => Number.isNaN(part))) {
          return [];
        }

        const [page, x, y, height, width] = parts;
        return [
          {
            page,
            x,
            y,
            h: height,
            w: width,
          },
        ];
      });

    if (coors.length > 0) {
      const coord = coors[0];
      // Use PDF dimensions from checklist or fallback to standard US Letter
      const PAGE_WIDTH = checklist?.pageWidth ?? 612;
      const PAGE_HEIGHT = checklist?.pageHeight ?? 792;

      const highlightArea: HighlightArea = {
        pageIndex: coord.page - 1,
        left: (coord.x / PAGE_WIDTH) * 100,
        top: (coord.y / PAGE_HEIGHT) * 100,
        width: (coord.h / PAGE_HEIGHT) * 100,
        height: (coord.w / PAGE_WIDTH) * 100,
      };

      setActivePdfCoordinate(highlightArea);
      setIsPdfPanelOpen(true);
    }
  }, []);

  const currentSectionProgress = sectionProgress.find(
    (s) => s.section === activeSection,
  );
  const currentSectionMeta = useMemo(
    () =>
      checklist?.sections?.find((section) => section.section === activeSection),
    [activeSection, checklist?.sections],
  );
  const currentSectionItems = useMemo(
    () => currentSectionMeta?.items ?? [],
    [currentSectionMeta],
  );
  const sectionsWithItems = useMemo(
    () => sectionProgress.filter((section) => section.totalItems > 0),
    [sectionProgress],
  );

  useEffect(() => {
    if (sectionsWithItems.length === 0) {
      return;
    }

    const hasActiveSectionItems = sectionsWithItems.some(
      (section) => section.section === activeSection,
    );

    if (!hasActiveSectionItems) {
      setActiveSection(sectionsWithItems[0].section);
    }
  }, [activeSection, sectionsWithItems, setActiveSection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-white gap-4">
        <p className="text-text-secondary">Checklist not found</p>
        <Button onClick={() => navigate(-1)} variant="secondary">
          Go Back
        </Button>
      </div>
    );
  }

  const renderChecklistTree = (
    nodes: ChecklistItemResponse[],
    depth = 0,
  ): React.ReactNode => {
    return nodes.map((itemNode) => {
      const isSubItem = depth > 0;
      const itemId = itemNode.itemTemplateId;
      const children = itemNode.children ?? [];

      return (
        <div key={itemId} className="space-y-3">
          <div
            className={cn(isSubItem && "ml-8 pl-4 border-l-2 border-border")}
          >
            <ChecklistItem
              template={{
                id: itemId,
                itemNumber: itemNode.itemNumber,
                topic: itemNode.topic,
                description: itemNode.description ?? "",
                section: itemNode.section ?? "OTHER_INFORMATION",
                isRequired: Boolean(itemNode.isRequired),
                isSubItem,
                parentId: itemNode.parentId ?? undefined,
                defaultSampleAnswer: itemNode.defaultSampleAnswer ?? undefined,
                order: itemNode.order ?? 0,
                hasLocationField: Boolean(itemNode.hasLocationField),
                isSectionHeaderOnly: Boolean(itemNode.isSectionHeaderOnly),
                hasChildren: Boolean(itemNode.hasChildren),
                canRespond: Boolean(itemNode.canRespond),
              }}
              response={getItemResponse(itemId)}
              onUpdate={updateItemResponse}
              onShowSample={handleShowSampleAnswer}
              onSaveItem={handleSaveItem}
              onNavigateToPdf={
                checklist.pdfUrl ? handleNavigateToPdf : undefined
              }
              isSubItem={isSubItem}
              hasUnsavedChanges={hasDraftChange(itemId)}
              isLoading={isSaving && savingItemId === itemId}
            />
          </div>

          {children.length > 0 && renderChecklistTree(children, depth + 1)}
        </div>
      );
    });
  };

  const isAutoFillInProgress =
    autoFillState.isActive && autoFillState.status !== null;

  return (
    <div className="flex h-screen flex-col bg-surface-white">
      {/* Hidden file input for PDF upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload PDF for auto-fill"
      />

      {/* Header */}
      <div className="fixed z-40 w-full bg-surface-white border-b border-border h-16 flex items-center px-4 sm:px-6 gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
          title="Go back"
        >
          <FiChevronLeft className="w-6 h-6 text-text-secondary" />
        </Button>

        <div className="flex-1">
          <h1 className="text-lg font-bold text-text-primary truncate">
            {checklist.title}
          </h1>
          <p className="text-xs text-text-secondary">
            {checklist.templateName} • {checklist.completionPercentage}%
            Complete
          </p>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={triggerFileUpload}
            disabled={isSaving || isAutoFillInProgress}
            className="inline-flex items-center gap-2"
            title="Upload a PDF to auto-fill checklist items using AI"
          >
            <FiUpload className="w-4 h-4" />
            {isAutoFillInProgress ? "Processing…" : "Auto-Fill"}
          </Button>
          {checklist.pdfUrl && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPdfPanelOpen((prev) => !prev)}
              className="inline-flex items-center gap-2"
              title={isPdfPanelOpen ? "Hide PDF panel" : "Show source PDF"}
            >
              <FiFileText className="w-4 h-4" />
              {isPdfPanelOpen ? "Hide PDF" : "View PDF"}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleGenerateReport("pdf")}
            disabled={isSaving}
            className="inline-flex items-center gap-2"
          >
            <FiEye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleGenerateReport("word")}
            disabled={isSaving}
            className="inline-flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Word
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasDraftChanges}
            className="inline-flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2"
        >
          <FiMenu className="w-6 h-6 text-text-secondary" />
        </Button>
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        side="right"
        title="Actions"
      >
        <div className="space-y-2 p-4">
          <Button
            variant="secondary"
            onClick={() => {
              triggerFileUpload();
              setIsMobileMenuOpen(false);
            }}
            disabled={isSaving || isAutoFillInProgress}
            className="w-full justify-center"
          >
            <FiUpload className="w-4 h-4 mr-2" />
            {isAutoFillInProgress ? "Processing…" : "Auto-Fill from PDF"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              handleGenerateReport("pdf");
              setIsMobileMenuOpen(false);
            }}
            disabled={isSaving}
            className="w-full justify-center"
          >
            <FiEye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              handleGenerateReport("word");
              setIsMobileMenuOpen(false);
            }}
            disabled={isSaving}
            className="w-full justify-center"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Download Word
          </Button>
          <Button
            onClick={() => {
              handleSave();
              setIsMobileMenuOpen(false);
            }}
            disabled={isSaving || !hasDraftChanges}
            className="w-full justify-center"
          >
            <FiSave className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Drawer>

      {/* Content Layout (Sidebar + Main) */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar - Hidden on mobile, collapsible on desktop */}
        <div className="hidden lg:block shrink-0">
          <SectionSidebar
            sections={sectionProgress}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        {/* Main Content */}
        <main
          className={cn(
            "flex flex-col overflow-hidden flex-1",
            !isDragging && "transition-all duration-300",
          )}
        >
          {/* Auto-Fill Status Banner */}
          {autoFillState.status && (
            <div
              className={cn(
                "shrink-0 border-b px-4 sm:px-6 py-3 flex items-center gap-3 transition-all duration-300",
                autoFillState.status === AutoFillStatus.Failed
                  ? "bg-surface-white border-border text-red-700"
                  : autoFillState.status === AutoFillStatus.Completed
                    ? "bg-surface-white border-border text-green-700"
                    : "bg-bg-secondary border-indigo-200 text-indigo-700",
              )}
            >
              {autoFillState.isActive &&
                autoFillState.status !== AutoFillStatus.Completed && (
                  <LoadingSpinner size="sm" />
                )}
              {autoFillState.status === AutoFillStatus.Completed && (
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {autoFillState.status === AutoFillStatus.Failed && (
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {AUTO_FILL_STAGE_LABELS[autoFillState.status] ??
                    autoFillState.status}
                </p>
                {autoFillState.message && (
                  <p className="text-xs opacity-75 truncate">
                    {autoFillState.message}
                  </p>
                )}
              </div>
              {autoFillState.mappedItems != null &&
                autoFillState.totalItems != null && (
                  <span className="text-xs font-mono whitespace-nowrap">
                    {autoFillState.mappedItems}/{autoFillState.totalItems} items
                  </span>
                )}
              {autoFillState.status === AutoFillStatus.Completed &&
                onAutoFillCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAutoFillCompleted}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border-green-300 text-green-700 hover:bg-surface-white whitespace-nowrap"
                    title="Refresh checklist data"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </Button>
                )}
              {/* Dismiss button for terminal states */}
              {(autoFillState.status === AutoFillStatus.Completed ||
                autoFillState.status === AutoFillStatus.Failed) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setAutoFillState((prev) => ({ ...prev, status: null }))
                  }
                  className="p-1 h-auto min-h-0 min-w-0"
                  title="Dismiss"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="shrink-0 bg-linear-to-r from-indigo-50 to-white border-b border-border p-4 sm:p-6">
            <CompletionProgress
              completed={checklist.completedItems}
              total={checklist.totalItems}
              size="lg"
              showLabel={true}
            />
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="shrink-0 mx-4 mt-4 p-3 bg-surface-white border border-border text-red-700 rounded-[4px] text-sm">
              {saveError}
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div
              className={cn(
                "mx-auto p-4 sm:p-6 lg:p-10 space-y-8",
                isPdfPanelOpen && checklist.pdfUrl ? "max-w-full" : "max-w-4xl",
              )}
            >
              {/* Section Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-text-primary mb-2">
                  {currentSectionProgress?.displayName ?? activeSection}
                </h2>
                {currentSectionMeta?.description && (
                  <p className="text-sm text-text-secondary mb-2">
                    {currentSectionMeta.description}
                  </p>
                )}
                {currentSectionProgress && (
                  <p className="text-text-secondary">
                    {currentSectionProgress.completedItems} of{" "}
                    {currentSectionProgress.totalItems} items completed in this
                    section
                  </p>
                )}
                <p className="text-xs text-text-secondary mt-2">
                  {isSaving
                    ? "Saving changes..."
                    : hasDraftChanges
                      ? "You have unsaved changes"
                      : lastSavedAt
                        ? `Last saved at ${new Date(lastSavedAt).toLocaleTimeString()}`
                        : "All changes saved"}
                </p>
              </div>

              {/* Items Grid */}
              <div className="space-y-6">
                {currentSectionItems.length > 0 ? (
                  renderChecklistTree(currentSectionItems)
                ) : (
                  <div className="text-center py-12 bg-bg-primary rounded-[4px] border border-border">
                    <p className="text-text-secondary">
                      No items in this section yet
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t border-border">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const sectionIndex = sectionProgress.findIndex(
                      (s) => s.section === activeSection,
                    );
                    if (sectionIndex > 0) {
                      setActiveSection(
                        sectionProgress[sectionIndex - 1].section,
                      );
                    }
                  }}
                >
                  Previous Section
                </Button>

                <Button
                  onClick={() => {
                    const sectionIndex = sectionProgress.findIndex(
                      (s) => s.section === activeSection,
                    );
                    if (sectionIndex < sectionProgress.length - 1) {
                      setActiveSection(
                        sectionProgress[sectionIndex + 1].section,
                      );
                    }
                  }}
                >
                  Next Section
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* PDF Viewer Panel */}
        {isPdfPanelOpen && checklist.pdfUrl && (
          <div
            style={{ width: pdfWidth ? `${pdfWidth}px` : undefined }}
            className={cn(
              "shrink-0 flex",
              !isDragging && "transition-all duration-300",
              !pdfWidth && "w-[55%]",
            )}
          >
            {/* Divider */}
            <div
              className={cn(
                "w-1.5 relative cursor-col-resize select-none self-stretch flex items-center justify-center group z-50",
                isDragging
                  ? "bg-accent"
                  : "bg-bg-secondary hover:bg-indigo-400 transition-colors",
              )}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
              <div
                className={cn(
                  "w-0.5 h-6 rounded-full transition-colors",
                  isDragging
                    ? "bg-indigo-200"
                    : "bg-gray-400 group-hover:bg-surface-white",
                )}
              />
            </div>

            <div className="flex-1 h-full overflow-hidden">
              <ChecklistPdfPanel
                pdfUrl={checklist.pdfUrl}
                activeCoordinate={activePdfCoordinate}
                onClose={() => {
                  setIsPdfPanelOpen(false);
                  setActivePdfCoordinate(null);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sample Answer Modal */}
      <SampleAnswerModal
        isOpen={showSampleModal}
        onClose={closeSample}
        data={sampleAnswerData}
      />
    </div>
  );
};

export default ChecklistEditor;
