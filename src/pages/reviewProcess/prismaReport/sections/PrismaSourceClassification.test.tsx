import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrismaSourceClassification from "./PrismaSourceClassification";
import { useProjectMember } from "../../../../hooks/useProjectMember";
import { useSearchSources } from "../../../../hooks/useSearchSources";
import prismaReportService from "../../../../services/prismaReportService";

vi.mock("../../../../hooks/useProjectMember", () => ({ useProjectMember: vi.fn() }));
vi.mock("../../../../hooks/useSearchSources", () => ({ useSearchSources: vi.fn() }));
vi.mock("../../../../services/prismaReportService", () => ({
  default: { classifySearchSource: vi.fn() },
}));

const mockUseProjectMember = vi.mocked(useProjectMember);
const mockUseSearchSources = vi.mocked(useSearchSources);
const mockClassify = vi.mocked(prismaReportService.classifySearchSource);

function renderWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PrismaSourceClassification projectId="project-1" />
    </QueryClientProvider>,
  );
}

describe("PrismaSourceClassification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProjectMember.mockReturnValue({ member: { isLeader: true } } as ReturnType<typeof useProjectMember>);
    mockClassify.mockResolvedValue(undefined);
  });

  it("clears a saved source classification when Unclassified is selected", async () => {
    mockUseSearchSources.mockReturnValue({
      searchSources: [{ sourceId: "source-1", name: "PubMed", prismaSourceGroup: "DATABASES_AND_REGISTERS" }],
      isLoadingSources: false,
      searchSourcesError: null,
      refetchSearchSources: vi.fn(),
    } as unknown as ReturnType<typeof useSearchSources>);

    renderWithClient();
    fireEvent.change(screen.getByRole("combobox", { name: "PRISMA source group for PubMed" }), {
      target: { value: "" },
    });

    await waitFor(() => expect(mockClassify).toHaveBeenCalledWith("project-1", "source-1", null));
  });

  it("shows source loading failures and retries the query", () => {
    const refetchSearchSources = vi.fn();
    mockUseSearchSources.mockReturnValue({
      searchSources: [],
      isLoadingSources: false,
      searchSourcesError: new Error("network unavailable"),
      refetchSearchSources,
    } as unknown as ReturnType<typeof useSearchSources>);

    renderWithClient();
    expect(screen.getByRole("alert").textContent).toContain("Could not load search sources");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetchSearchSources).toHaveBeenCalledOnce();
  });
});
