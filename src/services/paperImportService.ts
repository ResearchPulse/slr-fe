// Paper Import Service - API Integration Layer
// Handles RIS file upload with progress tracking
// Source: PaperAPI.md

import api from "../config/axios";
import type {
  RisFileImportRequest,
  RisImportResponse,
  BibTexFileImportRequest,
  PdfFileImportRequest,
  PdfFilesImportRequest,
  PdfBatchImportResponse,
  FileValidationResult,
  DoiImportRequest,
  CrossrefImportRequest,
  CrossrefQueryParameters,
  CrossrefWorksResponse,
  CrossrefWorkDetailResponse,
} from "../types/paper";

/**
 * File Upload Configuration
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".ris", ".bib", ".pdf"];
export const MAX_PDF_BATCH_FILES = 10;

/**
 * Validate import file before upload
 */
export const validateImportFile = (file: File): FileValidationResult => {
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  // Check file not empty
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty.",
    };
  }

  return { valid: true };
};

/**
 * Progress callback function type
 */
export type ProgressCallback = (progressPercent: number) => void;

/**
 * Paper Import Service
 * Implements RIS file import endpoint from PaperAPI.md
 */
export const paperImportService = {
  async importPdfFile(
    request: PdfFileImportRequest,
    onProgress?: ProgressCallback,
  ): Promise<RisImportResponse> {
    const validation = validateImportFile(request.file);
    if (!validation.valid || !request.file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Invalid file type. Only .pdf files are allowed.");
    }

    const formData = new FormData();
    formData.append("file", request.file);
    formData.append("projectId", request.projectId);
    if (request.searchSourceId) formData.append("searchSourceId", request.searchSourceId);

    const response = await api.post<RisImportResponse>("/papers/import/pdf", formData, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    });
    const result = response.data;
    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to import PDF file");
    }
    return result;
  },

  /**
   * Import up to MAX_PDF_BATCH_FILES PDFs in one request
   * POST /api/papers/import/pdf/batch
   *
   * Files are imported independently: the result lists each file's outcome. When no file
   * could be imported the backend answers 400 with the same result shape, which is returned
   * here (isSuccess = false) so the caller can show per-file errors.
   */
  async importPdfFiles(
    request: PdfFilesImportRequest,
    onProgress?: ProgressCallback,
  ): Promise<PdfBatchImportResponse> {
    if (request.files.length === 0) throw new Error("Please select at least one PDF file.");
    if (request.files.length > MAX_PDF_BATCH_FILES) {
      throw new Error(`You can import at most ${MAX_PDF_BATCH_FILES} PDF files at once.`);
    }

    const formData = new FormData();
    formData.append("projectId", request.projectId);
    if (request.searchSourceId) formData.append("searchSourceId", request.searchSourceId);
    request.files.forEach((file) => formData.append("files", file));

    try {
      const response = await api.post<PdfBatchImportResponse>("/papers/import/pdf/batch", formData, {
        onUploadProgress: (event) => {
          if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      return response.data;
    } catch (error) {
      const data = (error as { response?: { data?: PdfBatchImportResponse } }).response?.data;
      if (data?.data?.items) return data;
      throw error;
    }
  },

  /**
   * Import RIS file with progress tracking
   * POST /api/papers/import/ris
   * Content-Type: multipart/form-data
   *
   * @param request - RIS file import request
   * @param onProgress - Optional callback for upload progress
   * @returns Import result with statistics
   */
  async importRisFile(
    request: RisFileImportRequest,
    onProgress?: ProgressCallback,
  ): Promise<RisImportResponse> {
    // Client-side validation
    const validation = validateImportFile(request.file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Build FormData
    const formData = new FormData();
    formData.append("file", request.file);
    formData.append("projectId", request.projectId);

    if (request.searchSourceId) {
      formData.append("searchSourceId", request.searchSourceId);
    }

    // Upload with progress tracking
    const response = await api.post<RisImportResponse>("/papers/import/ris", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    const result = response.data;
    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to import RIS file");
    }
    return result;
  },

  /**
   * Import BibTeX file with progress tracking
   * POST /api/papers/import/bibtex
   * Content-Type: multipart/form-data
   *
   * @param request - BibTeX file import request
   * @param onProgress - Optional callback for upload progress
   * @returns Import result with statistics
   */
  async importBibTexFile(
    request: BibTexFileImportRequest,
    onProgress?: ProgressCallback,
  ): Promise<RisImportResponse> {
    // Client-side validation
    const validation = validateImportFile(request.file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Build FormData
    const formData = new FormData();
    formData.append("file", request.file);
    formData.append("projectId", request.projectId);

    if (request.searchSourceId) {
      formData.append("searchSourceId", request.searchSourceId);
    }

    // Upload with progress tracking
    const response = await api.post<RisImportResponse>("/papers/import/bibtex", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    const result = response.data;
    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to import BibTeX file");
    }
    return result;
  },

  /**
   * Quick import for drag-and-drop or single file upload
   * Automatically detects file type based on extension
   */
  async quickImport(
    file: File,
    projectId: string,
    searchSourceId?: string,
    onProgress?: ProgressCallback,
  ): Promise<RisImportResponse> {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".bib")) {
      return this.importBibTexFile(
        {
          file,
          projectId,
          searchSourceId,
        },
        onProgress,
      );
    }

    return this.importRisFile(
      {
        file,
        projectId,
        searchSourceId,
      },
      onProgress,
    );
  },

  /**
   * Import paper by DOI
   * POST /api/papers/import/doi
   */
  async importByDoi(request: DoiImportRequest): Promise<RisImportResponse> {
    const response = await api.post<RisImportResponse>("/papers/import/doi", request);
    const result = response.data;
    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to import paper by DOI");
    }
    return result;
  },

  /**
   * Import papers from Crossref API
   * POST /api/papers/import/cross-ref
   */
  async importFromCrossref(request: CrossrefImportRequest): Promise<RisImportResponse> {
    const response = await api.post<RisImportResponse>("/papers/import/cross-ref", request);
    const result = response.data;
    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to import papers from Crossref");
    }
    return result;
  },

  /**
   * Search for academic works via Crossref Proxy
   * GET /api/works
   */
  async searchWorks(params: CrossrefQueryParameters): Promise<CrossrefWorksResponse> {
    const response = await api.get<CrossrefWorksResponse>("/works", { params });
    const result = response.data;
    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to search Crossref works");
    }
    return result;
  },

  /**
   * Get full details for a specific work via DOI
   * GET /api/works/{doi}
   */
  async getWorkDetail(doi: string): Promise<CrossrefWorkDetailResponse> {
    // DOIs can contain slashes, which should be encoded or handled correctly by axios
    const response = await api.get<CrossrefWorkDetailResponse>(`/works/${encodeURIComponent(doi)}`);
    const result = response.data;
    if (!result.isSuccess) {
      throw new Error(result.message || "Failed to fetch work details");
    }
    return result;
  },
};
