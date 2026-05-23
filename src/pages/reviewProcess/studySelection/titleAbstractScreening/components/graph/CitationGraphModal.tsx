import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiX, FiMaximize2, FiInfo, FiRefreshCw } from "react-icons/fi";
import type { CitationGraphDto } from "../../../../../../types/studySelection";
import { usePaperDetails } from "../../../../../../hooks/usePaperDetails";
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

  const { data: paperData, isLoading: isLoadingDetails } = usePaperDetails(
    selectedPaperId || undefined,
  );

  const paperDetails = useMemo(() => {
    if (!paperData) return null;

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
  }, [paperData]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-(--z-index-popover) flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-surface-white w-full h-full rounded-[4px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-[4px] text-blue-600">
              <FiMaximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary leading-tight line-clamp-1">
                Interactive Citation Network
              </h2>
              <p className="text-xs text-text-secondary font-medium truncate max-w-md">
                Analyzing: {paperTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4 mr-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Root Paper
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Citations
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors text-text-secondary"
              aria-label="Close modal"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Split Content Area */}
        <div className="flex-1 flex overflow-hidden bg-bg-secondary relative">
          {/* LEFT PANEL: Compact Paper Details Sidebar */}
          <div className="w-[380px] border-r border-border bg-surface-white flex flex-col shadow-sm z-10 transition-all duration-300">
            {selectedPaperId ? (
              isLoadingDetails ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary">
                  <FiRefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" />
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
                <div className="w-16 h-16 bg-surface-white rounded-[4px] shadow-sm flex items-center justify-center mb-6 text-gray-300 border border-border">
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
          <div className="flex-1 relative">
            <CitationGraphCanvas
              data={data}
              rootPaperId={rootPaperId}
              selectedPaperId={selectedPaperId}
              onNodeClick={(id) => setSelectedPaperId(id)}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CitationGraphModal;
