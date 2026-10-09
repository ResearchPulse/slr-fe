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
  FiSettings,
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
      className="max-w-5xl"
      bodyClassName="p-0 overflow-hidden flex min-h-0"
    >
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar: Filter List */}
          <div className="w-80 border-r border-border bg-bg-primary/30 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  className="rounded-xl border border-border bg-surface-white py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full pl-9 pr-4"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {savedFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleSelectFilter(filter.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    activeFilterId === filter.id
                      ? "bg-surface-white border-2 border-accent shadow-sm"
                      : "border-2 border-transparent hover:bg-bg-secondary/50"
                  }`}
                >
                  <div className="text-left overflow-hidden">
                    <div
                      className={`text-sm font-bold truncate ${activeFilterId === filter.id ? "text-accent" : "text-text-primary"}`}
                    >
                      {filter.name}
                    </div>
                    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">
                      {new Date(filter.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {activeFilterId === filter.id ? (
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  ) : (
                    <FiChevronRight className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              ))}
              {savedFilters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 bg-bg-secondary rounded-xl flex items-center justify-center mb-4 text-gray-300">
                    <FiFilter className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    No collections
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Content: Filter Details/Editor */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-surface-white">
            {!activeFilterId ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-20 h-20 bg-bg-primary rounded-full flex items-center justify-center mb-6">
                  <FiSettings className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-lg font-black text-text-secondary uppercase tracking-widest">
                  Select a collection
                </h4>
                <p className="text-sm text-text-secondary max-w-xs mt-2">
                  Choose a saved filter from the list on the left to view and
                  edit its details.
                </p>
              </div>
            ) : isLoadingDetail ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : draft ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-black text-text-primary tracking-tight">
                      {draft.name}
                    </h4>
                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest mt-1">
                      Filter Identity & Rules
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isConfirmingDelete === draft.id ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                        <span className="text-xs font-bold text-red-600 px-3">
                          Confirm delete?
                        </span>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(draft.id)}
                          isLoading={isDeleting}
                        >
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsConfirmingDelete(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-100 hover:bg-surface-white rounded-xl"
                        onClick={() => setIsConfirmingDelete(draft.id)}
                      >
                        <FiTrash2 className="w-4 h-4 mr-2" />
                        Delete Collection
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
                      Collection Name
                    </label>
                    <div className="relative group">
                      <FiEdit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) =>
                          setDraft({ ...draft, name: e.target.value })
                        }
                        className="rounded-xl border border-border bg-surface-white py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full pl-11 pr-4 text-text-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
                      Search Keyword
                    </label>
                    <div className="relative group">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        value={draft.searchText || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, searchText: e.target.value })
                        }
                        placeholder="All papers"
                        className="rounded-xl border border-border bg-surface-white py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full pl-11 pr-4 text-text-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
                    Detailed Filter Rules
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Years */}
                    <div className="bg-bg-primary rounded-xl p-4 border border-border flex items-center justify-between">
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
                          className="rounded-xl border border-border bg-surface-white px-2 py-1.5 text-xs focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-16"
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
                          className="rounded-xl border border-border bg-surface-white px-2 py-1.5 text-xs focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-16"
                        />
                      </div>
                    </div>

                    {/* Source */}
                    <div className="bg-bg-primary rounded-xl p-4 border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FiDatabase className="text-text-secondary" />
                        <span className="text-xs font-bold text-text-secondary">
                          Source
                        </span>
                      </div>
                      <select
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
                        className="bg-transparent text-xs font-bold text-accent focus:outline-none"
                      >
                        <option value="all">All Sources</option>
                        {metadata?.searchSources.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DOI/FullText Toggles */}
                    <div className="col-span-2 grid grid-cols-3 gap-4">
                      <div className="p-4 bg-bg-primary rounded-xl border border-border">
                        <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
                          DOI Status
                        </div>
                        <select
                          value={draft.filters.doiState}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              filters: {
                                ...draft.filters,
                                doiState: e.target.value as any,
                              },
                            })
                          }
                          className="w-full bg-transparent text-xs font-bold text-text-primary focus:outline-none"
                        >
                          <option value="all">Any Status</option>
                          <option value="has">Has DOI</option>
                          <option value="missing">Missing DOI</option>
                        </select>
                      </div>
                      <div className="p-4 bg-bg-primary rounded-xl border border-border">
                        <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
                          Full Text
                        </div>
                        <select
                          value={draft.filters.fullTextState}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              filters: {
                                ...draft.filters,
                                fullTextState: e.target.value as any,
                              },
                            })
                          }
                          className="w-full bg-transparent text-xs font-bold text-text-primary focus:outline-none"
                        >
                          <option value="all">Any Status</option>
                          <option value="has">Has PDF</option>
                          <option value="missing">Missing PDF</option>
                        </select>
                      </div>
                      <div className="p-4 bg-bg-primary rounded-xl border border-border flex items-center justify-between">
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
                          className="w-4 h-4 rounded border-border text-accent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end gap-3">
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
