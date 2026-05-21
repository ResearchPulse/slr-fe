import React, { useState } from "react";
import { FiUpload, FiSearch, FiLink, FiCheckCircle, FiInfo, FiAlertCircle } from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { usePaperImport } from "../../hooks/usePaperImport";
import { useProjectMember } from "../../hooks/useProjectMember";
import type { CrossrefQueryParameters } from "../../types/paper";

interface PaperImportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  sourceOptions?: { label: string; value: string }[];
}

type ImportMode = "ris" | "bibtex" | "doi" | "crossref";

export default function PaperImportModal({
  projectId,
  isOpen,
  onClose,
  sourceOptions = [],
}: PaperImportModalProps) {
  const [mode, setMode] = useState<ImportMode>("ris");
  const { member } = useProjectMember(projectId);
  const isLeader = member?.isLeader ?? false;

  const {
    importRis,
    isImportingRis,
    importBibTex,
    isImportingBibTex,
    importByDoi,
    isImportingByDoi,
    importFromCrossref,
    isImportingFromCrossref,
  } = usePaperImport(projectId);

  // RIS State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // BibTeX State
  const [bibFile, setBibFile] = useState<File | null>(null);
  const [bibSourceId, setBibSourceId] = useState<string>("");
  const [isDraggingBib, setIsDraggingBib] = useState(false);

  // DOI State
  const [doi, setDoi] = useState("");
  const [doiSourceId, setDoiSourceId] = useState<string>("");

  // Crossref State
  const [crossrefQuery, setCrossrefQuery] = useState<CrossrefQueryParameters>({
    query: "",
    queryAuthor: "",
    queryTitle: "",
    rows: 20,
  });
  const [crossrefSourceId, setCrossrefSourceId] = useState<string>("");

  const isImporting =
    isImportingRis ||
    isImportingBibTex ||
    isImportingByDoi ||
    isImportingFromCrossref;

  const handleClose = () => {
    if (isImporting) return;
    onClose();
    // Reset state if needed or keep it
  };

  const handleRisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      await importRis({
        file: selectedFile,
        projectId,
        searchSourceId: selectedSourceId || undefined,
      });
      setSelectedFile(null);
      onClose();
    } catch (error) {
      // Error handled by hook toast
    }
  };

  const handleBibSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bibFile) return;
    try {
      await importBibTex({
        file: bibFile,
        projectId,
        searchSourceId: bibSourceId || undefined,
      });
      setBibFile(null);
      onClose();
    } catch (error) {
      // Error handled by hook toast
    }
  };

  const handleDoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doi.trim()) return;
    try {
      await importByDoi({
        doi: doi.trim(),
        projectId,
        searchSourceId: doiSourceId || undefined,
      });
      setDoi("");
      onClose();
    } catch (error) {
      // Error handled by hook toast
    }
  };

  const handleCrossrefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !crossrefQuery.query?.trim() &&
      !crossrefQuery.queryAuthor?.trim() &&
      !crossrefQuery.queryTitle?.trim()
    )
      return;
    try {
      await importFromCrossref({
        query: crossrefQuery,
        projectId,
        searchSourceId: crossrefSourceId || undefined,
      });
      setCrossrefQuery({ query: "", queryAuthor: "", queryTitle: "", rows: 20 });
      onClose();
    } catch (error) {
      // Error handled by hook toast
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Papers to Repository" size="xl">
      {!isLeader ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
            <FiAlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Permission Restricted</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">
            Only project leaders can perform bulk paper imports and manage the project repository.
          </p>
          <Button variant="secondary" onClick={onClose} className="mt-8 rounded-xl px-8">
            Close
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
        {/* Mode Selector */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          {[
            { id: "ris", label: "RIS File", icon: FiUpload },
            { id: "bibtex", label: "BibTeX", icon: FiUpload },
            { id: "doi", label: "DOI Lookup", icon: FiLink },
            { id: "crossref", label: "API Search", icon: FiSearch },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as ImportMode)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                mode === item.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* RIS Import Content */}
        {mode === "ris" && (
          <form
            onSubmit={handleRisSubmit}
            className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 font-medium leading-relaxed">
                Upload a RIS file exported from databases like Scopus, Web of Science, or PubMed.
                Max file size 10MB.
              </p>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-[2rem] p-10 transition-all text-center ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = e.dataTransfer.files;
                if (files.length > 0) setSelectedFile(files[0]);
              }}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                    <FiCheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">{selectedFile.name}</p>
                    <p className="text-sm text-slate-500 font-bold">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 text-sm font-black uppercase tracking-widest hover:underline"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50 mx-auto mb-6">
                    <FiUpload className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    Drop your RIS file
                  </h3>
                  <p className="text-slate-500 font-medium mb-6">
                    Drag and drop or{" "}
                    <label className="text-blue-600 hover:underline cursor-pointer">
                      browse your computer
                      <input
                        type="file"
                        accept=".ris"
                        onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      .RIS
                    </span>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                Associate with Search Source (Optional)
              </label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
              >
                <option value="">Unspecified source</option>
                {sourceOptions.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={handleClose}
                type="button"
                className="rounded-xl px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || isImportingRis}
                className="rounded-xl px-8"
              >
                {isImportingRis ? "Importing..." : "Import RIS File"}
              </Button>
            </div>
          </form>
        )}

        {/* BibTeX Import Content */}
        {mode === "bibtex" && (
          <form
            onSubmit={handleBibSubmit}
            className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
              <FiInfo className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                Upload a BibTeX (.bib) file. This format is widely used with LaTeX and reference
                managers like Mendeley or Zotero. Max file size 10MB.
              </p>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-[2rem] p-10 transition-all text-center ${
                isDraggingBib
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingBib(true);
              }}
              onDragLeave={() => setIsDraggingBib(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingBib(false);
                const files = e.dataTransfer.files;
                if (files.length > 0) setBibFile(files[0]);
              }}
            >
              {bibFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                    <FiCheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">{bibFile.name}</p>
                    <p className="text-sm text-slate-500 font-bold">
                      {(bibFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBibFile(null)}
                    className="text-red-500 text-sm font-black uppercase tracking-widest hover:underline"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50 mx-auto mb-6">
                    <FiUpload className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    Drop your BibTeX file
                  </h3>
                  <p className="text-slate-500 font-medium mb-6">
                    Drag and drop or{" "}
                    <label className="text-blue-600 hover:underline cursor-pointer">
                      browse your computer
                      <input
                        type="file"
                        accept=".bib"
                        onChange={(e) => e.target.files?.[0] && setBibFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      .BIB
                    </span>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                Associate with Search Source (Optional)
              </label>
              <select
                value={bibSourceId}
                onChange={(e) => setBibSourceId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
              >
                <option value="">Unspecified source</option>
                {sourceOptions.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={handleClose}
                type="button"
                className="rounded-xl px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!bibFile || isImportingBibTex}
                className="rounded-xl px-8"
              >
                {isImportingBibTex ? "Importing..." : "Import BibTeX File"}
              </Button>
            </div>
          </form>
        )}

        {/* DOI Import Content */}
        {mode === "doi" && (
          <form
            onSubmit={handleDoiSubmit}
            className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
              <FiInfo className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-700 font-medium leading-relaxed">
                Enter a Digital Object Identifier (DOI) to automatically fetch metadata from
                Crossref and import the paper.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  DOI String <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <FiLink className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="e.g. 10.1145/3313831.3376227"
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Associate with Search Source (Optional)
                </label>
                <select
                  value={doiSourceId}
                  onChange={(e) => setDoiSourceId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
                >
                  <option value="">Unspecified source</option>
                  {sourceOptions.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={handleClose}
                type="button"
                className="rounded-xl px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!doi.trim() || isImportingByDoi}
                className="rounded-xl px-8"
              >
                {isImportingByDoi ? "Importing..." : "Import by DOI"}
              </Button>
            </div>
          </form>
        )}

        {/* API Search Content */}
        {mode === "crossref" && (
          <form
            onSubmit={handleCrossrefSubmit}
            className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-3">
              <FiInfo className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-sm text-purple-700 font-medium leading-relaxed">
                Query the Crossref API directly to search for papers. All matching results (up to
                the limit) will be imported.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  General Query
                </label>
                <div className="relative group">
                  <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={crossrefQuery.query}
                    onChange={(e) => setCrossrefQuery({ ...crossrefQuery, query: e.target.value })}
                    placeholder="e.g. Systematic Review and AI"
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Author
                </label>
                <input
                  type="text"
                  value={crossrefQuery.queryAuthor}
                  onChange={(e) =>
                    setCrossrefQuery({ ...crossrefQuery, queryAuthor: e.target.value })
                  }
                  placeholder="e.g. Kitchenham"
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Title Keywords
                </label>
                <input
                  type="text"
                  value={crossrefQuery.queryTitle}
                  onChange={(e) =>
                    setCrossrefQuery({ ...crossrefQuery, queryTitle: e.target.value })
                  }
                  placeholder="e.g. Software Engineering"
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Max Results
                </label>
                <input
                  type="number"
                  value={crossrefQuery.rows}
                  onChange={(e) =>
                    setCrossrefQuery({ ...crossrefQuery, rows: parseInt(e.target.value) })
                  }
                  min="1"
                  max="1000"
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Target Search Source
                </label>
                <select
                  value={crossrefSourceId}
                  onChange={(e) => setCrossrefSourceId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 transition-all outline-none"
                >
                  <option value="">Unspecified source</option>
                  {sourceOptions.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={handleClose}
                type="button"
                className="rounded-xl px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  (!crossrefQuery.query &&
                    !crossrefQuery.queryAuthor &&
                    !crossrefQuery.queryTitle) ||
                  isImportingFromCrossref
                }
                className="rounded-xl px-8"
              >
                {isImportingFromCrossref ? "Importing..." : "Search & Import"}
              </Button>
            </div>
          </form>
        )}
      </div>
      )}
    </Modal>
  );
}
