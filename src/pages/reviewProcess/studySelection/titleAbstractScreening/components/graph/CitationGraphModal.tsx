import React, { useState, useMemo } from "react";
import { FiMaximize2, FiInfo, FiRefreshCw } from "react-icons/fi";
import type { CitationGraphDto } from "../../../../../../types/studySelection";
import { usePaperDetails } from "../../../../../../hooks/usePaperDetails";
import Modal from "../../../../../../components/ui/Modal";
import CitationGraphCanvas from "./CitationGraphCanvas";
import PaperDetailsPanel from "./PaperDetailsPanel";

interface CitationGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CitationGraphDto;
  paperTitle: string;
  rootPaperId?: string;
}

const CitationGraphModal: React.FC<CitationGraphModalProps> = ({
  isOpen,
  onClose,
  data,
  paperTitle,
  rootPaperId,
}) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  const selectedNode = data.nodes.find((node) => node.id === selectedPaperId);
  const selectedNodeIsExternal = selectedPaperId?.startsWith("openalex:") ?? false;
  const { data: paperData, isLoading: isLoadingDetails } = usePaperDetails(
    selectedPaperId && !selectedNodeIsExternal ? selectedPaperId : undefined,
  );

  const paperDetails = useMemo(() => {
    if (paperData) {
      return {
        id: paperData.id,
        title: paperData.title,
        authors: paperData.authors ?? undefined,
        year:
          paperData.publicationYearInt ||
          (paperData.publicationYear
            ? Number(paperData.publicationYear)
            : undefined),
        doi: paperData.doi ?? undefined,
        abstract: paperData.abstract ?? undefined,
      };
    }
    if (!selectedNode) return null;
    return {
      id: selectedNode.id,
      title: selectedNode.title,
      authors: selectedNode.authors ?? undefined,
      year: selectedNode.year ?? undefined,
      doi: selectedNode.doi ?? undefined,
      citationCount: selectedNode.citationCount,
    };
  }, [paperData, selectedNode]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-accent">
            <FiMaximize2 className="h-5 w-5" />
          </span>
          <span className="min-w-0">Interactive Citation Network</span>
        </span>
      }
      description={`Analyzing: ${paperTitle}`}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-secondary p-0"
      className="h-[calc(100dvh-2rem)] min-h-0 sm:h-[calc(100dvh-3rem)]"
    >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
          <div className="flex max-h-[36%] min-h-28 w-full shrink-0 flex-col overflow-y-auto border-b border-border bg-surface-white shadow-sm xl:max-h-none xl:min-h-0 xl:w-[380px] xl:border-b-0 xl:border-r">
            {selectedPaperId ? (
              isLoadingDetails ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary" role="status" aria-live="polite" aria-busy="true">
                  <FiRefreshCw aria-hidden="true" className="w-8 h-8 motion-safe:animate-spin motion-reduce:animate-none mb-4 text-accent" />
                  <p className="text-sm font-medium">Fetching details...</p>
                </div>
              ) : paperDetails ? (
                <PaperDetailsPanel paper={paperDetails} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary">
                  <FiInfo className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium text-text-secondary">
                    Details not available
                  </p>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-primary/50">
                <div className="w-16 h-16 bg-surface-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-text-secondary/35 border border-border">
                  <FiInfo className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-2">
                  Select a Paper
                </h3>
                <p className="text-xs text-text-secondary max-w-[220px] leading-relaxed">
                  Click on any node in the interactive network to view its
                  compact overview and connections.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Graph Canvas */}
          <div className="relative min-h-0 min-w-0 flex-1">
            <CitationGraphCanvas
              data={data}
              rootPaperId={rootPaperId}
              selectedPaperId={selectedPaperId}
              onNodeClick={(id) => setSelectedPaperId(id)}
            />
          </div>
        </div>
    </Modal>
  );
};

export default CitationGraphModal;
