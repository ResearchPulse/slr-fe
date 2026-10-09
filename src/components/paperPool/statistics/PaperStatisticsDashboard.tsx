import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiFileText,
  FiCheckCircle,
  FiAlertTriangle,
  FiActivity,
} from "react-icons/fi";

import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import BarChartComponent from "./BarChartComponent";
import PieChartComponent from "./PieChartComponent";
import LineChartComponent from "./LineChartComponent";
import FilterPanel from "./FilterPanel";

import paperStatisticsService from "../../../services/paperStatisticsService";
import type { PaperStatisticsFilter } from "../../../types/paperStatistics";

interface PaperStatisticsDashboardProps {
  projectId: string;
  availableSources: string[];
}

const PaperStatisticsDashboard: React.FC<PaperStatisticsDashboardProps> = ({
  projectId,
  availableSources,
}) => {
  const [filters, setFilters] = useState<PaperStatisticsFilter>({});

  const handleReset = () => {
    setFilters({});
  };

  // --- Queries ---
  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["paper-statistics", projectId, "overview", filters],
    queryFn: () => paperStatisticsService.getOverview(projectId, filters),
  });

  const { data: byYear, isLoading: isLoadingByYear } = useQuery({
    queryKey: ["paper-statistics", projectId, "by-year", filters],
    queryFn: () => paperStatisticsService.getByYear(projectId, filters),
  });

  const { data: pubTypes, isLoading: isLoadingPubTypes } = useQuery({
    queryKey: ["paper-statistics", projectId, "publication-types", filters],
    queryFn: () =>
      paperStatisticsService.getPublicationTypes(projectId, filters),
  });

  const { data: journals, isLoading: isLoadingJournals } = useQuery({
    queryKey: ["paper-statistics", projectId, "top-journals", filters],
    queryFn: () =>
      paperStatisticsService.getTopJournals(projectId, filters, 10),
  });

  const { data: conferences, isLoading: isLoadingConferences } = useQuery({
    queryKey: ["paper-statistics", projectId, "top-conferences", filters],
    queryFn: () =>
      paperStatisticsService.getTopConferences(projectId, filters, 10),
  });

  const { data: publishers, isLoading: isLoadingPublishers } = useQuery({
    queryKey: ["paper-statistics", projectId, "top-publishers", filters],
    queryFn: () =>
      paperStatisticsService.getTopPublishers(projectId, filters, 10),
  });

  const { data: languages, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ["paper-statistics", projectId, "languages", filters],
    queryFn: () => paperStatisticsService.getLanguages(projectId, filters),
  });

  const { data: fulltextStatus, isLoading: isLoadingFulltextStatus } = useQuery(
    {
      queryKey: ["paper-statistics", projectId, "fulltext-status", filters],
      queryFn: () =>
        paperStatisticsService.getFulltextStatus(projectId, filters),
    },
  );

  const { data: keywords, isLoading: isLoadingKeywords } = useQuery({
    queryKey: ["paper-statistics", projectId, "top-keywords", filters],
    queryFn: () =>
      paperStatisticsService.getTopKeywords(projectId, filters, 20),
  });

  const { data: dataQuality, isLoading: isLoadingDataQuality } = useQuery({
    queryKey: ["paper-statistics", projectId, "data-quality", filters],
    queryFn: () => paperStatisticsService.getDataQuality(projectId, filters),
  });

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-bg-secondary/30 p-1 rounded-2xl">
      {/* Filters Area */}
      <FilterPanel
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
        availableSources={availableSources}
      />

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Papers"
          value={overview?.totalPapers ?? 0}
          icon={FiFileText}
          color="#3b82f6"
          loading={isLoadingOverview}
        />
        <StatCard
          title="Fulltext Papers"
          value={overview?.totalPapersWithFulltext ?? 0}
          icon={FiCheckCircle}
          color="#10b981"
          loading={isLoadingOverview}
        />
        <StatCard
          title="Fulltext %"
          value={
            overview?.fulltextAvailablePercentage
              ? overview.fulltextAvailablePercentage.toFixed(1)
              : 0
          }
          suffix="%"
          icon={FiActivity}
          color="#8b5cf6"
          loading={isLoadingOverview}
        />
        <StatCard
          title="Missing DOI"
          value={overview?.totalMissingDoi ?? 0}
          icon={FiAlertTriangle}
          color="#f59e0b"
          loading={isLoadingOverview}
        />
        <StatCard
          title="Missing Abstract"
          value={overview?.totalMissingAbstract ?? 0}
          icon={FiAlertTriangle}
          color="#ef4444"
          loading={isLoadingOverview}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trend */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Papers by Year (Trend)"
            loading={isLoadingByYear}
            isEmpty={!byYear?.length}
          >
            <LineChartComponent data={byYear ?? []} xKey="year" yKey="count" />
          </ChartCard>
        </div>

        {/* Publication Types */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Publication Types"
            loading={isLoadingPubTypes}
            isEmpty={!pubTypes?.length}
          >
            <PieChartComponent
              data={pubTypes ?? []}
              nameKey="label"
              valueKey="count"
            />
          </ChartCard>
        </div>

        {/* Top Journals */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Top 10 Journals"
            loading={isLoadingJournals}
            isEmpty={!journals?.length}
          >
            <BarChartComponent
              data={journals ?? []}
              xKey="count"
              yKey="label"
              horizontal
            />
          </ChartCard>
        </div>

        {/* Top Conferences */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Top 10 Conferences"
            loading={isLoadingConferences}
            isEmpty={!conferences?.length}
          >
            <BarChartComponent
              data={conferences ?? []}
              xKey="count"
              yKey="label"
              horizontal
            />
          </ChartCard>
        </div>

        {/* Languages */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Language Distribution"
            loading={isLoadingLanguages}
            isEmpty={!languages?.length}
          >
            <PieChartComponent
              data={languages ?? []}
              nameKey="label"
              valueKey="count"
            />
          </ChartCard>
        </div>

        {/* Fulltext Status */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Fulltext Status"
            loading={isLoadingFulltextStatus}
            isEmpty={!fulltextStatus?.length}
          >
            <PieChartComponent
              data={fulltextStatus ?? []}
              nameKey="label"
              valueKey="count"
            />
          </ChartCard>
        </div>

        {/* Top Keywords */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Top 20 Keywords"
            loading={isLoadingKeywords}
            isEmpty={!keywords?.length}
          >
            <BarChartComponent
              data={keywords ?? []}
              xKey="count"
              yKey="label"
              horizontal
            />
          </ChartCard>
        </div>

        {/* Data Quality */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Data Quality Issues"
            loading={isLoadingDataQuality}
            isEmpty={!dataQuality}
          >
            <div className="space-y-4">
              <QualityIssue
                label="Missing DOI"
                count={dataQuality?.missingDoiCount ?? 0}
                color="#f59e0b"
              />
              <QualityIssue
                label="Missing Abstract"
                count={dataQuality?.missingAbstractCount ?? 0}
                color="#ef4444"
              />
              <QualityIssue
                label="Missing Authors"
                count={dataQuality?.missingAuthorsCount ?? 0}
                color="#3b82f6"
              />
              <QualityIssue
                label="Missing Year"
                count={dataQuality?.missingYearCount ?? 0}
                color="#6366f1"
              />
            </div>
          </ChartCard>
        </div>
        {/* Top Publishers */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Top 10 Publishers"
            loading={isLoadingPublishers}
            isEmpty={!publishers?.length}
          >
            <BarChartComponent
              data={publishers ?? []}
              xKey="count"
              yKey="label"
              horizontal
            />
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

const QualityIssue: React.FC<{
  label: string;
  count: number;
  color: string;
}> = ({ label, count, color }) => (
  <div className="flex items-center justify-between p-3.5 bg-bg-secondary/50 rounded-lg border border-border hover:bg-bg-secondary transition-colors">
  <div className="flex items-center gap-3">
      <div
        className="w-2.5 h-2.5 rounded-full shadow-none"
        style={{ backgroundColor: color }}
      />
      <span className="font-semibold text-text-secondary uppercase tracking-[0.1em] text-[10px]">
        {label}
      </span>
    </div>
    <span className="text-lg font-bold text-text-primary">{count}</span>
  </div>
);

export default PaperStatisticsDashboard;
