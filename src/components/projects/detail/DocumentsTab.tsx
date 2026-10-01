import React, { useState } from "react";
import { FiExternalLink, FiFileText, FiPlus } from "react-icons/fi";
import Button from "../../ui/Button";
import type { CommissioningDocument } from "../../../types/coreAndGovernance";

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
  const [showAll, setShowAll] = useState(false);
  const visibleDocuments = showAll ? documents : documents.slice(0, 3);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {documents.length} {documents.length === 1 ? "document" : "documents"}
        </p>
        {isLeader && documents.length > 0 && (
          <Button
            size="sm"
            onClick={onAdd}
            className="inline-flex items-center gap-2"
          >
            <FiPlus size={14} /> Add document
          </Button>
        )}
      </div>

      {documents.length ? (
        <ul className="divide-y divide-border">
          {visibleDocuments.map((document) => (
            <li
              key={document.document_id}
              className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-secondary text-text-secondary">
                  <FiFileText size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {document.sponsor || "Supporting review document"}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-text-secondary">
                    {document.scope}
                  </p>
                  <p className="mt-2 text-xs text-text-secondary">
                    Allocated budget · ${document.budget?.toLocaleString() ?? "—"}
                  </p>
                </div>
              </div>
              {document.document_url && (
                <a
                  href={document.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  View document <FiExternalLink size={14} />
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-t border-border py-7">
          <p className="text-sm font-medium text-text-primary">No documents yet</p>
          <p className="mt-1 max-w-xl text-sm leading-5 text-text-secondary">
            Add supporting review material with its scope, sponsor, and source link.
          </p>
          {isLeader && (
            <Button
              size="sm"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2"
            >
              <FiPlus size={14} /> Add document
            </Button>
          )}
        </div>
      )}

      {documents.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-3 text-sm font-medium text-accent hover:underline"
          aria-expanded={showAll}
        >
          {showAll
            ? "Show fewer documents"
            : `View all ${documents.length} documents`}
        </button>
      )}
    </section>
  );
};

export default DocumentsTab;
