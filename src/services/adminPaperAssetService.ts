import api from "../config/axios";
import { projectService } from "./projectService";
import paperPoolService from "./paperPoolService";
import type { PaperPoolApiResponse } from "../components/paperPool/types";
import type { ApiResponse, Project } from "../types/project";

export interface AdminPaperAsset {
  paper: PaperPoolApiResponse;
  projectId: string | null;
  projectTitle: string;
  projectRefs: Array<{ id: string; title: string }>;
  workId?: string;
  repositoryOnly: boolean;
  repository?: {
    visibility: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface RepositoryPaperAssetResponse {
  workId: string;
  paper: PaperPoolApiResponse;
  accessPolicy: { visibility: string; allowedProjectIds: string[] };
  createdAt?: string;
  updatedAt?: string;
}

interface RepositoryPaperAssetPage {
  items: RepositoryPaperAssetResponse[];
  nextCursor: string | null;
}

export interface AdminRepositoryAnalysis {
  run: {
    runId: string;
    schemaVersion: string;
    reviewStatus: string;
    provenance?: { provider?: string | null; model?: string | null } | null;
    createdAt: string;
    completedAt?: string | null;
  };
  analysis: unknown;
}

export interface AdminRepositoryPaperDetails {
  workId: string;
  metadata: {
    title: string;
    authors: Array<string | { name: string; affiliation?: string; orcid?: string }>;
    abstract?: string;
    doi?: string;
    openAlexId?: string;
    externalIdentifiers: Record<string, string>;
    publicationYear?: number;
    publicationDate?: string;
    venue?: string;
    journal?: string;
    journalIssn?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    publisher?: string;
    language?: string;
    publicationType?: string;
    keywords: string[];
  };
  identifiers: { doi?: string; openAlexId?: string; external: Record<string, string>; aliases: string[] };
  classification: { primaryTopicId?: string; topicIds: string[]; subfieldIds: string[]; fieldIds: string[]; domainIds: string[] };
  metadataProvenance: { source: string; sourcePriority: number; retrievedAt: string; schemaVersion: number };
  metadataEnrichmentAttemptedAt: string | null;
  metadataSources: Array<{ provider?: string | null; externalId?: string | null; sourceUrl?: string | null; retrievedAt?: string | null }>;
  contentAvailability: { hasPdf: boolean; hasFullText: boolean; hasAnalysis?: boolean; processingStatus: string };
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 100;
const PROJECT_CONCURRENCY = 4;

async function getRepositoryPaperAssets(): Promise<RepositoryPaperAssetResponse[]> {
  const items: RepositoryPaperAssetResponse[] = [];
  let cursor: string | undefined;
  const seenCursors = new Set<string>();

  do {
    const response = await api.get<ApiResponse<RepositoryPaperAssetPage>>(
      "/admin/paper-assets/repository",
      { params: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) } },
    );
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Không tải được kho bài báo dùng chung.");
    }

    const page = response.data.data;
    items.push(...page.items);
    cursor = page.nextCursor || undefined;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error("Kho bài báo trả về con trỏ phân trang bị lặp.");
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return items;
}

export async function getAdminRepositoryPaperAnalysis(workId: string): Promise<AdminRepositoryAnalysis | null> {
  const response = await api.get<ApiResponse<AdminRepositoryAnalysis | null>>(
    `/admin/paper-assets/repository/${encodeURIComponent(workId)}/analysis`,
  );
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || "Không tải được phân tích AI của bài báo trong kho chung.");
  }
  return response.data.data;
}

export async function getAdminRepositoryPaperDetails(workId: string): Promise<AdminRepositoryPaperDetails> {
  const response = await api.get<ApiResponse<AdminRepositoryPaperDetails>>(
    `/admin/paper-assets/repository/${encodeURIComponent(workId)}/details`,
  );
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || "KhÃ´ng táº£i Ä‘Æ°á»£c metadata Ä‘áº§y Ä‘á»§ cá»§a bÃ i bÃ¡o.");
  }
  return response.data.data;
}

async function mapConcurrent<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor++;
        results[index] = await mapper(values[index]);
      }
    }),
  );

  return results;
}

async function getAllProjects(): Promise<Project[]> {
  const firstPage = await projectService.getProjects({ pageNumber: 1, pageSize: PAGE_SIZE });
  if (!firstPage.isSuccess) {
    throw new Error(firstPage.message || "Không tải được danh sách dự án.");
  }

  const firstData = firstPage.data;
  const pageNumbers = Array.from(
    { length: Math.max(firstData.totalPages - 1, 0) },
    (_, index) => index + 2,
  );
  const remainingPages = await Promise.all(
    pageNumbers.map(async (pageNumber) => {
      const response = await projectService.getProjects({ pageNumber, pageSize: PAGE_SIZE });
      if (!response.isSuccess) {
        throw new Error(response.message || `Không tải được trang dự án ${pageNumber}.`);
      }
      return response.data.items;
    }),
  );

  return [
    ...firstData.items,
    ...remainingPages.flat(),
  ];
}

async function getProjectPaperAssets(project: Project): Promise<AdminPaperAsset[]> {
  const firstPage = await paperPoolService.getPapers(project.id, {
    pageNumber: 1,
    pageSize: PAGE_SIZE,
  });
  const pageNumbers = Array.from(
    { length: Math.max(firstPage.totalPages - 1, 0) },
    (_, index) => index + 2,
  );
  const remainingPages = await Promise.all(
    pageNumbers.map((pageNumber) =>
      paperPoolService.getPapers(project.id, { pageNumber, pageSize: PAGE_SIZE }),
    ),
  );

  return [firstPage, ...remainingPages]
    .flatMap((page) => page.items)
    .map((paper) => ({
      paper,
      projectId: project.id,
      projectTitle: project.title,
      projectRefs: [{ id: project.id, title: project.title }],
      workId: paper.workId,
      repositoryOnly: false,
    }));
}

/** Combines project paper records and the shared Research Work repository, deduplicating linked records by workId. */
export async function getAdminPaperAssetInventory(): Promise<AdminPaperAsset[]> {
  const [projects, repositoryAssets] = await Promise.all([
    getAllProjects(),
    getRepositoryPaperAssets(),
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const projectAssets = (await mapConcurrent(
    projects,
    PROJECT_CONCURRENCY,
    getProjectPaperAssets,
  )).flat();
  const byWorkId = new Map<string, AdminPaperAsset>();
  const unlinkedProjectAssets: AdminPaperAsset[] = [];

  for (const asset of projectAssets) {
    if (!asset.workId) {
      unlinkedProjectAssets.push(asset);
      continue;
    }
    const existing = byWorkId.get(asset.workId);
    if (existing) {
      const refs = new Map([...existing.projectRefs, ...asset.projectRefs].map((ref) => [ref.id, ref]));
      existing.projectRefs = Array.from(refs.values());
      existing.projectTitle = existing.projectRefs.map((ref) => ref.title).join(", ");
      continue;
    }
    byWorkId.set(asset.workId, asset);
  }

  for (const repositoryAsset of repositoryAssets) {
    const linked = byWorkId.get(repositoryAsset.workId);
    const projectRefs = repositoryAsset.accessPolicy.allowedProjectIds
      .map((id) => projectById.get(id))
      .filter((project): project is Project => Boolean(project))
      .map((project) => ({ id: project.id, title: project.title }));
    if (linked) {
      const projectPaperFields = Object.fromEntries(
        Object.entries(linked.paper).filter(([, value]) => value !== undefined && value !== null && value !== ""),
      ) as Partial<PaperPoolApiResponse>;
      linked.paper = {
        ...repositoryAsset.paper,
        ...projectPaperFields,
        id: linked.paper.id,
        workId: repositoryAsset.workId,
        fullTextAvailable: Boolean(repositoryAsset.paper.fullTextAvailable || linked.paper.fullTextAvailable),
      };
      linked.repository = {
        visibility: repositoryAsset.accessPolicy.visibility,
        createdAt: repositoryAsset.createdAt,
        updatedAt: repositoryAsset.updatedAt,
      };
      const refs = new Map([...linked.projectRefs, ...projectRefs].map((ref) => [ref.id, ref]));
      linked.projectRefs = Array.from(refs.values());
      linked.projectTitle = linked.projectRefs.map((ref) => ref.title).join(", ") || "Kho chung";
      continue;
    }

    byWorkId.set(repositoryAsset.workId, {
      paper: { ...repositoryAsset.paper, id: repositoryAsset.workId, workId: repositoryAsset.workId },
      projectId: null,
      projectTitle: projectRefs.map((ref) => ref.title).join(", ") || "Kho chung",
      projectRefs,
      workId: repositoryAsset.workId,
      repositoryOnly: true,
      repository: {
        visibility: repositoryAsset.accessPolicy.visibility,
        createdAt: repositoryAsset.createdAt,
        updatedAt: repositoryAsset.updatedAt,
      },
    });
  }

  return [...byWorkId.values(), ...unlinkedProjectAssets]
    .sort((left, right) => left.paper.title.localeCompare(right.paper.title, "vi"));
}
