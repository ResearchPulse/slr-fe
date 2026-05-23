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
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-[4px] border-2 transition-all ${
          isOpen
            ? "border-blue-500 bg-blue-50 shadow-sm"
            : "border-border bg-surface-white hover:border-border"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-[4px] flex items-center justify-center ${selectedFilter ? "bg-blue-500 text-white" : "bg-bg-secondary text-text-secondary"}`}
        >
          <FiFilter className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest leading-none mb-1">
            Active View
          </div>
          <div className="text-sm font-bold text-text-primary leading-none">
            {selectedFilter ? selectedFilter.name : "Unsaved View"}
          </div>
        </div>
        <FiChevronDown
          className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-surface-white rounded-[4px] shadow-2xl border border-border overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-border bg-bg-primary/50">
            <button
              onClick={() => {
                onSaveNew();
                setIsOpen(false);
              }}
              disabled={isCreating}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-[4px] text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-[4px] bg-blue-100 flex items-center justify-center">
                <FiPlus className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Save Current View
              </span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black text-text-secondary uppercase tracking-widest">
              Saved Filter Collections
            </div>
            {savedFilters.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-text-secondary italic">
                No saved filters yet
              </div>
            ) : (
              savedFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    onSelect(filter);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-[4px] transition-colors ${
                    selectedFilterId === filter.id
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-bg-primary text-text-primary"
                  }`}
                >
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-sm font-bold truncate">
                      {filter.name}
                    </span>
                    <span className="text-[10px] text-text-secondary truncate">
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

          <div className="p-2 border-t border-border bg-bg-primary/50">
            <button
              onClick={() => {
                onManage();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-[4px] text-text-secondary hover:bg-surface-white hover:text-text-primary hover:shadow-sm border border-transparent hover:border-border transition-all"
            >
              <div className="w-8 h-8 rounded-[4px] bg-bg-secondary flex items-center justify-center">
                <FiSettings className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Manage Filters
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
