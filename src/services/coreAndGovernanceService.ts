import api from "../config/axios";

import type {
  ReviewNeed,
  CreateReviewNeedInput,
  CommissioningDocument,
  CreateCommissioningDocumentInput,
  ReviewObjective,
  CreateReviewObjectiveInput,
  ResearchQuestion,
  CreateResearchQuestionInput,
  QuestionType,
  PICOCElement,
  CreatePICOCElementInput,
} from "../types/coreAndGovernance";

// API Response Types (for Backend API)
interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: ApiError[];
}

interface ApiError {
  field?: string;
  message: string;
}

type BackendRecord = Record<string, unknown>;

const readString = (...values: unknown[]): string => {
  const value = values.find((item) => typeof item === "string");
  return typeof value === "string" ? value : "";
};

const readNumber = (value: unknown): number =>
  typeof value === "number" ? value : Number(value) || 0;

// ==================== PROPERTY MAPPING HELPERS — GOVERNANCE ====================

function mapReviewNeedFromBackend(d: BackendRecord): ReviewNeed {
  const identifiedBy = readString(
    d.identifiedBy,
    d.identified_by,
    d.createdBy,
    d.created_by,
    "System",
  );

  return {
    need_id: readString(d.needId, d.need_id, d.id) || "unknown",
    project_id: readString(d.projectId, d.project_id),
    description: readString(d.description, d.title),
    justification: readString(d.justification),
    identified_by: identifiedBy,
    created_at: readString(d.createdAt, d.created_at),
  };
}

function mapReviewNeedToBackend(data: CreateReviewNeedInput): BackendRecord {
  return {
    projectId: data.project_id,
    description: data.description,
    justification: data.justification,
    identifiedBy: data.identified_by,
  };
}

function mapCommissioningDocumentFromBackend(d: BackendRecord): CommissioningDocument {
  return {
    document_id: readString(d.documentId),
    project_id: readString(d.projectId),
    sponsor: readString(d.sponsor),
    scope: readString(d.scope),
    budget: readNumber(d.budget),
    document_url: readString(d.documentUrl),
    created_at: readString(d.createdAt),
  };
}

function mapCommissioningDocumentToBackend(data: CreateCommissioningDocumentInput): BackendRecord {
  return {
    projectId: data.project_id,
    sponsor: data.sponsor,
    scope: data.scope,
    budget: data.budget,
    documentUrl: data.document_url,
  };
}

function mapReviewObjectiveFromBackend(d: BackendRecord): ReviewObjective {
  return {
    objective_id: readString(d.objectiveId),
    project_id: readString(d.projectId),
    objective_statement: readString(d.objectiveStatement),
    created_at: readString(d.createdAt),
  };
}

function mapReviewObjectiveToBackend(data: CreateReviewObjectiveInput): BackendRecord {
  return {
    projectId: data.project_id,
    objectiveStatement: data.objective_statement,
  };
}

function mapQuestionTypeFromBackend(d: BackendRecord): QuestionType {
  return {
    question_type_id: readString(d.questionTypeId),
    name: readString(d.name),
    description: readString(d.description),
  };
}

function mapResearchQuestionFromBackend(d: BackendRecord): ResearchQuestion {
  const questionType = d.questionType;
  return {
    researchQuestionId: readString(d.researchQuestionId),
    projectId: readString(d.projectId),
    questionType: typeof questionType === "string" ? questionType : null,
    questionText: readString(d.questionText),
    rationale: typeof d.rationale === "string" ? d.rationale : null,
    createdAt: readString(d.createdAt),
    question_type:
      questionType && typeof questionType === "object"
        ? mapQuestionTypeFromBackend(questionType as BackendRecord)
        : undefined,
  };
}

function mapResearchQuestionToBackend(data: CreateResearchQuestionInput): BackendRecord {
  return {
    projectId: data.projectId,
    questionType: data.questionType,
    questionText: data.questionText,
    rationale: data.rationale,
  };
}

function mapPicocElementFromBackend(d: BackendRecord): PICOCElement {
  return {
    picoc_id: readString(d.picocId),
    research_question_id: readString(d.researchQuestionId),
    element_type: readString(d.elementType) as PICOCElement["element_type"],
    description: readString(d.description),
  };
}

function mapPicocElementToBackend(data: CreatePICOCElementInput): BackendRecord {
  return {
    researchQuestionId: data.research_question_id,
    elementType: data.element_type,
    description: data.description,
  };
}

// ==================== CORE & GOVERNANCE BE SERVICE ====================

const GOVERN_BASE = "core-govern";

export const coreAndGovernanceService = {
  // ── Review Needs ────────────────────────────────────────────────────────

  async getReviewNeeds(projectId: string): Promise<ApiResponse<ReviewNeed[]>> {
    const response = await api.get<ApiResponse<BackendRecord[]>>(
      `${GOVERN_BASE}/review-needs/project/${projectId}`,
    );
    return { ...response.data, data: response.data.data.map(mapReviewNeedFromBackend) };
  },

  async createReviewNeed(data: CreateReviewNeedInput): Promise<ApiResponse<ReviewNeed>> {
    const response = await api.post<ApiResponse<BackendRecord>>(
      `${GOVERN_BASE}/review-needs`,
      mapReviewNeedToBackend(data),
    );
    return { ...response.data, data: mapReviewNeedFromBackend(response.data.data) };
  },

  async deleteReviewNeed(needId: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`${GOVERN_BASE}/review-needs/${needId}`);
    return response.data;
  },

  // ── Commissioning Documents ─────────────────────────────────────────────

  async getDocuments(projectId: string): Promise<ApiResponse<CommissioningDocument[]>> {
    const response = await api.get<ApiResponse<BackendRecord[]>>(
      `${GOVERN_BASE}/commissioning-documents/project/${projectId}`,
    );

    return { ...response.data, data: response.data.data.map(mapCommissioningDocumentFromBackend) };
  },

  async createDocument(
    data: CreateCommissioningDocumentInput,
  ): Promise<ApiResponse<CommissioningDocument>> {
    const response = await api.post<ApiResponse<BackendRecord>>(
      `${GOVERN_BASE}/commissioning-documents`,
      mapCommissioningDocumentToBackend(data),
    );
    return { ...response.data, data: mapCommissioningDocumentFromBackend(response.data.data) };
  },

  async deleteDocument(documentId: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `${GOVERN_BASE}/commissioning-documents/${documentId}`,
    );
    return response.data;
  },

  // ── Review Objectives ───────────────────────────────────────────────────

  async getObjectives(projectId: string): Promise<ApiResponse<ReviewObjective[]>> {
    const response = await api.get<ApiResponse<BackendRecord[]>>(
      `${GOVERN_BASE}/review-objectives/project/${projectId}`,
    );
    return { ...response.data, data: response.data.data.map(mapReviewObjectiveFromBackend) };
  },

  async createObjective(data: CreateReviewObjectiveInput): Promise<ApiResponse<ReviewObjective>> {
    const response = await api.post<ApiResponse<BackendRecord>>(
      `${GOVERN_BASE}/review-objectives`,
      mapReviewObjectiveToBackend(data),
    );
    return { ...response.data, data: mapReviewObjectiveFromBackend(response.data.data) };
  },

  async deleteObjective(objectiveId: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `${GOVERN_BASE}/review-objectives/${objectiveId}`,
    );
    return response.data;
  },

  // ── Research Questions ──────────────────────────────────────────────────

  async getResearchQuestions(projectId: string): Promise<ApiResponse<ResearchQuestion[]>> {
    const response = await api.get<ApiResponse<BackendRecord[]>>(`/research-questions/project/${projectId}`);
    return { ...response.data, data: response.data.data.map(mapResearchQuestionFromBackend) };
  },

  async createResearchQuestion(
    data: CreateResearchQuestionInput,
  ): Promise<ApiResponse<ResearchQuestion>> {
    const response = await api.post<ApiResponse<BackendRecord>>(
      `${GOVERN_BASE}/research-questions`,
      mapResearchQuestionToBackend(data),
    );
    return { ...response.data, data: mapResearchQuestionFromBackend(response.data.data) };
  },

  async deleteResearchQuestion(questionId: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `${GOVERN_BASE}/research-questions/${questionId}`,
    );
    return response.data;
  },

  // ── Question Types ──────────────────────────────────────────────────────

  async getQuestionTypes(): Promise<ApiResponse<QuestionType[]>> {
    const response = await api.get<ApiResponse<BackendRecord[]>>(`${GOVERN_BASE}/question-types`);
    return { ...response.data, data: response.data.data.map(mapQuestionTypeFromBackend) };
  },

  async updateQuestionType(
    id: string,
    data: Partial<Pick<QuestionType, "name" | "description">>,
  ): Promise<ApiResponse<QuestionType>> {
    const response = await api.put<ApiResponse<BackendRecord>>(`${GOVERN_BASE}/question-types/${id}`, data);
    return { ...response.data, data: mapQuestionTypeFromBackend(response.data.data) };
  },

  // ── PICOC Elements ──────────────────────────────────────────────────────

  async getPicocElements(questionId: string): Promise<ApiResponse<PICOCElement[]>> {
    const response = await api.get<ApiResponse<BackendRecord[]>>(
      `${GOVERN_BASE}/picoc-elements/research-question/${questionId}`,
    );
    return { ...response.data, data: response.data.data.map(mapPicocElementFromBackend) };
  },

  async createPicocElement(data: CreatePICOCElementInput): Promise<ApiResponse<PICOCElement>> {
    const response = await api.post<ApiResponse<BackendRecord>>(
      `${GOVERN_BASE}/picoc-elements`,
      mapPicocElementToBackend(data),
    );
    return { ...response.data, data: mapPicocElementFromBackend(response.data.data) };
  },

  async deletePicocElement(picocId: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `${GOVERN_BASE}/picoc-elements/${picocId}`,
    );
    return response.data;
  },
};
