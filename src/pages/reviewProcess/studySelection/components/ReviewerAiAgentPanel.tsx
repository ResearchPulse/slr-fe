import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { FiCpu, FiKey, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import api from "../../../../config/axios";
import { useProjectMember } from "../../../../hooks/useProjectMember";
import { toastError, toastSuccess } from "../../../../utils/toast";
import type { RootState } from "../../../../redux/store";

type ReviewStage = "TITLE_ABSTRACT" | "FULL_TEXT";
type AgentEntry = {
  agent: { id: string; name: string; description: string; isActive: boolean };
  access: { isActive: boolean } | null;
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
    abstract?: string;
    decisions?: Array<{ reviewerId: string; decision: string; phase?: number }>;
  } | null;
  stage: ReviewStage;
}) {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const { member } = useProjectMember(projectId);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const agentsKey = ["reviewer-ai-agents", projectId];
  const tasksKey = ["reviewer-ai-agent-tasks", projectId, paper?.id];

  const agentsQuery = useQuery({
    queryKey: agentsKey,
    queryFn: async () => {
      const response = await api.get<{ data: AgentEntry[] }>(`/projects/${projectId}/ai-review/agents`);
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
      toastSuccess("AI agent connected", "The project and reviewer scoped token was created.");
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
      toastSuccess("AI review task assigned");
      await queryClient.invalidateQueries({ queryKey: tasksKey });
    },
    onError: () => toastError("Could not assign the paper to this AI agent. Check that the paper is assigned to you."),
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
  const entries = agentsQuery.data ?? [];
  const connected = entries.filter(({ access }) => access);
  const available = entries.filter(({ agent, access }) => agent.isActive && !access);
  const selectedConnected = connected.filter(({ agent, access }) => access?.isActive && selectedAgentIds.includes(agent.id));
  const tasks = (tasksQuery.data ?? []).filter((task) => task.stage === stage);
  const ownDecision = paper.decisions?.find((decision) =>
    decision.reviewerId === currentUserId && decision.phase === (stage === "FULL_TEXT" ? 1 : 0),
  );
  const completedRecommendations = [...new Set(tasks
    .filter((task) => task.status === "COMPLETED" && task.result?.decision)
    .map((task) => normalizeDecision(task.result!.decision)))];

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm" aria-label="My AI agent reviews">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-violet-50 p-2 text-violet-700"><FiCpu /></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary">My AI review workspace</h3>
          <p className="mt-1 text-xs leading-5 text-text-secondary">AI agents assist your screening. Their results stay separate from human decisions and reviewer conflicts.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select aria-label="Connect an AI agent" defaultValue="" disabled={!available.length || connectMutation.isPending} onChange={(event) => {
          const agentId = event.target.value;
          if (agentId) connectMutation.mutate(agentId);
          event.target.value = "";
        }} className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs">
          <option value="">{available.length ? "Connect an AI agent" : "No available agents in catalog"}</option>
          {available.map(({ agent }) => <option key={agent.id} value={agent.id}>{agent.name}{agent.description ? ` — ${agent.description}` : ""}</option>)}
        </select>
        <button type="button" disabled={!selectedConnected.length || taskMutation.isPending} onClick={() => selectedConnected.forEach(({ agent }) => taskMutation.mutate(agent.id))} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {taskMutation.isPending ? "Assigning…" : `Send paper to ${selectedConnected.length || "selected"} agent${selectedConnected.length === 1 ? "" : "s"}`}
        </button>
      </div>

      {connected.length > 0 && <div className="mt-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Your connected agents</p>
        {connected.map(({ agent, access }) => <div key={agent.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-text-primary">
            <input type="checkbox" checked={selectedAgentIds.includes(agent.id)} disabled={!access?.isActive} onChange={(event) => setSelectedAgentIds(current => event.target.checked ? [...current, agent.id] : current.filter(id => id !== agent.id))} />
            <span className="truncate">{agent.name}</span>
            <span className={access?.isActive ? "text-emerald-700" : "text-rose-700"}>{access?.isActive ? "Connected" : "Disabled"}</span>
          </label>
          <button type="button" aria-label={`View ${agent.name} token`} onClick={() => actionMutation.mutate({ agentId: agent.id, action: "token" })} className="rounded border border-border p-1.5 text-text-secondary" title="View token"><FiKey /></button>
          <button type="button" aria-label={`Rotate ${agent.name} token`} onClick={() => actionMutation.mutate({ agentId: agent.id, action: "rotate" })} className="rounded border border-border p-1.5 text-text-secondary" title="Rotate token"><FiRefreshCw /></button>
          <button type="button" onClick={() => actionMutation.mutate({ agentId: agent.id, action: access?.isActive ? "disable" : "enable" })} className="rounded border border-border px-2 py-1 text-[10px] text-text-secondary">{access?.isActive ? "Disable" : "Enable"}</button>
        </div>)}
      </div>}

      {token && <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <label className="text-[10px] font-semibold uppercase text-amber-900">Reviewer scoped agent token</label>
        <input readOnly value={token} onFocus={(event) => event.currentTarget.select()} className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1.5 font-mono text-[10px]" />
        <p className="mt-1 text-[10px] text-amber-900">This token only retrieves your AI review tasks for this project.</p>
      </div>}

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Agent results · {stage === "FULL_TEXT" ? "Full text" : "Title / abstract"}</p>
        {ownDecision && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          Your screening decision: <strong>{ownDecision.decision}</strong>. AI recommendations below are for comparison and never create a human-review conflict by themselves.
        </div>}
        {completedRecommendations.length > 1 && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          AI agents disagree with each other. This is an AI-only disagreement, not a formal conflict between Human Reviewers.
        </div>}
        {tasks.length === 0 && <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-text-secondary">No AI tasks for this paper yet.</p>}
        {tasks.map((task) => <article key={task.id} className="rounded-lg border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold text-text-primary">{task.agentName || "AI Agent"}</p><p className="mt-0.5 text-[10px] text-text-secondary">{task.status === "COMPLETED" ? "Result ready" : "Waiting for agent"}</p></div>
            {task.status === "ASSIGNED" && <button type="button" aria-label="Remove pending AI review" onClick={() => removeMutation.mutate({ agentId: task.agentId, taskId: task.id })} className="text-text-secondary hover:text-rose-700"><FiTrash2 /></button>}
          </div>
          {task.result && <div className="mt-2 rounded-md bg-violet-50 p-3">
            <p className="text-xs font-semibold text-violet-900">Recommendation: {task.result.decision}</p>
            {ownDecision && <p className="mt-1 text-[10px] font-medium text-violet-900">
              {normalizeDecision(task.result.decision) === normalizeDecision(ownDecision.decision)
                ? "Agrees with your screening decision"
                : "Differs from your screening decision · reviewer discussion only"}
            </p>}
            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">{task.result.reasoning}</p>
            {task.result.data && <details className="mt-2"><summary className="cursor-pointer text-[10px] font-semibold text-violet-800">Criteria and evidence</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[10px] text-slate-700">{JSON.stringify(task.result.data, null, 2)}</pre></details>}
          </div>}
        </article>)}
      </div>
    </section>
  );
}
