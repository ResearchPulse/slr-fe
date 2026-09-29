import React from "react";
import Button from "../../ui/Button";
import type { CommissioningDocument } from "../../../types/coreAndGovernance";
import { FiPlus, FiExternalLink, FiBriefcase } from "react-icons/fi";

interface DocumentsTabProps {
  documents: CommissioningDocument[];
  onAdd: () => void;
  isLeader?: boolean;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onAdd,
  isLeader = true,
}) => {
  console.log("Check doc: ", documents);
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
          {documents.length} {documents.length === 1 ? "document" : "documents"}
        </p>
        {isLeader && (
          <Button size="sm" onClick={onAdd} className="flex items-center gap-2">
            <FiPlus size={14} />
            Add Document
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.document_id}
            className="border border-border bg-surface-white p-5"
          >
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
                  Scope &amp; Requirements
                </p>
                <p className="text-text-primary leading-[1.7] text-sm">
                  {doc.scope}
                </p>
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
                    Sponsor
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    {doc.sponsor}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
                    Budget
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    $
                    {doc.budget?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {doc.document_url && (
                  <div className="col-span-2">
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 py-2 px-4 bg-primary text-text-on-primary text-[11px] uppercase tracking-[0.1em] hover:bg-primary-hover transition-colors"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                      View Full Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="border border-dashed border-border py-14 text-center">
            <FiBriefcase className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary text-sm">
              No commissioning documents added yet
            </p>
            <p className="text-[11px] text-text-muted mt-1">
              Add documents to define the project's financial and legal scope.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;
