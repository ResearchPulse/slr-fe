import { useQuery } from "@tanstack/react-query";
import { studySelectionService } from "../services/studySelectionService";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { PaperNodeDto, CitationGraphDto, GetCitationGraphQuery } from "../types/studySelection";

/**
 * Hook to fetch references for a paper.
 */
export const usePaperReferences = (paperId: string | undefined) => {
  return useQuery<PaperNodeDto[]>({
    queryKey: QUERY_KEYS.papers.references(paperId ?? ""),
    queryFn: async () => {
      const response = await studySelectionService.getReferences(paperId!);
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to fetch references");
      }
      return response.data;
    },
    enabled: !!paperId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch citations for a paper.
 */
export const usePaperCitations = (paperId: string | undefined) => {
  return useQuery<PaperNodeDto[]>({
    queryKey: QUERY_KEYS.papers.citations(paperId ?? ""),
    queryFn: async () => {
      const response = await studySelectionService.getCitations(paperId!);
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to fetch citations");
      }
      return response.data;
    },
    enabled: !!paperId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch citation graph for a paper.
 */
export const usePaperGraph = (
  paperId: string | undefined,
  query: GetCitationGraphQuery = { depth: 1, minConfidence: 0.1 }
) => {
  return useQuery<CitationGraphDto>({
    queryKey: QUERY_KEYS.papers.graph(paperId ?? "", query.depth ?? 1, query.minConfidence ?? 0.1),
    queryFn: async () => {
      const response = await studySelectionService.getCitationGraph(paperId!, query);
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to fetch citation graph");
      }
      return response.data;
    },
    enabled: !!paperId,
    staleTime: 5 * 60 * 1000,
  });
};
