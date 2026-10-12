import { PaperPhase, PaperSelectionStatus } from "../../../types/studySelection";
import type { AssignedPapersParams, PaperSortBy } from "../../../types/studySelection";
import { studySelectionService } from "../../../services/studySelectionService";

type QueuePaper = { id: string };
type QueuePage = { pageNumber: number; pageSize: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
type QueueFilters = { search: string; status: string; sortBy: PaperSortBy; hasFullText?: boolean; hasConflict?: boolean };
export type QueueNeighbor = { paperId: string; pageNumber: number };

function apiStatus(status: string): PaperSelectionStatus | undefined {
  if (status === "pending") return PaperSelectionStatus.Pending;
  if (status === "included") return PaperSelectionStatus.Included;
  if (status === "excluded") return PaperSelectionStatus.Excluded;
  if (status === "conflicted") return PaperSelectionStatus.Conflict;
  return undefined;
}

export async function getAdjacentPaperId(args: {
  processId: string;
  phase: PaperPhase;
  currentId: string;
  papers: QueuePaper[];
  pagination: QueuePage;
  filters: QueueFilters;
  direction: -1 | 1;
}): Promise<{ paperId: string; pageNumber: number } | null> {
  const { processId, phase, currentId, papers, pagination, filters, direction } = args;
  const index = papers.findIndex((paper) => paper.id === currentId);
  const targetIndex = index + direction;
  if (index >= 0 && targetIndex >= 0 && targetIndex < papers.length) {
    return { paperId: papers[targetIndex].id, pageNumber: pagination.pageNumber };
  }

  const params: AssignedPapersParams = {
    phase,
    search: filters.search || undefined,
    status: apiStatus(filters.status),
    sortBy: filters.sortBy,
    pageSize: pagination.pageSize || 20,
    hasFullText: filters.hasFullText || undefined,
    hasConflict: filters.hasConflict || undefined,
  };

  if (index >= 0) {
    const pageNumber = pagination.pageNumber + direction;
    if (pageNumber < 1 || pageNumber > pagination.totalPages) return null;
    const response = await studySelectionService.getAssignedPapers(processId, { ...params, pageNumber });
    const items = response.data?.items ?? [];
    const item = direction > 0 ? items[0] : items[items.length - 1];
    return item ? { paperId: item.paperId, pageNumber } : null;
  }

  // Direct detail URLs have no list context. Find the paper's position using
  // the deterministic default (title ascending), one server page at a time.
  const pageSize = 100;
  const first = await studySelectionService.getAssignedPapers(processId, {
    phase, sortBy: 0, pageNumber: 1, pageSize,
  });
  const totalPages = first.data?.totalPages ?? 1;
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const response = pageNumber === 1 ? first : await studySelectionService.getAssignedPapers(processId, {
      phase, sortBy: 0, pageNumber, pageSize,
    });
    const items = response.data?.items ?? [];
    const currentIndex = items.findIndex((item) => item.paperId === currentId);
    if (currentIndex < 0) continue;
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < items.length) {
      return { paperId: items[nextIndex].paperId, pageNumber };
    }
    const adjacentPage = pageNumber + direction;
    if (adjacentPage < 1 || adjacentPage > totalPages) return null;
    const adjacent = await studySelectionService.getAssignedPapers(processId, {
      phase, sortBy: 0, pageNumber: adjacentPage, pageSize,
    });
    const adjacentItems = adjacent.data?.items ?? [];
    const item = direction > 0 ? adjacentItems[0] : adjacentItems[adjacentItems.length - 1];
    return item ? { paperId: item.paperId, pageNumber: adjacentPage } : null;
  }
  return null;
}

export async function getPaperQueueNeighbors(args: {
  processId: string;
  phase: PaperPhase;
  currentId: string;
  papers: QueuePaper[];
  pagination: QueuePage;
  filters: QueueFilters;
}): Promise<{ previous: QueueNeighbor | null; next: QueueNeighbor | null }> {
  const { processId, phase, currentId, papers, pagination, filters } = args;
  const index = papers.findIndex((paper) => paper.id === currentId);
  if (index >= 0) {
    const base = { processId, phase, currentId, papers, pagination, filters };
    const [previous, next] = await Promise.all([
      index > 0 || pagination.hasPreviousPage ? getAdjacentPaperId({ ...base, direction: -1 }) : null,
      index < papers.length - 1 || pagination.hasNextPage ? getAdjacentPaperId({ ...base, direction: 1 }) : null,
    ]);
    return { previous, next };
  }

  // A direct URL has no queue filters. Scan title-ascending pages one at a
  // time and retain only the adjacent IDs, never the full paper collection.
  const pageSize = 100;
  const first = await studySelectionService.getAssignedPapers(processId, { phase, sortBy: 0, pageNumber: 1, pageSize });
  const totalPages = first.data?.totalPages ?? 1;
  let previousId: string | null = null;
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const response = pageNumber === 1 ? first : await studySelectionService.getAssignedPapers(processId, { phase, sortBy: 0, pageNumber, pageSize });
    const items = response.data?.items ?? [];
    const currentIndex = items.findIndex((item) => item.paperId === currentId);
    if (currentIndex < 0) {
      previousId = items.length ? items[items.length - 1].paperId : previousId;
      continue;
    }
    let next: QueueNeighbor | null = currentIndex < items.length - 1
      ? { paperId: items[currentIndex + 1].paperId, pageNumber }
      : null;
    if (!next && pageNumber < totalPages) {
      const nextPage = await studySelectionService.getAssignedPapers(processId, { phase, sortBy: 0, pageNumber: pageNumber + 1, pageSize });
      const item = nextPage.data?.items?.[0];
      if (item) next = { paperId: item.paperId, pageNumber: pageNumber + 1 };
    }
    const previous = currentIndex > 0
      ? { paperId: items[currentIndex - 1].paperId, pageNumber }
      : previousId ? { paperId: previousId, pageNumber: pageNumber - 1 } : null;
    return { previous, next };
  }
  return { previous: null, next: null };
}
