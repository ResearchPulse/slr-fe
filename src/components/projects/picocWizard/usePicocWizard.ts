import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { picocWizardStateService } from "../../../services/picocWizardStateService";
import type { PicocWizardDraft, PicocWizardRecord } from "./types";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

const AUTOSAVE_DELAY_MS = 1200;

export function draftOf(record: PicocWizardRecord): PicocWizardDraft {
  const { reviewType, currentStep, intent, researchField, keywords, picoc, comparisonNotApplicable } = record;
  return { reviewType, currentStep, intent, researchField, keywords, picoc, comparisonNotApplicable };
}

/**
 * Loads the PICOC draft and autosaves edits. Every save sends the last revision seen; a 409 stops
 * autosave so another member's changes are never silently overwritten.
 */
export function usePicocWizard(projectId: string, canEdit: boolean) {
  const [record, setRecord] = useState<PicocWizardRecord | null>(null);
  const [draft, setDraft] = useState<PicocWizardDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const revisionRef = useRef(0);
  const draftRef = useRef<PicocWizardDraft | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const conflictRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const loaded = await picocWizardStateService.getState(projectId);
      revisionRef.current = loaded.revision;
      conflictRef.current = false;
      dirtyRef.current = false;
      draftRef.current = draftOf(loaded);
      setRecord(loaded);
      setDraft(draftRef.current);
      setSaveStatus("idle");
    } catch {
      setLoadError("Could not load the PICOC draft. Check your connection and try again.");
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    return () => window.clearTimeout(timerRef.current);
  }, [load]);

  const saveNow = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    if (!canEdit || !draftRef.current || conflictRef.current || savingRef.current) return;
    savingRef.current = true;
    dirtyRef.current = false;
    setSaveStatus("saving");
    try {
      const saved = await picocWizardStateService.saveState(projectId, revisionRef.current, draftRef.current);
      revisionRef.current = saved.revision;
      setRecord(saved);
      setSaveStatus("saved");
    } catch (error) {
      dirtyRef.current = true;
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        conflictRef.current = true;
        setSaveStatus("conflict");
      } else {
        setSaveStatus("error");
      }
    } finally {
      savingRef.current = false;
    }
    // Edits made while the request was in flight are saved next.
    if (dirtyRef.current && !conflictRef.current && draftRef.current) {
      timerRef.current = window.setTimeout(() => void saveNow(), AUTOSAVE_DELAY_MS);
    }
  }, [canEdit, projectId]);

  const update = useCallback((change: (current: PicocWizardDraft) => PicocWizardDraft) => {
    if (!canEdit || !draftRef.current) return;
    draftRef.current = change(draftRef.current);
    setDraft(draftRef.current);
    dirtyRef.current = true;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void saveNow(), AUTOSAVE_DELAY_MS);
  }, [canEdit, saveNow]);

  return { record, draft, loadError, saveStatus, update, saveNow, reload: load };
}
