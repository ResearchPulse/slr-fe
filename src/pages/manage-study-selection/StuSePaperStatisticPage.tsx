import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  BarChart3,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  X,
  Search,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReChartsTooltip,
} from "recharts";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import Tooltip from "../../components/ui/Tooltip";
import { cn } from "../../utils/cn";
import {
  useFinalResolutionProgress,
  useStudySelectionExclusionReasons,
} from "../../hooks/useStudySelection";
import { Dropdown } from "../../components/ui/Dropdown";
import { ChevronDown, Filter, RotateCcw, ChevronUp } from "lucide-react";
import { usePaperDetails } from "../../hooks/usePaperDetails";
import PaperDetailsView from "../../components/papers/PaperDetailsView";
import type {
  PaperResolutionProgressItem,
  StudySelectionExclusionReason,
} from "../../types/studySelection";
import type { PaperResponse } from "../../types/paper";
import YearRangeSlider from "./components/YearRangeSlider";

// --- Types ---
type StatusFilter = "all" | "included" | "excluded" | "pending";

const FILTER_MAP: Record<StatusFilter, number> = {
  all: 0,
  included: 1,
  excluded: 2,
  pending: 3,
};

// --- Sub-components ---

const StatusIndicator = ({
  status,
  label,
}: {
  status: string;
  label: string;
}) => {
  const s = status.toLowerCase();
  const configs: Record<string, any> = {
    included: {
      icon: CheckCircle2,
      bg: "bg-emerald-100",
      text: "text-emerald-600",
      border: "border-emerald-200",
      opacity: "",
    },
    excluded: {
      icon: XCircle,
      bg: "bg-rose-100",
      text: "text-rose-600",
      border: "border-rose-200",
      opacity: "",
    },
    pending: {
      icon: Clock,
      bg: "bg-bg-secondary",
      text: "text-text-secondary",
      border: "border-border",
      opacity: "",
    },
    conflicted: {
      icon: AlertCircle,
      bg: "bg-amber-100",
      text: "text-amber-600",
      border: "border-amber-200",
      opacity: "",
    },
    not_reached: {
      icon: Clock,
      bg: "bg-bg-secondary",
      text: "text-slate-300",
      border: "border-border",
      opacity: "opacity-40",
    },
  };

  const config = configs[s] || configs.pending;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[10px] font-bold uppercase tracking-tight transition-all",
        config.bg,
        config.text,
        config.border,
        config.opacity,
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>
        {label}: {status.replace("_", " ")}
      </span>
    </div>
  );
};

const ScreeningFlow = ({ paper }: { paper: PaperResolutionProgressItem }) => {
  return (
    <div className="flex items-center gap-3">
      <StatusIndicator status={paper.titleAbstractStatus.status} label="TA" />
      <div
        className={cn(
          "w-8 h-px bg-slate-200 relative",
          paper.titleAbstractStatus.status === "EXCLUDED" && "opacity-40",
        )}
      >
        <ArrowRight className="w-3 h-3 text-slate-300 absolute -right-1 -top-[5.5px]" />
      </div>
      <StatusIndicator status={paper.fullTextStatus.status} label="FT" />
    </div>
  );
};

const DecisionBadge = ({ status }: { status: string }) => {
  const s = status.toLowerCase();
  const configs: Record<string, any> = {
    included: { bg: "bg-emerald-500", text: "text-white", label: "Included" },
    excluded: { bg: "bg-rose-500", text: "text-white", label: "Excluded" },
    pending: { bg: "bg-slate-400", text: "text-white", label: "Pending" },
    not_reached: {
      bg: "bg-slate-200",
      text: "text-text-secondary",
      label: "N/A",
    },
  };

  const config = configs[s] || configs.pending;

  return (
    <div
      className={cn(
        "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-none",
        config.bg,
        config.text,
      )}
    >
      {config.label}
    </div>
  );
};

// --- Main Page ---

const StuSePaperStatisticPage: React.FC = () => {
  const { projectId, processId, screeningProcessId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [exclusionReasonCode, setExclusionReasonCode] = useState<
    number | undefined
  >(undefined);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const currentYear = new Date().getFullYear();
  const [search, setSearch] = useState("");
  const [fromYear, setFromYear] = useState<number>(2000);
  const [toYear, setToYear] = useState<number>(currentYear);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageNumber(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Pending Filter States
  const [pendingFilter, setPendingFilter] = useState<StatusFilter>(filter);
  const [pendingExclusionReasonCode, setPendingExclusionReasonCode] = useState<
    number | undefined
  >(exclusionReasonCode);
  const [pendingFromYear, setPendingFromYear] = useState<number>(fromYear);
  const [pendingToYear, setPendingToYear] = useState<number>(toYear);

  useEffect(() => {
    if (isFilterPanelOpen) {
      setPendingFilter(filter);
      setPendingExclusionReasonCode(exclusionReasonCode);
      setPendingFromYear(fromYear);
      setPendingToYear(toYear);
    }
  }, [isFilterPanelOpen]);

  const handleApplyFilters = () => {
    setFilter(pendingFilter);
    setExclusionReasonCode(pendingExclusionReasonCode);
    setFromYear(pendingFromYear);
    setToYear(pendingToYear);
    setPageNumber(1);
    setIsFilterPanelOpen(false);
  };

  const handleClearAllFilters = () => {
    const defaultFrom = 2000;
    const defaultTo = currentYear;
    const defaultFilter = "all";

    // Update pending states
    setPendingFilter(defaultFilter);
    setPendingExclusionReasonCode(undefined);
    setPendingFromYear(defaultFrom);
    setPendingToYear(defaultTo);

    // Immediately apply and trigger API
    setFilter(defaultFilter);
    setExclusionReasonCode(undefined);
    setFromYear(defaultFrom);
    setToYear(defaultTo);
    setPageNumber(1);
    setIsFilterPanelOpen(false);
  };

  const activeFilterCount = [
    filter !== "all",
    exclusionReasonCode !== undefined,
    fromYear !== 2000 || toYear !== currentYear,
  ].filter(Boolean).length;

  // Use Centralized Hooks
  const {
    data: response,
    isLoading,
    isError,
  } = useFinalResolutionProgress(screeningProcessId, {
    status: FILTER_MAP[filter],
    exclusionReasonCode,
    search: debouncedSearch || undefined,
    fromYear,
    toYear,
    pageNumber,
    pageSize,
  });

  // Manual Pagination for Exclusion Reasons
  const [reasonPage, setReasonPage] = useState(1);
  const [accumulatedReasons, setAccumulatedReasons] = useState<
    StudySelectionExclusionReason[]
  >([]);
  const [hasMoreReasons, setHasMoreReasons] = useState(true);
  const REASON_PAGE_SIZE = 20;

  const { data: currentReasons, isFetching: isFetchingReasons } =
    useStudySelectionExclusionReasons(screeningProcessId, {
      onlyActive: true,
      pageNumber: reasonPage,
      pageSize: REASON_PAGE_SIZE,
    });

  useEffect(() => {
    if (currentReasons) {
      if (currentReasons.length === 0) {
        setHasMoreReasons(false);
      } else {
        setAccumulatedReasons((prev) => {
          const newItems = currentReasons.filter(
            (nr) => !prev.some((pr) => pr.id === nr.id),
          );
          return [...prev, ...newItems];
        });
        if (currentReasons.length < REASON_PAGE_SIZE) {
          setHasMoreReasons(false);
        }
      }
    }
  }, [currentReasons]);

  const exclusionReasons = accumulatedReasons;

  const stats = response;
  const papers = response?.papers || [];
  const totalPages = response?.totalPages || 1;

  // Use Centralized Hook for Details
  const { data: paperDetails, isLoading: isLoadingDetails } = usePaperDetails(
    isDrawerOpen ? selectedPaperId! : undefined,
  );

  const handlePaperClick = (paperId: string) => {
    setSelectedPaperId(paperId);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-secondary/50">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <p className="text-text-secondary font-medium">Loading statistics...</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-secondary/50">
        <XCircle className="w-10 h-10 text-rose-500 mb-4" />
        <p className="text-text-secondary font-medium">
          Failed to load statistics.
        </p>
      </div>
    );
  }

  const chartData = [
    { name: "Included", value: stats.includedCount, color: "#10b981" },
    { name: "Excluded", value: stats.excludedCount, color: "#f43f5e" },
    { name: "Pending", value: stats.pendingCount, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-bg-secondary/50 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-surface-white/90 backdrop-blur-md border-b border-border px-6 py-3 shadow-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() =>
                navigate(
                  `/projects/${projectId}/processes/${processId}/screening/${screeningProcessId}/dashboard`,
                )
              }
              className="group flex items-center gap-2.5 px-4 py-2 bg-surface-white border border-border rounded-[4px] text-text-secondary transition-all hover:border-indigo-200 hover:text-accent hover:shadow-none active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Back
              </span>
            </button>

            <div className="h-10 w-px bg-slate-200" />

            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Decision Matrix
              </h1>
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tight">
                Screening journey & final decisions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Visual Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Card */}
          <div className="lg:col-span-2 bg-surface-white rounded-[4px] border border-border p-8 shadow-none flex items-center gap-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-bg-secondary/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

            <div className="relative w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1200}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReChartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = (
                          (data.value / stats.totalPapers) *
                          100
                        ).toFixed(1);
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-[4px] text-[11px] font-bold shadow-none border border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="uppercase tracking-wider">
                                {data.name}
                              </span>
                            </div>
                            <div className="text-lg font-black">
                              {data.value}{" "}
                              <span className="text-text-secondary font-medium text-xs">
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {stats.totalPapers}
                </span>
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  Total Papers
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">
                  Screening Distribution
                </h3>
                <p className="text-sm text-text-secondary font-medium">
                  Real-time breakdown of your paper selection progress.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {chartData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col p-3 rounded-[4px] bg-bg-secondary border border-border transition-colors hover:bg-surface-white hover:border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xl font-black text-slate-800">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Info Card */}
          <div className="bg-slate-900 rounded-[4px] p-8 shadow-none relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-surface-white/5 rounded-bl-full -mr-24 -mt-24 pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[4px] bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Key Insights
                  </h3>
                  <p className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">
                    Exclusion Patterns
                  </p>
                </div>
              </div>

              {stats.topExclusionReason ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-[4px] bg-surface-white/5 border border-white/10">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 block">
                      Top Reason for Rejection
                    </span>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {stats.topExclusionReason.name}
                    </h4>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-md bg-amber-500 text-text-primary text-[10px] font-black uppercase">
                        CODE: {stats.topExclusionReason.code}
                      </div>
                      <span className="text-xs text-text-secondary font-medium">
                        {stats.topExclusionReason.count} papers affected
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium leading-relaxed italic">
                    <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>
                      Focusing on this pattern can help refine your search
                      strings or inclusion criteria.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Clock className="w-8 h-8 text-text-secondary mb-3" />
                  <p className="text-sm text-text-secondary">
                    Not enough data to generate insights yet.
                  </p>
                </div>
              )}
            </div>

            <div className="relative z-10 mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-secondary uppercase">
                  Yield Rate
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {stats.totalPapers > 0
                    ? ((stats.includedCount / stats.totalPapers) * 100).toFixed(
                        1,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-12 h-1 bg-surface-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(stats.includedCount / (stats.totalPapers || 1)) * 100}%`,
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header & Filters */}
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-4xl">
              {/* Modern Search Bar */}
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-text-secondary group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, authors, DOI..."
                  className="block w-full pl-10 pr-4 py-2.5 bg-surface-white border border-border rounded-[4px] text-[13px] font-medium text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-secondary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-[4px] border transition-all relative overflow-hidden group shadow-none",
                  activeFilterCount > 0 || isFilterPanelOpen
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-surface-white border-border text-text-secondary hover:border-indigo-200 hover:bg-bg-secondary",
                )}
              >
                <Filter
                  className={cn(
                    "w-4 h-4",
                    activeFilterCount > 0 || isFilterPanelOpen
                      ? "text-white"
                      : "text-text-secondary group-hover:text-accent",
                  )}
                />
                <span className="text-[13px] font-black uppercase tracking-widest">
                  Filters
                </span>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-black rounded-full ml-1">
                    {activeFilterCount}
                  </span>
                )}
                {isFilterPanelOpen ? (
                  <ChevronUp className="w-4 h-4 ml-1 opacity-50" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                )}
              </button>
            </div>

            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-bg-secondary px-3 py-1.5 rounded-[4px] border border-border">
              Showing {papers.length} of {stats.totalPapers} Papers
            </div>
          </div>

          {/* Inline Expandable Filter Panel */}
          <motion.div
            initial={false}
            animate={{
              height: isFilterPanelOpen ? "auto" : 0,
              opacity: isFilterPanelOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-surface-white border border-border rounded-[4px] p-8 shadow-none shadow-slate-100/50 space-y-8 relative">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Status Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      Screening Status
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["all", "included", "excluded", "pending"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setPendingFilter(f);
                            if (f === "included" || f === "pending") {
                              setPendingExclusionReasonCode(undefined);
                            }
                          }}
                          className={cn(
                            "flex items-center justify-center px-4 py-3 rounded-[4px] border transition-all text-[11px] font-bold uppercase tracking-wider",
                            pendingFilter === f
                              ? "bg-slate-900 border-slate-900 text-white shadow-none"
                              : "bg-bg-secondary border-border text-text-secondary hover:bg-surface-white hover:border-border",
                          )}
                        >
                          {f}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Exclusion Reason Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      Exclusion Pattern
                    </span>
                  </div>
                  <div className="space-y-3">
                    <Dropdown
                      trigger={
                        <div className="flex items-center justify-between w-full h-11 px-4 bg-bg-secondary border border-border rounded-[4px] text-[12px] font-bold text-text-primary hover:bg-surface-white hover:border-border transition-all cursor-pointer">
                          <span className="truncate">
                            {pendingExclusionReasonCode !== undefined
                              ? exclusionReasons.find(
                                  (r) => r.code === pendingExclusionReasonCode,
                                )?.name || `Code: ${pendingExclusionReasonCode}`
                              : "No Grouping"}
                          </span>
                          <ChevronDown className="w-4 h-4 text-text-secondary" />
                        </div>
                      }
                      contentClassName="w-[340px] max-h-60 overflow-hidden flex flex-col bg-surface-white border border-border rounded-[4px] shadow-2xl z-[110]"
                    >
                      <div
                        className="overflow-y-auto custom-scrollbar p-1 max-h-60"
                        onScroll={(e) => {
                          const { scrollTop, scrollHeight, clientHeight } =
                            e.currentTarget;
                          if (scrollHeight - scrollTop <= clientHeight + 20) {
                            if (hasMoreReasons && !isFetchingReasons) {
                              setReasonPage((prev) => prev + 1);
                            }
                          }
                        }}
                      >
                        <button
                          onClick={() =>
                            setPendingExclusionReasonCode(undefined)
                          }
                          className={cn(
                            "w-full flex items-center px-4 py-2.5 text-xs font-bold transition-all rounded-[4px] mb-1",
                            pendingExclusionReasonCode === undefined
                              ? "bg-bg-secondary text-text-primary"
                              : "text-text-secondary hover:bg-bg-secondary",
                          )}
                        >
                          No Grouping
                        </button>
                        <div className="h-px bg-bg-secondary my-1 mx-2" />
                        {exclusionReasons.map((reason) => (
                          <button
                            key={reason.id}
                            onClick={() => {
                              setPendingExclusionReasonCode(reason.code);
                              setPendingFilter("excluded");
                            }}
                            className={cn(
                              "w-full flex items-center px-4 py-2.5 text-xs font-bold transition-all rounded-[4px] text-left mb-0.5",
                              pendingExclusionReasonCode === reason.code
                                ? "bg-bg-secondary text-accent"
                                : "text-text-secondary hover:bg-bg-secondary",
                            )}
                          >
                            <span className="flex items-center justify-center min-w-[28px] h-4 rounded bg-bg-secondary text-[9px] font-black text-text-secondary mr-3">
                              {reason.code}
                            </span>
                            <span className="truncate">{reason.name}</span>
                          </button>
                        ))}
                      </div>
                    </Dropdown>
                  </div>
                </div>

                {/* Year Range Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      Publication Timeline
                    </span>
                  </div>
                  <div className="bg-bg-secondary rounded-[4px] border border-border p-1">
                    <YearRangeSlider
                      fromYear={pendingFromYear}
                      toYear={pendingToYear}
                      minYear={1900}
                      maxYear={currentYear}
                      onChange={(from, to) => {
                        setPendingFromYear(from);
                        setPendingToYear(to);
                      }}
                      onClear={() => {
                        setPendingFromYear(1900);
                        setPendingToYear(currentYear);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border">
                <p className="text-[11px] text-text-secondary font-medium italic">
                  Note: Filters are applied cumulatively to refine your
                  screening dataset.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-rose-500 font-bold text-[11px] uppercase tracking-widest transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Defaults
                  </button>
                  <div className="w-px h-4 bg-slate-200" />
                  <button
                    onClick={handleApplyFilters}
                    className="px-8 py-2.5 bg-accent text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-none shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Apply Active Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Matrix Table */}
        <div className="space-y-4 pb-12">
          <div className="grid gap-3">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_240px_140px_100px] px-6 py-2 text-[10px] font-black text-text-secondary uppercase tracking-widest">
              <span>Paper Details</span>
              <span>Screening Flow</span>
              <span className="text-center">Final Decision</span>
              <span className="text-right">Reason</span>
            </div>

            {papers.map((paper) => (
              <div
                key={paper.paperId}
                className="group flex flex-col cursor-pointer"
                onClick={() => handlePaperClick(paper.paperId)}
              >
                <div
                  className={cn(
                    "grid grid-cols-[1fr_240px_140px_100px] items-center px-6 py-4 rounded-[4px] border transition-all duration-300",
                    paper.finalDecision === "INCLUDED"
                      ? "bg-emerald-50/30 border-emerald-100/50 hover:bg-emerald-50/60"
                      : paper.finalDecision === "EXCLUDED"
                        ? "bg-rose-50/30 border-rose-100/50 hover:bg-rose-50/60"
                        : "bg-surface-white border-border hover:border-indigo-200 hover:shadow-none hover:-translate-y-0.5",
                  )}
                >
                  {/* Paper Info */}
                  <div className="flex flex-col pr-4 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-accent transition-colors">
                      {paper.title}
                    </h4>
                    <span className="text-[11px] text-text-secondary font-medium truncate italic">
                      {paper.authors}{" "}
                      {paper.journal ? `| ${paper.journal}` : ""}{" "}
                      {paper.publicationYear
                        ? `(${paper.publicationYear})`
                        : ""}
                    </span>
                  </div>

                  {/* Flow */}
                  <div>
                    <ScreeningFlow paper={paper} />
                  </div>

                  {/* Decision */}
                  <div className="flex justify-center">
                    <DecisionBadge status={paper.finalDecision} />
                  </div>

                  {/* Reason */}
                  <div className="flex justify-end">
                    {paper.exclusionReason ? (
                      <Tooltip content={paper.exclusionReason.name}>
                        <div className="w-8 h-8 rounded-[4px] bg-rose-100 flex items-center justify-center text-[11px] font-black text-rose-600 border border-rose-200 shadow-none transition-transform hover:scale-110">
                          {paper.exclusionReason.code}
                        </div>
                      </Tooltip>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                  disabled={pageNumber === 1}
                  className="p-2 rounded-[4px] border border-border bg-surface-white disabled:opacity-40 transition-all hover:bg-bg-secondary active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPageNumber(i + 1)}
                      className={cn(
                        "w-8 h-8 rounded-[4px] text-xs font-bold transition-all",
                        pageNumber === i + 1
                          ? "bg-accent text-white shadow-none"
                          : "text-text-secondary hover:bg-bg-secondary",
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setPageNumber((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={pageNumber === totalPages}
                  className="p-2 rounded-[4px] border border-border bg-surface-white disabled:opacity-40 transition-all hover:bg-bg-secondary active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PaperDetailsView
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        paper={paperDetails as unknown as PaperResponse}
        loading={isLoadingDetails}
        mode="drawer"
      />
    </div>
  );
};

export default StuSePaperStatisticPage;
