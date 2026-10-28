import Button from "../ui/Button";
import Select from "../ui/Select";
import { useState, useEffect } from "react";
import { useSearchSources } from "../../hooks/useSearchSources";
import { useProjectMember } from "../../hooks/useProjectMember";

import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiAlertCircle,
  FiSearch,
  FiInfo,
  FiSettings,
  FiCheckCircle,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toastSuccess, toastError } from "../../utils/toast";
import type { SearchSourceDto } from "../../types/searchSource";
import SearchStrategyForm from "./SearchStrategyForm";
import type { SearchStrategyDto } from "./types/search-strategy";
import CrossrefWorksExplorer from "./CrossrefWorksExplorer";

interface SearchSourcePageProps {
  projectId: string;
  hideHeader?: boolean;
}

export default function SearchSourcePage({
  projectId,
  hideHeader = false,
}: SearchSourcePageProps) {
  const {
    searchSources: initialSources,
    availableMasterSources,
    isLoading,
    bulkUpsert,
    isUpserting,
    upsertSource,
    updateStrategies,
  } = useSearchSources(projectId);
  const { member } = useProjectMember(projectId);
  const canEditSources = member?.isLeader === true;
  const prefersReducedMotion = useReducedMotion();

  const [sources, setSources] = useState<SearchSourceDto[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string>("");
  const [configuringSourceIndex, setConfiguringSourceIndex] = useState<
    number | null
  >(null);
  const [isStrategyDrawerOpen, setIsStrategyDrawerOpen] = useState(false);

  useEffect(() => {
    if (initialSources) {
      setSources(initialSources);
    }
  }, [initialSources]);

  const handleAddSource = async () => {
    if (!selectedMasterId) {
      toastError("Please select a master source to add");
      return;
    }

    const master = availableMasterSources.find(
      (m) => m.id === selectedMasterId,
    );
    if (!master) return;

    // Check if already added
    if (sources.some((s) => s.masterSourceId === selectedMasterId)) {
      toastError(`${master.name} is already added to this project`);
      return;
    }

    const newSource: SearchSourceDto = {
      projectId,
      masterSourceId: master.id,
      name: master.name,
      strategies: [],
      url: master.baseUrl,
    };

    try {
      const response = await upsertSource(newSource);
      if (response.isSuccess) {
        toastSuccess(`${master.name} added to project`);
        setSelectedMasterId("");
      }
    } catch (error) {
      console.error("Error adding source:", error);
    }
  };

  const handleRemoveSource = (index: number) => {
    const newSources = [...sources];
    newSources.splice(index, 1);
    setSources(newSources);
    // Ideally we'd call a delete API here too, but the task focused on add/update
  };

  const handleSaveStrategy = async (strategy: SearchStrategyDto) => {
    if (configuringSourceIndex === null) return;
    const source = sources[configuringSourceIndex];

    if (!source.sourceId) {
      toastError("Source ID missing. Please refresh the page.");
      return;
    }

    try {
      const response = await updateStrategies({
        sourceId: source.sourceId,
        strategies: [strategy], // Backend synchronizes this list
      });

      if (response.isSuccess) {
        setIsStrategyDrawerOpen(false);
      }
    } catch (error) {
      console.error("Error saving strategies:", error);
    }
  };

  const handleSave = async () => {
    try {
      await bulkUpsert(sources);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const hasChanges = JSON.stringify(sources) !== JSON.stringify(initialSources);

  if (isLoading && sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div aria-hidden="true" className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full motion-safe:animate-spin motion-reduce:animate-none" />
        <p className="text-text-secondary font-medium">
          Loading search sources...
        </p>
      </div>
    );
  }

  return (
    <div className={hideHeader ? "" : "px-4 pb-20"}>
      {!hideHeader && (
        <div className="mb-8">
          <h1 className="text-3xl font-black text-text-primary mb-2">
            Search Sources
          </h1>
          <p className="text-text-secondary">
            Define the academic databases and repositories you used for your
            search.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
        {/* Add Source Section */}
        {canEditSources && (
          <div className="md:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-surface-white p-4 shadow-none">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
                <FiPlus className="h-4 w-4 text-accent" aria-hidden="true" />
                Add Source
              </h3>
              <p className="mb-4 text-[13px] leading-5 text-text-secondary">
                Choose a source from the available master list to add to your
                project.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Select Master Source
                  </label>
                  <Select
                    aria-label="Select master source"
                    value={selectedMasterId}
                    onChange={(e) => setSelectedMasterId(e.target.value)}
                    placeholder="Select a source..."
                    options={availableMasterSources.map((source) => ({
                      value: source.id,
                      label: source.name,
                    }))}
                    containerClassName="w-full"
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleAddSource}
                  disabled={!selectedMasterId}
                  className="w-full gap-2"
                >
                  <FiPlus />
                  Add to Project
                </Button>
              </div>

              <div className="mt-5 rounded-lg border border-primary/15 bg-primary-light p-3">
                <div className="flex items-start gap-2.5">
                  <FiInfo className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <p className="text-xs leading-5 text-text-secondary">
                    Adding a source here allows you to associate imported papers
                    with their original database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Section */}
        <div
          className={
            canEditSources ? "md:col-span-2 space-y-3" : "md:col-span-3 space-y-3"
          }
        >
          <div className="mb-0 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold text-text-primary">
              <FiSearch className="h-4 w-4 text-accent" aria-hidden="true" />
              Search Strategies
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {sources.length}
              </span>
            </h3>

            {hasChanges && canEditSources && (
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={isUpserting}
                aria-busy={isUpserting}
                className="min-h-9 rounded-lg px-4 text-[13px]"
              >
                {isUpserting ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin motion-reduce:animate-none" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave aria-hidden="true" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {sources.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-dashed border-border bg-surface-white p-7 text-center sm:p-8"
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-bg-primary">
                  <FiAlertCircle className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                </div>
                <h4 className="mb-1 text-sm font-semibold text-text-primary">
                  No sources added yet
                </h4>
                <p className="mx-auto max-w-xs text-[13px] leading-5 text-text-secondary">
                  Add search sources to keep track of where your papers came
                  from.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {sources.map((source, index) => {
                  const hasStrategy =
                    source.strategies && source.strategies.length > 0;
                  const querySnippet = hasStrategy
                    ? source.strategies![0].query
                    : null;

                  return (
                    <motion.div
                      key={source.masterSourceId || source.sourceId || index}
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      layout={!prefersReducedMotion}
                      className="group flex items-center justify-between rounded-xl border border-border bg-surface-white p-3 transition-colors hover:border-primary/30"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light font-semibold text-accent transition-colors group-hover:bg-primary group-hover:text-white motion-reduce:transition-none">
                          {source.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-text-primary truncate">
                              {source.name}
                            </h4>
                            {hasStrategy && (
                              <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-success">
                                <FiCheckCircle className="w-3 h-3" />
                                Configured
                              </div>
                            )}
                          </div>
                          {querySnippet ? (
                            <p className="text-xs text-text-secondary truncate max-w-md italic">
                              "{querySnippet}"
                            </p>
                          ) : (
                            <p className="text-xs text-text-secondary">
                              {source.sourceId
                                ? `ID: ${source.sourceId.substring(0, 8)}...`
                                : "New Source"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setConfiguringSourceIndex(index);
                            setIsStrategyDrawerOpen(true);
                          }}
                          className={`flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none ${
                            hasStrategy
                              ? "bg-primary-light text-accent hover:bg-accent/10"
                              : "bg-bg-primary text-text-secondary hover:bg-bg-secondary"
                          }`}
                        >
                          <FiSettings />
                          {hasStrategy
                            ? canEditSources
                              ? "Configure"
                              : "View Strategy"
                            : canEditSources
                              ? "Setup Strategy"
                              : "No Strategy"}
                        </button>
                        {canEditSources && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSource(index)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
                            title="Remove source"
                            aria-label="Remove source"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {configuringSourceIndex !== null && sources[configuringSourceIndex] && (
        <SearchStrategyForm
          key={configuringSourceIndex}
          projectId={projectId}
          source={sources[configuringSourceIndex]}
          isOpen={isStrategyDrawerOpen}
          onExited={() => setConfiguringSourceIndex(null)}
          onSave={handleSaveStrategy}
          onClose={() => setIsStrategyDrawerOpen(false)}
          isLeader={canEditSources}
        />
      )}

      {/* Crossref Works Explorer Section */}
      <CrossrefWorksExplorer
        projectId={projectId}
        availableSources={sources
          .map((s) => ({
            label: s.name,
            value: s.sourceId || "",
          }))
          .filter((s) => !!s.value)}
        isLeader={canEditSources}
      />
    </div>
  );
}
