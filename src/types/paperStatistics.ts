export interface PaperOverviewDto {
  totalPapers: number;
  totalPapersWithFulltext: number;
  fulltextAvailablePercentage: number;
  totalMissingDoi: number;
  totalMissingAbstract: number;
}

export interface CountItemDto {
  label: string;
  count: number;
}

export interface StatusCountItemDto {
  status: number;
  label: string;
  count: number;
}

export interface YearCountDto {
  year: number;
  count: number;
}

export interface DataQualityDto {
  missingDoiCount: number;
  missingAbstractCount: number;
  missingAuthorsCount: number;
  missingYearCount: number;
}

export interface PaperStatisticsFilter {
  yearFrom?: number;
  yearTo?: number;
  source?: string;
}
