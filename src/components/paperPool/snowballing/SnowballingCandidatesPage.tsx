import React, { useState } from "react";
import SnowballingPaperList from "./SnowballingPaperList";
import SnowballingPaperWorkspace from "./SnowballingPaperWorkspace";
import { type MockCandidate } from "../../../mocks/snowballingMockData";
import {
  useSelectCandidates,
  useRejectCandidates,
  usePapersWithCandidates,
} from "../../../hooks/useSnowballCandidates";
import type { PaperWithCandidateDto } from "../../../types/paper";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { FiAlertCircle } from "react-icons/fi";
import { toastSuccess, toastError } from "../../../utils/toast";
import { useProjectMember } from "../../../hooks/useProjectMember";

interface SnowballingCandidatesPageProps {
  projectId: string;
}

const SnowballingCandidatesPage: React.FC<SnowballingCandidatesPageProps> = ({
  projectId,
}) => {
  const [view, setView] = useState<"list" | "workspace">("list");
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<MockCandidate | null>(null);

  const { member } = useProjectMember(projectId);
  const isLeader = member?.isLeader ?? false;

  // Mutations
  const selectMutation = useSelectCandidates(projectId);
  const rejectMutation = useRejectCandidates();

  // Fetch papers if needed for Workspace metadata fallback
  const { data: response } = usePapersWithCandidates(projectId, {
    pageNumber: 1,
    pageSize: 100,
  });
  const activePaper = response?.items?.find(
    (p: PaperWithCandidateDto) => p.id === selectedPaperId,
  );

  const handlePaperClick = (id: string) => {
    setSelectedPaperId(id);
    setView("workspace");
  };

  const handleBack = () => {
    setView("list");
    setSelectedPaperId(null);
    setSelectedCandidate(null);
  };

  const handleDetailAction = async (
    id: string,
    action: "select" | "reject",
  ) => {
    try {
      if (action === "select") {
        await selectMutation.mutateAsync({ candidateIds: [id] });
      } else {
        await rejectMutation.mutateAsync({ candidateIds: [id] });
      }
      setSelectedCandidate(null);
      toastSuccess(
        `Candidate successfully ${action === "select" ? "promoted" : "rejected"}.`,
      );
    } catch (err: any) {
      toastError(err.message || "Failed to update candidate.");
    }
  };

  const isProcessing = selectMutation.isPending || rejectMutation.isPending;

  if (!isLeader) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 bg-surface-white rounded-xl shadow-none border border-border">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <FiAlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          Access Restricted
        </h2>
        <p className="mt-2 text-text-secondary text-center max-w-md">
          Only project leaders can manage snowballing candidates and review
          reference discovery workflows.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-white rounded-xl shadow-none border border-border relative">
      {/* Dynamic Header based on view */}
      <div className="relative z-20 border-b border-border bg-surface-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-accent">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary sm:text-xl">
                Snowballing candidates
              </h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                {view === "list"
                  ? "Choose a source paper to review its references."
                  : "Review references extracted from this source paper."}
              </p>
            </div>
          </div>
          {view === "workspace" && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back to papers</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Transitions */}
      <div className="flex-1 overflow-hidden relative">
        {view === "list" ? (
          <SnowballingPaperList
            projectId={projectId}
            onPaperClick={handlePaperClick}
          />
        ) : activePaper ? (
          <SnowballingPaperWorkspace
            projectId={projectId}
            paper={activePaper}
            onSelectCandidate={setSelectedCandidate}
            selectedCandidateId={selectedCandidate?.candidateId}
            selectedCandidate={selectedCandidate}
            onCloseDetail={() => setSelectedCandidate(null)}
            onAction={handleDetailAction}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-20 bg-surface-white">
            <Loader2 aria-hidden="true" className="w-10 h-10 motion-safe:animate-spin motion-reduce:animate-none text-primary/40 mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-text-secondary">
              Loading Workspace...
            </p>
          </div>
        )}

        {/* Detail Overlay - Moved to workspace level or handled here */}
        {view === "workspace" && activePaper && (
          <div className="h-full w-full">
            {/* The workspace itself will now handle the detail panel if we want it localized */}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnowballingCandidatesPage;
