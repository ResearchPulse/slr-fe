import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchSourceService } from "../services/searchSourceService";
import { masterSourceService } from "../services/masterSourceService";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { SearchSourceDto } from "../types/searchSource";
import type { SearchStrategyDto } from "../components/paperPool/types/search-strategy";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/errorUtils";

const EMPTY_SEARCH_SOURCES: SearchSourceDto[] = [];

export const useSearchSources = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: searchSources, isLoading: isLoadingSources } = useQuery({
    queryKey: QUERY_KEYS.searchSources.byProject(projectId),
    queryFn: async () => {
      const response = await searchSourceService.getByProjectId(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });

  const { data: availableMasterSources, isLoading: isLoadingMasterSources } = useQuery({
    queryKey: QUERY_KEYS.masterSources.all,
    queryFn: async () => {
      const response = await masterSourceService.getAvailable();
      return response.data;
    },
  });

  const { mutateAsync: bulkUpsert, isPending: isUpserting } = useMutation({
    mutationFn: (sources: SearchSourceDto[]) => searchSourceService.bulkUpsert(sources),
    onSuccess: (response) => {
      if (response.isSuccess) {
        queryClient.setQueryData(QUERY_KEYS.searchSources.byProject(projectId), response.data);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paperPool.metadata(projectId) });
        queryClient.invalidateQueries({ queryKey: ["paper-pool", projectId, "papers"] });
        toast.success("Search sources updated successfully");
      } else {
        toast.error(response.message || "Failed to update search sources");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "An error occurred"));
    },
  });

  const { mutateAsync: upsertSource, isPending: isUpsertingSingle } = useMutation({
    mutationFn: (source: SearchSourceDto) => searchSourceService.upsertSource(source),
    onSuccess: (response) => {
      if (response.isSuccess) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.searchSources.byProject(projectId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paperPool.metadata(projectId) });
        queryClient.invalidateQueries({ queryKey: ["paper-pool", projectId, "papers"] });
      } else {
        toast.error(response.message || "Failed to update search source");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "An error occurred"));
    },
  });

  const { mutateAsync: updateStrategies, isPending: isUpdatingStrategies } = useMutation({
    mutationFn: ({ sourceId, strategies }: { sourceId: string; strategies: SearchStrategyDto[] }) =>
      searchSourceService.updateStrategies(sourceId, strategies),
    onSuccess: (response) => {
      if (response.isSuccess) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.searchSources.byProject(projectId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paperPool.metadata(projectId) });
        queryClient.invalidateQueries({ queryKey: ["paper-pool", projectId, "papers"] });
        toast.success("Search strategies synchronized successfully");
      } else {
        toast.error(response.message || "Failed to synchronize strategies");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "An error occurred"));
    },
  });

  return {
    searchSources: searchSources || EMPTY_SEARCH_SOURCES,
    isLoadingSources,
    availableMasterSources: availableMasterSources || [],
    isLoadingMasterSources,
    bulkUpsert,
    isUpserting,
    upsertSource,
    isUpsertingSingle,
    updateStrategies,
    isUpdatingStrategies,
    isLoading: isLoadingSources || isLoadingMasterSources,
  };
};
