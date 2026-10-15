import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router";
import gsap from "gsap";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import Button from "../../ui/Button";
import { Dropdown } from "../../ui/Dropdown";
import { useProjectMembers } from "../../../hooks/useProjects";
import { useAssignPapers } from "../../../hooks/useProjectPapers";
import { useDebounce } from "../../../hooks/useDebounce";
import { ProjectRole, type ProjectMember } from "../../../types/project";
import { toastSuccess, toastError } from "../../../utils/toast";

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
      className="fixed bottom-5 left-1/2 z-(--z-index-dropdown) w-full max-w-5xl -translate-x-1/2 px-3 sm:px-4 opacity-0 translate-y-[100px]"
    >
      <div className="relative overflow-visible rounded-2xl border border-border bg-surface-white/95 p-3 text-text-primary shadow-[0_12px_36px_rgba(15,23,42,0.14)] backdrop-blur-md sm:p-4">
        {/* Background Accent */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl"></div>

        <div className="relative flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Section 1: Bulk Action Stats */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm ring-4 ring-primary/10">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                Bulk Action
              </div>
              <div className="flex items-center gap-1.5 text-base font-semibold tabular-nums">
                <span>{selectedCount}</span>
                <span className="text-[11px] font-medium uppercase text-text-secondary">
                  Papers
                </span>
              </div>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-border md:block"></div>

          {/* Section 2: Human reviewer assignment */}
          <div className="w-full min-w-0 flex-1">
            <label className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
              <span>Assign reviewers</span>
              <span
                className={`rounded-full px-2 py-1 text-[9px] tracking-normal ${selectedReviewers.size === 2 ? "bg-primary-light text-accent" : "bg-amber-500/10 text-amber-600"}`}
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
          </div>

          {/* Section 3: Action Button */}
          <div className="flex shrink-0 flex-col items-stretch md:items-end">
            <Button
              onClick={() => !isDisabled && handleAssign()}
              disabled={selectedReviewers.size !== 2 || isPending || isDisabled}
              className="min-h-11 w-full rounded-xl border-none px-4 py-2.5 text-xs font-semibold normal-case tracking-normal shadow-none transition-all active:scale-[0.98] disabled:border-border disabled:bg-bg-secondary disabled:text-text-secondary sm:w-auto"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2
                  className={`w-4 h-4 transition-transform ${selectedReviewers.size > 0 ? "scale-100" : "scale-0"}`}
                />
              )}
              {isPending ? "Assigning..." : "Assign Selected"}
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
