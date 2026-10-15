import { useEffect, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FieldStep from "./FieldStep";
import { emptyDraft } from "./picocTestUtils";
import type { PicocWizardDraft } from "./types";
import { picocWizardStateService } from "../../../services/picocWizardStateService";

vi.mock("../../../services/picocWizardStateService", () => ({
  picocWizardStateService: { classify: vi.fn(), browseTaxonomy: vi.fn(), track: vi.fn() },
}));

const service = vi.mocked(picocWizardStateService);
const probe: { draft?: PicocWizardDraft } = {};

function Harness({ initial }: { initial: PicocWizardDraft }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    probe.draft = draft;
  });
  return <FieldStep projectId="p1" draft={draft} update={(change) => setDraft((current) => change(current))} />;
}

const title = "Byzantine-robust asynchronous federated learning";
const initial = () => emptyDraft({
  intent: { topic: title, description: "Aggregation for heterogeneous edge devices under intermittent connectivity." },
  keywords: [],
});

const consentAndClassify = () => {
  fireEvent.click(screen.getByRole("checkbox", { name: /Send this exact title/ }));
  fireEvent.click(screen.getByRole("button", { name: "Get field suggestions" }));
};

describe("FieldStep", () => {
  beforeEach(() => Object.values(service).forEach((mock) => mock.mockReset()));

  it("shows primary + alternative topics with their path, keeps/drops keywords, and saves the confirmed field (scenario 1)", async () => {
    service.classify.mockResolvedValue({
      classifierVersion: "2",
      primaryTopic: {
        id: "https://openalex.org/T10",
        label: "Federated learning",
        domain: { id: "https://openalex.org/domains/3", label: "Physical Sciences" },
        field: { id: "https://openalex.org/fields/17", label: "Computer Science" },
        subfield: { id: "https://openalex.org/subfields/1702", label: "Artificial Intelligence" },
      },
      alternatives: [{ id: "https://openalex.org/T11", label: "Distributed systems" }],
      keywords: [{ id: "k1", label: "Edge computing" }, { id: "k2", label: "Blockchain" }],
      providerNote: null,
    });
    render(<Harness initial={initial()} />);

    const button = screen.getByRole("button", { name: "Get field suggestions" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true); // consent is required for every request
    consentAndClassify();

    expect(await screen.findByText("Federated learning · primary suggestion")).toBeTruthy();
    expect(screen.getByText("Physical Sciences → Computer Science → Artificial Intelligence")).toBeTruthy();
    expect(screen.getByText("Distributed systems")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d+%/);
    expect(service.classify).toHaveBeenCalledWith("p1", title, expect.stringContaining("Aggregation"));
    expect((screen.getByRole("checkbox", { name: /Send this exact title/ }) as HTMLInputElement).checked).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /Blockchain/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm selected topic" }));

    await waitFor(() => expect(probe.draft!.researchField).toMatchObject({
      topic: { id: "https://openalex.org/T10" },
      subfield: { id: "https://openalex.org/subfields/1702" },
      source: "openalex_suggestion",
      classifierVersion: "2",
    }));
    // The title/abstract snapshot is not stored until the retention policy is approved.
    expect(probe.draft!.researchField).not.toHaveProperty("inputSnapshot");
    expect(probe.draft!.keywords).toEqual([
      { id: "k1", label: "Edge computing", origin: "openalex", kept: true },
      { id: "k2", label: "Blockchain", origin: "openalex", kept: false },
    ]);
    expect(service.track).toHaveBeenCalledWith("p1", "field_confirmed", { source: "openalex" });
  });

  it("explains an empty topic result with the provider note (scenario 2)", async () => {
    service.classify.mockResolvedValue({ classifierVersion: "2", primaryTopic: null, alternatives: [], keywords: [], providerNote: "Title is too generic" });
    render(<Harness initial={initial()} />);
    consentAndClassify();
    expect(await screen.findByText(/OpenAlex found no topic: Title is too generic/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirm selected topic" })).toBeNull();
  });

  it("lets the user browse and confirm a field manually when OpenAlex times out (scenario 3)", async () => {
    service.classify.mockRejectedValue(new AxiosError("timeout", "ERR", undefined, undefined, {
      status: 504,
      data: { success: false, error: { code: "OPENALEX_TIMEOUT", message: "x" } },
      statusText: "",
      headers: {},
      config: { headers: new AxiosHeaders() },
    }));
    service.browseTaxonomy
      .mockResolvedValueOnce({ items: [{ id: "https://openalex.org/domains/3", label: "Physical Sciences", level: "domain" }], nextCursor: null })
      .mockResolvedValueOnce({ items: [{ id: "https://openalex.org/fields/17", label: "Computer Science", level: "field" }], nextCursor: null })
      .mockResolvedValueOnce({ items: [{ id: "https://openalex.org/subfields/1702", label: "Artificial Intelligence", level: "subfield" }], nextCursor: null })
      .mockResolvedValueOnce({ items: [{ id: "https://openalex.org/T10", label: "Federated learning", level: "topic" }], nextCursor: null });
    render(<Harness initial={initial()} />);
    consentAndClassify();
    expect(await screen.findByText(/OpenAlex did not respond in time\. You can browse/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Browse fields manually" }));
    fireEvent.click(await screen.findByRole("button", { name: "Physical Sciences" }));
    fireEvent.click(await screen.findByRole("button", { name: "Computer Science" }));
    fireEvent.click(await screen.findByRole("button", { name: "Artificial Intelligence" }));
    fireEvent.click(await screen.findByRole("button", { name: "Federated learning" }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirm “Federated learning”/ }));

    await waitFor(() => expect(probe.draft!.researchField).toMatchObject({
      topic: { id: "https://openalex.org/T10" },
      field: { id: "https://openalex.org/fields/17" },
      source: "manual_browse",
      classifierVersion: null,
    }));
    expect(service.browseTaxonomy).toHaveBeenLastCalledWith("p1", "topic", "https://openalex.org/subfields/1702");
    expect(service.track).toHaveBeenCalledWith("p1", "field_confirmed", { source: "user" });
  });
});
