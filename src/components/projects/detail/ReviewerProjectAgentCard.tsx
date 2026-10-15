import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiEye, FiUserPlus } from "react-icons/fi";
import { isAxiosError } from "axios";
import api from "../../../config/axios";
import { toastError, toastSuccess } from "../../../utils/toast";

type Agent = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

type ReviewerAccess = {
  isActive: boolean;
  agentCapabilities?: string[];
};

type AgentEntry = {
  agent: Agent;
  access: ReviewerAccess | null;
};

type ApiData<T> = { data: T };

const messageOf = (error: unknown) =>
  isAxiosError(error)
    ? error.response?.data?.error?.message || error.message
    : "Request failed";

export default function ReviewerProjectAgentCard({
  projectId,
}: {
  projectId: string;
}) {
  const [entries, setEntries] = useState<AgentEntry[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  const connected = useMemo(
    () =>
      entries.find(
        ({ agent, access }) =>
          agent.isActive &&
          access?.isActive &&
          access.agentCapabilities?.includes("extraction:review"),
      ) ?? null,
    [entries],
  );

  const availableAgents = useMemo(
    () => entries.filter(({ agent }) => agent.isActive),
    [entries],
  );

  const loadAgents = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.get<
        ApiData<{ agents: AgentEntry[]; selectedAgentId: string | null }>
      >(`/projects/${projectId}/ai-review/agents`);
      setEntries(data.data.agents);
      setSelectedAgentId(
        data.data.selectedAgentId ?? data.data.agents[0]?.agent.id ?? "",
      );
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, [projectId]);

  const connect = async () => {
    if (!selectedAgentId) return;
    setIsBusy(true);
    setError("");
    try {
      const { data } = await api.post<
        ApiData<{ accessToken: string }>
      >(`/projects/${projectId}/ai-review/agents`, {
        agentId: selectedAgentId,
      });
      setToken(data.data.accessToken);
      await loadAgents();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setIsBusy(false);
    }
  };

  const viewToken = async () => {
    if (!connected) return;
    setIsBusy(true);
    setError("");
    try {
      const { data } = await api.get<ApiData<{ accessToken: string }>>(
        `/projects/${projectId}/ai-review/agents/${connected.agent.id}/token`,
      );
      setToken(data.data.accessToken);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setIsBusy(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toastSuccess("Token copied", "The reviewer token is now on your clipboard.");
    } catch {
      toastError(
        "Copy failed",
        "Your browser could not access the clipboard. Select and copy the token manually.",
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="border border-border bg-surface-white p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <FiUserPlus /> Connect an extraction agent
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Choose a provider from the system catalog and issue a reviewer-scoped MCP token.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="mt-4 text-sm text-text-secondary">Loading agent connection…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                aria-label="Choose reviewer extraction agent"
                value={selectedAgentId}
                onChange={(event) => setSelectedAgentId(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">Select an agent</option>
                {availableAgents.map(({ agent }) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}{agent.description ? ` — ${agent.description}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isBusy || !selectedAgentId || selectedAgentId === connected?.agent.id}
                onClick={() => void connect()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087BC1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <FiUserPlus />
                {connected ? "Switch agent" : "Connect agent"}
              </button>
            </div>
            {connected ? (
              <p className="mt-2 text-xs text-text-secondary">
                The selected agent is already connected to this reviewer workspace.
              </p>
            ) : !availableAgents.length ? (
              <p className="mt-2 text-xs text-text-secondary">
                No active agents are available in the system catalog.
              </p>
            ) : null}
          </>
        )}
      </div>

      {token && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h3 className="font-semibold text-text-primary">Reviewer project token</h3>
          <p className="mt-1 text-xs text-amber-900">
            This token scopes MCP access to your extraction tasks in this project.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Reviewer project token"
              readOnly
              value={token}
              className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => void copyToken()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087BC1] px-4 py-2 text-sm font-semibold text-white"
            >
              <FiCopy />
              Copy
            </button>
            <button
              type="button"
              onClick={() => setToken("")}
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-text-primary"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-900">
            Configure this token in the MCP connection and run <code>/slr review</code>.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
        <section className="border border-border bg-surface-white p-5">
          <h2 className="mb-3 font-semibold text-text-primary">Connected agents</h2>
          {!connected ? (
            <p className="text-sm text-text-secondary">No reviewer agent connected to this project.</p>
          ) : (
            <div className="rounded-lg border border-[#087BC1] bg-sky-50 p-3">
              <button
                type="button"
                onClick={() => setToken("")}
                className="w-full text-left"
              >
                <span className="font-medium text-text-primary">{connected.agent.name}</span>
                <span className="ml-2 text-xs text-emerald-700">Connected</span>
                <p className="mt-1 text-xs text-text-secondary">Extraction reviewer capability</p>
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void viewToken()}
                  className="inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-1 text-xs"
                >
                  <FiEye /> View token
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="border border-border bg-surface-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
            <FiEye /> Reviewer access
          </h2>
          <p className="text-sm text-text-secondary">
            Your connected agent can access only the extraction tasks assigned to your reviewer account.
          </p>
          <div className="mt-4 rounded-lg border border-border bg-bg-primary p-4">
            <p className="text-sm font-medium text-text-primary">
              {connected ? `Connected to ${connected.agent.name}` : "No agent connected"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Project settings and paper assignments remain managed by the Project Leader.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
