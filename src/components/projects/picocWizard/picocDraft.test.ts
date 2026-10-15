import { describe, expect, it } from "vitest";
import {
  addCustomTerm,
  applyReviewFlags,
  buildSuggestionRequest,
  removeItem,
  setComparisonNotApplicable,
  setSuggestionState,
  upstreamSignature,
} from "./picocDraft";
import { emptyDraft, item, suggestion } from "./picocTestUtils";

describe("picocDraft helpers", () => {
  it("selects, marks not sure, and removes a suggestion while keeping its provenance and rationale", () => {
    let draft = setSuggestionState(emptyDraft(), "intervention", suggestion("Robust aggregation", { synonyms: ["Byzantine-robust aggregation"] }), "selected");
    expect(draft.picoc.intervention).toEqual([
      expect.objectContaining({ label: "Robust aggregation", origin: "ai", status: "selected", rationale: "Rationale for Robust aggregation", synonyms: ["Byzantine-robust aggregation"] }),
    ]);
    draft = setSuggestionState(draft, "intervention", suggestion("robust  aggregation"), "unsure");
    expect(draft.picoc.intervention).toHaveLength(1);
    expect(draft.picoc.intervention[0].status).toBe("unsure");
    draft = setSuggestionState(draft, "intervention", suggestion("Robust aggregation"), null);
    expect(draft.picoc.intervention).toEqual([]);
  });

  it("adds custom terms with origin user and ignores duplicates", () => {
    let draft = addCustomTerm(emptyDraft(), "population", "  IoT   gateways ");
    draft = addCustomTerm(draft, "population", "iot gateways");
    expect(draft.picoc.population).toEqual([expect.objectContaining({ label: "IoT gateways", origin: "user", status: "selected" })]);
  });

  it("keeps N/A and selected comparators mutually exclusive (T-10)", () => {
    let draft = emptyDraft();
    draft.picoc.comparison = [item("c1", "FedAvg"), item("c2", "Krum", { status: "unsure" })];
    draft = setComparisonNotApplicable(draft, "Mapping study");
    expect(draft.comparisonNotApplicable).toEqual({ reason: "Mapping study" });
    expect(draft.picoc.comparison.map((value) => value.label)).toEqual(["Krum"]);

    draft = setSuggestionState(draft, "comparison", suggestion("Synchronous FL", { component: "comparison" }), "selected");
    expect(draft.comparisonNotApplicable).toBeNull();
    draft = setComparisonNotApplicable(draft, "Again");
    draft = addCustomTerm(draft, "comparison", "Centralised training");
    expect(draft.comparisonNotApplicable).toBeNull();
  });

  it("flags but never deletes selections that refreshed suggestions dropped (T-08)", () => {
    const draft = emptyDraft();
    draft.picoc.intervention = [item("a", "Staleness weighting"), item("b", "My method", { origin: "user" })];
    const flagged = applyReviewFlags(draft, "intervention", ["a"]);
    expect(flagged.picoc.intervention).toEqual([
      expect.objectContaining({ id: "a", needsReview: true }),
      expect.objectContaining({ id: "b", needsReview: false }),
    ]);
    expect(removeItem(flagged, "intervention", "a").picoc.intervention.map((value) => value.id)).toEqual(["b"]);
  });

  it("changes a component's signature only when an earlier step changes", () => {
    const draft = emptyDraft();
    const before = upstreamSignature(draft, "intervention");
    const withOutcome = addCustomTerm(draft, "outcome", "Accuracy");
    expect(upstreamSignature(withOutcome, "intervention")).toBe(before);
    const withContext = addCustomTerm(draft, "context", "Intermittent connectivity");
    expect(upstreamSignature(withContext, "intervention")).not.toBe(before);
  });

  it("builds a suggestion request with confirmed labels only (not-sure terms excluded)", () => {
    const draft = emptyDraft();
    draft.picoc.context = [item("x", "Intermittent connectivity"), item("y", "Mobile edge", { status: "unsure" })];
    draft.picoc.intervention = [item("i", "Robust aggregation")];
    const request = buildSuggestionRequest(draft, "intervention", "more", ["Shown A"]);
    expect(request.context.confirmed.context).toEqual(["Intermittent connectivity"]);
    expect(request.context.keywords).toEqual([{ label: "Edge computing", origin: "openalex" }]);
    expect(request.exclude).toEqual(["Shown A"]);
    expect(request.currentSelections).toEqual([{ id: "i", label: "Robust aggregation", synonyms: [], origin: "ai" }]);
    expect(buildSuggestionRequest(draft, "intervention", "refresh", ["Shown A"]).exclude).toEqual([]);
  });
});
