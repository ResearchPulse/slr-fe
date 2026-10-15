import { useEffect, useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ComponentStep, { type SuggestionCacheEntry } from "./ComponentStep";
import { addCustomTerm } from "./picocDraft";
import { emptyDraft, item, suggestion } from "./picocTestUtils";
import type { PicocComponent, PicocWizardDraft } from "./types";
import { picocWizardStateService } from "../../../services/picocWizardStateService";

vi.mock("../../../services/picocWizardStateService", () => ({
  picocWizardStateService: { suggest: vi.fn() },
}));

const suggest = vi.mocked(picocWizardStateService.suggest);

// Latest harness state, published from an effect so tests can read and drive it.
const probe: { draft?: PicocWizardDraft; setDraft?: (draft: PicocWizardDraft) => void } = {};

function Harness({ initial, component, cache }: { initial: PicocWizardDraft; component: PicocComponent; cache: Partial<Record<PicocComponent, SuggestionCacheEntry>> }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    probe.draft = draft;
    probe.setDraft = setDraft;
  });
  return <ComponentStep projectId="p1" component={component} draft={draft} cache={cache} update={(change) => setDraft((current) => change(current))} />;
}

const aiResponse = (labels: string[], selectionsToReview: string[] = []) => ({
  component: "intervention" as const,
  source: "ai" as const,
  fallbackReason: null,
  suggestions: labels.map((label) => suggestion(label)),
  selectionsToReview,
  model: "m",
  promptVersion: "picoc-suggest-v1",
});

describe("ComponentStep", () => {
  beforeEach(() => suggest.mockReset());

  it("shows suggestion cards with source labels; select / not sure use aria-pressed and update the draft", async () => {
    suggest.mockResolvedValueOnce(aiResponse(["Robust aggregation", "Staleness weighting", "Krum", "Median", "Trimmed mean"]));
    render(<Harness initial={emptyDraft()} component="intervention" cache={{}} />);

    const card = (await screen.findByText("Robust aggregation")).closest("li")!;
    expect(within(card).getByText("AI")).toBeTruthy();
    const select = within(card).getByRole("button", { name: /Select/ });
    expect(select.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(select);
    expect(within(card).getByRole("button", { name: /Selected/ }).getAttribute("aria-pressed")).toBe("true");
    expect(probe.draft!.picoc.intervention).toEqual([expect.objectContaining({ label: "Robust aggregation", status: "selected", origin: "ai" })]);

    fireEvent.click(within(card).getByRole("button", { name: /Not sure/ }));
    expect(probe.draft!.picoc.intervention[0].status).toBe("unsure");

    fireEvent.click(within(card).getByRole("button", { name: "Why?" }));
    expect(within(card).getByText("Rationale for Robust aggregation")).toBeTruthy();
    expect(suggest.mock.calls[0][1]).toMatchObject({ component: "intervention", mode: "refresh" });
  });

  it("shows the OpenAlex fallback with a retry, and custom terms survive suggestion changes", async () => {
    suggest.mockResolvedValueOnce({
      ...aiResponse([]),
      source: "openalex_fallback",
      fallbackReason: "AI_TIMEOUT",
      suggestions: [suggestion("Edge computing", { sourceType: "openalex" })],
    });
    suggest.mockResolvedValueOnce(aiResponse(["Robust aggregation"]));
    render(<Harness initial={emptyDraft()} component="intervention" cache={{}} />);

    expect(await screen.findByText(/AI suggestions are unavailable \(the AI service timed out\)/)).toBeTruthy();
    expect(screen.getByText("OpenAlex")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Add your own intervention term"), { target: { value: "My own method" } });
    fireEvent.click(screen.getByRole("button", { name: /Add/ }));
    expect(probe.draft!.picoc.intervention).toEqual([expect.objectContaining({ label: "My own method", origin: "user" })]);

    fireEvent.click(screen.getByRole("button", { name: /Retry AI suggestions/ }));
    expect(await screen.findByText("Robust aggregation")).toBeTruthy();
    expect(screen.getByText("My own method")).toBeTruthy();
    expect(screen.getByText("You added")).toBeTruthy();
  });

  it("reuses cached suggestions, and refreshes + flags selections when an earlier step changed (T-08)", async () => {
    const cache: Partial<Record<PicocComponent, SuggestionCacheEntry>> = {};
    const initial = emptyDraft();
    initial.picoc.intervention = [item("old", "Gradient clipping")];
    suggest.mockResolvedValueOnce(aiResponse(["Gradient clipping", "Robust aggregation"]));
    const view = render(<Harness initial={initial} component="intervention" cache={cache} />);
    await screen.findByText("Robust aggregation");
    view.unmount();

    // Revisiting with unchanged earlier steps does not call the AI again.
    const again = render(<Harness initial={initial} component="intervention" cache={cache} />);
    await screen.findByText("Robust aggregation");
    expect(suggest).toHaveBeenCalledTimes(1);

    // Changing Context (an earlier step) refreshes and flags the dropped AI selection.
    suggest.mockResolvedValueOnce(aiResponse(["Staleness-aware aggregation"], ["old"]));
    act(() => probe.setDraft!(addCustomTerm(probe.draft!, "context", "Intermittent connectivity")));
    expect(await screen.findByText(/Needs review — no longer suggested/)).toBeTruthy();
    expect(probe.draft!.picoc.intervention).toEqual([expect.objectContaining({ id: "old", needsReview: true })]);
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(probe.draft!.picoc.intervention[0].needsReview).toBe(false);
    again.unmount();
  });

  it("requires a reason for Comparison N/A and removes selected baselines when N/A is set (T-10)", async () => {
    suggest.mockResolvedValueOnce({ ...aiResponse(["FedAvg"]), component: "comparison" });
    const initial = emptyDraft({ reviewType: "comparative" });
    initial.picoc.comparison = [item("b", "Synchronous FL")];
    render(<Harness initial={initial} component="comparison" cache={{}} />);
    await screen.findByText("FedAvg");

    fireEvent.click(screen.getByLabelText(/Comparison is not applicable/));
    expect(screen.getByText(/Comparative reviews normally need a comparator/)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Enter a reason");
    expect(probe.draft!.comparisonNotApplicable).toBeNull();

    fireEvent.change(screen.getByLabelText("Reason (required)"), { target: { value: "Descriptive mapping only" } });
    await waitFor(() => expect(probe.draft!.comparisonNotApplicable).toEqual({ reason: "Descriptive mapping only" }));
    expect(probe.draft!.picoc.comparison).toEqual([]);
  });
});
