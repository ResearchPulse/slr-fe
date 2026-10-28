import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SynthesisWorkspaceDto } from "../../../types/synthesisExecution";
import SynthesisDashboard from "./SynthesisDashboard";

const workspace = {
  process: { status: "InProgress", startedAt: null, completedAt: null },
  totalExtractedPapers: 3,
  themes: [{ id: "t1" }],
  findings: [{ id: "f1" }, { id: "f2" }],
} as unknown as SynthesisWorkspaceDto;

function renderDashboard(props: { isSynthesisComplete?: boolean; withArtifacts?: boolean }) {
  const onNavigateToArtifacts = vi.fn();
  render(
    <SynthesisDashboard
      workspace={workspace}
      finalizedFindingCount={props.isSynthesisComplete ? 2 : 1}
      evidenceCount={4}
      isSynthesisComplete={props.isSynthesisComplete}
      onNavigateToThematic={vi.fn()}
      onNavigateToDescriptiveCharts={vi.fn()}
      onNavigateToRqReporting={vi.fn()}
      onNavigateToArtifacts={props.withArtifacts === false ? undefined : onNavigateToArtifacts}
    />,
  );
  return { onNavigateToArtifacts };
}

describe("SynthesisDashboard SLR artifacts entry", () => {
  it("opens the artifacts workspace and says it is ready once synthesis is complete", () => {
    const { onNavigateToArtifacts } = renderDashboard({ isSynthesisComplete: true });
    expect(screen.getByText("Synthesis complete · ready to generate")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /SLR Artifacts \(A1–A10\)/ }));
    expect(onNavigateToArtifacts).toHaveBeenCalledTimes(1);
  });

  it("tells the user to finalize RQ findings first while synthesis is incomplete", () => {
    renderDashboard({ isSynthesisComplete: false });
    expect(screen.getByText("Finalize RQ findings first (1 / 2)")).toBeTruthy();
  });

  it("hides the card when no artifacts handler is provided", () => {
    renderDashboard({ withArtifacts: false });
    expect(screen.queryByText(/SLR Artifacts/)).toBeNull();
  });
});
