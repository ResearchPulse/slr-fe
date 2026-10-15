export type DataItemType = 
  | "Text" 
  | "Number" 
  | "SingleSelect" 
  | "MultiSelect" 
  | "Boolean" 
  | "Date"
  | "Group"; // For nested grouping

// Map Frontend types to Backend enum values
export const FieldTypeEnum = {
  Text: 0,
  Integer: 1,
  Decimal: 2,
  Boolean: 3,
  SingleSelect: 4,
  MultiSelect: 5,
} as const;

export type FieldTypeEnum = typeof FieldTypeEnum[keyof typeof FieldTypeEnum];

export const SectionTypeEnum = {
  FlatForm: 0,
  MatrixGrid: 1,
} as const;

export type SectionTypeEnum = typeof SectionTypeEnum[keyof typeof SectionTypeEnum];

export interface FieldOption {
  option_id: string;
  field_id: string;
  option_value: string;
  display_order: number;
}

export interface DataItemDefinitionExtended {
  data_item_id: string;
  form_id: string;
  parent_field_id?: string; // For nested structure
  name: string;
  data_type: DataItemType;
  description: string;
  is_required: boolean;
  display_order: number;
  options?: FieldOption[]; // For SingleSelect/MultiSelect
  subItems?: DataItemDefinitionExtended[]; // For nested items
}

// Backend DTOs
export interface FieldOptionDto {
  optionId?: string | null;
  fieldId?: string | null;
  value: string;
  displayOrder: number;
}

export interface ExtractionFieldDto {
  fieldId?: string | null;
  templateId?: string | null;
  sectionId?: string | null;
  parentFieldId?: string | null;
  name: string;
  instruction?: string | null;
  fieldType: FieldTypeEnum;
  isRequired: boolean;
  orderIndex: number;
  options: FieldOptionDto[];
  subFields: ExtractionFieldDto[];
}

export interface ExtractionMatrixColumnDto {
  columnId?: string | null;
  name: string;
  orderIndex: number;
}

export interface ExtractionSectionDto {
  sectionId?: string | null;
  templateId?: string | null;
  name: string;
  orderIndex: number;
  sectionType: SectionTypeEnum;
  isPicoc?: boolean;
  linkedResearchQuestionId?: string | null;
  fields: ExtractionFieldDto[];
  matrixColumns?: ExtractionMatrixColumnDto[];
}

export interface ExtractionTemplateDto {
  templateId?: string | null;
  projectId?: string;
  name: string;
  description?: string | null;
  sections?: ExtractionSectionDto[];
  fields?: ExtractionFieldDto[];
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Template persisted by the canonical project-scoped extraction API. */
export interface ExtractionTemplateResponseDto {
  templateId: string;
  projectId: string;
  name: string;
  description?: string | null;
  sections: ExtractionSectionDto[];
  fields?: ExtractionFieldDto[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionTemplateInputDto {
  name: string;
  description?: string | null;
  sections?: ExtractionSectionDto[];
  fields?: ExtractionFieldDto[];
}

export interface ExtractionTemplatePresetDto extends ExtractionTemplateInputDto {
  presetId: string;
}

export interface ExtractionApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ExtractionWorkflowMutationDto {
  templateVersion: number;
  values: Record<string, unknown>;
  expectedVersion: number;
}

export interface ExtractionAssignmentRequestDto {
  reviewerIds: [string, string];
  templateId: string;
}

export interface ExtractionConsensusDraftDto {
  expectedVersion: number;
  values: Record<string, unknown>;
  findings: ExtractionFindingDto[];
}

export interface ExtractionFindingDto {
  findingId: string;
  fieldId: string;
  kind: "VALUE_DISAGREEMENT" | "MISSING_REQUIRED" | "AI_SUGGESTION";
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  reviewer1Value?: unknown;
  reviewer2Value?: unknown;
  proposedValue?: unknown;
  resolution?: unknown;
  reason?: string;
}

export interface ExtractionExportProjectionDto {
  schema: "slr-extraction-json-v1";
  projectId: string;
  items: Array<{
    paperId: string;
    citation: ExtractionCitationDto;
    templateId: string;
    templateVersion: number;
    templateSnapshot: ExtractionTemplateResponseDto;
    values: Record<string, unknown>;
  }>;
}

export interface ExtractionPhaseStateDto {
  phaseStatus?: "NotStarted" | "InProgress" | "Completed";
  status?: number | string;
  statusText?: string;
  version: number;
}


export interface CreateFieldOptionInput {
  field_id: string;
  option_value: string;
  display_order: number;
}

// ============================================
// Data Extraction Conducting Phase DTOs
// ============================================

export interface ExtractionDashboardFilterDto {
  search?: string;
  searchQuery?: string;
  statusFilter?: string;
  pageNumber: number;
  pageSize: number;
}

export interface ExtractionDashboardSummaryDto {
  totalIncluded: number;
  inProgress: number;
  awaitingConsensus: number;
  completed: number;
  notStarted: number;
}

export interface ExtractionDashboardMetadataDto {
  startedAt?: string | null;
  lastUpdatedAt?: string | null;
}

export interface ExtractionCitationDto {
  title: string;
  authors: Array<string | { name: string; affiliation?: string }>;
  doi?: string;
  year?: number;
  journal?: string;
  abstract?: string;
}

export interface ExtractionDashboardTaskDto {
  taskId?: string;
  paperId: string;
  title: string;
  citation: ExtractionCitationDto;
  authors?: string | null;
  publicationYear?: number | null;
  pdfUrl?: string | null;
  status: string;
  ownStatus?: string;
  reviewer1Id?: string | null;
  reviewer1Status?: string | null;
  reviewer2Id?: string | null;
  reviewer2Status?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ExtractionDashboardResponseDto {
  metadata?: ExtractionDashboardMetadataDto;
  summary: ExtractionDashboardSummaryDto;
  tasks: PaginatedResponse<ExtractionDashboardTaskDto>;
}

export interface ReviewerWorkloadDto {
  reviewerId: string;
  reviewerName: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

export interface ExtractionWorkloadSummaryDto {
  overallProgressPercentage: number;
  reviewerWorkloads: ReviewerWorkloadDto[];
}

export type ExtractionPreviewRowDto = Record<string, unknown> | unknown[];

export interface ExtractionPreviewDto {
  headers: string[];
  rows: ExtractionPreviewRowDto[];
}

export interface ExtractionGridCellDto {
  value: string | null;
  paperId: string | null;
  fieldId: string | null;
  matrixColumnId: string | null;
  matrixRowIndex: number | null;
  isNotReported?: boolean;
  fieldType?: string | null;
}

export interface GridFieldOptionDto {
  optionId: string;
  value: string;
}

export interface ExtractionGridColumnMetaDto {
  fieldId: string;
  headerName: string;
  sectionName: string;
  displayFieldName: string;
  fieldType: string;
  options: GridFieldOptionDto[];
}

export interface ExtractionGridRowDto {
  rowId: string;
  paperTitle: string;
  citation: string;
  cells: Record<string, ExtractionGridCellDto>;
}

export interface ExtractionEditableGridDto {
  columns: ExtractionGridColumnMetaDto[];
  rows: ExtractionGridRowDto[];
}

export interface UpdateGridCellRequestDto {
  paperId: string;
  fieldId: string;
  columnId?: string;
  row?: number;
  value: unknown;
  expectedVersion: number;
}

export interface ExtractionAuditEntryDto {
  id: string;
  projectId: string;
  paperId: string;
  actorId: string;
  action: string;
  fieldIds: string[];
  version: number;
  createdAt: string;
}

export interface ExtractionAuditLogsResponseDto {
  items: ExtractionAuditEntryDto[];
}

export interface ExtractionCommentRequestDto {
  text: string;
  expectedVersion: number;
}

export type AssignReviewersDto = ExtractionAssignmentRequestDto;

export const TargetReviewer = {
  Reviewer1: "reviewer1",
  Reviewer2: "reviewer2",
  Both: "both",
} as const;

export type TargetReviewer = (typeof TargetReviewer)[keyof typeof TargetReviewer];

export interface ReopenExtractionRequestDto {
  target: TargetReviewer;
  reason: string;
  expectedVersion: number;
}

export interface ExtractedValueDto {
  fieldId: string;
  optionId: string | null;
  stringValue: string | null;
  numericValue: number | null;
  booleanValue: boolean | null;
  matrixColumnId: string | null;
  matrixRowIndex: number | null;
  isNotReported?: boolean;
  evidenceCoordinates?: string | null;
  EvidenceCoordinates?: string | null;
}

export interface SubmitExtractionRequestDto {
  values: ExtractedValueDto[];
}

export interface ExtractionAiDraftRequestDto {
  fieldIds?: string[];
}

export interface ExtractionAiDraftResponseDto {
  values: Record<string, unknown>;
  evidenceRefs: Array<{ fieldId: string; quote: string }>;
  templateVersion: number;
}

export interface ExtractionCommentDto {
  id: string;
  fieldId: string;
  threadOwnerId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface AddCommentRequestDto {
  threadOwnerId: string;
  content: string;
  matrixColumnId: string | null;
  matrixRowIndex: number | null;
}

// ============================================
// Consensus Resolution Phase DTOs
// ============================================

export type ExtractionConsensusComparisonStatusDto =
  | "AGREE"
  | "SEMANTIC_AGREE"
  | "CONFLICT"
  | "MISSING";

export interface ExtractionConsensusEvidenceDto {
  fieldId: string;
  sourceAssetId: string;
  sourceRevision: string;
  sourceHash: string;
  startOffset: number;
  endOffset: number;
  quote: string;
  quoteHash: string;
  section?: string;
  paragraph?: number;
  pdfPage?: number;
}

export interface ExtractionConsensusFieldAnalysisDto {
  fieldId: string;
  fieldName?: string;
  sectionName?: string;
  isRequired?: boolean;
  status: ExtractionConsensusComparisonStatusDto;
  reviewer1Value?: unknown;
  reviewer2Value?: unknown;
  reviewer1Evidence?: ExtractionConsensusEvidenceDto[];
  reviewer2Evidence?: ExtractionConsensusEvidenceDto[];
  recommendedValue?: unknown;
  reason: string;
  checks: string[];
}

export interface ExtractionConsensusAnalysisDto {
  schemaVersion: "leader-consensus-v1";
  status: "READY" | "CONFLICT";
  fields: ExtractionConsensusFieldAnalysisDto[];
  summary: string;
  generatedAt?: string;
  sourceRevision?: string;
  sourceHash?: string;
}

export interface AnswerDetailDto {
  optionId: string | null;
  stringValue: string | null;
  numericValue: number | null;
  booleanValue: boolean | null;
  isNotReported?: boolean;
  displayValue: string;
  evidenceCoordinates?: string | null;
  comments?: ExtractionCommentDto[];
}

export interface ExtractedAnswerDto {
  matrixColumnId?: string | null;
  matrixRowIndex?: number | null;
  reviewer1Answer: AnswerDetailDto | null;
  reviewer2Answer: AnswerDetailDto | null;
  finalAnswer?: AnswerDetailDto | null;
}

export interface ConsensusAnswerGroupDto {
  matrixColumnId?: string | null;
  matrixRowIndex?: number | null;
  reviewer1Answer: AnswerDetailDto | null;
  reviewer2Answer: AnswerDetailDto | null;
  finalAnswer?: AnswerDetailDto | null;
}

export interface ConsensusFieldDto {
  fieldId: string;
  name: string;
  instruction?: string | null;
  fieldType: FieldTypeEnum;
  isRequired: boolean;
  orderIndex?: number;
  options?: FieldOptionDto[];
  answers: ConsensusAnswerGroupDto[];
  subFields?: ConsensusFieldDto[];
}

export interface ConsensusSectionDto {
  sectionId: string;
  name: string;
  description?: string | null;
  sectionType: SectionTypeEnum;
  orderIndex?: number;
  fields: ConsensusFieldDto[];
  matrixColumns?: ExtractionMatrixColumnDto[];
}

export interface ConsensusWorkspaceDto {
  paperId?: string;
  templateId?: string;
  reviewer1Id?: string;
  reviewer2Id?: string;
  reviewer1Username?: string;
  reviewer2Username?: string;
  reviewer1Status?: "DRAFT" | "SUBMITTED" | "REOPENED";
  reviewer2Status?: "DRAFT" | "SUBMITTED" | "REOPENED";
  consensusReady?: boolean;
  leaderDraft?: {
    values: Record<string, unknown>;
    findings: ExtractionFindingDto[];
    status: string;
    version: number;
    updatedAt?: string;
    agentAnalysis?: ExtractionConsensusAnalysisDto;
  } | null;
  sections: ConsensusSectionDto[];
}

export interface ConsensusValueDto {
  fieldId: string;
  optionId: string | null;
  stringValue: string | null;
  numericValue: number | null;
  booleanValue: boolean | null;
  isNotReported?: boolean;
  matrixColumnId: string | null;
  matrixRowIndex: number | null;
  evidenceCoordinates?: string | null;
}

export interface SubmitConsensusRequestDto {
  values: ConsensusValueDto[];
}

export interface ReviewerExtractedAnswerDto {
  matrixColumnId?: string | null;
  matrixRowIndex?: number | null;
  answer: AnswerDetailDto | null;
}

export interface ReviewerFieldDto {
  fieldId: string;
  name: string;
  instruction?: string | null;
  fieldType: FieldTypeEnum;
  isRequired: boolean;
  orderIndex?: number;
  options?: FieldOptionDto[];
  answers: ReviewerExtractedAnswerDto[];
  subFields?: ReviewerFieldDto[];
}

export interface ReviewerSectionDto {
  sectionId: string;
  name: string;
  description?: string | null;
  sectionType: SectionTypeEnum;
  orderIndex?: number;
  fields: ReviewerFieldDto[];
  matrixColumns?: ExtractionMatrixColumnDto[];
}

export interface ReviewerWorkspaceDto {
  paperId?: string;
  templateId?: string;
  reviewerId?: string;
  sections: ReviewerSectionDto[];
}
