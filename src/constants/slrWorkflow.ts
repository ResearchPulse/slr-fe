export type SLRPhaseKey = "planning" | "conducting" | "reporting";

export interface SLRWorkflowModule {
  id: string;
  title: string;
  description: string;
  route?: string;
  links?: { label: string; route: string }[];
  availability: "available" | "planned";
}

export interface SLRWorkflowPhase {
  id: SLRPhaseKey;
  letter: "A" | "B" | "C";
  title: string;
  summary: string;
  accent: string;
}

export const SLR_WORKFLOW_PHASES: SLRWorkflowPhase[] = [
  {
    id: "planning",
    letter: "A",
    title: "Planning the Review",
    summary: "Define the question, scope, eligibility and protocol before the review begins.",
    accent: "border-l-primary",
  },
  {
    id: "conducting",
    letter: "B",
    title: "Conducting the Review",
    summary: "Search, select and assess studies, then extract and synthesize evidence.",
    accent: "border-l-success",
  },
  {
    id: "reporting",
    letter: "C",
    title: "Reporting the Review",
    summary: "Present the review flow and organize results for transparent reporting.",
    accent: "border-l-accent",
  },
];

export const PLANNING_MODULES: SLRWorkflowModule[] = [
  { id: "scope", title: "Research scope & PICOC", description: "Set the review intent, field and PICOC criteria.", route: "/projects/:projectId/overview#review-protocol", availability: "available" },
  { id: "questions", title: "Research question builder", description: "Review the protocol questions and objectives.", route: "/projects/:projectId/overview#review-protocol", availability: "available" },
  { id: "search", title: "Search strategy & pilot search", description: "Document sources and run literature searches.", route: "/projects/:projectId/processes/:processId/identification/:identificationPhaseId", availability: "available" },
  { id: "eligibility", title: "Eligibility criteria & screening plan", description: "Configure criteria and reviewer screening.", route: "/projects/:projectId/screening", availability: "available" },
  { id: "analysis-plan", title: "Quality, extraction & synthesis plan", description: "Open the configuration workspace for each analysis method.", links: [{ label: "Quality assessment", route: "/projects/:projectId/quality-assessment" }, { label: "Data extraction", route: "/projects/:projectId/extraction" }, { label: "Evidence synthesis", route: "/projects/:projectId/synthesis/overview" }], availability: "available" },
  { id: "protocol", title: "Protocol builder & quality review", description: "Review the saved project protocol and its setup.", route: "/projects/:projectId/overview", availability: "available" },
  { id: "registration", title: "Register protocol", description: "OSF or registry submission tracking is not available in this workspace yet.", availability: "planned" },
];

export const REPORTING_MODULES: SLRWorkflowModule[] = [
  { id: "prisma", title: "PRISMA flow diagram", description: "Generate, review and export the study flow report.", route: "/projects/:projectId/processes/:processId/prisma-report", availability: "available" },
  { id: "results", title: "Results & evidence summary", description: "Review themes, evidence and research question findings.", route: "/projects/:projectId/synthesis/rq-reporting", availability: "available" },
  { id: "manuscript", title: "SLR manuscript", description: "A dedicated manuscript editor is not available yet.", availability: "planned" },
  { id: "checklist", title: "Reporting checklist & validation", description: "A dedicated reporting checklist is not available yet.", availability: "planned" },
  { id: "export", title: "Export & publication", description: "Export the PRISMA flow report and synthesis outputs.", route: "/projects/:projectId/processes/:processId/prisma-report", availability: "available" },
];
