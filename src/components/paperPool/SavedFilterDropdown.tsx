import { useState, useRef, useEffect } from "react";
import {
  FiChevronDown,
  FiFilter,
  FiSettings,
  FiCheck,
  FiPlus,
} from "react-icons/fi";
import type { PaperPoolFilterSetting } from "./types";

interface SavedFilterDropdownProps {
  savedFilters: PaperPoolFilterSetting[];
  selectedFilterId: string | null;
  onSelect: (filter: PaperPoolFilterSetting) => void;
  onManage: () => void;
  onSaveNew: () => void;
  isCreating?: boolean;
}

export default function SavedFilterDropdown({
  savedFilters,
  selectedFilterId,
  onSelect,
  onManage,
  onSaveNew,
  isCreating = false,
}: SavedFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedFilter = savedFilters.find((f) => f.id === selectedFilterId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
          isOpen
            ? "border-accent bg-primary-light"
            : "border-border bg-white hover:border-accent/40"
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${selectedFilter ? "bg-accent text-white" : "bg-slate-100 text-text-secondary"}`}
        >
          <FiFilter className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="mb-1 text-[9px] font-medium uppercase leading-none tracking-wider text-text-secondary">
            Active View
          </div>
          <div className="max-w-36 truncate text-sm font-semibold leading-none text-text-primary">
            {selectedFilter ? selectedFilter.name : "Unsaved View"}
          </div>
        </div>
        <FiChevronDown
          className={`h-4 w-4 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-(--z-index-dropdown) mt-2 w-72 animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border border-border bg-surface-white shadow-xl duration-200">
          <div className="border-b border-border bg-slate-50/70 p-2">
            <button
              type="button"
              onClick={() => {
                onSaveNew();
                setIsOpen(false);
              }}
              disabled={isCreating}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-accent transition-colors hover:bg-primary-light"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                <FiPlus className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">
                Save Current View
              </span>
            </button>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Saved Filter Collections
            </div>
            {savedFilters.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-text-secondary">
                No saved filters yet
              </div>
            ) : (
              savedFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    onSelect(filter);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 transition-colors ${
                    selectedFilterId === filter.id
                      ? "bg-primary-light text-accent"
                      : "hover:bg-bg-primary text-text-primary"
                  }`}
                >
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="truncate text-sm font-semibold">
                      {filter.name}
                    </span>
                    <span className="truncate text-[10px] text-text-secondary">
                      {filter.searchText || "No search term"}
                    </span>
                  </div>
                  {selectedFilterId === filter.id && (
                    <FiCheck className="w-4 h-4 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border bg-slate-50/70 p-2">
            <button
              type="button"
              onClick={() => {
                onManage();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-text-secondary transition-colors hover:border-border hover:bg-white hover:text-text-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                <FiSettings className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">
                Manage Filters
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
