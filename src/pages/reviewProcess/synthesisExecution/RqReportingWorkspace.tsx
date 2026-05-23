import { useMemo, useState } from "react";
import {
  BookOpen,
  BookOpenText,
  CheckCircle2,
  FileText,
  LayoutList,
  Maximize,
  PencilLine,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import type {
  FindingStatus,
  ResearchQuestionFindingDto,
  SaveFindingRequest,
  SynthesisThemeDto,
  SynthesisWorkspaceDto,
} from "../../../types/synthesisExecution";
import RichTextEditor from "./RichTextEditor";

interface RqReportingWorkspaceProps {
  workspace: SynthesisWorkspaceDto;
  themes: SynthesisThemeDto[];
  isReadOnly?: boolean;
  isSavingFinding?: boolean;
  onSaveFinding: (
    findingId: string,
    request: SaveFindingRequest,
  ) => Promise<void>;
  onViewStrategyGuidelines: () => void;
}

function statusChipClassName(status: FindingStatus): string {
  if (status === "Finalized") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function FindingEditor({
  finding,
  isReadOnly,
  isSavingFinding,
  isFullscreen,
  onSaveFinding,
  onViewStrategyGuidelines,
  onToggleFullscreen,
}: {
  finding: ResearchQuestionFindingDto;
  isReadOnly: boolean;
  isSavingFinding: boolean;
  isFullscreen: boolean;
  onSaveFinding: (
    findingId: string,
    request: SaveFindingRequest,
  ) => Promise<void>;
  onViewStrategyGuidelines: () => void;
  onToggleFullscreen: () => void;
}) {
  const [draftAnswerText, setDraftAnswerText] = useState(finding.answerText);
  const [draftStatus, setDraftStatus] = useState<FindingStatus>(finding.status);

  const handleSave = async () => {
    await onSaveFinding(finding.id, {
      answerText: draftAnswerText,
      status: draftStatus,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">
              RQ Reporting Workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              {finding.questionText}
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewStrategyGuidelines}
              className="text-text-secondary hover:text-text-primary"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              View Strategy Guidelines
            </Button>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${statusChipClassName(draftStatus)}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {draftStatus}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Draft the narrative finding, then finalize it when the answer is ready
          for synthesis reporting.
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-text-primary"
          htmlFor="rq-answer"
        >
          Answer Text
        </label>
        <RichTextEditor
          value={draftAnswerText}
          onChange={setDraftAnswerText}
          readOnly={isReadOnly}
          className={isFullscreen ? "min-h-[calc(100vh-18rem)]" : ""}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[4px] border border-border bg-bg-primary p-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">Status</p>
          <p className="mt-1 text-sm text-text-secondary">
            Switch between draft and finalized before saving.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDraftStatus("Draft")}
            disabled={isReadOnly}
            className={`rounded-[4px] border px-4 py-2 text-sm font-semibold transition-colors ${
              draftStatus === "Draft"
                ? "border-amber-300 bg-amber-100 text-amber-800"
                : "border-border bg-surface-white text-text-primary hover:bg-bg-secondary"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => setDraftStatus("Finalized")}
            disabled={isReadOnly}
            className={`rounded-[4px] border px-4 py-2 text-sm font-semibold transition-colors ${
              draftStatus === "Finalized"
                ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                : "border-border bg-surface-white text-text-primary hover:bg-bg-secondary"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Finalized
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex items-center rounded-[4px] border border-border bg-surface-white px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
          >
            <Maximize className="mr-2 h-4 w-4" />
            {isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={handleSave}
          isLoading={isSavingFinding}
          disabled={isReadOnly}
        >
          <PencilLine className="mr-2 h-4 w-4" />
          Save Finding
        </Button>
      </div>

      <div className="rounded-[4px] border border-border bg-bg-primary p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Created: {new Date(finding.createdAt).toLocaleString()}
          </span>
          <span>Modified: {new Date(finding.modifiedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function RqReportingWorkspace({
  workspace,
  themes,
  isReadOnly = false,
  isSavingFinding = false,
  onSaveFinding,
  onViewStrategyGuidelines,
}: RqReportingWorkspaceProps) {
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeFinding = useMemo(() => {
    if (workspace.findings.length === 0) {
      return null;
    }

    return (
      workspace.findings.find((finding) => finding.id === activeFindingId) ??
      workspace.findings[0] ??
      null
    );
  }, [activeFindingId, workspace.findings]);

  if (workspace.findings.length === 0) {
    return (
      <div className="rounded-[4px] border border-border bg-surface-white p-6 shadow-none">
        <div className="flex flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed border-border bg-bg-primary px-6 py-10 text-center">
          <LayoutList className="h-8 w-8 text-text-secondary" />
          <p className="text-sm font-medium text-text-secondary">
            No research questions were returned for this synthesis process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 overflow-y-auto bg-bg-secondary p-4 sm:p-6"
          : "grid gap-6 2xl:grid-cols-[300px_1fr_320px] xl:grid-cols-[290px_1fr]"
      }
    >
      {!isFullscreen ? (
        <aside className="rounded-[4px] border border-border bg-surface-white p-5 shadow-none">
          <div className="mb-4 flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-text-primary">
              Research Questions
            </h2>
          </div>

          <div className="space-y-3">
            {workspace.findings.map((finding) => (
              <button
                key={finding.id}
                type="button"
                onClick={() => setActiveFindingId(finding.id)}
                className={`w-full rounded-[4px] border p-4 text-left transition-all ${
                  activeFinding?.id === finding.id
                    ? "border-blue-200 bg-blue-50/60 shadow-none"
                    : "border-border bg-surface-white hover:border-border hover:bg-bg-primary"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary line-clamp-2">
                      {finding.questionText}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      RQ #{finding.researchQuestionId}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusChipClassName(finding.status)}`}
                  >
                    {finding.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <section
        className={
          isFullscreen
            ? "rounded-[4px] border border-border bg-surface-white p-6 shadow-none min-h-[calc(100vh-2rem)]"
            : "rounded-[4px] border border-border bg-surface-white p-6 shadow-none"
        }
      >
        {activeFinding ? (
          <FindingEditor
            key={activeFinding.id}
            finding={activeFinding}
            isReadOnly={isReadOnly}
            isSavingFinding={isSavingFinding}
            isFullscreen={isFullscreen}
            onSaveFinding={onSaveFinding}
            onViewStrategyGuidelines={onViewStrategyGuidelines}
            onToggleFullscreen={() => setIsFullscreen((current) => !current)}
          />
        ) : (
          <div className="rounded-[4px] border border-dashed border-border bg-bg-primary px-6 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              Select a research question to begin drafting its finding.
            </p>
          </div>
        )}
      </section>

      {!isFullscreen ? (
        <aside className="rounded-[4px] border border-border bg-surface-white p-5 shadow-none xl:col-span-2 2xl:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <BookOpenText className="h-5 w-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-text-primary">
              Theme Reference
            </h3>
          </div>

          {themes.length === 0 ? (
            <div className="rounded-[4px] border border-dashed border-border bg-bg-primary px-4 py-6 text-center">
              <p className="text-sm text-text-secondary">
                No themes available yet. Create themes in Thematic Analysis.
              </p>
            </div>
          ) : (
            <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="rounded-[4px] border border-border bg-bg-primary p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: theme.colorCode ?? "#94a3b8" }}
                    />
                    <p className="text-sm font-semibold text-text-primary">
                      {theme.name}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    {theme.description || "No description provided."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
