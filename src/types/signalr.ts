import { type ExtractionSuggestionResponse } from "./studySelection";

export interface SignalRMessage {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  type: 'all' | 'user' | 'group';
}

export const ConnectionState = {
  Disconnected: 'Disconnected',
  Connecting: 'Connecting',
  Connected: 'Connected',
  Reconnecting: 'Reconnecting'
} as const;

export type ConnectionState = typeof ConnectionState[keyof typeof ConnectionState];

export interface MetadataExtractedPayload {
  paperId: string;
  suggestion: ExtractionSuggestionResponse;
}

export interface ChecklistAutoFillStatusPayload {
  reviewChecklistId: string;
  status: string;
  message: string;
  completionPercentage?: number | null;
  totalItems?: number | null;
  mappedItems?: number | null;
  timestamp: string;
}

export const AutoFillStatus = {
  Queued: 'Queued',
  ExtractingText: 'ExtractingText',
  TextExtracted: 'TextExtracted',
  AnalyzingWithAI: 'AnalyzingWithAI',
  SavingResults: 'SavingResults',
  Completed: 'Completed',
  Failed: 'Failed',
} as const;

export type AutoFillStatus = typeof AutoFillStatus[keyof typeof AutoFillStatus];

export interface SignalREvents {
  ReceiveMessage: (message: SignalRMessage) => void;
  ReceiveUserMessage: (message: SignalRMessage) => void;
  ReceiveGroupMessage: (message: SignalRMessage) => void;
  OnMetadataExtracted: (payload: MetadataExtractedPayload) => void;
  OnChecklistAutoFillStatus: (payload: ChecklistAutoFillStatusPayload) => void;
}
