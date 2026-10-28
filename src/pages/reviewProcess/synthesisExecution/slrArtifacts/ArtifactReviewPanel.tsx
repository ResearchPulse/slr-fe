import { useState } from "react";
import { Check, X } from "lucide-react";
import Button from "../../../../components/ui/Button";
import type { SlrArtifactReview } from "../../../../services/slrArtifactsService";
import { asText, isObject, StatusPill, type Data } from "../SlrArtifactsShared";

export const REVIEW_NOTE_MAX = 2000;

/** The review entries `getArtifact` merges into the artifact metadata. */
export function readReviews(metadata: Data | null): SlrArtifactReview[] {
  const reviews = metadata?.reviews;
  if (!Array.isArray(reviews)) return [];
  return reviews.filter(isObject).flatMap((review) => (
    review.decision === "APPROVED" || review.decision === "REJECTED"
      ? [{
        artifact_type: review.artifact_type as SlrArtifactReview["artifact_type"],
        decision: review.decision,
        note: typeof review.note === "string" ? review.note : null,
        reviewer_id: asText(review.reviewer_id),
        at: asText(review.at, ""),
      }]
      : []
  ));
}

interface ArtifactReviewPanelProps {
  canReview: boolean;
  reviewStatus: string;
  validationStatus: string;
  reviews: SlrArtifactReview[];
  isSubmitting: boolean;
  onReview: (decision: "APPROVED" | "REJECTED", note: string) => void;
}

export default function ArtifactReviewPanel({ canReview, reviewStatus, validationStatus, reviews, isSubmitting, onReview }: ArtifactReviewPanelProps) {
  const [note, setNote] = useState("");
  const submit = (decision: "APPROVED" | "REJECTED") => {
    onReview(decision, note.trim());
    setNote("");
  };
  const history = [...reviews].reverse();
  return <section aria-label="Artifact review" className="space-y-3 rounded-xl border border-border bg-surface-white p-4">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-text-primary">Review</h3><StatusPill>{reviewStatus}</StatusPill></div>
    {canReview && <div className="space-y-2">
      <label className="block text-xs font-medium text-text-secondary">Review note (optional)
        <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, REVIEW_NOTE_MAX))} maxLength={REVIEW_NOTE_MAX} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-surface-white p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <span className="mt-1 block font-normal text-text-muted">{note.length} / {REVIEW_NOTE_MAX}</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={reviewStatus === "approved" || validationStatus === "invalid" || isSubmitting} onClick={() => submit("APPROVED")}><Check className="h-4 w-4" />Approve after review</Button>
        <Button variant="danger" size="sm" disabled={reviewStatus === "rejected" || isSubmitting} onClick={() => submit("REJECTED")}><X className="h-4 w-4" />Reject</Button>
        {validationStatus === "invalid" && <span className="text-xs text-text-muted">An artifact that failed validation cannot be approved.</span>}
      </div>
    </div>}
    {history.length > 0
      ? <ul aria-label="Review history" className="divide-y divide-border/60 text-sm">{history.map((review, index) => <li key={`${review.at}-${index}`} className="py-2"><div className="flex flex-wrap items-center gap-2"><StatusPill>{review.decision === "APPROVED" ? "approved" : "rejected"}</StatusPill><span className="text-xs text-text-muted">{review.at ? new Date(review.at).toLocaleString() : "—"} · reviewer {review.reviewer_id}</span></div>{review.note && <p className="mt-1 text-text-secondary">{review.note}</p>}</li>)}</ul>
      : <p className="text-sm text-text-muted">No review decisions recorded yet.</p>}
  </section>;
}
