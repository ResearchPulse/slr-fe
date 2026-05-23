// Searches (Strategy Documentation) Tab Content

import {
  FiSearch,
  FiFileText,
  FiDatabase,
  FiCopy,
  FiCheck,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiMoreVertical,
} from "react-icons/fi";
import Button from "../../../../components/ui/Button";

import type { SearchExecutionResponse } from "../../../../types/searchExecution";
import { SearchExecutionType } from "../../../../types/identification";
import { formatRelativeTime } from "../../../../utils/dateFormat";
import EmptyState from "../../../../components/ui/EmptyState";

interface SearchesTabContentProps {
  searchExecutions: SearchExecutionResponse[];
}

export default function SearchesTabContent({
  searchExecutions,
}: SearchesTabContentProps) {
  return (
    <div>
      {/* Info Banner */}
      <div className="bg-bg-primary border border-border rounded-[4px] p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiFileText className="w-5 h-5 text-text-secondary mt-0.5" />
          <div>
            <h4 className="font-semibold text-text-primary mb-1">
              Search Strategy Documentation
            </h4>
            <p className="text-sm text-text-secondary">
              This section is for documenting your literature search strategies
              for audit and reporting purposes. Records are imported via RIS
              files in the Import Batches tab.
            </p>
          </div>
        </div>
      </div>

      {/* Minimal Toolbar - Documentation Focus */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Filter documented searches..."
              className="pl-10 pr-4 py-2 border border-border rounded-[4px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[300px]"
            />
          </div>
          <select className="px-3 py-2 border border-border rounded-[4px] text-sm focus:ring-2 focus:ring-blue-500">
            <option>All Databases</option>
            <option>PubMed</option>
            <option>IEEE Xplore</option>
            <option>ACM Digital Library</option>
          </select>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <FiFileText className="w-4 h-4" />
          Document Search Strategy
        </Button>
      </div>

      {searchExecutions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Source
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Query Summary
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Executed Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Results
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Type
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {searchExecutions.map((search) => (
                <tr
                  key={search.id}
                  className="border-b border-border hover:bg-bg-primary transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FiDatabase className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-text-primary">
                        {search.searchSource}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-md">
                      <p
                        className="text-sm text-text-primary truncate"
                        title={search.searchQuery || ""}
                      >
                        {search.searchQuery}
                      </p>
                      <button className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1">
                        <FiCopy className="w-3 h-3" />
                        Copy query
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-secondary">
                    {formatRelativeTime(search.executedAt)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-lg font-semibold text-green-600">
                      {search.resultCount}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700`}
                    >
                      <FiCheck className="w-3 h-3" />
                      {search.type === SearchExecutionType.DatabaseSearch
                        ? "Database Search"
                        : "Manual Import"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors">
                        <FiRefreshCw className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors">
                        <FiDownload className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors">
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<FiFileText className="w-16 h-16 text-gray-300" />}
          title="No Search Strategy Documented Yet"
          description="Document your literature search strategies here for audit and reporting purposes. This is primarily for tracking metadata, not executing live searches."
          actionLabel="Document Search Strategy"
          onAction={() => console.log("Add search strategy")}
        />
      )}
    </div>
  );
}
