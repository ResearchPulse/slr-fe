import Select from "../ui/Select";
import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiEye, FiKey, FiRefreshCw, FiUserPlus } from "react-icons/fi";
import { isAxiosError } from "axios";
import api from "../../config/axios";
import { toastError, toastSuccess } from "../../utils/toast";
import AIReviewResultCard from "./AIReviewResultCard";
import ConfirmModal from "../ui/ConfirmModal";

type Agent = { id: string; name: string; description: string; isActive: boolean };
type ProjectAccess = { id: string; agentId: string; projectId: string; projectName: string; isActive: boolean; agentCapabilities?: string[] };
type Entry = { agent: Agent; access: ProjectAccess | null };
type Paper = { id: string; title: string };
type Task = { id: string; paperId: string; paperTitle?: string; instructions: string; status: string; taskKind?: string; stage?: "TITLE_ABSTRACT" | "FULL_TEXT"; result?: { decision: string; reasoning: string; data?: Record<string, unknown> } };
type ApiData<T> = { data: T };
const messageOf = (error: unknown) => isAxiosError(error) ? error.response?.data?.error?.message || error.message : "Request failed";

export default function ProjectAgentAssignments({ projectId }: { projectId?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [connectAgentId, setConnectAgentId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [token, setToken] = useState("");
  const [tokenLabel, setTokenLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [agentToRotate, setAgentToRotate] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const selected = entries.find(entry => entry.agent.id === selectedAgentId);
  const connected = useMemo(() => entries.filter(entry => entry.access?.agentCapabilities?.includes("extraction:leader")), [entries]);
  const available = useMemo(() => entries.filter(entry => entry.agent.isActive && !entry.access?.agentCapabilities?.includes("extraction:leader")), [entries]);

  const loadEntries = async () => {
    if (!projectId) return;
    const { data } = await api.get<ApiData<Entry[]>>(`/projects/${projectId}/agents`);
    setEntries(data.data);
  };
  const loadTasks = async (agentId: string) => {
    if (!projectId || !agentId) { setTasks([]); return; }
    const { data } = await api.get<ApiData<{ items: Task[] }>>(`/projects/${projectId}/agents/${agentId}/tasks`);
    setTasks(data.data.items);
  };
  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try { await operation(); } catch (reason) { setError(messageOf(reason)); } finally { setBusy(false); }
  };
  const showToken = (value: string, agentName: string) => { setToken(value); setTokenLabel(agentName); };
  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toastSuccess("Token copied", "The project access token is now on your clipboard.");
    } catch {
      toastError("Copy failed", "Your browser could not access the clipboard. Select and copy the token manually.");
    }
  };

  useEffect(() => {
    if (!projectId) return;
    void Promise.all([
      loadEntries(),
      api.get<ApiData<{ items: Paper[] }>>(`/projects/${projectId}/papers`, { params: { pageSize: 100 } }).then(({ data }) => setPapers(data.data.items)),
    ]).catch(reason => setError(messageOf(reason)));
  }, [projectId]);

  useEffect(() => {
    void loadTasks(selectedAgentId).catch(reason => setError(messageOf(reason)));
  }, [projectId, selectedAgentId]);

  const connect = () => run(async () => {
    const { data } = await api.post<ApiData<{ access: ProjectAccess; accessToken: string }>>(`/projects/${projectId}/agents/${connectAgentId}/leader-access`);
    const agent = entries.find(entry => entry.agent.id === connectAgentId)?.agent;
    showToken(data.data.accessToken, agent?.name || "Agent");
    setSelectedAgentId(connectAgentId);
    setConnectAgentId("");
    await loadEntries();
  });

  const viewToken = (entry: Entry) => run(async () => {
    const { data } = await api.post<ApiData<{ accessToken: string }>>(`/projects/${projectId}/agents/${entry.agent.id}/leader-access`);
    showToken(data.data.accessToken, entry.agent.name);
  });

  const rotateToken = (entry: Entry) => {
    setAgentToRotate(entry);
  };

  const confirmRotateToken = async () => {
    if (!agentToRotate) return;
    const entry = agentToRotate;
    await run(async () => {
      const { data } = await api.post<ApiData<{ accessToken: string }>>(`/projects/${projectId}/agents/${entry.agent.id}/leader-access`);
      showToken(data.data.accessToken, entry.agent.name);
      await loadEntries();
    });
    setAgentToRotate(null);
  };

  const assign = () => run(async () => {
    if (!selectedAgentId) return;
    await api.post(`/projects/${projectId}/agents/${selectedAgentId}/leader-tasks`, { paperId, instructions: instructions.trim() });
    setPaperId("");
    setInstructions("");
    await loadTasks(selectedAgentId);
  });

  if (!projectId) return null;

  return (
    <div className="min-w-0 space-y-5">
      <div className="rounded-xl border border-border bg-surface-white p-4 shadow-none sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary"><FiUserPlus /> Connect an extraction agent</h2>
        <p className="mt-1 text-sm text-text-secondary">Choose a provider from the system catalog and issue a project-scoped MCP token for extraction consensus.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Select aria-label="Choose catalog agent" value={connectAgentId} onChange={event => setConnectAgentId(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm">
            <option value="">Select an agent</option>
            {available.map(({ agent }) => <option key={agent.id} value={agent.id}>{agent.name}{agent.description ? ` — ${agent.description}` : ""}</option>)}
          </Select>
          <button type="button" disabled={busy || !connectAgentId} onClick={() => void connect()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50">Connect and generate project token</button>
        </div>
        {!available.length && <p className="mt-2 text-xs text-text-secondary">{entries.some(({ agent }) => agent.isActive) ? "All active catalog agents are already connected to this project." : "There are no active agents in the system catalog."}</p>}
      </div>

      {error && <div role="alert" className="rounded-xl border border-error/20 bg-error/5 p-3 text-sm text-error">{error}</div>}
      {token && <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
        <h3 className="font-semibold text-text-primary">{tokenLabel} project token</h3>
        <p className="mt-1 text-xs text-warning">This token scopes API access to this agent's review tasks in this project.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input aria-label="Project agent access token" readOnly value={token} className="min-h-11 min-w-0 flex-1 rounded-xl border border-warning/30 bg-surface-white px-3 py-2 font-mono text-xs text-text-primary" />
          <button type="button" onClick={() => void copyToken()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><FiCopy /> Copy</button>
          <button type="button" onClick={() => { setToken(""); setTokenLabel(""); }} className="inline-flex min-h-11 items-center rounded-lg border border-warning/30 px-4 py-2 text-sm transition-colors hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">Close</button>
        </div>
        <p className="mt-2 text-xs text-warning">Configure this token in the MCP connection and run <code>/slr extract &lt;taskId&gt;</code>.</p>
      </div>}

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
        <section className="min-w-0 rounded-xl border border-border bg-surface-white p-4 shadow-none sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">Connected agents</h2>
          {!connected.length && <p className="text-sm text-text-secondary">No agents connected to this project.</p>}
          <div className="space-y-2">{connected.map(entry => <div key={entry.agent.id} className={`rounded-lg border p-3 ${selectedAgentId === entry.agent.id ? "border-primary bg-primary-light" : "border-border"}`}>
            <button type="button" onClick={() => { setToken(""); setSelectedAgentId(entry.agent.id); }} className="min-h-11 w-full rounded-md px-1 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <span className="font-medium text-text-primary">{entry.agent.name}</span>
              <span className={`ml-2 text-xs ${entry.access?.isActive ? "text-success" : "text-error"}`}>{entry.access?.isActive ? "Connected" : "Access disabled"}</span>
              <p className="mt-1 text-xs text-text-secondary">Extraction leader capability</p>
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void viewToken(entry)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><FiEye /> View token</button>
              <button type="button" disabled={busy} onClick={() => rotateToken(entry)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><FiRefreshCw /> Rotate</button>
            </div>
          </div>)}</div>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-surface-white p-4 shadow-none sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary"><FiKey /> Assign review papers</h2>
          {!selected ? <p className="text-sm text-text-secondary">Select a connected agent to assign papers and view its submitted reviews.</p> : <>
            {selected.access?.isActive && <form onSubmit={event => { event.preventDefault(); void assign(); }} className="space-y-3">
              <Select aria-label="Paper to assign" required value={paperId} onChange={event => setPaperId(event.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm">
                <option value="">Choose a paper</option>{papers.map(paper => <option key={paper.id} value={paper.id}>{paper.title || paper.id}</option>)}
              </Select>
              <textarea aria-label="Agent review instructions" maxLength={5000} placeholder="Instructions for this review (optional)" value={instructions} onChange={event => setInstructions(event.target.value)} className="min-h-24 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
              <button disabled={busy || !paperId} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50">Assign to {selected.agent.name}</button>
            </form>}
            <h3 className="mb-3 mt-5 font-semibold text-text-primary">Extraction tasks</h3>
            {!tasks.length && <p className="text-sm text-text-secondary">No tasks assigned to this agent in the project.</p>}
            <div className="space-y-3">{tasks.map(task => <article key={task.id} className="min-w-0 space-y-2 rounded-lg border border-border p-3 text-sm">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-medium text-text-primary">{task.paperTitle || task.paperId}</p><p className="mt-1 text-xs text-text-secondary">{task.stage || "FULL_TEXT"} · {task.status}</p></div></div>
              {task.instructions && <p className="break-words text-xs text-text-secondary">{task.instructions}</p>}
              {task.result && <AIReviewResultCard task={{ ...task, agentId: selectedAgentId, agentName: selected?.agent.name }} />}
            </article>)}</div>
          </>}
        </section>
      </div>
      <ConfirmModal
        isOpen={Boolean(agentToRotate)}
        onClose={() => { if (!busy) setAgentToRotate(null); }}
        onConfirm={() => void confirmRotateToken()}
        title="Rotate project token?"
        message={agentToRotate ? `Rotate ${agentToRotate.agent.name}'s token for this project? The previous token will stop working immediately.` : "The previous token will stop working immediately."}
        confirmText="Rotate token"
        cancelText="Keep current token"
        isLoading={busy}
        variant="warning"
      />
    </div>
  );
}
