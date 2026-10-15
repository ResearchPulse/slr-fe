import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PicocWizard from "./PicocWizard";
import PicocCanvas from "./PicocCanvas";
import { emptyDraft, item, record } from "./picocTestUtils";
import { picocWizardStateService } from "../../../services/picocWizardStateService";

vi.mock("../../../services/picocWizardStateService", () => ({
  picocWizardStateService: { getState: vi.fn(), saveState: vi.fn(), suggest: vi.fn(), exportFile: vi.fn() },
}));

const service = vi.mocked(picocWizardStateService);

describe("PicocCanvas (T-11)", () => {
  it("lists components in P–I–C–O–C order with provenance, N/A reason, and jump-to-step", () => {
    const draft = emptyDraft({ comparisonNotApplicable: { reason: "Mapping study" } });
    draft.researchField = {
      topic: { id: "https://openalex.org/T1", label: "Federated learning" },
      field: { id: "https://openalex.org/fields/17", label: "Computer Science" },
      source: "openalex_suggestion",
      classifierVersion: "2",
    };
    draft.picoc.population = [item("p", "Edge devices", { origin: "user" })];
    draft.picoc.context = [item("c", "Intermittent connectivity", { status: "unsure", needsReview: true })];
    const onSelectStep = vi.fn();
    render(<PicocCanvas draft={draft} onSelectStep={onSelectStep} />);

    const order = ["population", "intervention", "comparison", "outcome", "context"].map((component) => screen.getByTestId(`canvas-${component}`));
    order.reduce((previous, current) => {
      expect(previous.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      return current;
    });
    expect(screen.getByText("Federated learning")).toBeTruthy();
    expect(screen.getByText("OpenAlex suggestion · classifier v2")).toBeTruthy();
    expect(within(screen.getByTestId("canvas-population")).getByText("· You added")).toBeTruthy();
    expect(within(screen.getByTestId("canvas-comparison")).getByText("Mapping study")).toBeTruthy();
    expect(within(screen.getByTestId("canvas-context")).getByText("(not sure)")).toBeTruthy();
    expect(within(screen.getByTestId("canvas-context")).getByText("· needs review")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Outcome" }));
    expect(onSelectStep).toHaveBeenCalledWith("outcome");
  });
});

describe("PicocWizard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.values(service).forEach((mock) => mock.mockReset());
  });
  afterEach(() => vi.useRealTimers());

  it("resumes at the saved step and autosaves with the last revision (T-02 / T-13)", async () => {
    const saved = emptyDraft({ currentStep: "intent" });
    service.getState.mockResolvedValue(record(saved, { revision: 4 }));
    service.saveState.mockImplementation(async (_projectId, expectedRevision, state) => record(state, { revision: expectedRevision + 1 }));
    render(<PicocWizard projectId="p1" canEdit />);

    const topic = await screen.findByLabelText("Research topic");
    expect(screen.getByText("PICOC · Step 1/8")).toBeTruthy();
    fireEvent.change(topic, { target: { value: "New topic" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(service.saveState).toHaveBeenCalledWith("p1", 4, expect.objectContaining({ intent: { topic: "New topic", description: "Edge systems" } }));
    expect(await screen.findByText("Draft saved")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(service.saveState).toHaveBeenLastCalledWith("p1", 5, expect.objectContaining({ currentStep: "field" }));
  });

  it("stops autosave and offers reload when another member saved first", async () => {
    service.getState.mockResolvedValue(record(emptyDraft()));
    service.saveState.mockRejectedValue(new AxiosError("conflict", "ERR", undefined, undefined, {
      status: 409, data: {}, statusText: "Conflict", headers: {}, config: { headers: new AxiosHeaders() },
    }));
    render(<PicocWizard projectId="p1" canEdit />);

    fireEvent.change(await screen.findByLabelText("Research topic"), { target: { value: "Edited" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(await screen.findByText(/Someone else saved this PICOC/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Research topic"), { target: { value: "Edited again" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(service.saveState).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    await waitFor(() => expect(service.getState).toHaveBeenCalledTimes(2));
  });

  it("shows gate results with remediation on the review step and never shows a score", async () => {
    service.getState.mockResolvedValue(record(emptyDraft({ currentStep: "review" })));
    service.saveState.mockImplementation(async (_projectId, expectedRevision, state) => record(state, { revision: expectedRevision + 1 }));
    render(<PicocWizard projectId="p1" canEdit />);

    const gate = await screen.findByRole("list", { name: "Quality gate" });
    expect(within(gate).getByText("Blocked")).toBeTruthy();
    expect(within(gate).getByText("Not Run")).toBeTruthy();
    expect(gate.textContent).not.toMatch(/%|score/i);
    fireEvent.click(within(gate).getByRole("button", { name: /Go to Context/ }));
    expect(await screen.findByRole("heading", { name: /setting or conditions/ })).toBeTruthy();
  });

  it("is read-only for members who are not the project leader", async () => {
    service.getState.mockResolvedValue(record(emptyDraft()));
    render(<PicocWizard projectId="p1" canEdit={false} />);
    expect(await screen.findByText(/The project leader defines the PICOC/)).toBeTruthy();
    expect(screen.queryByLabelText("Research topic")).toBeNull();
    expect(screen.getByRole("complementary", { name: "PICOC canvas" })).toBeTruthy();
  });
});
