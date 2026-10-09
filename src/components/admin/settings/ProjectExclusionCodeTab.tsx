import React, { useState } from "react";
import { FiPlus, FiSearch, FiTrash2, FiInfo, FiX } from "react-icons/fi";
import { cn } from "../../../utils/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../ui/Table";
import ActionButton from "../slr-projects/ActionButton";
import {
  useExclusionReasonLibrary,
  useExclusionReasonLibraryMutations,
} from "../../../hooks/useExclusionReasonLibrary";
import { useDebounce } from "../../../hooks/useDebounce";
import Pagination from "../../ui/Pagination";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Modal from "../../ui/Modal";
import ConfirmModal from "../../ui/ConfirmModal";
import FormField from "../../ui/FormField";
import Button from "../../ui/Button";
import Switch from "../../ui/Switch";
import {
  toastSuccess,
  toastError,
  toastLoading,
  dismissToast,
} from "../../../utils/toast";
import type { CreateExclusionReasonRequest } from "../../../types/exclusionReasonLibrary";

const ProjectExclusionCodeTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Map filter selection to API parameter - we send undefined for "all" and true for "active only"

  const { items, totalCount, totalPages, isLoading } =
    useExclusionReasonLibrary({
      search: debouncedSearch,
      onlyActive: onlyActive,
      pageNumber: pageNumber,
      pageSize: pageSize,
    });

  const {
    bulkCreate,
    isBulkCreating,
    deleteReason,
    isDeleting,
    toggleActive,
    isToggling,
  } = useExclusionReasonLibraryMutations();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPageNumber(1); // Reset to first page on search
  };

  const handleToggleOnlyActive = () => {
    setOnlyActive(!onlyActive);
    setPageNumber(1); // Reset to first page on filter change
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const loadingId = toastLoading(
      currentStatus ? "Disabling..." : "Enabling...",
    );
    try {
      await toggleActive(id);
      dismissToast(loadingId);
      toastSuccess(
        "Success",
        `Exclusion reason has been ${currentStatus ? "disabled" : "enabled"}.`,
      );
    } catch {
      dismissToast(loadingId);
      toastError("Error", "Failed to update status.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await deleteReason(deletingId);
      toastSuccess("Success", "Exclusion code has been permanently deleted.");
      setIsConfirmOpen(false);
      setDeletingId(null);
    } catch {
      toastError("Error", "Failed to delete the exclusion code.");
    }
  };

  const [newCodes, setNewCodes] = useState<{ code: string; name: string }[]>([
    { code: "", name: "" },
  ]);

  const handleAddRow = () => {
    setNewCodes([...newCodes, { code: "", name: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (newCodes.length > 1) {
      setNewCodes(newCodes.filter((_, i) => i !== index));
    }
  };

  const handleUpdateRow = (
    index: number,
    field: "code" | "name",
    value: string,
  ) => {
    const updated = [...newCodes];
    updated[index] = { ...updated[index], [field]: value };
    setNewCodes(updated);
  };

  const handleBulkCreate = async () => {
    // Validate
    const invalid = newCodes.some((c) => {
      const parsed = parseInt(c.code, 10);
      return (
        !c.name.trim() ||
        !c.code.trim() ||
        isNaN(parsed) ||
        parsed < 0 ||
        !/^\d+$/.test(c.code.trim())
      );
    });
    if (invalid) {
      toastError(
        "Validation Error",
        "Please provide a valid non-negative numeric code and name for all items.",
      );
      return;
    }

    // Convert string codes to numbers
    const payload: CreateExclusionReasonRequest[] = newCodes.map((c) => ({
      code: parseInt(c.code, 10),
      name: c.name,
    }));

    try {
      await bulkCreate(payload);
      toastSuccess(
        "Success",
        `Successfully added ${newCodes.length} exclusion codes.`,
      );
      setIsModalOpen(false);
      setNewCodes([{ code: "", name: "" }]);
    } catch {
      toastError("Error", "Failed to add exclusion codes to the library.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Project exclusion codes
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Maintain the reasons reviewers can use to exclude studies.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-white p-4 sm:p-5 rounded-xl border border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by code or name..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <button
            onClick={handleToggleOnlyActive}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors border",
              onlyActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-text-secondary border-border hover:bg-bg-primary",
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                onlyActive
                  ? "bg-emerald-500"
                  : "bg-slate-300",
              )}
            />
            {onlyActive ? "Active only" : "Show active only"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <FiPlus size={18} />
            New code
          </button>
        </div>
      </div>

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <Table className="min-w-[620px]">
            <TableHeader className="bg-bg-primary">
              <TableRow>
                <TableHead className="w-[120px] px-5 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                  Code
                </TableHead>
                <TableHead className="px-5 py-3 text-xs font-semibold normal-case tracking-normal text-text-secondary">
                  Name
                </TableHead>
                <TableHead className="w-[140px] px-5 py-3 text-center text-xs font-semibold normal-case tracking-normal text-text-secondary">
                  Status
                </TableHead>
                <TableHead className="w-[110px] px-5 py-3 text-right text-xs font-semibold normal-case tracking-normal text-text-secondary">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-text-secondary">
                      <LoadingSpinner size="lg" />
                      <span className="text-sm">
                        Loading exclusion codes...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group hover:bg-bg-primary/70 transition-colors"
                  >
                    <TableCell className="px-5 py-4">
                      <span className="inline-flex rounded-md border border-border bg-bg-primary px-2.5 py-1 font-mono text-xs text-text-secondary">
                        {item.code}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="text-sm text-text-primary">
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={item.isActive}
                          onChange={() =>
                            handleToggleActive(item.id, item.isActive)
                          }
                          disabled={isToggling}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={FiTrash2}
                          label="Delete"
                          variant="destructive"
                          onClick={() => handleDeleteClick(item.id)}
                          disabled={isDeleting && deletingId === item.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="space-y-3">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-bg-primary text-text-secondary">
                        <FiInfo size={32} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-text-primary">
                          No results found
                        </h4>
                        <p className="mx-auto max-w-xs text-sm text-text-secondary">
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

        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 bg-bg-primary border-t border-border flex items-center justify-between">
            <div className="text-xs text-text-secondary">
              Showing {items.length} of {totalCount} reasons
            </div>
            <Pagination
              currentPage={pageNumber}
              totalPages={totalPages}
              onPageChange={setPageNumber}
            />
          </div>
        )}
      </div>

      {/* 💡 Modal 💡 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Exclusion Codes"
        description="Populate the system library with standard exclusion reasons."
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            {newCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-end gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 animate-in slide-in-from-top-2 duration-200"
              >
                <div className="w-24 shrink-0">
                  <FormField
                    id={`code-${index}`}
                    label="Code"
                    type="number"
                    min={0}
                    value={code.code}
                    onChange={(e) =>
                      handleUpdateRow(index, "code", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1">
                  <FormField
                    id={`name-${index}`}
                    label="Name"
                    placeholder="e.g. Not a relevant population"
                    value={code.name}
                    onChange={(e) =>
                      handleUpdateRow(index, "name", e.target.value)
                    }
                  />
                </div>
                {newCodes.length > 1 && (
                  <button
                    onClick={() => handleRemoveRow(index)}
                    className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 text-accent text-sm font-black hover:bg-bg-secondary px-4 py-2 rounded-xl transition-all"
            >
              <FiPlus size={18} />
              Add Another Row
            </button>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={isBulkCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkCreate}
                isLoading={isBulkCreating}
                className="px-8"
              >
                Save to Library
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ⚠️ Selection Deletion Confirmation ⚠️ */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Exclusion Code"
        message="Are you sure you want to delete this code? This action is permanent and cannot be undone."
        confirmText="Permanently Delete"
        cancelText="Keep Code"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default ProjectExclusionCodeTab;
