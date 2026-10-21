export type ArgumentNodeType = "I" | "RA" | "CA" | "PA" | "MA";
export type ArgumentGraphStatus = "DRAFT" | "SUBMITTED" | "APPROVED";
export type ArgumentLinkType = "RA" | "CA" | "PA" | "MA";

export interface ArgumentSourceAnchor {
  exactQuote: string;
  sourceAssetId: string | null;
  sourceRevision: string | null;
  sourceHash: string | null;
  startOffset: number | null;
  endOffset: number | null;
  pdfPage: number | null;
  section: string | null;
  paragraph: string | null;
  pdfHighlightCoordinates: string | null;
  quoteHash: string;
}

export interface ArgumentNode {
  id: string;
  type: ArgumentNodeType;
  text: string;
  normalizedClaimId: string | null;
  source: ArgumentSourceAnchor | null;
}

export interface ArgumentEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface ArgumentGraph {
  id: string;
  projectId: string;
  paperId: string;
  paperTitle: string;
  status: ArgumentGraphStatus;
  version: number;
  nodes: ArgumentNode[];
  edges: ArgumentEdge[];
  createdById: string;
  createdAt: string;
  modifiedAt: string;
  submittedById: string | null;
  submittedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
}

export interface ArgumentGraphSummary {
  id: string;
  paperId: string;
  paperTitle: string;
  status: ArgumentGraphStatus | "NOT_STARTED";
  version: number;
  nodeCount: number;
  edgeCount: number;
  modifiedAt: string | null;
}

export interface ArgumentWebLink {
  id: string;
  projectId: string;
  fromPaperId: string;
  fromNodeId: string;
  toPaperId: string;
  toNodeId: string;
  relation: ArgumentLinkType;
  note: string | null;
  createdById: string;
  createdAt: string;
}

export interface ArgumentWebNode extends ArgumentNode {
  webNodeId: string;
  paperId: string;
  paperTitle: string;
  graphId: string;
}

export interface ArgumentWebEdge extends ArgumentEdge {
  webFromNodeId: string;
  webToNodeId: string;
  paperId: string;
}

export interface ArgumentWeb {
  totalGraphs: number;
  approvedGraphs: number;
  totalNodes: number;
  totalEdges: number;
  totalLinks: number;
  nodes: ArgumentWebNode[];
  graphEdges: ArgumentWebEdge[];
  links: ArgumentWebLink[];
}

export interface UpsertArgumentGraphRequest {
  expectedVersion?: number;
  nodes: Array<{
    id: string;
    type: ArgumentNodeType;
    text: string;
    normalizedClaimId?: string | null;
    source: (Omit<ArgumentSourceAnchor, "quoteHash"> & { quoteHash?: string }) | null;
  }>;
  edges: ArgumentEdge[];
}

export interface CreateArgumentWebLinkRequest {
  fromPaperId: string;
  fromNodeId: string;
  toPaperId: string;
  toNodeId: string;
  relation: ArgumentLinkType;
  note?: string | null;
}
