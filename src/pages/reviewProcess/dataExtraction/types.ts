import type { Dispatch, SetStateAction } from "react";
import type {
  AddCommentRequestDto,
  AssignReviewersDto,
  ExtractedValueDto,
  ExtractionDashboardSummaryDto,
  ExtractionDashboardTaskDto,
  ExtractionEditableGridDto,
  ExtractionFieldDto,
  ExtractionPreviewDto,
  ExtractionWorkloadSummaryDto,
  ExtractionTemplateDto,
  ExtractionTemplateResponseDto,
  ConsensusWorkspaceDto,
  ReviewerWorkspaceDto,
  ExtractionConsensusDraftDto,
  ExtractionFindingDto,
  ReopenExtractionRequestDto,
  ExtractionWorkflowMutationDto,
  SubmitConsensusRequestDto,
  SubmitExtractionRequestDto,
  ExtractionAuditEntryDto,
  ExtractionCommentDto,
} from "../../../types/dataExtraction";
import type { PaperWithDecisionsResponse } from "../../../types/studySelection";

export type ExtractionTabKey = "dashboard" | "workspace" | "consensus" | "grid";
export type ExtractionMode = "double";
export type ExtractionPaperStatus = "todo" | "in-progress" | "awaiting-consensus" | "completed";
export type ExtractionValue = string | number | boolean | string[] | null;

export interface ReviewerOption {
  id: string;
  name: string;
}

export interface ReviewerSubmission {
  reviewerId: string;
  reviewerName: string;
  submittedAt?: string | null;
  values: Record<string, ExtractionValue>;
}
export interface CanonicalReviewerSubmission {
  reviewerId: string;
  values: Record<string, unknown>;
  version: number;
  templateVersion: number;
  status: string;
  submittedAt?: string | null;
}

export interface CanonicalExtractionDraft {
  values: Record<string, unknown>;
  status: string;
  version: number;
  updatedAt?: string | null;
}

export interface CanonicalExtractionSubmission extends CanonicalExtractionDraft {
  templateVersion: number;
  submittedAt?: string | null;
}

export interface CanonicalExtractionLeaderDraft extends CanonicalExtractionDraft {
  findings: ExtractionFindingDto[];
  updatedAt: string;
}

export interface ExtractionPaperRecord {
  paperId: string;
  assigneeId: string | null;
  assigneeName: string | null;
  status: ExtractionPaperStatus;
  draftsByReviewer: Record<string, Record<string, ExtractionValue>>;
  submissions: ReviewerSubmission[];
  finalValues?: Record<string, ExtractionValue>;
  conflictFieldIds?: string[];
  updatedAt?: string;
}

export interface FlattenedExtractionField {
  field: ExtractionFieldDto;
  depth: number;
}

export interface PdfHighlightCoordinate {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AskAiFieldResult {
  fieldId: string;
  value: ExtractionValue;
  matrixColumnId: string | null;
  matrixRowIndex: number | null;
  isNotReported?: boolean;
  evidenceCoordinates?: string | null;
  evidenceRefs?: Array<{ fieldId: string; quote: string }>;
}

export interface ExtractionStudyItem {
  paperId: string;
  title: string;
  authors: string | null;
  publicationYear: number | null;
  pdfUrl: string | null;
  source: string | null;
  raw: PaperWithDecisionsResponse;
}

export type ExtractionSummaryMetrics = ExtractionDashboardSummaryDto;

export interface UseDataExtractionWorkspaceReturn {
  projectId?: string;
  currentUserId: string | null;
  isCurrentUserLeader: boolean;
  extractionProcessStatus: "NotStarted" | "InProgress" | "Completed";

  isLoading: boolean;
  error: string | null;

  isMockMode: boolean;

  activeTab: ExtractionTabKey;
  setActiveTab: (tab: ExtractionTabKey) => void;
  extractionMode: ExtractionMode;
  setExtractionMode: (mode: ExtractionMode) => void;
  activeReviewerId: string;
  setActiveReviewerId: (reviewerId: string) => void;
  reviewerOptions: ReviewerOption[];

  templates: ExtractionTemplateDto[];
  selectedTemplateId: string;
  setSelectedTemplateId: (templateId: string) => void;
  selectedTemplate: ExtractionTemplateDto | null;
  refreshTemplates: () => Promise<void>;

  studies: ExtractionStudyItem[];
  selectedPaperId: string;
  setSelectedPaperId: (paperId: string) => void;
  selectedStudy: ExtractionStudyItem | null;
  selectedRecord: ExtractionPaperRecord | null;

  allFields: FlattenedExtractionField[];
  answerFields: FlattenedExtractionField[];

  summary: ExtractionSummaryMetrics;
  dashboardTasks: ExtractionDashboardTaskDto[];
  dashboardTotalCount: number;
  dashboardTotalPages: number;
  isDashboardLoading: boolean;
  workloadSummary: ExtractionWorkloadSummaryDto | null;
  isWorkloadLoading: boolean;

  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  pageNumber: number;
  setPageNumber: (value: number) => void;
  pageSize: number;
  setPageSize: (value: number) => void;

  getPaperStatus: (paperId: string) => ExtractionPaperStatus;
  getRecord: (paperId: string) => ExtractionPaperRecord | null;
  canCurrentUserExtractPaper: (paperId: string) => boolean;
  assignPaper: (paperId: string, payload: AssignReviewersDto) => Promise<unknown>;
  isAssigningReviewers: boolean;
  startPhase: () => Promise<void>;
  isStarting: boolean;
  completePhase: () => Promise<void>;
  isCompleting: boolean;
  reopenExtraction: (paperId: string, target: ReopenExtractionRequestDto) => Promise<void>;
  isReopeningExtraction: boolean;
  hasCurrentUserSubmitted: (paperId: string) => boolean;

  setDraftValue: (
    paperId: string,
    reviewerId: string,
    fieldId: string,
    value: ExtractionValue
  ) => void;
  saveDraft: (
    paperId: string,
    reviewerId: string,
    payload: ExtractionWorkflowMutationDto
  ) => Promise<void>;
  submitExtraction: (
    paperId: string,
    payload: ExtractionWorkflowMutationDto | SubmitExtractionRequestDto
  ) => Promise<void>;
  isSubmittingExtraction: boolean;
  editableGrid: ExtractionEditableGridDto | null;
  isGridLoading: boolean;
  getEditableGrid: () => Promise<ExtractionEditableGridDto | null>;
  updateGridCell: (payload: {
    paperId: string;
    fieldId: string;
    columnId?: string;
    row?: number;
    value: unknown;
    expectedVersion: number;
  }) => Promise<void>;
  isUpdatingGrid: boolean;
  auditLogs: ExtractionAuditEntryDto[];
  fetchAuditLogs: (filters?: {
    paperId?: string;
    fieldId?: string;
    pageSize?: number;
  }) => Promise<ExtractionAuditEntryDto[]>;
  isAuditLoading: boolean;

  autoExtractWithAI: (
    paperId: string,
    templateId: string
  ) => Promise<ExtractedValueDto[]>;
  isAutoExtracting: boolean;

  activeHighlights: PdfHighlightCoordinate[];
  setActiveHighlights: Dispatch<SetStateAction<PdfHighlightCoordinate[]>>;

  handleAskAiForField: (
    field: ExtractionFieldDto,
    matrixColumnId: string | null,
    matrixRowIndex: number | null
  ) => Promise<AskAiFieldResult | null>;
  isAskingAi: boolean;

  checkConsensus: (
    paperId: string,
    submissionVersions: Record<string, number>
  ) => Promise<{
    findings: ExtractionFindingDto[];
    proposedValues: Record<string, unknown>;
  }>;
  saveConsensusDraft: (
    paperId: string,
    payload: ExtractionConsensusDraftDto
  ) => Promise<void>;
  finalizeConsensus: (paperId: string, expectedVersion: number) => Promise<void>;
  submitConsensus: (paperId: string, payload: SubmitConsensusRequestDto) => Promise<void>;
  isSubmittingConsensus: boolean;
  isCheckingConsensus: boolean;
  isSavingConsensusDraft: boolean;
  isFinalizingConsensus: boolean;

  consensusWorkspace: (ConsensusWorkspaceDto & {
    templateSnapshot?: ExtractionTemplateResponseDto;
    reviewerSubmissions?: CanonicalReviewerSubmission[];
    leaderDraft?: CanonicalExtractionLeaderDraft;
    findings?: ExtractionFindingDto[];
  }) | null;
  isConsensusLoading: boolean;
  fetchConsensusWorkspace: (
    paperId: string
  ) => Promise<ConsensusWorkspaceDto | null>;
  fetchPaperVersion: (paperId: string) => Promise<number | null>;

  reviewerWorkspace: (ReviewerWorkspaceDto & {
    templateSnapshot?: ExtractionTemplateResponseDto;
    ownDraft?: CanonicalExtractionDraft;
    ownSubmission?: CanonicalExtractionSubmission;
    version?: number;
  }) | null;
  isReviewerWorkspaceLoading: boolean;
  fetchReviewerWorkspace: (
    paperId: string
  ) => Promise<ReviewerWorkspaceDto | null>;
  fetchFieldComments: (
    paperId: string,
    fieldId: string
  ) => Promise<ExtractionCommentDto[]>;
  addFieldComment: (
    paperId: string,
    fieldId: string,
    payload: AddCommentRequestDto
  ) => Promise<void>;
  isAddingFieldComment: boolean;

  exportExtractedData: () => void;
  isExporting: boolean;

  extractionPreview: ExtractionPreviewDto | null;
  isExtractionPreviewLoading: boolean;
  isExtractionPreviewFetching: boolean;
  fetchExtractionPreview: () => Promise<ExtractionPreviewDto | null>;

  awaitingConsensus: ExtractionStudyItem[];
  completedStudies: ExtractionStudyItem[];

  handleBack: () => void;
}