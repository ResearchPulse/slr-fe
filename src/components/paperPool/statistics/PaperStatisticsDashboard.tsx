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
import DistributionDonutChart from "./DistributionDonutChart";
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
    <div className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none sm:gap-5">
      {/* Filters Area */}
      <FilterPanel
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
        availableSources={availableSources}
      />

      {/* KPI Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-5">
        <StatCard
          title="Total Papers"
          value={overview?.totalPapers ?? 0}
          icon={FiFileText}
          color="var(--color-accent)"
          loading={isLoadingOverview}
        />
        <StatCard
          title="Fulltext Papers"
          value={overview?.totalPapersWithFulltext ?? 0}
          icon={FiCheckCircle}
          color="var(--color-success)"
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
          color="var(--color-info)"
          loading={isLoadingOverview}
        />
        <StatCard
          title="Missing DOI"
          value={overview?.totalMissingDoi ?? 0}
          icon={FiAlertTriangle}
          color="var(--color-warning)"
          loading={isLoadingOverview}
        />
        <StatCard
          title="Missing Abstract"
          value={overview?.totalMissingAbstract ?? 0}
          icon={FiAlertTriangle}
          color="var(--color-error)"
          loading={isLoadingOverview}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12 sm:gap-5">
        {/* Trend */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Papers by Year (Trend)"
            description="Paper count by publication year."
            loading={isLoadingByYear}
            isEmpty={!byYear?.length}
            emptyDescription="No publication-year values match the current filters."
          >
            <LineChartComponent data={byYear ?? []} xKey="year" yKey="count" />
          </ChartCard>
        </div>

        {/* Publication Types */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Publication Types"
            description="Share and paper count by publication type."
            loading={isLoadingPubTypes}
            isEmpty={!pubTypes?.some((item) => item.count > 0)}
            emptyDescription="No publication-type records match the current filters."
          >
            <DistributionDonutChart
              data={pubTypes ?? []}
              totalLabel="Total publications"
              itemLabel="publication"
            />
          </ChartCard>
        </div>

        {/* Top Journals */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Top 10 Journals"
            description="Paper count grouped by journal title."
            loading={isLoadingJournals}
            isEmpty={!journals?.length}
            emptyDescription="No journal titles are stored for the current records."
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
            description="Paper count grouped by conference or proceedings."
            loading={isLoadingConferences}
            isEmpty={!conferences?.length}
            emptyDescription="Conference and proceedings details are not available in these records."
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
            description="Paper count grouped by language."
            loading={isLoadingLanguages}
            isEmpty={!languages?.some((item) => item.count > 0)}
            emptyDescription="No language data matches the current filters."
          >
            <DistributionDonutChart data={languages ?? []} />
          </ChartCard>
        </div>

        {/* Fulltext Status */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Fulltext Status"
            description="Records with a PDF or full text available."
            loading={isLoadingFulltextStatus}
            isEmpty={!fulltextStatus?.some((item) => item.count > 0)}
            emptyDescription="No papers with full-text status match the current filters."
          >
            <DistributionDonutChart data={fulltextStatus ?? []} />
          </ChartCard>
        </div>

        {/* Top Keywords */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Top 20 Keywords"
            description="Most frequent keywords across the filtered papers."
            loading={isLoadingKeywords}
            isEmpty={!keywords?.length}
            emptyDescription="No keyword metadata is stored for the current records."
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
            description="Missing bibliographic fields in the filtered papers."
            loading={isLoadingDataQuality}
            isEmpty={!dataQuality}
            emptyDescription="Data quality information is not available for the current filters."
          >
            <div className="flex h-full min-h-[260px] flex-col divide-y divide-border">
              <QualityIssue
                label="Missing DOI"
                count={dataQuality?.missingDoiCount ?? 0}
                color="var(--color-warning)"
              />
              <QualityIssue
                label="Missing Abstract"
                count={dataQuality?.missingAbstractCount ?? 0}
                color="var(--color-error)"
              />
              <QualityIssue
                label="Missing Authors"
                count={dataQuality?.missingAuthorsCount ?? 0}
                color="var(--color-accent)"
              />
              <QualityIssue
                label="Missing Year"
                count={dataQuality?.missingYearCount ?? 0}
                color="var(--color-info)"
              />
            </div>
          </ChartCard>
        </div>
        {/* Top Publishers */}
        <div className="lg:col-span-12">
          <ChartCard
            title="Top 10 Publishers"
            description="Paper count grouped by publisher."
            loading={isLoadingPublishers}
            isEmpty={!publishers?.length}
            emptyDescription="Publisher metadata is not available in these records."
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
  <div className="flex flex-1 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
    <div className="flex items-center gap-3">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
        {label}
      </span>
    </div>
    <span className="text-lg font-bold tabular-nums text-text-primary">{count}</span>
  </div>
);

export default PaperStatisticsDashboard;
