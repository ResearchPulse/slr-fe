import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { isAxiosError } from "axios";
import { FiCpu, FiKey, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import api from "../../../../config/axios";
import Select from "../../../../components/ui/Select";
import Button from "../../../../components/ui/Button";
import AIReviewResultCard from "../../../../components/projects/AIReviewResultCard";
import { useProjectMember } from "../../../../hooks/useProjectMember";
import { toastError, toastSuccess } from "../../../../utils/toast";
import type { RootState } from "../../../../redux/store";

type ReviewStage = "TITLE_ABSTRACT" | "FULL_TEXT";
type AgentEntry = {
  agent: { id: string; name: string; description: string; isActive: boolean };
  access: { isActive: boolean } | null;
};
type AgentWorkspace = {
  agents: AgentEntry[];
  selectedAgentId: string | null;
};
type AgentTask = {
  id: string;
  agentId: string;
  agentName?: string;
  paperId: string;
  stage?: ReviewStage;
  instructions: string;
  status: "ASSIGNED" | "COMPLETED";
  result?: { decision: string; reasoning: string; data?: Record<string, unknown> };
  createdAt: string;
};

const normalizeDecision = (value: string) => {
  const normalized = value.trim().toUpperCase();
  if (normalized === "INCLUDED") return "INCLUDE";
  if (normalized === "EXCLUDED") return "EXCLUDE";
  return normalized;
};

export default function ReviewerAiAgentPanel({
  paper,
  stage,
}: {
  paper: {
    id: string;
    title?: string;
    abstract?: string | null;
    pdfUrl?: string | null;
    extraction?: { status: string; message?: string | null } | null;
    decisions?: Array<{ reviewerId: string; decision: string; phase?: number }>;
  } | null;
  stage: ReviewStage;
}) {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const { member } = useProjectMember(projectId);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const [isChangingAgent, setIsChangingAgent] = useState(false);
  const [token, setToken] = useState("");
  const [taskError, setTaskError] = useState("");
  const agentsKey = ["reviewer-ai-agents", projectId];
  const tasksKey = ["reviewer-ai-agent-tasks", projectId, paper?.id];

  const agentsQuery = useQuery({
    queryKey: agentsKey,
    queryFn: async () => {
      const response = await api.get<{ data: AgentWorkspace }>(`/projects/${projectId}/ai-review/agents`);
      return response.data.data;
    },
    enabled: Boolean(projectId && member?.role === 3),
  });

  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: async () => {
      const response = await api.get<{ data: AgentTask[] }>(`/projects/${projectId}/ai-review/tasks`, {
        params: { paperIds: paper!.id },
      });
      return response.data.data;
    },
    enabled: Boolean(projectId && paper?.id && member?.role === 3),
    refetchInterval: 15_000,
  });

  const connectMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await api.post<{ data: { accessToken: string } }>(`/projects/${projectId}/ai-review/agents`, { agentId });
      return response.data.data;
    },
    onSuccess: async (result) => {
      setToken(result.accessToken);
      setIsChangingAgent(false);
      toastSuccess("AI agent connected", "This agent is now connected to your reviewer workspace for this project.");
      await queryClient.invalidateQueries({ queryKey: agentsKey });
    },
    onError: () => toastError("Could not connect AI agent"),
  });

  const taskMutation = useMutation({
    mutationFn: async (agentId: string) => api.post(`/projects/${projectId}/ai-review/agents/${agentId}/tasks`, {
      paperId: paper!.id,
      stage,
      instructions: "Review this paper against the protocol criteria. Return a recommendation with criterion-level evidence and reasoning. Do not make or submit a human screening decision.",
    }),
    onSuccess: async () => {
      setTaskError("");
      toastSuccess("AI review task assigned");
      await queryClient.invalidateQueries({ queryKey: tasksKey });
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.error?.message || error.response?.data?.error?.code || error.message
        : error instanceof Error ? error.message : "Could not assign the paper to this AI agent.";
      setTaskError(message);
      toastError("Could not assign the paper to this AI agent", message);
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ agentId, action }: { agentId: string; action: "rotate" | "disable" | "enable" | "token" }) => {
      if (action === "rotate") {
        const response = await api.post<{ data: { accessToken: string } }>(`/projects/${projectId}/ai-review/agents/${agentId}/rotate-token`);
        return response.data.data.accessToken;
      }
      if (action === "token") {
        const response = await api.get<{ data: { accessToken: string } }>(`/projects/${projectId}/ai-review/agents/${agentId}/token`);
        return response.data.data.accessToken;
      }
      await api.patch(`/projects/${projectId}/ai-review/agents/${agentId}`, { isActive: action === "enable" });
      return "";
    },
    onSuccess: async (nextToken, variables) => {
      if (nextToken) setToken(nextToken);
      if (variables.action === "disable") setToken("");
      await queryClient.invalidateQueries({ queryKey: agentsKey });
    },
    onError: () => toastError("Could not update AI agent access"),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ agentId, taskId }: { agentId: string; taskId: string }) =>
      api.delete(`/projects/${projectId}/ai-review/agents/${agentId}/tasks/${taskId}`),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: tasksKey }),
    onError: () => toastError("Only pending AI tasks can be removed"),
  });

  if (member?.role !== 3 || !paper || !projectId) return null;
  const entries = agentsQuery.data?.agents ?? [];
  const selectedAgent = entries.find(({ agent }) => agent.id === agentsQuery.data?.selectedAgentId) ?? null;
  const available = entries.filter(({ agent }) => agent.isActive && agent.id !== selectedAgent?.agent.id);
  const canAssignTask = Boolean(selectedAgent?.agent.isActive && selectedAgent.access?.isActive);
  const tasks = (tasksQuery.data ?? []).filter((task) => task.stage === stage);
  const ownDecision = paper.decisions?.find((decision) =>
    decision.reviewerId === currentUserId && decision.phase === (stage === "FULL_TEXT" ? 1 : 0),
  );
  const completedRecommendations = [...new Set(tasks
    .filter((task) => task.status === "COMPLETED" && task.result?.decision)
    .map((task) => normalizeDecision(task.result!.decision)))];

  return (
    <section className="w-full min-w-0 rounded-xl border border-violet-200 bg-white p-4 shadow-sm" aria-label="My AI agent reviews">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-violet-50 p-2 text-violet-700"><FiCpu /></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary">My AI review workspace</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-text-secondary">Choose one AI agent for your reviewer workspace in this project. Its token is reused for every task you assign, and its results stay separate from human decisions.</p>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-2">
        {!selectedAgent || isChangingAgent ? (
          <div className="space-y-2">
            <Select
              aria-label="Connect an AI agent"
              value=""
              placeholder={available.length
                ? selectedAgent ? "Choose a replacement AI agent" : "Choose one AI agent for this project"
                : "No other active agents are available"}
              disabled={!available.length || connectMutation.isPending}
              onChange={(event) => {
                if (event.target.value) connectMutation.mutate(event.target.value);
              }}
              options={available.map(({ agent }) => ({
                value: agent.id,
                label: agent.name,
                description: agent.description,
              }))}
              containerClassName="w-full min-w-0"
              menuClassName="max-h-72"
              className="h-10 rounded-lg px-3 text-xs"
            />
            {selectedAgent && isChangingAgent && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] leading-4 text-text-secondary">
                  Switching agents disables the current token; its pending tasks may stop being processed.
                </p>
                <button
                  type="button"
                  onClick={() => setIsChangingAgent(false)}
                  className="shrink-0 text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0 rounded-lg border border-border bg-slate-50/70 px-3 py-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-600">
                <FiCpu className="h-[18px] w-[18px]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Project agent</p>
                <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="max-w-full truncate text-[13px] font-semibold leading-5 text-text-primary">{selectedAgent.agent.name}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium ${selectedAgent.access?.isActive ? "text-emerald-700" : "text-text-secondary"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedAgent.access?.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {selectedAgent.access?.isActive ? "Connected" : "Disabled"}
                  </span>
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <button type="button" aria-label={`View ${selectedAgent.agent.name} token`} onClick={() => actionMutation.mutate({ agentId: selectedAgent.agent.id, action: "token" })} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-text-secondary transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" title="View token"><FiKey className="h-4 w-4" /></button>
                <button type="button" aria-label={`Rotate ${selectedAgent.agent.name} token`} onClick={() => actionMutation.mutate({ agentId: selectedAgent.agent.id, action: "rotate" })} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-text-secondary transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" title="Rotate token"><FiRefreshCw className="h-4 w-4" /></button>
                <button type="button" onClick={() => actionMutation.mutate({ agentId: selectedAgent.agent.id, action: selectedAgent.access?.isActive ? "disable" : "enable" })} className="h-8 rounded-md border border-border bg-white px-2.5 text-[11px] font-medium text-text-secondary transition hover:border-slate-300 hover:bg-white hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{selectedAgent.access?.isActive ? "Disable" : "Enable"}</button>
              </div>
            </div>
            {available.length > 0 && (
              <div className="mt-1.5 pl-12">
                <button type="button" onClick={() => setIsChangingAgent(true)} className="rounded px-1.5 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Change agent</button>
              </div>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!canAssignTask || taskMutation.isPending}
          onClick={() => selectedAgent && taskMutation.mutate(selectedAgent.agent.id)}
          className="h-10 w-full rounded-lg normal-case tracking-normal text-xs font-semibold"
        >
          {taskMutation.isPending
            ? "Assigning…"
            : selectedAgent
              ? `Send paper to ${selectedAgent.agent.name}`
              : "Choose an AI agent to continue"}
        </Button>
      </div>

      {token && <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <label className="text-[10px] font-semibold uppercase text-amber-900">Reviewer scoped agent token</label>
        <input readOnly value={token} onFocus={(event) => event.currentTarget.select()} className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1.5 font-mono text-[10px]" />
        <p className="mt-1 text-[10px] text-amber-900">This token only retrieves your AI review tasks for this project.</p>
      </div>}

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Agent results · {stage === "FULL_TEXT" ? "Full text" : "Title / abstract"}</p>
        {agentsQuery.isError && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"><span>Could not load your AI workspace.</span><button type="button" onClick={() => void agentsQuery.refetch()} className="shrink-0 font-semibold underline">Retry</button></div>}
        {tasksQuery.isLoading && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-text-secondary">Loading AI review results…</p>}
        {tasksQuery.isError && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"><span>Could not load AI task results.</span><button type="button" onClick={() => void tasksQuery.refetch()} className="shrink-0 font-semibold underline">Retry</button></div>}
        {taskError && <div role="alert" className="break-words rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Task assignment failed: {taskError}</div>}
        {ownDecision && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          Your screening decision: <strong>{ownDecision.decision}</strong>. AI recommendations below are for comparison and never create a human-review conflict by themselves.
        </div>}
        {completedRecommendations.length > 1 && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          AI recommendations differ. This is an AI-only disagreement, not a formal conflict between Human Reviewers.
        </div>}
        {tasks.length === 0 && !tasksQuery.isLoading && !tasksQuery.isError && <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-text-secondary">No AI tasks for this paper yet.</p>}
        {tasks.map((task) => <div key={task.id} className="relative min-w-0">
          <AIReviewResultCard
            task={task}
            humanDecision={ownDecision?.decision}
            paperInput={{ hasPdf: Boolean(paper.pdfUrl), extractionStatus: paper.extraction?.status, extractionMessage: paper.extraction?.message }}
          />
          {task.status === "ASSIGNED" && <div className="mt-1 flex justify-end"><button type="button" aria-label="Remove pending AI review" onClick={() => removeMutation.mutate({ agentId: task.agentId, taskId: task.id })} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-text-secondary hover:bg-rose-50 hover:text-rose-700"><FiTrash2 /> Remove pending task</button></div>}
        </div>)}
      </div>
    </section>
  );
}
