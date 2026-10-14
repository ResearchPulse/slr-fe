import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { isAxiosError } from "axios";
import { FiCopy, FiCpu, FiKey, FiRefreshCw, FiSettings, FiTrash2 } from "react-icons/fi";
import api from "../../../../config/axios";
import Select from "../../../../components/ui/Select";
import Button from "../../../../components/ui/Button";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import AIReviewResultCard from "../../../../components/projects/AIReviewResultCard";
import { useProjectMember } from "../../../../hooks/useProjectMember";
import { toastError, toastSuccess } from "../../../../utils/toast";
import type { RootState } from "../../../../redux/store";

type ReviewStage = "TITLE_ABSTRACT" | "FULL_TEXT";
type AgentEntry = {
  agent: { id: string; name: string; description: string; isActive: boolean };
  access: { isActive: boolean; agentCapabilities?: string[] } | null;
};
type AgentWorkspace = { agents: AgentEntry[]; selectedAgentId: string | null };
type AgentTask = {
  id: string;
  agentId: string;
  agentName?: string;
  paperId: string;
  stage?: ReviewStage;
  instructions: string;
  status: string;
  result?: { decision: string; reasoning: string; data?: Record<string, unknown> };
  error?: { code?: string; message?: string };
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
  const isReviewer = member?.role === 3;
  const isOwner = member?.role === 1;
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const [activeAgentId, setActiveAgentId] = useState("");
  const [isChoosingAgent, setIsChoosingAgent] = useState(false);
  const [taskToRemove, setTaskToRemove] = useState<AgentTask | null>(null);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});
  const agentsKey = ["reviewer-ai-agents", projectId];
  const tasksKey = ["reviewer-ai-agent-tasks", projectId, paper?.id];
  const taskStateKey = (agentId: string, paperId = paper?.id, taskStage = stage) => `${paperId ?? ""}:${taskStage}:${agentId}`;

  const agentsQuery = useQuery({
    queryKey: agentsKey,
    queryFn: async () => {
      if (isReviewer) {
        const response = await api.get<{ data: AgentWorkspace }>(`/projects/${projectId}/ai-review/agents`);
        return response.data.data;
      }
      const response = await api.get<{ data: AgentEntry[] }>(`/projects/${projectId}/agents`);
      return { agents: response.data.data, selectedAgentId: null };
    },
    enabled: Boolean(projectId && (isReviewer || isOwner)),
  });

  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: async () => {
      const response = isReviewer
        ? await api.get<{ data: AgentTask[] }>(`/projects/${projectId}/ai-review/tasks`, { params: { paperIds: paper!.id } })
        : await api.get<{ data: AgentTask[] }>(`/projects/${projectId}/agents/tasks`, { params: { paperIds: paper!.id } });
      return response.data.data;
    },
    enabled: Boolean(projectId && paper?.id && (isReviewer || isOwner)),
    refetchInterval: 15_000,
  });

  const connectMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = isReviewer
        ? await api.post<{ data: { accessToken: string } }>(`/projects/${projectId}/ai-review/agents`, { agentId })
        : await api.post<{ data: { accessToken: string } }>(`/projects/${projectId}/agents/${agentId}/screening-access`);
      return { agentId, accessToken: response.data.data.accessToken };
    },
    onSuccess: async ({ agentId, accessToken }) => {
      setTokens((previous) => ({ ...previous, [agentId]: accessToken }));
      setActiveAgentId(agentId);
      setIsChoosingAgent(false);
      toastSuccess("AI agent connected", "This agent is now connected to your reviewer workspace for this project.");
      await queryClient.invalidateQueries({ queryKey: agentsKey });
    },
    onError: () => toastError("Could not connect AI agent"),
  });

  const taskMutation = useMutation({
    mutationFn: async ({ agentId, paperId, taskStage }: { agentId: string; paperId: string; taskStage: ReviewStage }) => {
      const taskBody = {
        paperId,
        stage: taskStage,
        instructions: "Review this paper against the protocol criteria. Return a recommendation with criterion-level evidence and reasoning. Do not make or submit a human screening decision.",
      };
      if (isReviewer) {
        await api.post(`/projects/${projectId}/ai-review/agents/${agentId}/tasks`, taskBody);
      } else {
        await api.post(`/projects/${projectId}/agents/${agentId}/screening-tasks`, taskBody);
      }
      return { agentId, paperId, taskStage };
    },
    onSuccess: async ({ agentId, paperId, taskStage }) => {
      setTaskErrors((previous) => ({ ...previous, [taskStateKey(agentId, paperId, taskStage)]: "" }));
      toastSuccess("AI review task assigned");
      await queryClient.invalidateQueries({ queryKey: ["reviewer-ai-agent-tasks", projectId, paperId] });
    },
    onError: (error, variables) => {
      const message = isAxiosError(error)
        ? error.response?.data?.error?.message || error.response?.data?.error?.code || error.message
        : error instanceof Error ? error.message : "Could not assign the paper to this AI agent.";
      setTaskErrors((previous) => ({ ...previous, [taskStateKey(variables.agentId, variables.paperId, variables.taskStage)]: message }));
      toastError("Could not assign the paper to this AI agent", message);
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ agentId, action }: { agentId: string; action: "rotate" | "disable" | "enable" | "token" | "copy" }) => {
      if (action === "rotate") {
        const response = await api.post<{ data: { accessToken: string } }>(`/projects/${projectId}/ai-review/agents/${agentId}/rotate-token`);
        return { agentId, accessToken: response.data.data.accessToken };
      }
      if (action === "token" || action === "copy") {
        const tokenPath = isReviewer
          ? `/projects/${projectId}/ai-review/agents/${agentId}/token`
          : `/projects/${projectId}/agents/${agentId}/token`;
        const response = await api.get<{ data: { accessToken: string } }>(tokenPath);
        return { agentId, accessToken: response.data.data.accessToken };
      }
      await api.patch(`/projects/${projectId}/ai-review/agents/${agentId}`, { isActive: action === "enable" });
      return { agentId, accessToken: "" };
    },
    onSuccess: async ({ agentId, accessToken }, variables) => {
      if (accessToken) setTokens((previous) => ({ ...previous, [agentId]: accessToken }));
      if (variables.action === "copy" && accessToken) {
        try {
          await navigator.clipboard.writeText(accessToken);
          toastSuccess("Agent token copied to clipboard");
        } catch {
          toastError("Could not copy token", "Use the key button to view and copy the token manually.");
        }
      }
      if (variables.action === "disable") setTokens((previous) => ({ ...previous, [agentId]: "" }));
      await queryClient.invalidateQueries({ queryKey: agentsKey });
    },
    onError: () => toastError("Could not update AI agent access"),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ agentId, taskId }: { agentId: string; taskId: string }) => {
      const endpoint = isReviewer
        ? `/projects/${projectId}/ai-review/agents/${agentId}/tasks/${taskId}`
        : `/projects/${projectId}/agents/${agentId}/tasks/${taskId}`;
      await api.delete(endpoint);
    },
    onSuccess: async () => {
      setTaskToRemove(null);
      await queryClient.invalidateQueries({ queryKey: tasksKey });
    },
    onError: () => toastError("Only pending AI tasks can be removed"),
  });

  const entries = agentsQuery.data?.agents ?? [];
  const isScreeningConnected = (entry: AgentEntry) => Boolean(entry.access?.isActive &&
    (isReviewer || entry.access.agentCapabilities?.includes("screening:leader")));
  const available = entries.filter((entry) => entry.agent.isActive && !isScreeningConnected(entry));
  const agentTasks = useMemo(() => {
    const grouped = new Map<string, AgentTask[]>();
    for (const task of tasksQuery.data ?? []) {
      if (task.paperId !== paper?.id || task.stage !== stage) continue;
      grouped.set(task.agentId, [...(grouped.get(task.agentId) ?? []), task]);
    }
    return grouped;
  }, [paper?.id, stage, tasksQuery.data]);

  useEffect(() => {
    if (!entries.length) return;
    if (activeAgentId && entries.some(({ agent }) => agent.id === activeAgentId)) return;
    const defaultEntry = entries.find(({ agent }) => agent.id === agentsQuery.data?.selectedAgentId)
      ?? entries.find(isScreeningConnected)
      ?? entries.find(({ agent }) => agent.isActive)
      ?? entries[0];
    setActiveAgentId(defaultEntry.agent.id);
  }, [activeAgentId, agentsQuery.data?.selectedAgentId, entries]);

  if ((!isReviewer && !isOwner) || !paper || !projectId) return null;
  const ownDecision = paper.decisions?.find((decision) =>
    decision.reviewerId === currentUserId && decision.phase === (stage === "FULL_TEXT" ? 1 : 0),
  );
  const recommendations = [...new Set((tasksQuery.data ?? [])
    .filter((task) => task.paperId === paper.id && task.stage === stage && task.status === "COMPLETED" && task.result?.decision)
    .map((task) => normalizeDecision(task.result!.decision)))];

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-white" aria-label="AI review workspace">
      <div className="flex min-w-0 items-center gap-2 border-b border-border px-3 pt-3">
        <FiCpu className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
        <div role="tablist" aria-label="AI review agents" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {entries.map(({ agent, access }) => (
            <button
              key={agent.id}
              id={`ai-agent-tab-${agent.id}`}
              type="button"
              role="tab"
              aria-selected={activeAgentId === agent.id}
              aria-controls={`ai-agent-panel-${agent.id}`}
              onClick={() => { setActiveAgentId(agent.id); setIsChoosingAgent(false); }}
              className={`relative flex min-h-9 max-w-40 shrink-0 items-center gap-1.5 rounded-t-md px-2.5 text-xs font-medium transition ${activeAgentId === agent.id ? "bg-blue-50 text-blue-800" : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"}`}
              title={agent.name}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${access?.isActive ? "bg-emerald-500" : access ? "bg-slate-400" : "bg-slate-300"}`} />
              <span className="truncate">{agent.name}</span>
              {activeAgentId === agent.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600" />}
            </button>
          ))}
          {available.length > 0 && <button type="button" onClick={() => setIsChoosingAgent(true)} className="min-h-9 shrink-0 rounded-t-md px-2 text-xs font-medium text-blue-700 hover:bg-blue-50">+ Connect</button>}
        </div>
        <button type="button" aria-label="Refresh AI agents" title="Refresh agents" onClick={() => void agentsQuery.refetch()} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-slate-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><FiRefreshCw className="h-3.5 w-3.5" /></button>
      </div>

      {agentsQuery.isError && <div role="alert" className="m-3 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"><span>Could not load your AI workspace.</span><button type="button" onClick={() => void agentsQuery.refetch()} className="shrink-0 font-semibold underline">Retry</button></div>}
      {!entries.length && !agentsQuery.isLoading && !agentsQuery.isError && <div className="p-3 text-xs text-text-secondary">No AI agents are available in this project.</div>}

      {entries.map((entry) => {
        const entryTasks = agentTasks.get(entry.agent.id) ?? [];
        return <div
        key={entry.agent.id}
        id={`ai-agent-panel-${entry.agent.id}`}
        role="tabpanel"
        aria-labelledby={`ai-agent-tab-${entry.agent.id}`}
        hidden={activeAgentId !== entry.agent.id}
        className="min-w-0 p-3"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><FiCpu className="h-3.5 w-3.5" /></span>
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{entry.agent.name}</h3>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${entry.access?.isActive ? "text-emerald-700" : "text-text-secondary"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${entry.access?.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
            {isScreeningConnected(entry) ? "Connected" : "Not connected"}
          </span>
          {isScreeningConnected(entry) && <div className="ml-auto flex shrink-0 items-center gap-1">
            <button type="button" aria-label={`Refresh ${entry.agent.name} review`} title="Refresh this agent's results" onClick={() => void tasksQuery.refetch()} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-slate-100 hover:text-blue-700"><FiRefreshCw className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label={`View ${entry.agent.name} token`} title="View token" onClick={() => actionMutation.mutate({ agentId: entry.agent.id, action: "token" })} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-slate-100 hover:text-blue-700"><FiKey className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label={`Copy ${entry.agent.name} token`} title="Copy agent token" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ agentId: entry.agent.id, action: "copy" })} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-slate-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FiCopy className="h-3.5 w-3.5" /></button>
            {isReviewer && <>
            <button type="button" aria-label={`Rotate ${entry.agent.name} token`} title="Rotate token" onClick={() => { if (window.confirm(`Rotate ${entry.agent.name}'s token? The previous token will stop working.`)) actionMutation.mutate({ agentId: entry.agent.id, action: "rotate" }); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-slate-100 hover:text-blue-700"><FiRefreshCw className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label={`${entry.access?.isActive ? "Disconnect" : "Reconnect"} ${entry.agent.name}`} title={entry.access?.isActive ? "Disconnect agent" : "Reconnect agent"} onClick={() => { const action = entry.access?.isActive ? "disable" : "enable"; if (action === "disable" && !window.confirm(`Disconnect ${entry.agent.name}? Its existing review history will remain available.`)) return; actionMutation.mutate({ agentId: entry.agent.id, action }); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-slate-100 hover:text-blue-700"><FiSettings className="h-3.5 w-3.5" /></button>
            </>}
          </div>}
        </div>

        {(isChoosingAgent && activeAgentId === entry.agent.id || !isScreeningConnected(entry)) && <div className="mt-3 flex min-w-0 items-center gap-2">
          <Select aria-label="Connect an AI agent" value="" placeholder={available.length ? "Connect another AI agent" : "No additional active agents"} disabled={!available.length || connectMutation.isPending} onChange={(event) => { if (event.target.value) connectMutation.mutate(event.target.value); }} options={available.map(({ agent }) => ({ value: agent.id, label: agent.name, description: agent.description }))} containerClassName="min-w-0 flex-1" menuClassName="max-h-72" className="h-9 rounded-lg px-3 text-xs" />
          {isChoosingAgent && <button type="button" onClick={() => setIsChoosingAgent(false)} className="shrink-0 px-2 py-1 text-xs text-text-secondary hover:text-text-primary">Cancel</button>}
          {!entry.agent.isActive && <span className="text-[10px] text-text-secondary">This catalog agent is unavailable.</span>}
        </div>}

        {tokens[entry.agent.id] && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <label className="text-[10px] font-semibold text-amber-900">AI agent token</label>
          <input readOnly value={tokens[entry.agent.id]} onFocus={(event) => event.currentTarget.select()} className="mt-1 w-full rounded border border-amber-200 bg-white px-2 py-1.5 font-mono text-[10px]" />
        </div>}

        {isScreeningConnected(entry) && <Button type="button" variant="primary" size="sm" disabled={!entry.agent.isActive || (taskMutation.isPending && taskMutation.variables?.agentId === entry.agent.id && taskMutation.variables.paperId === paper.id && taskMutation.variables.taskStage === stage)} onClick={() => taskMutation.mutate({ agentId: entry.agent.id, paperId: paper.id, taskStage: stage })} className="mt-3 h-9 w-full rounded-lg normal-case tracking-normal text-xs font-semibold">
          {taskMutation.isPending && taskMutation.variables?.agentId === entry.agent.id && taskMutation.variables.paperId === paper.id && taskMutation.variables.taskStage === stage ? "Sending to agent…" : "Send to agent"}
        </Button>}
        {taskErrors[taskStateKey(entry.agent.id)] && <div role="alert" className="mt-2 break-words rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Task assignment failed: {taskErrors[taskStateKey(entry.agent.id)]}</div>}

        {ownDecision && <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-900">Your human decision: <strong>{ownDecision.decision}</strong>. AI recommendations never change it.</div>}
        {recommendations.length > 1 && <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">Agents recommend different outcomes. This is AI only and does not create a human review conflict.</div>}

        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold text-text-primary">{stage === "FULL_TEXT" ? "Full text" : "Title / abstract"} screening</h4>
            <span className="text-[10px] text-text-tertiary">{entryTasks.length} {entryTasks.length === 1 ? "task" : "tasks"}</span>
          </div>
          {tasksQuery.isLoading && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-text-secondary">Loading AI review results…</p>}
          {tasksQuery.isError && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"><span>Could not load AI task results.</span><button type="button" onClick={() => void tasksQuery.refetch()} className="shrink-0 font-semibold underline">Retry</button></div>}
          {!tasksQuery.isLoading && !tasksQuery.isError && !entryTasks.length && <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-text-secondary">{entry.access?.isActive ? "No review yet for this paper." : "Connect this agent to send papers for review. Past results remain available."}</p>}
          <div className="space-y-2">
            {entryTasks.map((task) => <div key={task.id} className="relative min-w-0">
              <AIReviewResultCard task={task} humanDecision={ownDecision?.decision} paperInput={{ hasPdf: Boolean(paper.pdfUrl), extractionStatus: paper.extraction?.status, extractionMessage: paper.extraction?.message }} />
              {(isReviewer || isOwner) && task.status === "ASSIGNED" && !task.result && <div className="mt-1 flex justify-end"><button type="button" aria-label="Remove pending AI review" disabled={removeMutation.isPending && removeMutation.variables?.taskId === task.id} onClick={() => setTaskToRemove(task)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-text-secondary hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"><FiTrash2 /> Remove pending task</button></div>}
            </div>)}
          </div>
        </div>
      </div>;
      })}
      <ConfirmModal
        isOpen={Boolean(taskToRemove)}
        onClose={() => setTaskToRemove(null)}
        onConfirm={() => {
          if (taskToRemove) {
            removeMutation.mutate({ agentId: taskToRemove.agentId, taskId: taskToRemove.id });
          }
        }}
        title="Remove pending AI task?"
        message="This task has no submitted result. Removing it cannot be undone."
        confirmText="Remove task"
        cancelText="Keep task"
        isLoading={removeMutation.isPending}
        variant="danger"
      />
    </section>
  );
}
