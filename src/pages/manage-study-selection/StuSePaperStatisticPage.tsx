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
import { motion, useReducedMotion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import Tooltip from "../../components/ui/Tooltip";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Pagination from "../../components/ui/Pagination";
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
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20",
      opacity: "",
    },
    excluded: {
      icon: XCircle,
      bg: "bg-error/10",
      text: "text-error",
      border: "border-error/20",
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
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/20",
      opacity: "",
    },
    not_reached: {
      icon: Clock,
      bg: "bg-bg-secondary",
      text: "text-text-secondary",
      border: "border-border",
      opacity: "opacity-40",
    },
  };

  const config = configs[s] || configs.pending;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight transition-colors motion-reduce:transition-none",
        config.bg,
        config.text,
        config.border,
        config.opacity,
      )}
    >
      <Icon aria-hidden="true" className="w-3.5 h-3.5" />
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
        "relative h-px w-8 bg-border",
          paper.titleAbstractStatus.status === "EXCLUDED" && "opacity-40",
        )}
      >
        <ArrowRight aria-hidden="true" className="absolute -right-1 -top-[5.5px] h-3 w-3 text-text-tertiary" />
      </div>
      <StatusIndicator status={paper.fullTextStatus.status} label="FT" />
    </div>
  );
};

const DecisionBadge = ({ status }: { status: string }) => {
  const s = status.toLowerCase();
  const configs: Record<string, any> = {
    included: { bg: "bg-success", text: "text-white", label: "Included" },
    excluded: { bg: "bg-error", text: "text-white", label: "Excluded" },
    pending: { bg: "bg-bg-secondary", text: "text-text-secondary", label: "Pending" },
    not_reached: {
      bg: "bg-bg-secondary",
      text: "text-text-secondary",
      label: "N/A",
    },
  };

  const config = configs[s] || configs.pending;

  return (
    <div
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ring-1 ring-inset ring-border/60",
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
  const prefersReducedMotion = useReducedMotion();
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
      <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto bg-bg-secondary/50">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-text-secondary font-medium">Loading statistics...</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto bg-bg-secondary/50">
        <XCircle className="mb-4 h-10 w-10 text-error" />
        <p className="text-text-secondary font-medium">
          Failed to load statistics.
        </p>
      </div>
    );
  }

  const chartData = [
    { name: "Included", value: stats.includedCount, color: "var(--color-success)" },
    { name: "Excluded", value: stats.excludedCount, color: "var(--color-error)" },
    { name: "Pending", value: stats.pendingCount, color: "var(--color-text-muted)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-y-contain bg-bg-secondary/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-surface-white/90 backdrop-blur-md border-b border-border px-4 py-3 shadow-none sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/projects/${projectId}/processes/${processId}/screening/${screeningProcessId}`,
                )
              }
              className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-surface-white px-4 text-sm font-medium text-text-secondary transition-colors hover:border-primary/20 hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
              <span>Back</span>
            </button>

            <div className="h-10 w-px shrink-0 bg-border" />

            <div>
              <h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-text-primary sm:text-xl">
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

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:space-y-8 sm:p-6">
        {/* Visual Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Card */}
          <div className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-xl border border-border bg-surface-white p-5 shadow-none sm:flex-row sm:gap-8 sm:p-8 lg:col-span-2 lg:gap-12">
            <div className="absolute top-0 right-0 w-32 h-32 bg-bg-secondary/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

            <div className="relative h-40 w-40 flex-shrink-0 sm:h-48 sm:w-48">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={72}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={!prefersReducedMotion}
                      animationBegin={prefersReducedMotion ? 0 : 200}
                      animationDuration={prefersReducedMotion ? 0 : 800}
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
                            <div className="rounded-xl border border-border bg-surface-white px-3 py-2 text-[11px] font-semibold text-text-primary shadow-lg">
                              <div className="mb-1 flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="uppercase tracking-wider">
                                  {data.name}
                                </span>
                              </div>
                  <div className="text-lg font-bold">
                                {data.value}{" "}
                                  <span className="text-xs font-medium text-text-secondary">
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
              ) : (
                <div
                  className="absolute inset-2 rounded-full border-2 border-dashed border-border bg-bg-secondary/60"
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-text-primary tracking-tight">
                  {stats.totalPapers}
                </span>
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  Total Papers
                </span>
              </div>
            </div>

            <div className="relative z-10 w-full min-w-0 flex-1 space-y-5 sm:space-y-6">
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight mb-1">
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
                    className="flex flex-col p-3 rounded-xl bg-bg-secondary border border-border transition-colors hover:bg-surface-white hover:border-border"
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
                    <span className="text-xl font-black text-text-primary">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Info Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface-white p-5 shadow-none sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-bl-full bg-primary-light/70" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary-light">
                  <TrendingUp aria-hidden="true" className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-text-primary">
                    Key Insights
                  </h3>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-text-secondary">
                    Exclusion Patterns
                  </p>
                </div>
              </div>

              {stats.topExclusionReason ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-bg-secondary/60 p-4">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-warning">
                      Top Reason for Rejection
                    </span>
                    <h4 className="text-lg font-bold leading-tight text-text-primary">
                      {stats.topExclusionReason.name}
                    </h4>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-warning">
                        CODE: {stats.topExclusionReason.code}
                      </div>
                      <span className="text-xs font-medium text-text-secondary">
                        {stats.topExclusionReason.count} papers affected
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-medium italic leading-relaxed text-text-secondary">
                    <Info aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <span>
                      Focusing on this pattern can help refine your search
                      strings or inclusion criteria.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Clock aria-hidden="true" className="mb-3 h-8 w-8 text-text-tertiary" />
                  <p className="text-sm text-text-secondary">
                    Not enough data to generate insights yet.
                  </p>
                </div>
              )}
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between border-t border-border pt-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-secondary uppercase">
                  Yield Rate
                </span>
                <span className="text-xl font-bold text-success">
                  {stats.totalPapers > 0
                    ? ((stats.includedCount / stats.totalPapers) * 100).toFixed(
                        1,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-1 w-12 overflow-hidden rounded-full bg-bg-secondary">
                <motion.div
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{
                    width: `${(stats.includedCount / (stats.totalPapers || 1)) * 100}%`,
                  }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
                  className="h-full bg-success"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header & Filters */}
        <div className="flex w-full flex-col gap-4 sm:gap-6">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 w-full max-w-4xl flex-1 items-center gap-2 sm:gap-3">
              {/* Modern Search Bar */}
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-text-secondary group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="text"
                  value={search}
                  aria-label="Search papers by title, authors, or DOI"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, authors, DOI..."
                  className="block min-h-11 w-full rounded-xl border border-border bg-surface-white py-2.5 pl-10 pr-12 text-[13px] font-medium text-text-primary placeholder:text-text-secondary shadow-none transition-[border-color,box-shadow] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFilterPanelOpen((open) => !open)}
                aria-expanded={isFilterPanelOpen}
                aria-controls="study-selection-statistics-filters"
                className={cn(
                  "group relative flex min-h-11 shrink-0 items-center gap-2 overflow-hidden rounded-xl border px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none sm:gap-2.5 sm:px-5",
                  activeFilterCount > 0 || isFilterPanelOpen
                    ? "bg-primary border-primary text-white"
                    : "bg-surface-white border-border text-text-secondary hover:border-accent/20 hover:bg-bg-secondary",
                )}
              >
                <Filter
                  aria-hidden="true"
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
                  <span className="ml-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
                {isFilterPanelOpen ? (
                  <ChevronUp aria-hidden="true" className="ml-1 h-4 w-4 opacity-70" />
                ) : (
                  <ChevronDown aria-hidden="true" className="ml-1 h-4 w-4 opacity-70" />
                )}
              </button>
            </div>

            <div className="self-start whitespace-nowrap rounded-xl border border-border bg-bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary sm:self-auto sm:tracking-widest">
              Showing {papers.length} of {stats.totalPapers} Papers
            </div>
          </div>

          {/* Inline Expandable Filter Panel */}
          <motion.div
            id="study-selection-statistics-filters"
            aria-hidden={!isFilterPanelOpen}
            inert={!isFilterPanelOpen}
            initial={false}
            animate={{
              height: isFilterPanelOpen ? "auto" : 0,
              opacity: isFilterPanelOpen ? 1 : 0,
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative min-w-0 space-y-6 rounded-xl border border-border bg-surface-white p-4 shadow-none sm:space-y-8 sm:p-8">
              <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
                {/* Status Section */}
                <div className="min-w-0 space-y-4">
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
                          type="button"
                          aria-pressed={pendingFilter === f}
                          onClick={() => {
                            setPendingFilter(f);
                            if (f === "included" || f === "pending") {
                              setPendingExclusionReasonCode(undefined);
                            }
                          }}
                          className={cn(
                            "flex min-h-11 items-center justify-center rounded-xl border px-4 text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none",
                            pendingFilter === f
                              ? "bg-primary border-primary text-white shadow-none"
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
                <div className="min-w-0 space-y-4">
                  <div className="flex items-center gap-2">
                    <div aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-error" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      Exclusion Pattern
                    </span>
                  </div>
                  <div className="space-y-3">
                    <Dropdown
                      className="block w-full min-w-0"
                      trigger={
                        <div className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-bg-secondary px-4 text-left text-[12px] font-semibold text-text-primary transition-colors hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none">
                          <span className="truncate">
                            {pendingExclusionReasonCode !== undefined
                              ? exclusionReasons.find(
                                  (r) => r.code === pendingExclusionReasonCode,
                                )?.name || `Code: ${pendingExclusionReasonCode}`
                              : "No Grouping"}
                          </span>
                          <ChevronDown aria-hidden="true" className="w-4 h-4 text-text-secondary" />
                        </div>
                      }
                      contentClassName="z-(--z-index-dropdown) flex max-h-60 w-full max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface-white shadow-2xl sm:w-[340px]"
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
                          type="button"
                          onClick={() =>
                            setPendingExclusionReasonCode(undefined)
                          }
                          className={cn(
                            "mb-1 flex min-h-11 w-full items-center rounded-xl px-4 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none",
                            pendingExclusionReasonCode === undefined
                              ? "bg-bg-secondary text-text-primary"
                              : "text-text-secondary hover:bg-bg-secondary",
                          )}
                        >
                          No Grouping
                        </button>
                        <div aria-hidden="true" className="mx-2 my-1 h-px bg-border" />
                        {exclusionReasons.map((reason) => (
                          <button
                            key={reason.id}
                            type="button"
                            onClick={() => {
                              setPendingExclusionReasonCode(reason.code);
                              setPendingFilter("excluded");
                            }}
                            className={cn(
                              "mb-0.5 flex min-h-11 w-full items-center rounded-xl px-4 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none",
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
                <div className="min-w-0 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      Publication Timeline
                    </span>
                  </div>
                  <div className="bg-bg-secondary rounded-xl border border-border p-1">
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

              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                <p className="text-[11px] font-medium italic text-text-secondary">
                  Note: Filters are applied cumulatively to refine your
                  screening dataset.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-text-secondary transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-bold text-[11px] uppercase tracking-widest motion-reduce:transition-none"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Defaults
                  </button>
                  <div className="h-4 w-px bg-border" />
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="min-h-11 rounded-xl bg-primary px-8 text-white shadow-none transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 font-black text-[11px] uppercase tracking-widest motion-reduce:transition-none"
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
            <div className="hidden grid-cols-[1fr_240px_140px_100px] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary md:grid">
              <span>Paper Details</span>
              <span>Screening Flow</span>
              <span className="text-center">Final Decision</span>
              <span className="text-right">Reason</span>
            </div>

            {papers.map((paper) => {
              const decisionTone =
                paper.finalDecision === "INCLUDED"
                  ? "border-success/15 bg-success/5 hover:bg-success/10"
                  : paper.finalDecision === "EXCLUDED"
                    ? "border-error/15 bg-error/5 hover:bg-error/10"
                    : "bg-surface-white border-border hover:border-accent/20 hover:bg-bg-secondary/50";
              const publicationDetails = [
                paper.authors,
                paper.journal,
                paper.publicationYear ? `(${paper.publicationYear})` : "",
              ].filter(Boolean).join(" · ");

              return (
                <div
                  key={paper.paperId}
                  className="group cursor-pointer"
                  onClick={() => handlePaperClick(paper.paperId)}
                >
                  <button
                    type="button"
                    className={cn(
                      "mb-3 grid w-full min-w-0 gap-3 rounded-xl border p-4 text-left transition-colors md:hidden",
                      decisionTone,
                    )}
                  >
                    <span className="line-clamp-2 break-words text-sm font-semibold text-text-primary">
                      {paper.title}
                    </span>
                    <span className="line-clamp-2 break-words text-xs leading-5 text-text-secondary">
                      {publicationDetails || "Publication details unavailable"}
                    </span>
                    <div className="min-w-0 border-t border-border/70 pt-3">
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                        Screening flow
                      </span>
                      <ScreeningFlow paper={paper} />
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-3 border-t border-border/70 pt-3">
                      <div className="min-w-0">
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                          Final decision
                        </span>
                        <DecisionBadge status={paper.finalDecision} />
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                          Reason
                        </span>
                        {paper.exclusionReason ? (
                          <Tooltip content={paper.exclusionReason.name}>
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-error/20 bg-error/10 px-2 text-xs font-bold text-error">
                              {paper.exclusionReason.code}
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-text-secondary">—</span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div
                    className={cn(
                      "hidden grid-cols-[1fr_240px_140px_100px] items-center rounded-xl border px-6 py-4 transition-colors md:grid",
                      decisionTone,
                    )}
                  >
                    <div className="flex min-w-0 flex-col pr-4">
                      <h4 className="truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
                        {paper.title}
                      </h4>
                      <span className="truncate text-[11px] font-medium italic text-text-secondary">
                        {publicationDetails}
                      </span>
                    </div>
                    <ScreeningFlow paper={paper} />
                    <div className="flex justify-center">
                      <DecisionBadge status={paper.finalDecision} />
                    </div>
                    <div className="flex justify-end">
                      {paper.exclusionReason ? (
                        <Tooltip content={paper.exclusionReason.name}>
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-error/20 bg-error/10 px-2 text-xs font-bold text-error">
                            {paper.exclusionReason.code}
                          </span>
                        </Tooltip>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={pageNumber}
                  totalPages={totalPages}
                  onPageChange={setPageNumber}
                />
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
