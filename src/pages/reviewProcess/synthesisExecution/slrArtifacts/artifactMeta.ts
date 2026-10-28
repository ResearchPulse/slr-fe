import type { SlrArtifactType } from "../../../../services/slrArtifactsService";

export const ARTIFACT_NAMES: Record<SlrArtifactType, string> = {
  A1: "Knowledge Synthesis Matrix",
  A2: "Research Landscape Taxonomy",
  A3: "Scientific Argument Graph",
  A4: "Evidence Quality & Confidence",
  A5: "Context–Conditions–Outcomes",
  A6: "Mechanism–Moderator Map",
  A7: "Contradiction & Uncertainty",
  A8: "Evidence Gap Map",
  A9: "Research Agenda",
  A10: "Traceability & Reproducibility",
};

/** Artifacts grouped by the question they answer (V1-V4 of the 4+1 view model), in reading order. */
export const ARTIFACT_GROUPS: Array<{ label: string; types: SlrArtifactType[] }> = [
  { label: "Landscape", types: ["A2"] },
  { label: "Evidence synthesis", types: ["A1", "A4", "A5", "A6"] },
  { label: "Argument & contradiction", types: ["A3", "A7"] },
  { label: "Gap & agenda", types: ["A8", "A9", "A10"] },
];

export const ARTIFACT_ORDER: SlrArtifactType[] = ARTIFACT_GROUPS.flatMap((group) => group.types);

export const ARTIFACT_OPTIONS = ARTIFACT_GROUPS.flatMap((group) =>
  group.types.map((type) => ({ value: type, label: `${type} · ${ARTIFACT_NAMES[type]}`, group: group.label })),
);
