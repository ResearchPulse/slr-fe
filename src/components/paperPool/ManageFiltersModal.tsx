import Select from "../ui/Select";
import { useState, useEffect } from "react";
import {
  FiTrash2,
  FiEdit3,
  FiSearch,
  FiCopy,
  FiCalendar,
  FiDatabase,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import LoadingSpinner from "../ui/LoadingSpinner";
import type { PaperPoolFilterMetadata, PaperPoolFilterSetting } from "./types";

interface ManageFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedFilters: PaperPoolFilterSetting[];
  onDelete: (id: string) => Promise<void>;
  onSaveAsNew: (draft: PaperPoolFilterSetting) => Promise<void>;
  detailFilter: PaperPoolFilterSetting | null;
  isLoadingDetail: boolean;
  onViewDetail: (id: string) => void;
  isCreating: boolean;
  isDeleting: boolean;
  metadata: PaperPoolFilterMetadata | null;
}

export default function ManageFiltersModal({
  isOpen,
  onClose,
  savedFilters,
  onDelete,
  onSaveAsNew,
  detailFilter,
  isLoadingDetail,
  onViewDetail,
  isCreating,
  isDeleting,
  metadata,
}: ManageFiltersModalProps) {
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PaperPoolFilterSetting | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (detailFilter) {
      setDraft(detailFilter);
    }
  }, [detailFilter]);

  const handleSelectFilter = (id: string) => {
    setActiveFilterId(id);
    onViewDetail(id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Filter Collections"
      description="Edit, clone or remove your saved filter configurations"
      size="xl"
      className="h-[min(82dvh,44rem)] max-w-4xl sm:h-[min(76vh,44rem)]"
      headerClassName="items-center px-5 py-3 sm:px-5 sm:py-3"
      descriptionClassName="text-[13px] leading-5"
      bodyClassName="flex min-h-0 overflow-hidden p-0 sm:p-0"
    >
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden md:flex-row">
          {/* Left Sidebar: Filter List */}
          <div className="flex max-h-48 w-full shrink-0 flex-col border-b border-border bg-bg-primary/30 md:max-h-none md:w-1/4 md:min-w-56 md:max-w-64 md:border-b-0 md:border-r">
            <div className="shrink-0 border-b border-border px-3 py-3">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  aria-label="Search collections"
                  className="h-10 w-full rounded-lg border border-border bg-surface-white pl-9 pr-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 motion-reduce:transition-none"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5 custom-scrollbar">
              {savedFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleSelectFilter(filter.id)}
                  aria-pressed={activeFilterId === filter.id}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    activeFilterId === filter.id
                      ? "border-primary/25 bg-primary-light"
                      : "border-transparent hover:border-border/70 hover:bg-surface-white"
                  }`}
                >
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div
                      className={`truncate text-sm font-semibold ${activeFilterId === filter.id ? "text-primary" : "text-text-primary"}`}
                    >
                      {filter.name}
                    </div>
                    <div className="mt-1 text-[11px] leading-4 text-text-secondary">
                      {new Date(filter.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <FiChevronRight className={`h-4 w-4 shrink-0 transition-colors motion-reduce:transition-none ${activeFilterId === filter.id ? "text-primary" : "text-text-secondary/60"}`} aria-hidden="true" />
                </button>
              ))}
              {savedFilters.length === 0 && (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary">
                    <FiFilter className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-text-primary">
                    No saved collections
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">Save a filter view to manage it here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Content: Filter Details/Editor */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface-white p-4 custom-scrollbar sm:p-5 lg:p-6">
            {!activeFilterId ? (
              <div className="flex h-full min-h-52 flex-col items-center justify-center px-4 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <FiFilter className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-[15px] font-semibold text-text-primary">
                  Select a collection
                </h4>
                <p className="mt-1.5 max-w-xs text-[13px] leading-5 text-text-secondary">
                  Choose a collection to view its filters or save a new copy.
                </p>
              </div>
            ) : isLoadingDetail ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : draft ? (
              <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-1 motion-safe:duration-150 motion-reduce:animate-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold tracking-tight text-text-primary">
                      {draft.name}
                    </h4>
                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest mt-1">
                      Filter Identity & Rules
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isConfirmingDelete === draft.id ? (
                      <div className="flex flex-wrap items-center justify-end gap-2 motion-safe:animate-in motion-safe:slide-in-from-right-1 motion-safe:duration-150 motion-reduce:animate-none">
                        <span className="px-2 text-xs font-semibold text-error sm:px-3">
                          Confirm delete?
                        </span>
                        <Button
                          size="sm"
                          variant="danger"
                          className="min-h-9"
                          onClick={() => onDelete(draft.id)}
                          isLoading={isDeleting}
                        >
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="min-h-9"
                          onClick={() => setIsConfirmingDelete(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9 rounded-lg border-error/20 text-error hover:bg-error/5"
                        onClick={() => setIsConfirmingDelete(draft.id)}
                      >
                        <FiTrash2 className="w-4 h-4 mr-2" />
                        Delete Collection
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
                      Collection Name
                    </label>
                    <div className="relative group">
                      <FiEdit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 transition-colors group-focus-within:text-accent motion-reduce:transition-none" />
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) =>
                          setDraft({ ...draft, name: e.target.value })
                        }
                        className="min-h-10 w-full rounded-lg border border-border bg-surface-white py-2 pl-10 pr-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
                      Search Keyword
                    </label>
                    <div className="relative group">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 transition-colors group-focus-within:text-accent motion-reduce:transition-none" />
                      <input
                        type="text"
                        value={draft.searchText || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, searchText: e.target.value })
                        }
                        placeholder="All papers"
                        className="min-h-10 w-full rounded-lg border border-border bg-surface-white py-2 pl-10 pr-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
                    Detailed Filter Rules
                  </h5>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                    {/* Years */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-primary p-3">
                      <div className="flex items-center gap-3">
                        <FiCalendar className="text-text-secondary" />
                        <span className="text-xs font-bold text-text-secondary">
                          Year Range
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1900}
                          max={2100}
                          step={1}
                          value={draft.filters.yearFrom != null && draft.filters.yearFrom >= 0 ? draft.filters.yearFrom : ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              filters: {
                                ...draft.filters,
                                yearFrom: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              },
                            })
                          }
                          placeholder="Start"
                          className="min-h-9 w-16 rounded-lg border border-border bg-surface-white px-2 text-xs text-text-primary outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                        <span className="text-text-secondary font-bold">-</span>
                        <input
                          type="number"
                          min={1900}
                          max={2100}
                          step={1}
                          value={draft.filters.yearTo != null && draft.filters.yearTo >= 0 ? draft.filters.yearTo : ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              filters: {
                                ...draft.filters,
                                yearTo: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              },
                            })
                          }
                          placeholder="End"
                          className="min-h-9 w-16 rounded-lg border border-border bg-surface-white px-2 text-xs text-text-primary outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Source */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-primary p-3">
                      <div className="flex items-center gap-3">
                        <FiDatabase className="text-text-secondary" />
                        <span className="text-xs font-bold text-text-secondary">
                          Search Source
                        </span>
                      </div>
                      <Select
                        value={draft.filters.searchSourceId}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            filters: {
                              ...draft.filters,
                              searchSourceId: e.target.value as any,
                            },
                          })
                        }
                        aria-label="Search source"
                        className="min-h-9 max-w-[55%] bg-transparent text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <option value="all">All Search Sources</option>
                        {metadata?.searchSources.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-primary p-3">
                      <div className="flex items-center gap-3">
                        <FiDatabase className="text-text-secondary" />
                        <span className="text-xs font-bold text-text-secondary">
                          Paper Source
                        </span>
                      </div>
                      <Select
                        value={draft.filters.paperSource ?? "all"}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            filters: {
                              ...draft.filters,
                              paperSource: e.target.value,
                            },
                          })
                        }
                        aria-label="Paper source"
                        className="min-h-9 max-w-[55%] bg-transparent text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <option value="all">All Paper Sources</option>
                        {metadata?.paperSources?.map((source) => (
                          <option key={source} value={source}>
                            {source}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* DOI/FullText Toggles */}
                    <div className="col-span-1 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:col-span-2">
                      <div className="rounded-lg border border-border bg-bg-primary p-3">
                        <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
                          DOI Status
                        </div>
                        <Select
                          value={draft.filters.doiState}
                          aria-label="DOI status"
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              filters: {
                                ...draft.filters,
                                doiState: e.target.value as any,
                              },
                            })
                          }
                          className="min-h-9 w-full bg-transparent text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          <option value="all">Any Status</option>
                          <option value="has">Has DOI</option>
                          <option value="missing">Missing DOI</option>
                        </Select>
                      </div>
                      <div className="rounded-lg border border-border bg-bg-primary p-3">
                        <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
                          Full Text
                        </div>
                        <Select
                          value={draft.filters.fullTextState}
                          aria-label="Full text status"
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              filters: {
                                ...draft.filters,
                                fullTextState: e.target.value as any,
                              },
                            })
                          }
                          className="min-h-9 w-full bg-transparent text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          <option value="all">Any Status</option>
                          <option value="has">Has PDF</option>
                          <option value="missing">Missing PDF</option>
                        </Select>
                      </div>
                      <label htmlFor="filter-only-unused" className="flex min-h-10 cursor-pointer items-center justify-between rounded-lg border border-border bg-bg-primary p-3">
                        <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                          Unused Only
                        </div>
                        <input
                          type="checkbox"
                          checked={draft.filters.onlyUnused}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              filters: {
                                ...draft.filters,
                                onlyUnused: e.target.checked,
                              },
                            })
                          }
                          id="filter-only-unused"
                          className="h-5 w-5 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => onSaveAsNew(draft)}
                    isLoading={isCreating}
                  >
                    <FiCopy className="w-4 h-4 mr-2" />
                    Save Changes As New Filter
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
    </Modal>
  );
}
