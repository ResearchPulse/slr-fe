import React, { useState } from "react";
import { FiPlus, FiSearch, FiTrash2, FiInfo } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { cn } from "../../../../utils/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../../ui/Table";
import ActionButton from "../../../admin/slr-projects/ActionButton";
import Pagination from "../../../ui/Pagination";
import AddExclusionReasonsModal from "./AddExclusionReasonsModal";
import ConfirmModal from "../../../ui/ConfirmModal";
import Switch from "../../../ui/Switch";
import Select from "../../../ui/Select";
import {
  useStudySelectionExclusionReasons,
  useToggleExclusionReasonActive,
  useDeleteExclusionReason,
} from "../../../../hooks/useStudySelection";
import { useDebounce } from "../../../../hooks/useDebounce";
import { toastSuccess, toastError } from "../../../../utils/toast";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Button from "../../../ui/Button";

const ProcessExclusionCodeTab: React.FC = () => {
  const { screeningProcessId: studySelectionProcessId } = useParams<{
    screeningProcessId: string;
  }>();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [onlyActive, setOnlyActive] = useState(false);
  const [source, setSource] = useState(0); // 0: All, 1: Library, 2: Custom
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const toggleActiveMutation = useToggleExclusionReasonActive();
  const deleteMutation = useDeleteExclusionReason();

  const { data: exclusionReasons = [], isLoading } =
    useStudySelectionExclusionReasons(studySelectionProcessId, {
      onlyActive,
      source,
      search: debouncedSearchTerm,
    });

  const handleToggleActive = (id: string) => {
    toggleActiveMutation.mutate(id, {
      onSuccess: (data) => {
        toastSuccess(
          "Status Updated",
          `Exclusion code "${data.name}" is now ${data.isActive ? "active" : "disabled"}.`,
        );
      },
      onError: (error: any) => {
        toastError(
          "Update Failed",
          error.message || "Failed to update exclusion code status.",
        );
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingId || !studySelectionProcessId) return;

    deleteMutation.mutate(
      { id: deletingId, processId: studySelectionProcessId },
      {
        onSuccess: () => {
          toastSuccess(
            "Code Deleted",
            "Exclusion reason has been removed successfully.",
          );
          setIsConfirmOpen(false);
          setDeletingId(null);
        },
        onError: (error: any) => {
          toastError(
            "Deletion Failed",
            error.message || "Failed to delete exclusion reason.",
          );
        },
      },
    );
  };

  // The local data is already filtered by the server
  const filteredData = exclusionReasons;

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6">
      {/* 🛠️ Action Bar 🛠️ */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-white p-3 shadow-none sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-md sm:flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Filter by code or name..."
              className="min-h-11 w-full rounded-xl border-none bg-bg-secondary py-2.5 pl-10 pr-4 text-sm font-medium text-text-primary outline-none transition-[background-color,box-shadow] focus:bg-surface-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-[180px]">
            <Select
              value={source.toString()}
              onChange={(e) => setSource(Number(e.target.value))}
              options={[
                { value: "0", label: "All Sources" },
                { value: "1", label: "Library Only" },
                { value: "2", label: "Custom Only" },
              ]}
              className="!bg-bg-secondary !border-none !font-black uppercase !text-text-secondary"
            />
          </div>

          <button
            onClick={() => setOnlyActive(!onlyActive)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase transition-colors sm:justify-start",
              onlyActive
                ? "border-success/20 bg-success/10 text-success shadow-none"
                : "bg-surface-white text-text-secondary border-border hover:text-text-secondary hover:bg-bg-secondary",
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-150 motion-reduce:transition-none",
                onlyActive
                  ? "bg-success"
                  : "bg-border",
              )}
            />
            {onlyActive ? "Active" : "All Status"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsModalOpen(true)} className="w-full justify-center gap-2 md:w-auto">
            <FiPlus size={18} />
            New Code
          </Button>
        </div>
      </div>

      {/* 📊 Table 📊 */}
      <div className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-border bg-surface-white shadow-none sm:min-h-[400px]">
        <div className="space-y-3 p-3 md:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-text-secondary">
              <LoadingSpinner size="md" />
              Loading reasons...
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <article key={item.id} className="min-w-0 rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-lg border border-primary/20 bg-bg-secondary px-2.5 py-1 text-xs font-bold text-accent">
                      {item.code}
                    </span>
                    <h3 className="mt-2 break-words text-sm font-semibold text-text-primary">{item.name}</h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
                      item.source === 0
                        ? "border-primary/20 bg-primary-light text-accent"
                        : "border-border bg-bg-secondary text-text-secondary",
                    )}
                  >
                    {item.source === 0 ? "Library" : "Custom"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>Status</span>
                    <Switch
                      checked={item.isActive}
                      onChange={() => handleToggleActive(item.id)}
                      disabled={toggleActiveMutation.isPending}
                    />
                    <span>{item.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <ActionButton
                    icon={FiTrash2}
                    label="Delete"
                    variant="destructive"
                    onClick={() => handleDeleteClick(item.id)}
                  />
                </div>
              </article>
            ))
          ) : (
            <div className="py-10 text-center">
              <FiInfo aria-hidden="true" className="mx-auto mb-3 text-text-secondary/50" size={32} />
              <h4 className="font-semibold text-text-primary">No results found</h4>
              <p className="mt-1 text-sm text-text-secondary">We couldn&apos;t find any exclusion codes matching your criteria.</p>
            </div>
          )}
        </div>

        <div className="hidden flex-1 md:block">
          <Table>
            <TableHeader className="bg-bg-secondary/50">
              <TableRow>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary w-[120px]">
                  Code
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Name
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary w-[150px]">
                  Source
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center w-[150px]">
                  Status
                </TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right w-[150px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <LoadingSpinner size="lg" />
                      <span className="text-sm font-black text-text-secondary uppercase tracking-widest">
                        Loading reasons...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group hover:bg-bg-secondary/50 transition-colors"
                  >
                    <TableCell className="px-8 py-6">
                      <span className="inline-flex px-3 py-1 bg-bg-secondary text-accent text-xs font-black rounded-xl border border-primary/20 uppercase tracking-tighter">
                        {item.code}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <div className="text-sm font-extrabold text-text-primary">
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap",
                          item.source === 0 // 0: Library
                            ? "bg-primary-light text-accent border-primary/20"
                            : "bg-bg-secondary text-text-secondary border-border",
                        )}
                      >
                        {item.source === 0 ? "Library" : "Custom"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-6 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={item.isActive}
                          onChange={() => handleToggleActive(item.id)}
                          disabled={toggleActiveMutation.isPending}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={FiTrash2}
                          label="Delete"
                          variant="destructive"
                          onClick={() => handleDeleteClick(item.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="space-y-3">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-bg-secondary text-text-secondary">
                        <FiInfo size={32} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-text-primary">
                          No results found
                        </h4>
                        <p className="text-text-secondary text-sm max-w-xs mx-auto">
                          We couldn't find any exclusion codes matching your
                          criteria.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 🔢 Pagination (UI Only) 🔢 */}
        <div className="flex flex-col gap-3 border-t border-border bg-bg-secondary/50 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="text-xs font-semibold text-text-secondary sm:font-black sm:uppercase sm:tracking-widest">
            Showing {filteredData.length} of {exclusionReasons.length} reasons
          </div>
          <Pagination
            currentPage={pageNumber}
            totalPages={1}
            onPageChange={setPageNumber}
          />
        </div>
      </div>

      <AddExclusionReasonsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={(data) => {
          console.log("Adding reasons:", data);
          setIsModalOpen(false);
        }}
      />

      {/* ⚠️ Selection Deletion Confirmation ⚠️ */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => !deleteMutation.isPending && setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Exclusion Code"
        message="Are you sure you want to delete this code? This action is permanent and cannot be undone."
        confirmText="Permanently Delete"
        cancelText="Keep Code"
        variant="danger"
      />
    </div>
  );
};

export default ProcessExclusionCodeTab;
