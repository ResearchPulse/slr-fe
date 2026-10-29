import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiFileText } from "react-icons/fi";
import { Modal } from "../../../../ui/Modal";
import Pagination from "../../../../ui/Pagination";
import { paperImportService } from "../../../../../services/paperImportService";
import type { CrossrefWorkDto } from "../../../../../types/paper";

function normalizeTitle(value: string | undefined): string {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function abstractText(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  // Crossref abstracts are often JATS/XML fragments. Convert markup to readable text
  // before displaying it as plain text in the modal.
  const withParagraphBreaks = value.replace(/<\/(?:jats:)?(?:p|div|li)>/gi, " ");
  const parsed = new DOMParser().parseFromString(withParagraphBreaks, "text/html");
  const text = (parsed.body.textContent ?? "").replace(/\s+/g, " ").trim();
  return text || null;
}

async function findCrossrefWork(paper: any): Promise<CrossrefWorkDto | null> {
  if (paper.doi?.trim()) {
    try {
      const response = await paperImportService.getWorkDetail(paper.doi.trim());
      return response.data;
    } catch {
      // Some external records have stale or malformed DOIs. Try an exact title match below.
    }
  }

  if (!paper.title?.trim()) return null;
  const response = await paperImportService.searchWorks({ queryTitle: paper.title, rows: 5 });
  const title = normalizeTitle(paper.title);
  return response.data.items.find((work) => normalizeTitle(work.title?.[0]) === title) ?? null;
}

const PaperMetadataContent: React.FC<{ paper: any }> = ({ paper }) => {
  const existingAbstract = abstractText(paper.abstract);
  const lookup = useQuery({
    queryKey: ["crossref-paper-abstract", paper.doi || normalizeTitle(paper.title)],
    queryFn: () => findCrossrefWork(paper),
    enabled: !existingAbstract,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
  const abstract = existingAbstract || abstractText(lookup.data?.abstract);

  return (
    <>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Title</dt>
          <dd className="mt-1 break-words text-[15px] font-semibold leading-6 text-text-primary">{paper.title || "Untitled paper"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Authors</dt>
          <dd className="mt-1 break-words text-sm leading-6 text-text-primary">{paper.authors || "Author information unavailable"}</dd>
        </div>
        {paper.year != null && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Publication year</dt>
            <dd className="mt-1 text-sm tabular-nums text-text-primary">{paper.year}</dd>
          </div>
        )}
        {paper.citationCount != null && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Citations</dt>
            <dd className="mt-1 text-sm tabular-nums text-text-primary">{paper.citationCount}</dd>
          </div>
        )}
        {paper.doi && (
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">DOI</dt>
            <dd className="mt-1 break-all font-mono text-sm text-text-primary">{paper.doi}</dd>
          </div>
        )}
      </dl>

      <section className="mt-6 border-t border-border/70 pt-5" aria-labelledby="paper-abstract-heading">
        <div className="flex items-center gap-2">
          <FiFileText aria-hidden="true" className="h-4 w-4 text-primary" />
          <h3 id="paper-abstract-heading" className="text-sm font-semibold text-text-primary">Abstract</h3>
          {(abstract || lookup.data?.abstract) && <span className="text-xs text-text-secondary">Crossref</span>}
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text-secondary">
          {abstract || (lookup.isLoading
            ? "Searching Crossref for the abstract…"
            : lookup.isError
              ? "Could not retrieve the abstract right now. Please try again later."
              : "No abstract was found in Crossref for this paper.")}
        </p>
      </section>
    </>
  );
};

interface PaperNodeListProps {
  nodes: any[];
  isLoading: boolean;
  emptyLabel: string;
  variant?: "cards" | "flat";
  flatHeading?: string;
  flatHeadingId?: string;
}

export const PaperNodeList: React.FC<PaperNodeListProps> = ({
  nodes,
  isLoading,
  emptyLabel,
  variant = "cards",
  flatHeading,
  flatHeadingId,
}) => {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const flatPageSize = 8;
  const totalPages = Math.max(1, Math.ceil(nodes.length / flatPageSize));
  const nodeIdsKey = nodes.map((node) => node.id).join("|");

  React.useEffect(() => {
    setCurrentPage(1);
  }, [nodeIdsKey]);

  if (isLoading) {
    if (variant === "flat") {
      return (
        <div className="divide-y divide-border/70" role="status" aria-label="Loading papers">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 py-4 first:pt-2">
              <div className="h-4 w-3/5 rounded bg-bg-secondary motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-2/5 rounded bg-bg-secondary motion-safe:animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-border bg-bg-secondary motion-safe:animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center gap-2 py-7 text-sm text-text-secondary ${variant === "cards" ? "justify-center text-center" : ""}`}>
        <FiFileText aria-hidden="true" className="h-4 w-4 shrink-0 text-text-secondary/60" />
        <p>{emptyLabel}</p>
      </div>
    );
  }

  if (variant === "flat") {
    const page = Math.min(currentPage, totalPages);
    const pageNodes = nodes.slice((page - 1) * flatPageSize, page * flatPageSize);
    const firstItem = (page - 1) * flatPageSize + 1;
    const lastItem = Math.min(page * flatPageSize, nodes.length);

    return (
      <>
        <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-white">
          {flatHeading && (
            <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 sm:px-5">
              <h2 id={flatHeadingId} className="text-sm font-semibold text-text-primary">{flatHeading}</h2>
              <span
                aria-label={`${nodes.length} papers`}
                className="inline-flex h-6 min-w-8 items-center justify-center rounded-full bg-primary-light px-2.5 text-[13px] font-bold tabular-nums text-primary ring-1 ring-inset ring-primary/15"
              >
                {nodes.length}
              </span>
            </div>
          )}
          <div className="divide-y divide-border/70" role="list">
            {pageNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                role="listitem"
                aria-haspopup="dialog"
                onClick={() => setSelectedNode(node)}
                className="group w-full cursor-pointer px-4 py-3.5 text-left transition-colors duration-150 hover:bg-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset active:bg-primary-light motion-reduce:transition-none sm:px-5"
              >
                <span className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[15px] font-semibold leading-6 text-text-primary transition-colors group-hover:text-primary">
                      {node.title || "Untitled paper"}
                    </span>
                    <span className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-5 text-text-secondary">
                      <span className="break-words">
                        {node.authors || "Author information unavailable"}
                      </span>
                      {node.doi && (
                        <>
                          <span aria-hidden="true" className="text-text-secondary/50">{"\u00b7"}</span>
                          <span className="break-all">DOI: {node.doi}</span>
                        </>
                      )}
                    </span>
                  </span>
                  {node.year != null && (
                    <span className="shrink-0 text-[13px] tabular-nums text-text-secondary sm:pt-0.5 sm:pl-2">
                      {node.year}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-2 border-t border-border/70 bg-bg-secondary/35 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs tabular-nums text-text-secondary" aria-live="polite">
                Showing {firstItem}–{lastItem} of {nodes.length} papers
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                compact
              />
            </div>
          )}
        </div>

        <Modal
          isOpen={selectedNode !== null}
          onClose={() => setSelectedNode(null)}
          size="md"
          title="Paper metadata"
          description="Bibliographic information for this paper."
          bodyClassName="p-5 sm:p-6"
        >
          {selectedNode && <PaperMetadataContent paper={selectedNode} />}
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="group flex items-start gap-3 rounded-xl border border-border bg-surface-white p-4 transition-colors duration-200 hover:border-primary/30 hover:bg-bg-secondary/40 motion-reduce:transition-none sm:gap-4 sm:p-5"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-accent">
            <FiFileText aria-hidden="true" className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <h4 className="min-w-0 flex-1 text-sm font-semibold leading-5 text-text-primary transition-colors group-hover:text-primary sm:text-[15px]">
                {node.title}
              </h4>
              {node.year != null && (
                <span className="shrink-0 rounded-full bg-bg-secondary px-2.5 py-1 text-xs font-semibold tabular-nums text-text-secondary">
                  {node.year}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-text-secondary">
              <span className="min-w-0 truncate">
                {node.authors || "Author information unavailable"}
              </span>
              {node.doi && (
                <>
                  <span aria-hidden="true" className="text-text-secondary/40">·</span>
                  <span className="min-w-0 max-w-full truncate font-medium">DOI: {node.doi}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
