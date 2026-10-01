import type { ScreeningPaper } from "../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";
import type { UploadPdfOptions } from "../../../../pages/reviewProcess/studySelection/uploadTypes";
import type { PaperWithDecisionsResponse } from "../../../../types/studySelection";

export interface PaperViewerProps {
  paper: ScreeningPaper | null;
  onInclude?: (paperId: string) => void;
  onExclude?: (paperId: string, exclusionReasonId: string | null, reason: string | null) => void;
  onUploadPdf?: (
    paperId: string,
    file: File,
    options?: UploadPdfOptions,
  ) => Promise<PaperWithDecisionsResponse>;
  onApplyMetadataSuggestion?: (
    paperId: string,
    sourceMetadataId: string,
    fields: string[],
  ) => Promise<void>;
  onRetryExtraction?: (paperId: string) => Promise<void>;
  isSubmitting?: boolean;
  isUploadingPdf?: boolean;
  isApplyingMetadataSuggestion?: boolean;
  isRetryingExtraction?: boolean;
  hideActions?: boolean;
  isLeaderView?: boolean;
  phase?: number;
  isDisabled?: boolean;
}

export type PaperViewerTab = "abstract" | "references" | "citations" | "graph" | "fulltext";
