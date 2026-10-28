import { useEffect, useState } from "react";
import { FiCpu, FiEdit2, FiPlus, FiSave, FiToggleLeft, FiToggleRight, FiX } from "react-icons/fi";
import { isAxiosError } from "axios";
import api from "../../config/axios";
import Input from "../../components/ui/Input";

type Agent = { id: string; name: string; description: string; isActive: boolean };
type ApiData<T> = { data: T };
const errorText = (error: unknown) => isAxiosError(error) ? error.response?.data?.error?.message || error.message : "Request failed";

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Agent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = async () => {
    const { data } = await api.get<ApiData<Agent[]>>("/admin/agents");
    setAgents(data.data);
  };

  useEffect(() => { void reload().catch(reason => setError(errorText(reason))); }, []);

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try { await operation(); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  };

  const createAgent = () => run(async () => {
    await api.post("/admin/agents", { name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
    await reload();
  });

  const saveAgent = () => editing && run(async () => {
    await api.patch(`/admin/agents/${editing.id}`, { name: editing.name.trim(), description: editing.description.trim() });
    setEditing(null);
    await reload();
  });

  const toggleAgent = (agent: Agent) => run(async () => {
    await api.patch(`/admin/agents/${agent.id}`, { isActive: !agent.isActive });
    await reload();
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8 text-text-primary">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">System configuration</p>
        <h1 className="mt-2 text-3xl font-semibold">AI Agent Catalog</h1>
        <p className="mt-2 text-sm text-text-secondary">Define available agent providers. Project leaders select from this catalog and create project-scoped access.</p>
      </header>
      {error && <div role="alert" className="rounded-lg border border-error/20 bg-error/5 p-3 text-sm text-error">{error}</div>}

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><FiPlus /> Add catalog agent</h2>
        <form onSubmit={event => { event.preventDefault(); void createAgent(); }} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input aria-label="Agent name" required maxLength={120} placeholder="Claude, ChatGPT..." value={name} onChange={event => setName(event.target.value)} />
          <Input aria-label="Agent description" maxLength={1000} placeholder="Description or provider notes" value={description} onChange={event => setDescription(event.target.value)} />
          <button disabled={busy || !name.trim()} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">Add agent</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border bg-bg-secondary px-5 py-4">
          <h2 className="font-semibold">Available agents</h2>
          <p className="mt-1 text-xs text-text-secondary">Tokens are created by a project leader when connecting an agent to a project.</p>
        </div>
        <div className="divide-y divide-border">
          {!agents.length && <p className="p-6 text-sm text-text-secondary">No agents in the catalog yet.</p>}
          {agents.map(agent => editing?.id === agent.id ? (
            <div key={agent.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_2fr_auto_auto]">
              <Input aria-label="Edit agent name" value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} />
              <Input aria-label="Edit agent description" value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} />
              <button type="button" disabled={busy || !editing.name.trim()} onClick={() => void saveAgent()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm text-white transition-colors motion-reduce:transition-none hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><FiSave /> Save</button>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm transition-colors motion-reduce:transition-none hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"><FiX /> Cancel</button>
            </div>
          ) : (
            <div key={agent.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary"><FiCpu /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><h3 className="font-semibold">{agent.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] ${agent.isActive ? "bg-success/10 text-success" : "bg-bg-secondary text-text-secondary"}`}>{agent.isActive ? "Available" : "Disabled"}</span></div>
                <p className="mt-1 text-sm text-text-secondary">{agent.description || "No description"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => setEditing(agent)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-xs transition-colors motion-reduce:transition-none hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"><FiEdit2 /> Edit</button>
                <button type="button" disabled={busy} onClick={() => void toggleAgent(agent)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-xs transition-colors motion-reduce:transition-none hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50">{agent.isActive ? <FiToggleRight /> : <FiToggleLeft />}{agent.isActive ? "Disable" : "Enable"}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
