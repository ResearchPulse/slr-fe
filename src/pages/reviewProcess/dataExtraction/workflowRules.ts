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

function isRequiredValueMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  if (record.isNotReported === true) return false;
  if ("stringValue" in record) {
    return typeof record.stringValue !== "string" || record.stringValue.trim() === "";
  }
  if ("numericValue" in record) {
    return typeof record.numericValue !== "number" || !Number.isFinite(record.numericValue);
  }
  if ("booleanValue" in record) return typeof record.booleanValue !== "boolean";
  if ("optionId" in record) return typeof record.optionId !== "string" || record.optionId.length === 0;
  if ("optionIds" in record) return !Array.isArray(record.optionIds) || record.optionIds.length === 0;
  if ("values" in record) return !Array.isArray(record.values) || record.values.length === 0;
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
