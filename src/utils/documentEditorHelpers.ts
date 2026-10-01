import { v4 as uuidv4 } from "uuid";
import type { DocumentDraft } from "../types/documentEditor";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateChecklistDraftJson = (json: unknown): { isValid: boolean; error?: string } => {
  if (!isRecord(json)) return { isValid: false, error: "Invalid JSON format" };
  
  // Basic structures
  if (json.title !== undefined && typeof json.title !== 'string') return { isValid: false, error: "Invalid 'title' format" };
  if (json.paragraphs !== undefined && !Array.isArray(json.paragraphs)) return { isValid: false, error: "Invalid 'paragraphs' format" };
  if (json.sections !== undefined && !Array.isArray(json.sections)) return { isValid: false, error: "Invalid 'sections' format" };

  // Validate paragraphs if present
  const paragraphs = json.paragraphs;
  if (Array.isArray(paragraphs)) {
    for (const p of paragraphs) {
      if (!isRecord(p) || typeof p.text !== 'string') return { isValid: false, error: "A paragraph is missing 'text' property" };
    }
  }

  // Validate sections if present
  const sections = json.sections;
  if (Array.isArray(sections)) {
    for (const s of sections) {
      if (!isRecord(s) || typeof s.title !== 'string') return { isValid: false, error: "A section is missing 'title' property" };
      const items = s.items;
      if (items !== undefined && !Array.isArray(items)) return { isValid: false, error: "Section 'items' must be an array" };
      if (Array.isArray(items)) {
        for (const item of items) {
          if (!isRecord(item) || typeof item.text !== 'string') return { isValid: false, error: "An item is missing 'text' property" };
        }
      }
    }
  }

  return { isValid: true };
};

export const normalizeChecklistDraft = (draft: Partial<DocumentDraft>): DocumentDraft => {
  return {
    title: draft.title || "Untitled Document",
    paragraphs: (draft.paragraphs || []).map((p, idx) => ({
      ...p,
      id: uuidv4(),
      order: idx + 1
    })),
    sections: (draft.sections || []).map((s, sIdx) => ({
      ...s,
      id: uuidv4(),
      order: sIdx + 1,
      items: (s.items || []).map((item, iIdx) => ({
        ...item,
        id: uuidv4(),
        order: iIdx + 1
      }))
    }))
  };
};

export const mergeChecklistDrafts = (current: DocumentDraft, incoming: Partial<DocumentDraft>): DocumentDraft => {
  const normalizedIncoming = normalizeChecklistDraft(incoming);
  
  // Use protocol title if manual title is empty or just "Untitled Document"
  const useProtocolTitle = !current.title.trim() || current.title === "Untitled Document" || current.title === "Untitled Template";
  
  return {
    title: useProtocolTitle ? (incoming.title || current.title) : current.title,
    
    // If we have manual paragraphs, we keep them and append protocol paragraphs.
    // If no manual paragraphs, we just use protocol paragraphs.
    paragraphs: [
      ...current.paragraphs,
      ...normalizedIncoming.paragraphs.map((p, idx) => ({
        ...p,
        order: current.paragraphs.length + idx + 1
      }))
    ],
    
    sections: [
      ...current.sections,
      ...normalizedIncoming.sections.map((s, idx) => ({
        ...s,
        order: current.sections.length + idx + 1
      }))
    ]
  };
};
