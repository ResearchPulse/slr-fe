export interface ReviewerRecord<TValues = Record<string, unknown>> {
  reviewerId: string;
  values: TValues;
  version: number;
}

export interface ReviewerWorkspaceState<TValues = Record<string, unknown>> {
  ownDraft: ReviewerRecord<TValues> | null;
  ownSubmission: ReviewerRecord<TValues> | null;
  otherReviewerRecord: null;
}

export function getEffectiveReviewerRecordValues<TValues>(
  ownDraft: { values?: TValues | null } | null | undefined,
  ownSubmission: { values?: TValues | null } | null | undefined,
): TValues | null {
  return ownSubmission?.values ?? ownDraft?.values ?? null;
}

export interface RequiredField {
  fieldId?: string | null;
  name: string;
  isRequired: boolean;
}

export function getReviewerWorkspaceState<TValues>(
  ownDraft: ReviewerRecord<TValues> | null,
  ownSubmission: ReviewerRecord<TValues> | null,
  reviewerId: string,
): ReviewerWorkspaceState<TValues> {
  return {
    ownDraft: ownDraft?.reviewerId === reviewerId ? ownDraft : null,
    ownSubmission: ownSubmission?.reviewerId === reviewerId ? ownSubmission : null,
    otherReviewerRecord: null,
  };
}

export function getEffectiveReviewerValues<TValues>(
  state: ReviewerWorkspaceState<TValues>,
): TValues | null {
  return getEffectiveReviewerRecordValues(state.ownDraft, state.ownSubmission);
}

function isRequiredValueMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  if (record.isNotReported === true) return false;
  if (typeof record.stringValue === "string") {
    return record.stringValue.trim() === "";
  }
  if (typeof record.numericValue === "number") {
    return !Number.isFinite(record.numericValue);
  }
  if (typeof record.booleanValue === "boolean") return false;
  if (typeof record.optionId === "string") return record.optionId.trim() === "";
  if (Array.isArray(record.optionIds)) return record.optionIds.length === 0;
  if (Array.isArray(record.values)) return record.values.length === 0;

  const hasTypedValue = [
    "stringValue",
    "numericValue",
    "booleanValue",
    "optionId",
    "optionIds",
    "values",
  ].some((key) => key in record);
  if (hasTypedValue) return true;

  return Object.keys(record).length === 0;
}

export function findMissingRequiredFields(
  fields: RequiredField[],
  values: Record<string, unknown>,
  notReported: Record<string, boolean>,
): string[] {
  return fields
    .filter((field) => {
      if (!field.isRequired || !field.fieldId || notReported[field.fieldId]) {
        return false;
      }

      return isRequiredValueMissing(values[field.fieldId]);
    })
    .map((field) => field.name);
}

export function canFinalizeConsensus(reviewerIds: string[]): boolean {
  return reviewerIds.length === 2 && reviewerIds[0] !== reviewerIds[1];
}
export function applyAiProposalToDraft<TValues extends Record<string, unknown>>(
  currentDraft: TValues,
  proposedValues: Partial<TValues>,
): TValues {
  return { ...currentDraft, ...proposedValues };
}

export function hasTwoIndependentSubmissions<TValues>(
  submissions: ReviewerRecord<TValues>[],
): boolean {
  return (
    submissions.length === 2 &&
    submissions[0].reviewerId !== submissions[1].reviewerId
  );
}
