import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import gsap from "gsap";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Loader2,
  Bot,
} from "lucide-react";
import Button from "../../ui/Button";
import { Dropdown } from "../../ui/Dropdown";
import { useProjectMembers } from "../../../hooks/useProjects";
import { useAssignPapers } from "../../../hooks/useProjectPapers";
import { useDebounce } from "../../../hooks/useDebounce";
import { ProjectRole, type ProjectMember } from "../../../types/project";
import { toastSuccess, toastError } from "../../../utils/toast";
import api from "../../../config/axios";
import { useQueryClient } from "@tanstack/react-query";

interface ConnectedAgent {
  agent: { id: string; name: string; isActive: boolean };
  access: { isActive: boolean } | null;
}

interface BulkAssignmentPanelProps {
  selectedPaperIds: string[];
  onAssignmentComplete: () => void;
  /** The current phase of the process, used for the assign call */
  currentPhase?: number;
  isDisabled?: boolean;
}

const BulkAssignmentPanel: React.FC<BulkAssignmentPanelProps> = ({
  selectedPaperIds,
  onAssignmentComplete,
  currentPhase,
  isDisabled = false,
}) => {
  const selectedCount = selectedPaperIds.length;
  const panelRef = useRef<HTMLDivElement>(null);
  const { projectId, screeningProcessId } = useParams<{
    projectId: string;
    screeningProcessId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [assignmentTarget, setAssignmentTarget] = useState<"reviewers" | "agents">("reviewers");
  const [connectedAgents, setConnectedAgents] = useState<ConnectedAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isAssigningAgents, setIsAssigningAgents] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<Map<string, string>>(new Map());

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // 1. Fetch project members from API
  const { members, isLoading } = useProjectMembers(projectId, {
    search: debouncedSearch,
    pageSize: 100, // Large enough for member selection
  });

  // 2. Keep this list aligned with the API: only non-admin reviewers can be assigned.
  const reviewers = useMemo(() => {
    return members.filter((member) => {
      const role = String(member.roleText ?? member.role).trim().toUpperCase();
      const isAdmin = ["ADMIN", "OWNER", "1"].includes(role);
      const isReviewer = member.role === ProjectRole.Reviewer || role === "REVIEWER";
      return isReviewer && !isAdmin;
    });
  }, [members]);

  // 3. Selection State (Map ID to Name for chip display)
  const [selectedReviewers, setSelectedReviewers] = useState<
    Map<string, string>
  >(new Map());

  // 4. Mutation for assigning papers
  const { mutate: assignPapers, isPending } = useAssignPapers();

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setIsLoadingAgents(true);
    api.get<{ data: ConnectedAgent[] }>(`/projects/${projectId}/agents`)
      .then(({ data }) => {
        if (!cancelled) setConnectedAgents(data.data.filter(({ agent, access }) => agent.isActive && access?.isActive));
      })
      .catch(() => {
        if (!cancelled) setConnectedAgents([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAgents(false);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  const handleAssignAgents = async () => {
    if (!projectId || selectedPaperIds.length === 0 || selectedAgents.size === 0) return;
    setIsAssigningAgents(true);
    const assignments = Array.from(selectedAgents.keys()).flatMap((agentId) =>
      selectedPaperIds.map((paperId) => ({ agentId, paperId })),
    );
    let successful = 0;
    try {
      for (let index = 0; index < assignments.length; index += 8) {
        const batch = assignments.slice(index, index + 8);
        const results = await Promise.allSettled(batch.map(({ agentId, paperId }) =>
          api.post(`/projects/${projectId}/agents/${agentId}/tasks`, {
            paperId,
            instructions: "Review this paper against the project's review criteria and return a decision with evidence-based reasoning.",
          }),
        ));
        successful += results.filter((result) => result.status === "fulfilled").length;
      }
      const failed = assignments.length - successful;
      if (successful === 0) {
        toastError("Assignment Failed", "Could not assign papers to the selected AI agents.");
        return;
      }
      toastSuccess(
        failed ? "Partial AI Assignment" : "AI Tasks Assigned",
        `${successful} AI review task(s) created${failed ? `; ${failed} failed` : ""}.`,
      );
      setSelectedAgents(new Map());
      await queryClient.invalidateQueries({ queryKey: ["project-agent-tasks", projectId] });
      onAssignmentComplete();
    } finally {
      setIsAssigningAgents(false);
    }
  };

  const handleAssign = () => {
    const reviewerIds = Array.from(selectedReviewers.keys());

    if (reviewerIds.length !== 2) {
      toastError(
        "Selection Error",
        "Please select exactly 2 reviewers for each paper.",
      );
      return;
    }

    if (selectedPaperIds.length === 0) return;

    // PaperPhase uses 0/1 in the FE; the assignment API uses 1/2.
    const phase = (currentPhase ?? 0) + 1;

    assignPapers(
      {
        paperIds: selectedPaperIds,
        memberIds: reviewerIds,
        studySelectionProcessId: screeningProcessId ?? "",
        phase,
      },
      {
        onSuccess: (response) => {
          if (response.isSuccess) {
            toastSuccess(
              "Papers Assigned",
              response.message ||
                `${selectedPaperIds.length} papers assigned to ${reviewerIds.length} reviewers.`,
            );
            setSelectedReviewers(new Map());
            onAssignmentComplete();
          } else {
            toastError(
              "Assignment Failed",
              response.errors?.[0]?.message || "Could not assign papers.",
            );
          }
        },
        onError: (err: any) => {
          toastError(
            "Error",
            err?.response?.data?.message ||
              "An unexpected error occurred during assignment.",
          );
        },
      },
    );
  };

  useEffect(() => {
    if (selectedCount > 0) {
      gsap.to(panelRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
      });
    } else {
      gsap.to(panelRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
      });
      setSearchQuery("");
    }
  }, [selectedCount]);

  const toggleReviewer = (member: ProjectMember) => {
    const newSelected = new Map(selectedReviewers);
    if (newSelected.has(member.userId)) {
      newSelected.delete(member.userId);
    } else {
      if (newSelected.size >= 2) {
        toastError(
          "Selection Limit",
          "You can only assign exactly 2 reviewers.",
        );
        return;
      }
      newSelected.set(member.userId, member.fullName);
    }
    setSelectedReviewers(newSelected);
  };

  const removeReviewer = (id: string) => {
    const newSelected = new Map(selectedReviewers);
    newSelected.delete(id);
    setSelectedReviewers(newSelected);
  };

  const selectedEntries = Array.from(selectedReviewers.entries());
  const visibleChips = selectedEntries.slice(0, 2);
  const remainingCount = selectedEntries.length - visibleChips.length;

  if (selectedCount === 0) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl px-3 z-(--z-index-dropdown) opacity-0 translate-y-[100px]"
    >
      <div className="bg-surface-white border border-border rounded-xl shadow-2xl p-3 text-text-primary overflow-visible relative">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 relative">
          {/* Section 1: Bulk Action Stats */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-xl shadow-inner ring-4 ring-accent/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] text-accent font-bold uppercase tracking-widest mb-0.5">
                Bulk Action
              </div>
              <div className="text-base font-black flex items-center gap-1.5 tabular-nums">
                <span>{selectedCount}</span>
                <span className="text-text-secondary text-[11px] font-medium uppercase">
                  Papers
                </span>
              </div>
            </div>
          </div>

          <div className="h-12 w-px bg-border hidden lg:block"></div>

          {/* Section 2: Human or AI assignment */}
          <div className="flex-1 w-full min-w-0">
            <div className="mb-1.5 inline-flex rounded-lg border border-border bg-bg-secondary p-0.5">
              <button type="button" onClick={() => setAssignmentTarget("reviewers")} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${assignmentTarget === "reviewers" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}>
                Human reviewers
              </button>
              <button type="button" onClick={() => setAssignmentTarget("agents")} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${assignmentTarget === "agents" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}>
                <Bot className="h-3.5 w-3.5" /> AI agents
              </button>
            </div>
            {assignmentTarget === "reviewers" ? <>
            <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-0.5 block flex items-center justify-between">
              <span>Assign reviewers</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded ${selectedReviewers.size === 2 ? "text-accent bg-primary-light" : "text-amber-600 bg-amber-500/10"}`}
              >
                2 reviewers required
              </span>
            </label>

            <div className="flex items-center gap-2">
              {/* Selector Button with Dropdown */}
              <Dropdown
                trigger={
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-bg-secondary border-border text-text-primary hover:border-primary hover:bg-primary-light transition-all text-xs font-semibold whitespace-nowrap active:scale-95">
                    <UserPlus className="w-3.5 h-3.5" />
                    Select Reviewers
                    <ChevronDown className="w-3.5 h-3.5 ml-1 text-text-secondary" />
                  </button>
                }
                className="w-auto"
                position="top"
                contentClassName="bg-transparent shadow-none ring-0 w-auto p-0"
              >
                <div className="w-72 bg-surface-white border border-border rounded-xl overflow-hidden shadow-2xl">
                  <div className="p-3 border-b border-border bg-bg-secondary">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search reviewers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-surface-white border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent text-text-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar min-h-[100px] relative">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-10 text-text-secondary">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-xs font-medium">
                          Fetching Team...
                        </span>
                      </div>
                    ) : reviewers.length > 0 ? (
                      reviewers.map((member) => (
                        <label
                          key={member.userId}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg-secondary cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedReviewers.has(member.userId)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleReviewer(member);
                            }}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-surface-white"
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-[10px] font-bold text-accent group-hover:bg-primary transition-colors">
                              {member.fullName.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors">
                              {member.fullName}
                            </span>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-text-secondary italic">
                        No team members found
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-border bg-bg-secondary flex items-center justify-between">
                    <span className="text-[10px] text-text-secondary font-bold uppercase tabular-nums">
                      {selectedReviewers.size} Selected
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReviewers(new Map());
                      }}
                      className="text-[10px] text-accent font-bold hover:text-primary-hover transition-colors uppercase"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </Dropdown>

              {/* Selected Chips Container */}
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar py-1">
                  {visibleChips.map(([id, name]) => (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-bg-secondary border border-border text-xs text-text-primary whitespace-nowrap animate-in zoom-in-95 duration-200"
                    >
                      <Users className="w-3 h-3 text-accent" />
                      {name}
                      <button
                        onClick={() => removeReviewer(id)}
                        className="p-0.5 hover:bg-border rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-text-secondary hover:text-red-400" />
                      </button>
                    </div>
                  ))}

                  {remainingCount > 0 && (
                    <div                     className="px-2 py-1 rounded-xl bg-bg-secondary border border-border border-dashed text-[10px] font-bold text-accent whitespace-nowrap cursor-help relative group">
                      +{remainingCount} more
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 bg-surface-white border border-border rounded-xl shadow-2xl p-3 z-(--z-index-popover) animate-in fade-in zoom-in-95">
                        <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-2 border-b border-border pb-1">
                          Also Assigned To
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {selectedEntries.slice(2).map(([id, name]) => (
                            <div
                              key={id}
                              className="flex items-center gap-2 text-xs text-text-primary"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                              {name}
                            </div>
                          ))}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-950"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </> : <>
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-0.5 block">
                Assign to AI agents
              </label>
              <Dropdown
                trigger={<button type="button" className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:border-primary">
                  <Bot className="h-3.5 w-3.5" />
                  {selectedAgents.size ? `${selectedAgents.size} agent(s) selected` : "Select AI agents"}
                  <ChevronDown className="ml-1 h-3.5 w-3.5 text-text-secondary" />
                </button>}
                position="top"
                contentClassName="w-80 bg-transparent p-0 shadow-none ring-0"
              >
                <div className="w-80 overflow-hidden rounded border border-border bg-surface-white shadow-2xl">
                  <div className="max-h-56 overflow-y-auto p-2">
                    {isLoadingAgents ? <div className="p-4 text-center text-xs text-text-secondary">Loading project agents…</div>
                      : connectedAgents.length ? connectedAgents.map(({ agent }) => (
                        <label key={agent.id} className="flex cursor-pointer items-center gap-3 rounded p-2.5 text-sm text-text-primary hover:bg-bg-secondary">
                          <input type="checkbox" checked={selectedAgents.has(agent.id)} onChange={() => setSelectedAgents((current) => {
                            const next = new Map(current);
                            if (next.has(agent.id)) next.delete(agent.id); else next.set(agent.id, agent.name);
                            return next;
                          })} className="h-4 w-4 rounded border-border bg-surface-white text-primary" />
                          <Bot className="h-4 w-4 text-accent" />
                          {agent.name}
                        </label>
                        )) : <div className="p-4 text-center text-xs text-text-secondary">No active agents connected to this project.</div>}
                  </div>
                  {!connectedAgents.length && !isLoadingAgents && <button type="button" onClick={() => navigate(`/projects/${projectId}/settings`)} className="w-full border-t border-border p-3 text-left text-xs font-semibold text-accent hover:bg-bg-secondary">
                    Connect an agent in Project Settings → AI Agents
                  </button>}
                  {selectedAgents.size > 0 && <button type="button" onClick={() => setSelectedAgents(new Map())} className="w-full border-t border-border p-3 text-left text-xs font-semibold text-accent hover:bg-bg-secondary">Clear selection</button>}
                </div>
              </Dropdown>
            </>}
          </div>

          {/* Section 3: Action Button */}
          <div className="flex flex-col items-center lg:items-end flex-shrink-0">
            <Button
              onClick={() => !isDisabled && (assignmentTarget === "reviewers" ? handleAssign() : void handleAssignAgents())}
              disabled={(assignmentTarget === "reviewers" ? selectedReviewers.size !== 2 || isPending : selectedAgents.size === 0 || isAssigningAgents) || isDisabled}
              className="bg-primary hover:bg-primary-hover disabled:bg-bg-secondary disabled:text-text-secondary disabled:border-border text-white font-bold py-2 px-4 rounded-lg shadow-none shadow-primary/10 border-none transition-all active:scale-95 flex items-center gap-1.5 group whitespace-nowrap text-xs"
            >
              {(isPending || isAssigningAgents) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2
                  className={`w-4 h-4 transition-transform ${selectedReviewers.size > 0 ? "scale-100" : "scale-0"}`}
                />
              )}
              {isPending || isAssigningAgents ? "Assigning..." : assignmentTarget === "agents" ? "Assign to Agents" : "Assign Selected"}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default BulkAssignmentPanel;
