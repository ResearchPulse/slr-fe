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
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import type { SearchSourceDto } from "../../types/searchSource";
import SearchStrategyForm from "./SearchStrategyForm";
import type { SearchStrategyDto } from "./types/search-strategy";
import CrossrefWorksExplorer from "./CrossrefWorksExplorer";

interface SearchSourcePageProps {
  projectId: string;
  hideHeader?: boolean;
}

export default function SearchSourcePage({ projectId, hideHeader = false }: SearchSourcePageProps) {
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
  const isLeader = member?.isLeader ?? false;

  const [sources, setSources] = useState<SearchSourceDto[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string>("");
  const [configuringSourceIndex, setConfiguringSourceIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialSources) {
      setSources(initialSources);
    }
  }, [initialSources]);

  const handleAddSource = async () => {
    if (!selectedMasterId) {
      toast.error("Please select a master source to add");
      return;
    }

    const master = availableMasterSources.find((m) => m.id === selectedMasterId);
    if (!master) return;

    // Check if already added
    if (sources.some((s) => s.masterSourceId === selectedMasterId)) {
      toast.error(`${master.name} is already added to this project`);
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
        toast.success(`${master.name} added to project`);
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
      toast.error("Source ID missing. Please refresh the page.");
      return;
    }

    try {
      const response = await updateStrategies({
        sourceId: source.sourceId,
        strategies: [strategy], // Backend synchronizes this list
      });

      if (response.isSuccess) {
        setConfiguringSourceIndex(null);
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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading search sources...</p>
      </div>
    );
  }

  return (
    <div className={`px-4 ${hideHeader ? "" : "pb-20"}`}>
      {!hideHeader && (
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Search Sources</h1>
          <p className="text-gray-500">
            Define the academic databases and repositories you used for your search.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Add Source Section */}
        {isLeader && (
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiPlus className="text-blue-600" />
                Add Source
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Choose a source from the available master list to add to your project.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">
                    Select Master Source
                  </label>
                  <select
                    value={selectedMasterId}
                    onChange={(e) => setSelectedMasterId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  >
                    <option value="">Select a source...</option>
                    {availableMasterSources.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddSource}
                  disabled={!selectedMasterId}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <FiPlus />
                  Add to Project
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex gap-3">
                  <FiInfo className="text-blue-600 shrink-0 mt-1" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Adding a source here allows you to associate imported papers with their original
                    database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Section */}
        <div className={isLeader ? "md:col-span-2 space-y-4" : "md:col-span-3 space-y-4"}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiSearch className="text-blue-600" />
              Search Strategies
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {sources.length}
              </span>
            </h3>

            {hasChanges && isLeader && (
              <button
                onClick={handleSave}
                disabled={isUpserting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-green-500/20"
              >
                {isUpserting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSave />
                )}
                Save Changes
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {sources.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">No sources added yet</h4>
                <p className="text-gray-500 max-w-xs mx-auto">
                  Add search sources to keep track of where your papers came from.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {sources.map((source, index) => {
                  const hasStrategy = source.strategies && source.strategies.length > 0;
                  const querySnippet = hasStrategy ? source.strategies![0].query : null;

                  return (
                    <motion.div
                      key={source.masterSourceId || source.sourceId || index}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                          {source.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-gray-900 truncate">{source.name}</h4>
                            {hasStrategy && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                <FiCheckCircle className="w-3 h-3" />
                                Configured
                              </div>
                            )}
                          </div>
                          {querySnippet ? (
                            <p className="text-xs text-gray-400 truncate max-w-md italic">
                              "{querySnippet}"
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">
                              {source.sourceId
                                ? `ID: ${source.sourceId.substring(0, 8)}...`
                                : "New Source"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfiguringSourceIndex(index)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                            hasStrategy
                              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          <FiSettings className={hasStrategy ? "animate-spin-slow" : ""} />
                          {hasStrategy ? (isLeader ? "Configure" : "View Strategy") : (isLeader ? "Setup Strategy" : "No Strategy")}
                        </button>
                        {isLeader && (
                          <button
                            onClick={() => handleRemoveSource(index)}
                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove source"
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

      <AnimatePresence>
        {configuringSourceIndex !== null && (
          <SearchStrategyForm
            projectId={projectId}
            source={sources[configuringSourceIndex]}
            onSave={handleSaveStrategy}
            onClose={() => setConfiguringSourceIndex(null)}
            isLeader={isLeader}
          />
        )}
      </AnimatePresence>

      {/* Crossref Works Explorer Section */}
      <CrossrefWorksExplorer
        projectId={projectId}
        availableSources={sources
          .map((s) => ({
            label: s.name,
            value: s.sourceId || "",
          }))
          .filter((s) => !!s.value)}
        isLeader={isLeader}
      />
    </div>
  );
}
