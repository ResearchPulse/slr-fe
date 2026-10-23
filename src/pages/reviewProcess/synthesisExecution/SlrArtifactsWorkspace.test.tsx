import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectMember } from "../../../hooks/useProjectMember";
import { slrArtifactsService } from "../../../services/slrArtifactsService";
import SlrArtifactsWorkspace from "./SlrArtifactsWorkspace";

vi.mock("../../../hooks/useProjectMember", () => ({ useProjectMember: vi.fn() }));
vi.mock("../../../services/slrArtifactsService", () => ({
  SLR_ARTIFACT_TYPES: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"],
  slrArtifactsService: {
    listRuns: vi.fn(),
    generateRun: vi.fn(),
    getArtifact: vi.fn(),
    reviewArtifact: vi.fn(),
  },
}));

function renderWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SlrArtifactsWorkspace projectId="project-1" />
    </QueryClientProvider>,
  );
}

describe("SlrArtifactsWorkspace permission state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProjectMember).mockReturnValue({ member: null } as ReturnType<typeof useProjectMember>);
    vi.mocked(slrArtifactsService.listRuns).mockRejectedValue({ response: { status: 403 } });
  });

  it("explains project membership is required without offering an unsupported retry action", async () => {
    renderWorkspace();

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("You don’t have access to these SLR artifacts")).toBeTruthy();
    expect(screen.getByText(/ask a project owner to add you as a project member/i)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
