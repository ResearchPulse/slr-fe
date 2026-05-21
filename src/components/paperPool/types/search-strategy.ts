export interface SearchStrategyDto {
  id?: string;
  sourceId?: string;
  query: string;
  fields: string[]; // e.g. ["title", "abstract"]
  filters: {
    yearFrom?: number;
    yearTo?: number;
    language?: string;
    studyType?: string;
  };
  url: string;

  // PICOC Keywords Breakdown
  populationKeywords?: string[];
  interventionKeywords?: string[];
  comparisonKeywords?: string[];
  outcomeKeywords?: string[];
  contextKeywords?: string[];

  dateSearched?: string;
  version?: string;
  notes?: string;
}
