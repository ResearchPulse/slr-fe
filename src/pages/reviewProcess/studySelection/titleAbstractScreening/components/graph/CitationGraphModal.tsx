import React from "react";
import { FiMaximize2 } from "react-icons/fi";
import type { CitationGraphDto } from "../../../../../../types/studySelection";
import Modal from "../../../../../../components/ui/Modal";
import CitationGraphWorkspace from "./CitationGraphWorkspace";

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
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="xl"
    title={
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-accent">
          <FiMaximize2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">Interactive Citation Network</span>
      </span>
    }
    description={`Analyzing: ${paperTitle}`}
    bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-secondary p-0"
    className="h-[calc(100dvh-2rem)] min-h-0 sm:h-[calc(100dvh-3rem)]"
  >
    <CitationGraphWorkspace
      data={data}
      rootPaperId={rootPaperId}
      className="h-full min-h-0"
    />
  </Modal>
);

export default CitationGraphModal;
