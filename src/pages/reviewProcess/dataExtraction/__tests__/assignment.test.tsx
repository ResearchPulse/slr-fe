import { act, renderHook, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectRole } from "../../../../types/project";
import { login } from "../../../../redux/slices/authSlice";
import authReducer from "../../../../redux/slices/authSlice";
import { projectService } from "../../../../services/projectService";
import { dataExtractionConductingService } from "../../../../services/dataExtractionConductingService";
import { dataExtractionTemplateService } from "../../../../services/dataExtractionService";
import { useDataExtractionWorkspace } from "../hooks/useDataExtractionWorkspace";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ projectId: "project-1" }),
}));

function TestProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
  );
  queryClient.invalidateQueries = vi.fn().mockResolvedValue(undefined);
  const [store] = useState(() => {
    const nextStore = configureStore({ reducer: { auth: authReducer } });
    nextStore.dispatch(
      login({
        accessToken: "token",
        accessTokenExpiresAt: "2026-10-13T00:00:00.000Z",
        user: { id: "leader-1", name: "Project Leader" },
      }),
    );
    return nextStore;
  });

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}

describe("data extraction assignment", () => {
  beforeEach(() => {
    vi.spyOn(projectService, "getProjectMembers").mockResolvedValue({
      isSuccess: true,
      message: "",
      data: {
        items: [
          {
            userId: "leader-1",
            projectId: "project-1",
            role: ProjectRole.Owner,
            roleText: "OWNER",
            joinedAt: "2026-10-12T00:00:00.000Z",
            userName: "project-leader",
            fullName: "Project Leader",
            email: "leader@example.com",
          },
          {
            userId: "reviewer-1",
            projectId: "project-1",
            role: ProjectRole.Reviewer,
            roleText: "REVIEWER",
            joinedAt: "2026-10-12T00:00:00.000Z",
            userName: "jane-doe",
            fullName: "Jane Doe",
            email: "jane@example.com",
          },
          {
            userId: "reviewer-2",
            projectId: "project-1",
            role: ProjectRole.Reviewer,
            roleText: "REVIEWER",
            joinedAt: "2026-10-12T00:00:00.000Z",
            userName: "john-doe",
            fullName: "John Doe",
            email: "john@example.com",
          },
        ],
        totalCount: 3,
        pageNumber: 1,
        pageSize: 100,
        totalPages: 1,
      },
    } as never);
    vi.spyOn(projectService, "getProjectById").mockResolvedValue({
      isSuccess: true,
      message: "",
      data: { dataExtraction: { statusText: "InProgress" } },
    } as never);
    vi.spyOn(dataExtractionConductingService, "getDashboard").mockResolvedValue({
      summary: {
        totalIncluded: 0,
        inProgress: 0,
        awaitingConsensus: 0,
        completed: 0,
        notStarted: 0,
      },
      tasks: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    } as never);
    vi.spyOn(dataExtractionConductingService, "getWorkloadSummary").mockResolvedValue({} as never);
    vi.spyOn(dataExtractionTemplateService, "list").mockResolvedValue([
      {
        templateId: "template-1",
        projectId: "project-1",
        name: "Extraction template",
        sections: [],
      },
    ] as never);
  });

  it("sends the canonical reviewer tuple for an assignment", async () => {
    const assignReviewers = vi
      .spyOn(dataExtractionConductingService, "assignReviewers")
      .mockResolvedValue({} as never);

    const { result } = renderHook(() => useDataExtractionWorkspace(), {
      wrapper: TestProviders,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.assignPaper("paper-1", {
        reviewerIds: ["reviewer-1", "reviewer-2"],
        templateId: "template-1",
      });
    });

    expect(assignReviewers).toHaveBeenCalledWith(
      "project-1",
      "paper-1",
      {
        reviewerIds: ["reviewer-1", "reviewer-2"],
        templateId: "template-1",
      },
    );
  });
});
