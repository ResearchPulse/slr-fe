import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import ChecklistDashboardPage from "../../pages/checklist/ChecklistDashboard";
import { checklistApi } from "../../services/checklistService";
import { type ReviewChecklist } from "../../types/checklist";
import type {
  ChecklistTemplateSummaryDto,
  ReviewChecklistSummaryDto,
} from "../../types/checklistApi";
import { toastError, toastSuccess } from "../../utils/toast";
import Button from "../../components/ui/Button";

const mapReviewChecklistSummary = (
  checklist: ReviewChecklistSummaryDto,
): ReviewChecklist => {
  const itemCount = Number(checklist?.itemCount) || 0;
  const completionPercentage = Number(checklist?.completionPercentage) || 0;
  const completedItems = Math.round((itemCount * completionPercentage) / 100);

  return {
    id: checklist?.reviewChecklistId || (checklist as { id?: string })?.id || "",
    projectId: checklist?.reviewId || "",
    reviewId: checklist?.reviewId || "",
    templateId: checklist?.templateId || "",
    templateName: checklist?.templateName || "PRISMA Checklist",
    templateType: checklist?.templateType ?? 0,
    typeName: checklist?.typeName || "Full Review",
    title: checklist?.reviewTitle || "Systematic Literature Review",
    createdAt: checklist?.lastUpdatedAt || new Date().toISOString(),
    updatedAt: checklist?.lastUpdatedAt || new Date().toISOString(),
    responses: [],
    completionPercentage,
    totalItems: itemCount,
    completedItems,
  };
};

export default function ChecklistDashboardPageWrapper() {
  const { projectId, id } = useParams<{ projectId?: string; id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reviewId = projectId || id || "";

  const templatesQuery = useQuery<ChecklistTemplateSummaryDto[]>({
    queryKey: ["checklist-templates"],
    queryFn: () => checklistApi.getTemplates(),
    retry: 1,
  });

  const checklistQuery = useQuery<ReviewChecklistSummaryDto[]>({
    queryKey: ["review-checklists", reviewId],
    queryFn: async () => {
      if (!reviewId) return [];
      return checklistApi.getReviewChecklists(reviewId);
    },
    enabled: Boolean(reviewId),
    retry: 1,
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!reviewId) {
        throw new Error("Missing review id");
      }
      return checklistApi.cloneTemplateToReview(reviewId, { templateId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["review-checklists", reviewId],
      });
      toastSuccess(
        "Checklist created",
        "The PRISMA checklist is ready for editing.",
      );
    },
    onError: (error) => {
      toastError(
        "Checklist creation failed",
        error instanceof Error
          ? error.message
          : "Unable to create checklist from template",
      );
    },
  });

  // Handle critical query errors gracefully
  if ((checklistQuery.isError || templatesQuery.isError) && !checklistQuery.isLoading && !templatesQuery.isLoading) {
    const errorMessage =
      checklistQuery.error instanceof Error
        ? checklistQuery.error.message
        : templatesQuery.error instanceof Error
          ? templatesQuery.error.message
          : "Không thể tải danh sách checklist từ máy chủ";

    return (
      <div className="min-h-screen bg-surface-white">
        <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4 ring-8 ring-red-50">
            <FiAlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Không thể tải dữ liệu Checklist
          </h2>
          <p className="text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/projects/${reviewId}`)}
              className="inline-flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Quay lại dự án
            </Button>
            <Button
              onClick={() => {
                checklistQuery.refetch();
                templatesQuery.refetch();
              }}
              className="inline-flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rawChecklists = Array.isArray(checklistQuery.data)
    ? checklistQuery.data
    : [];

  const rawTemplates = Array.isArray(templatesQuery.data)
    ? templatesQuery.data
    : [];

  const checklistCards = rawChecklists.map(mapReviewChecklistSummary);

  return (
    <ChecklistDashboardPage
      projectId={reviewId}
      checklists={checklistCards}
      templates={rawTemplates}
      isLoading={checklistQuery.isLoading || templatesQuery.isLoading}
      onCreateChecklist={async (templateId) => {
        await createChecklistMutation.mutateAsync(templateId);
      }}
    />
  );
}
