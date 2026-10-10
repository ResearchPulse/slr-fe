import React, { useState, useMemo } from "react";
import {
  FiPlus,
  FiSearch,
  FiDatabase,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiExternalLink,
  FiFilter,
  FiAlertCircle,
} from "react-icons/fi";
import {
  useMasterSources,
  useMasterSourceActions,
} from "../../hooks/useMasterSources";
import Modal from "../../components/ui/Modal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useForm } from "react-hook-form";
import type {
  CreateMasterSearchSourceRequest,
  MasterSearchSource,
} from "../../types/masterSource";
import FormField from "../../components/ui/FormField";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Select from "../../components/ui/Select";
import { motion, AnimatePresence } from "framer-motion";

const MasterSourcePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<MasterSearchSource | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: sources,
    isLoading,
    isError: hasSourceLoadError,
    error: sourceLoadError,
    refetch: refetchSources,
  } = useMasterSources({
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const {
    createSource,
    updateSource,
    toggleStatus,
    deleteSource,
    isCreating,
    isUpdating,
    isDeleting,
  } = useMasterSourceActions();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateMasterSearchSourceRequest>();

  const handleOpenModal = (source?: MasterSearchSource) => {
    if (source) {
      setEditingSource(source);
      setValue("sourceName", source.sourceName);
      setValue("baseUrl", source.baseUrl);
      setValue("isActive", source.isActive);
      setValue("logoUrl", source.logoUrl || "");
    } else {
      setEditingSource(null);
      reset({
        sourceName: "",
        baseUrl: "",
        isActive: true,
        logoUrl: "",
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CreateMasterSearchSourceRequest) => {
    try {
      if (editingSource) {
        await updateSource({ id: editingSource.id, data });
      } else {
        await createSource(data);
      }
      setIsModalOpen(false);
    } catch {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSource(deleteId);
      setDeleteId(null);
    }
  };

  const filteredSources = useMemo(() => {
    if (!sources) return [];
    return sources.filter((s) => {
      const matchesSearch =
        s.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.baseUrl.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.isActive) ||
        (statusFilter === "inactive" && !s.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [sources, searchQuery, statusFilter]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-2">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">System configuration</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-text-primary sm:text-[32px]">
            Search Sources
          </h1>
          <p className="mt-1.5 text-[14px] leading-6 text-text-secondary">
            Manage global bibliographic databases for SLR projects.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-11 gap-2">
          <FiPlus className="h-4 w-4" />
          <span>Create source</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3.5 sm:flex-row sm:items-center">
        <div className="group relative min-w-0 flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-bg-primary py-2.5 pl-10 pr-4 text-[13px] text-text-secondary outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/[0.08]"
          />
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <FiFilter className="ml-1 h-4 w-4 shrink-0 text-text-muted" />
          <Select
            aria-label="Filter by source status"
            className="w-full sm:w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active only" },
              { value: "inactive", label: "Inactive only" },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(23,50,71,0.025)]">
        {isLoading ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 text-text-secondary">
            <LoadingSpinner size="lg" />
            <p className="text-[13px] font-medium">Loading sources...</p>
          </div>
        ) : hasSourceLoadError && !sources ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-5 py-12 text-center text-text-secondary">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <FiAlertCircle className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-text-secondary">Could not load search sources</p>
            <p className="mt-1 max-w-lg text-[12px] leading-5">
              {sourceLoadError instanceof Error
                ? sourceLoadError.message
                : "The server could not return the source list."}
            </p>
            <Button
              size="sm"
              onClick={() => void refetchSources()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-5 py-12 text-center text-text-muted">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-accent">
              <FiDatabase className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-text-secondary">No sources found</p>
            <p className="mt-1 text-[12px]">
              Try adjusting your filters or create a new one.
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 h-9 rounded-xl border border-border bg-white px-3.5 text-[11px] font-semibold text-text-secondary transition hover:bg-bg-primary"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[760px] table-fixed text-left">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[39%]" />
                <col className="w-[14%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-bg-primary">
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    Source Name
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    Base URL
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    Status
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    Usage
                  </th>
                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {filteredSources.map((source) => (
                    <motion.tr
                      key={source.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="transition-colors hover:bg-bg-primary"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-[13px] font-semibold text-accent">
                            {source.sourceName.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate text-[13px] font-semibold text-text-secondary">
                            {source.sourceName}
                          </span>
                        </div>
                      </td>
                      <td className="min-w-0 px-5 py-4">
                        <a
                          href={source.baseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex min-w-0 items-center gap-1.5 text-[12px] text-text-secondary transition-colors hover:text-accent"
                        >
                          <span className="truncate underline decoration-border underline-offset-4">
                            {source.baseUrl}
                          </span>
                          <FiExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                              source.isActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-50 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {source.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                          <span className="text-[13px] font-semibold leading-none text-text-secondary">
                            {source.usageCount || 0}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Projects
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStatus(source.id)}
                            title={source.isActive ? "Deactivate" : "Activate"}
                            aria-label={source.isActive ? "Deactivate source" : "Activate source"}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                              source.isActive
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-text-muted hover:bg-bg-primary"
                            }`}
                          >
                            {source.isActive ? (
                              <FiToggleRight className="h-5 w-5" />
                            ) : (
                              <FiToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(source)}
                            aria-label={`Edit ${source.sourceName}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-accent transition-colors hover:bg-primary-light"
                            title="Edit"
                          >
                            <FiEdit2 className="h-[17px] w-[17px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(source.id)}
                            aria-label={`Delete ${source.sourceName}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-50"
                            title="Delete"
                          >
                            <FiTrash2 className="h-[17px] w-[17px]" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingSource ? "Edit Search Source" : "Create New Search Source"
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="flex gap-3 rounded-xl border border-border bg-primary-light p-4">
            <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-[12px] leading-5 text-text-secondary">
              These sources will be available globally for all users to select
              during the search identification phase.
            </p>
          </div>

          <FormField
            id="sourceName"
            label="Source Name"
            errorMessage={errors.sourceName?.message}
            {...register("sourceName", { required: "Source name is required" })}
            placeholder="e.g., Scopus, Web of Science"
            className="rounded-lg"
          />

          <FormField
            id="baseUrl"
            label="Base URL"
            errorMessage={errors.baseUrl?.message}
            {...register("baseUrl", {
              required: "Base URL is required",
              pattern: {
                value:
                  /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                message: "Enter a valid URL",
              },
            })}
            placeholder="e.g., https://www.scopus.com"
            className="rounded-lg"
          />

          <FormField
            id="logoUrl"
            label="Logo URL (Optional)"
            errorMessage={errors.logoUrl?.message}
            {...register("logoUrl")}
            placeholder="e.g., https://example.com/logo.png"
            className="rounded-lg"
          />

          <div className="flex items-center justify-between rounded-xl border border-border bg-bg-primary p-4">
            <div>
              <p className="text-[13px] font-semibold text-text-secondary">Initial status</p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                Enable this source immediately
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("isActive")}
                className="sr-only peer"
              />
              <div className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/10"></div>
            </label>
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating || isUpdating}
              className="flex-1"
            >
              {editingSource ? "Save Changes" : "Create Source"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Search Source"
        message="Are you sure you want to delete this search source? This action cannot be undone and may affect active projects."
        confirmText="Delete Source"
      />
    </div>
  );
};

export default MasterSourcePage;
