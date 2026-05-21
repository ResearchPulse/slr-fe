import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { paperImportService } from "../services/paperImportService";
import type { CrossrefQueryParameters } from "../types/paper";

export function useCrossrefWorks(projectId?: string) {
  const [queryParams, setQueryParams] = useState<CrossrefQueryParameters>({
    query: "",
    rows: 10,
    cursor: undefined,
    projectId: projectId,
  });

  // Keep track of cursor history for "Back" button
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  const {
    data: searchResults,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["crossref-works", queryParams, cursorHistory.length],
    queryFn: () => paperImportService.searchWorks(queryParams),
    enabled: !!(queryParams.query || queryParams.queryAuthor || queryParams.queryTitle),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const search = useCallback(
    (params: CrossrefQueryParameters, useCursor = true) => {
      setQueryParams({
        ...params,
        projectId: projectId, // Ensure projectId is always included
        offset: useCursor ? undefined : 0,
        cursor: useCursor ? "*" : undefined,
      });
      setCursorHistory([]);
    },
    [projectId]
  );

  const nextCursor = searchResults?.data?.["next-cursor"];

  const handleNextPage = useCallback(() => {
    if (!nextCursor) return;

    setCursorHistory((prev) => [...prev, queryParams.cursor || "*"]);
    setQueryParams((prev) => ({
      ...prev,
      cursor: nextCursor,
    }));
  }, [nextCursor, queryParams.cursor]);

  const handlePrevPage = useCallback(() => {
    if (cursorHistory.length === 0) return;

    const prevCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((prev) => prev.slice(0, -1));
    setQueryParams((prev) => ({
      ...prev,
      cursor: prevCursor,
    }));
  }, [cursorHistory]);

  const { mutateAsync: fetchDetail, isPending: isFetchingDetail } = useMutation({
    mutationFn: (doi: string) => paperImportService.getWorkDetail(doi),
  });

  return {
    searchResults: searchResults?.data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    queryParams,
    cursorHistory,
    search,
    handleNextPage,
    handlePrevPage,
    canGoBack: cursorHistory.length > 0,
    canGoNext:
      !!nextCursor && (searchResults?.data?.items?.length || 0) >= (queryParams.rows || 10),
    fetchDetail,
    isFetchingDetail,
  };
}
