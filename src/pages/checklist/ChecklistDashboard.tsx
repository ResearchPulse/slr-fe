import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiChevronRight,
  FiTrash2,
  FiArrowLeft,
} from "react-icons/fi";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import { cn } from "../../utils/cn";
import { ChecklistType, type ReviewChecklist } from "../../types/checklist";
import type { ChecklistTemplateSummaryDto } from "../../types/checklistApi";

interface ChecklistDashboardPageProps {
  projectId: string;
  checklists?: ReviewChecklist[];
  templates?: ChecklistTemplateSummaryDto[];
  isLoading?: boolean;
  onCreateChecklist?: (templateId: string) => Promise<void>;
}

const ChecklistDashboardPage: React.FC<ChecklistDashboardPageProps> = ({
  projectId: propsProjectId,
  checklists: propChecklists = [],
  templates = [],
  isLoading = false,
  onCreateChecklist,
}) => {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectId = propsProjectId || paramProjectId;
  const safeChecklists = Array.isArray(propChecklists) ? propChecklists : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChecklist = async (templateId: string) => {
    if (!onCreateChecklist) return;

    try {
      setIsCreating(true);
      await onCreateChecklist(templateId);
      setShowCreateModal(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-white">
      <div className="bg-linear-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(projectId ? `/projects/${projectId}` : "/projects")}
              className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
              title="Quay lại dự án"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-1">
                PRISMA 2020 Checklists
              </h1>
              <p className="text-text-secondary">
                Manage systematic review reporting checklists for this project
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            New Checklist
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : safeChecklists.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 border-2 border-dashed border-border rounded-xl bg-surface-white/60 max-w-xl mx-auto my-6 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4 ring-1 ring-accent/20">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No checklists yet
            </h3>
            <p className="text-text-secondary text-sm max-w-sm mb-6 leading-relaxed">
              Create your first PRISMA checklist to track and evaluate your systematic review reporting items.
            </p>
            <div className="flex justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                Create First Checklist
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {safeChecklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                onOpen={() =>
                  navigate(`/projects/${projectId}/checklists/${checklist.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      <CreateChecklistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        templates={safeTemplates}
        onSelectTemplate={handleCreateChecklist}
        isLoading={isCreating}
      />
    </div>
  );
};

interface ChecklistCardProps {
  checklist: ReviewChecklist;
  onOpen: () => void;
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({ checklist, onOpen }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const completionPercentage = Number(checklist?.completionPercentage) || 0;
  const isComplete = completionPercentage >= 100;
  const completedItems = Number(checklist?.completedItems) || 0;
  const totalItems = Number(checklist?.totalItems) || 0;

  return (
    <div
      className={cn(
        "border rounded-[4px] p-5 hover:shadow-none transition-all cursor-pointer group",
        isComplete
          ? "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
          : "bg-surface-white border-border hover:border-indigo-300",
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
            {checklist?.title || "Checklist"}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Based on {checklist?.templateName || "PRISMA"} ({checklist?.typeName || "Standard"})
          </p>
        </div>
        <FiChevronRight className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors shrink-0" />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-text-secondary">
            Progress
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              isComplete ? "text-emerald-600" : "text-accent",
            )}
          >
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              isComplete
                ? "bg-linear-to-r from-emerald-400 to-emerald-600"
                : "bg-linear-to-r from-indigo-400 to-indigo-600",
            )}
            style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {completedItems} of {totalItems} items completed
        </p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-text-secondary">
          <div className="flex items-center gap-1">
            <FiClock className="w-4 h-4" />
            <span>{formatDate(checklist?.updatedAt)}</span>
          </div>
          {isComplete && (
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <FiCheckCircle className="w-4 h-4" />
              <span>Complete</span>
            </div>
          )}
        </div>
        <button
          className="p-1 hover:bg-bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete checklist"
        >
          <FiTrash2 className="w-4 h-4 text-text-secondary hover:text-red-600" />
        </button>
      </div>
    </div>
  );
};

interface CreateChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ChecklistTemplateSummaryDto[];
  onSelectTemplate: (templateId: string) => Promise<void>;
  isLoading?: boolean;
}

const CreateChecklistModal: React.FC<CreateChecklistModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
  isLoading = false,
}) => {
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const handleSelect = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    await onSelectTemplate(templateId);
    setSelectedTemplateId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Checklist"
      size="lg"
    >
      <div className="space-y-4">
        {safeTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template.id)}
            disabled={isLoading}
            className="w-full text-left p-4 border-2 border-border rounded-[4px] hover:border-indigo-300 hover:bg-bg-secondary transition-all disabled:opacity-50"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">
                  {template.name}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {template.description}
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  {template.itemCount} items • {template.version}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-1 rounded",
                    template.isSystem
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {template.isSystem ? "System" : "Custom"}
                </span>
                <p
                  className={cn(
                    "text-xs font-semibold px-2 py-1 rounded",
                    template.type === ChecklistType.FULL
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {template.typeName}
                </p>
                {selectedTemplateId === template.id && isLoading && (
                  <div className="mt-2 flex justify-end">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
        {templates.length === 0 && (
          <div className="p-4 text-sm text-text-secondary bg-bg-primary border border-dashed border-border rounded-[4px]">
            No templates are available.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default ChecklistDashboardPage;
