import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  Database,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import {
  useInfiniteTitleAbstractAssignmentPapers,
  useInfiniteFullTextAssignmentPapers,
  useConflictStatus,
} from "../../../hooks/useStudySelection";
import type { SelectionPhase } from "../components/StuSePhaseHeaderController";
import { PaperPhase } from "../../../types/studySelection";
import type {
  GetAssignmentPapersParams,
  AssignedReviewer,
} from "../../../types/studySelection";
import AssignedReviewersModal from "./AssignedReviewersModal";
import { useParams } from "react-router-dom";
import { useProjectMember } from "../../../hooks/useProjectMember";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys";
import api from "../../../config/axios";

interface AgentPaperTask {
  id: string;
  paperId: string;
  agentName: string;
  status: "ASSIGNED" | "COMPLETED";
}

interface PaperListProps {
  studySelectionProcessId: string;
  currentPhase: SelectionPhase;
  selectedPaperId: string | null;
  onSelectPaper: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isAssignmentMode: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const statusConfig: Record<
  string,
  { icon: any; color: string; bgColor: string; borderColor: string }
> = {
  Pending: {
    icon: HelpCircle,
    color: "text-text-secondary",
    bgColor: "bg-bg-secondary",
    borderColor: "border-border",
  },
  Included: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  Excluded: {
    icon: XCircle,
    color: "text-error",
    bgColor: "bg-error/10",
    borderColor: "border-error/20",
  },
  Conflict: {
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  Resolved: {
    icon: CheckCircle2,
    color: "text-accent",
    bgColor: "bg-bg-secondary",
    borderColor: "border-accent/20",
  },
};

export const PaperList: React.FC<PaperListProps> = ({
  studySelectionProcessId,
  currentPhase,
  selectedPaperId,
  onSelectPaper,
  selectedIds,
  onSelectionChange,
  isAssignmentMode,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [reviewersModal, setReviewersModal] = useState<{
    isOpen: boolean;
    paperTitle: string;
    reviewers: AssignedReviewer[];
  }>({
    isOpen: false,
    paperTitle: "",
    reviewers: [],
  });
  const pageSize = 20;
  const { projectId } = useParams<{ projectId: string }>();
  const { member } = useProjectMember(projectId);
  const isLeader = member?.role === 1;
  const queryClient = useQueryClient();

  const phaseNum =
    currentPhase === "TITLE_ABSTRACT"
      ? PaperPhase.TitleAbstract
      : PaperPhase.FullText;

  // Map filters to API params
  const params: GetAssignmentPapersParams = useMemo(
    () => ({
      search: searchQuery || undefined,
      year: yearFilter !== "all" ? parseInt(yearFilter) : undefined,
      assignmentStatus:
        assignmentFilter === "assigned"
          ? 1
          : assignmentFilter === "not_assigned"
            ? 2
            : 0,
      decisionStatus:
        decisionFilter === "all" ? undefined : Number(decisionFilter),
      pageSize,
    }),
    [searchQuery, yearFilter, decisionFilter, assignmentFilter],
  );

  // Use appropriate hook based on phase
  const titleAbstractQuery = useInfiniteTitleAbstractAssignmentPapers(
    studySelectionProcessId,
    params,
    isLeader && currentPhase === "TITLE_ABSTRACT",
  );

  const fullTextQuery = useInfiniteFullTextAssignmentPapers(
    studySelectionProcessId,
    params,
    isLeader && currentPhase === "FULL_TEXT",
  );

  const query =
    currentPhase === "TITLE_ABSTRACT" ? titleAbstractQuery : fullTextQuery;
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  // Conflict Status Polling
  const { data: conflictStatusList } = useConflictStatus(
    studySelectionProcessId,
    phaseNum,
    {
      enabled: !!studySelectionProcessId && isLeader,
      refetchInterval: 10000, // 10 seconds
    },
  );

  const conflictMap = useMemo(() => {
    const map = new Map<string, boolean>();
    conflictStatusList?.forEach((c) => map.set(c.paperId, c.hasConflict));
    return map;
  }, [conflictStatusList]);

  const papers = useMemo(() => {
    const basePapers = data?.pages.flatMap((page) => page.items) || [];
    return basePapers.map((p) => ({
      ...p,
      hasConflict: conflictMap.get(p.id) || false,
    }));
  }, [data, conflictMap]);
  const visiblePaperIds = papers.map((paper) => paper.id).join(",");
  const { data: agentTasks = [] } = useQuery({
    queryKey: ["project-agent-tasks", projectId, visiblePaperIds],
    queryFn: async () => {
      const response = await api.get<{ data: AgentPaperTask[] }>(
        `/projects/${projectId}/agents/tasks`,
        { params: { paperIds: visiblePaperIds } },
      );
      return response.data.data;
    },
    enabled: Boolean(projectId && isLeader && visiblePaperIds),
    staleTime: 0,
  });
  const agentTasksByPaper = useMemo(() => {
    const grouped = new Map<string, AgentPaperTask[]>();
    for (const task of agentTasks) {
      const current = grouped.get(task.paperId) ?? [];
      current.push(task);
      grouped.set(task.paperId, current);
    }
    return grouped;
  }, [agentTasks]);

  const isAllSelected =
    papers.length > 0 && papers.every((p) => selectedIds.includes(p.id));
  const isSomeSelected =
    papers.some((p) => selectedIds.includes(p.id)) && !isAllSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = papers
        .filter(
          (p) =>
            !["Included", "Excluded", "Resolved"].includes(p.status),
        )
        .map((p) => p.id);
      const newSelectedIds = Array.from(new Set([...selectedIds, ...allIds]));
      onSelectionChange(newSelectedIds);
    } else {
      const currentIds = papers.map((p) => p.id);
      const newSelectedIds = selectedIds.filter(
        (id) => !currentIds.includes(id),
      );
      onSelectionChange(newSelectedIds);
    }
  };

  const handleSelectPaper = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    e.stopPropagation();
    if (e.target.checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
  };

  const handleViewReviewers = (
    e: React.MouseEvent,
    title: string,
    reviewers: AssignedReviewer[],
  ) => {
    e.stopPropagation();
    setReviewersModal({
      isOpen: true,
      paperTitle: title,
      reviewers: reviewers || [],
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Fetch more when we are within 200px of the bottom
    if (
      scrollHeight - scrollTop <= clientHeight + 200 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
      // Invalidate conflict status on page change to keep it somewhat in sync
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.studySelection.conflictStatus(
          studySelectionProcessId,
          phaseNum,
        ),
      });
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col items-center border-r border-border bg-bg-secondary py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-1 motion-safe:duration-150 motion-reduce:animate-none">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand papers list"
          className="mb-8 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-text-secondary transition-colors hover:border-accent/20 hover:bg-surface-white hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div
            className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Papers Queue
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <AlertCircle className="mb-2 h-8 w-8 text-error" />
        <p className="text-sm font-medium text-text-secondary">
          Failed to load papers
        </p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="mt-2 inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface-white">
      {/* Header & Search */}
      <div className="space-y-4 border-b border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAssignmentMode && (
              <div className="flex items-center justify-center w-5 h-5">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary focus:ring-primary/40"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={handleSelectAll}
                />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-text-primary">Review queue</h2>
              <p className="mt-0.5 text-[11px] text-text-secondary">Select a paper to inspect and decide</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-text-secondary transition-colors hover:border-border hover:bg-bg-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              title="Collapse List"
              aria-label="Collapse review queue"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            {isAssignmentMode && selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-flex shrink-0 whitespace-nowrap items-center rounded-full bg-bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-1 motion-safe:duration-150 motion-reduce:animate-none">
                  {selectedIds.length} Selected
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-accent transition-colors" />
          <Input
            aria-label="Search papers by title or authors"
            placeholder="Search title or authors..."
            className="border-border bg-surface-white pl-10 transition-[border-color,box-shadow] focus-visible:ring-primary motion-reduce:transition-none"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            aria-label="Filter by publication year"
            className="min-h-11 rounded-xl px-3 text-xs font-medium"
            value={yearFilter}
            onChange={(e) => handleFilterChange(setYearFilter, e.target.value)}
            options={[
              { value: "all", label: "Years" },
              ...Array.from(
                { length: new Date().getFullYear() - 1900 + 1 },
                (_, i) => new Date().getFullYear() - i,
              ).map((year) => ({ value: year.toString(), label: year.toString() })),
            ]}
          />

          <Select
            aria-label="Filter by decision"
            className="min-h-11 rounded-xl px-3 text-xs font-medium"
            value={decisionFilter}
            onChange={(e) =>
              handleFilterChange(setDecisionFilter, e.target.value)
            }
            options={[
              { value: "all", label: "All Decisions" },
              { value: "0", label: "Pending" },
              { value: "1", label: "Included" },
              { value: "2", label: "Excluded" },
              { value: "3", label: "Conflict" },
            ]}
          />

          <Select
            aria-label="Filter by assignment"
            className="min-h-11 rounded-xl px-3 text-xs font-medium"
            value={assignmentFilter}
            onChange={(e) =>
              handleFilterChange(setAssignmentFilter, e.target.value)
            }
            options={[
              { value: "all", label: "All Assignment" },
              { value: "assigned", label: "Assigned" },
              { value: "not_assigned", label: "Not Assigned" },
            ]}
          />
        </div>
      </div>

      {/* List */}
      <div
        className="min-h-0 flex-1 touch-pan-y space-y-2 overflow-y-auto overscroll-contain bg-bg-primary p-3 custom-scrollbar compact-scrollbar"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-border bg-white motion-safe:animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : papers.length > 0 ? (
          papers.map((paper) => {
            const status =
              statusConfig[paper.status] || statusConfig["Pending"];
            const StatusIcon = status.icon;
            const isPaperActive = selectedPaperId === paper.id;
            const isPaperSelected = selectedIds.includes(paper.id);
            const paperAgentTasks = agentTasksByPaper.get(paper.id) ?? [];
            const completedAgentTasks = paperAgentTasks.filter((task) => task.status === "COMPLETED").length;

            return (
              <div
                key={paper.id}
                onClick={() => onSelectPaper(paper.id)}
                className={cn(
                  "group relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-[border-color,background-color,box-shadow] duration-150 motion-reduce:transition-none",
                  isPaperActive
                    ? "border-accent bg-white shadow-sm ring-2 ring-accent/20"
                    : "border-border bg-white hover:border-accent/20 hover:shadow-sm",
                )}
              >
                {isPaperActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
                )}

                {isAssignmentMode && (
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-30"
                      checked={isPaperSelected}
                      disabled={
                        ["Included", "Excluded", "Resolved"].includes(paper.status)
                      }
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleSelectPaper(e, paper.id)}
                    />
                  </div>
                )}

                <div className="flex-1 space-y-3 min-w-0">
                  <h3
                    className={cn(
                      "line-clamp-2 text-[13px] font-semibold leading-5 transition-colors",
                      isPaperActive
                        ? "text-accent"
                        : "text-text-primary group-hover:text-primary",
                    )}
                  >
                    {paper.title}
                  </h3>

                  <p className="text-xs font-medium text-text-secondary line-clamp-1">
                    {paper.author}
                  </p>

                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-text-secondary shrink-0">
                        <Calendar className="w-3 h-3" />
                        {paper.year}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-text-secondary truncate">
                        <Database className="w-3 h-3 shrink-0" />
                        {paper.source}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider",
                          status.bgColor,
                          status.color,
                          status.borderColor,
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {paper.status}
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider",
                          paper.isAssigned
                            ? "bg-bg-secondary text-accent border-accent/20"
                            : "bg-bg-secondary text-text-secondary border-border",
                        )}
                      >
                        <Users className="w-3 h-3" />
                        {paper.isAssigned
                          ? `${paper.assignedReviewers?.filter((reviewer) => reviewer.decision !== "Pending").length ?? 0}/${paper.assignedReviewers?.length ?? 0} reviewed`
                          : "Unassigned"}
                        {paper.isAssigned && (
                          <button
                            type="button"
                            onClick={(e) =>
                              handleViewReviewers(
                                e,
                                paper.title,
                                paper.assignedReviewers || [],
                              )
                            }
                            className="ml-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                            title="View Reviewers"
                            aria-label={`View reviewers for ${paper.title}`}
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {paperAgentTasks.length > 0 && (
                        <div
                          title={paperAgentTasks.map((task) => `${task.agentName}: ${task.status.toLowerCase()}`).join("\n")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-violet-700"
                        >
                          <Bot className="h-3 w-3" />
                          AI {completedAgentTasks}/{paperAgentTasks.length} done
                        </div>
                      )}
                    </div>

                    {paper.hasConflict && (
                      <div className="flex w-fit items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-warning">
                        <AlertCircle className="w-3 h-3" />! Conflict
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-text-secondary" />
            </div>
            <p className="text-sm font-medium text-text-secondary">
              No papers found matching your filters
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setYearFilter("all");
                setDecisionFilter("0");
                setAssignmentFilter("all");
              }}
              className="mt-2 inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
            >
              Clear all filters
            </button>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="py-4 flex justify-center">
            <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-widest">
              <LoadingSpinner size="sm" />
              Loading more...
            </div>
          </div>
        )}
      </div>

      <AssignedReviewersModal
        isOpen={reviewersModal.isOpen}
        onClose={() =>
          setReviewersModal((prev) => ({ ...prev, isOpen: false }))
        }
        paperTitle={reviewersModal.paperTitle}
        reviewers={reviewersModal.reviewers}
      />
    </div>
  );
};
