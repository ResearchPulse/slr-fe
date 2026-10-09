import React, { useState, useEffect } from "react";
import { useProject, useProjectMutations } from "../../../hooks/useProjects";
import type { Project } from "../../../types/project";
import FormField from "../../ui/FormField";
import FormTextarea from "../../ui/FormTextarea";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Drawer from "../../ui/Drawer";
import { toastSuccess, toastError } from "../../../utils/toast";
import { cn } from "../../../utils/cn";
import { FiPlus, FiSave, FiInfo, FiLayers, FiFileText, FiCalendar, FiAlertCircle, FiUpload } from "react-icons/fi";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  isViewOnly?: boolean;
  onSuccess?: (project: Project) => void;
}

export default function ProjectFormModal({
  isOpen,
  onClose,
  projectId,
  isViewOnly = false,
  onSuccess,
}: ProjectFormModalProps) {
  const isEditMode = Boolean(projectId);

  // Data fetching
  const { project, isLoading: isInitialLoading } = useProject(projectId);

  // Mutations
  const {
    createProject,
    isCreating,
    createProjectFromOsfFile,
    isCreatingFromOsfFile,
    updateProject,
    isUpdating,
    updateProjectDates,
  } =
    useProjectMutations();

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    domain: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [osfFile, setOsfFile] = useState<File | null>(null);
  const [creationMode, setCreationMode] = useState<"manual" | "osf">("manual");

  // Initialize form data when project is loaded
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (project && isOpen) {
        setFormData({
          code: project.code,
          title: project.title,
          domain: project.domain || "",
          description: project.description || "",
          startDate: project.startDate ? project.startDate.split("T")[0] : "",
          endDate: project.endDate ? project.endDate.split("T")[0] : "",
        });
      } else if (!isEditMode && isOpen) {
        // Clear form when opening for creation
        setFormData({
          code: "",
          title: "",
          domain: "",
          description: "",
          startDate: "",
          endDate: "",
        });
        setErrors({});
        setOsfFile(null);
        setCreationMode("manual");
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [project, isOpen, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (creationMode === "manual" && !formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề cho dự án nghiên cứu.";
    } else if (creationMode === "manual" && formData.title.trim().length > 200) {
      newErrors.title = `Tiêu đề nghiên cứu không được vượt quá 200 ký tự (hiện tại: ${formData.title.trim().length}/200).`;
    }
    if (creationMode === "manual" && !formData.domain.trim()) {
      newErrors.domain = "Vui lòng nhập lĩnh vực nghiên cứu.";
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate).getTime() > new Date(formData.endDate).getTime()) {
        newErrors.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
      }
    }
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = `Tóm tắt dự án không được vượt quá 2000 ký tự (hiện tại: ${formData.description.length}/2000).`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditMode && projectId) {
        // Update basic project metadata
        const result = await updateProject({
          id: projectId,
          data: {
            id: projectId,
            name: formData.title,
            domain: formData.domain,
            description: formData.description,
          },
        });

        // Chỉ cập nhật ngày tháng khi người dùng thực sự thay đổi chúng trên form (trong trường hợp được phép sửa)
        const originalStartDate = project?.startDate ? project.startDate.split("T")[0] : "";
        const originalEndDate = project?.endDate ? project.endDate.split("T")[0] : "";
        const hasDatesChanged = formData.startDate !== originalStartDate || formData.endDate !== originalEndDate;

        if (hasDatesChanged) {
          try {
            await updateProjectDates({
              id: projectId,
              data: {
                id: projectId,
                startDate: formData.startDate ? formData.startDate : null,
                endDate: formData.endDate ? formData.endDate : null,
              },
            });
          } catch (dateErr) {
            console.warn("Không thể cập nhật ngày tháng do phân quyền:", dateErr);
            toastError("Lưu ngày tháng thất bại", "Chỉ có Trưởng nhóm dự án (Project Leader) mới có quyền thay đổi ngày bắt đầu/kết thúc.");
          }
        }

        if (result.isSuccess) {
          toastSuccess(
            "Đã cập nhật dự án",
            "Thông tin chi tiết của dự án đã được cập nhật thành công.",
          );
          onSuccess?.(result.data);
          onClose();
        }
      } else {
        if (creationMode === "osf") {
          if (!osfFile) {
            setErrors({ osfFile: "Vui lòng chọn file OSF." });
            return;
          }
          const result = await createProjectFromOsfFile(osfFile);
          if (result.isSuccess && (formData.startDate || formData.endDate)) {
            await updateProjectDates({
              id: result.data.id,
              data: {
                id: result.data.id,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
              },
            });
          }
          if (result.isSuccess) {
            toastSuccess("Đã tạo dự án", "Dự án đã được tạo từ file OSF thành công.");
            onSuccess?.(result.data);
            onClose();
          }
          return;
        }

        // Create new project with basic info first
        const result = await createProject({
          name: formData.title,
          domain: formData.domain,
          description: formData.description,
        });

        // Set dates if they are provided
        if (result.isSuccess && (formData.startDate || formData.endDate)) {
          try {
            await updateProjectDates({
              id: result.data.id,
              data: {
                id: result.data.id,
                startDate: formData.startDate ? formData.startDate : null,
                endDate: formData.endDate ? formData.endDate : null,
              },
            });
          } catch (dateErr) {
            console.warn("Không thể gán ngày tháng khi tạo mới dự án:", dateErr);
          }
        }

        if (result.isSuccess) {
          toastSuccess(
            "Đã tạo dự án",
            "Dự án nghiên cứu mới đã được khởi tạo thành công.",
          );
          onSuccess?.(result.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      console.error("Project submission error:", err);
      const maybeErr = err as {
        response?: { data?: { message?: string; errors?: any } };
        message?: string;
      };
      let errorMessage =
        maybeErr.response?.data?.message ||
        maybeErr.message ||
        "Đã xảy ra lỗi không xác định trong quá trình gửi biểu mẫu.";

      if (errorMessage.includes("Validation error") || errorMessage.includes("200")) {
        if (errorMessage.includes("name") || errorMessage.includes("title")) {
          errorMessage = "Tiêu đề nghiên cứu vượt quá độ dài tối đa 200 ký tự. Vui lòng rút gọn lại.";
        }
      }
      toastError("Lưu thất bại", errorMessage);
    }
  };

  const isSubmitting = isEditMode ? isUpdating : isCreating || isCreatingFromOsfFile;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isViewOnly ? "Chi tiết Dự án" : (isEditMode ? "Cấu hình Dự án" : "Tạo mới dự án SLR")}
      description={
        isViewOnly
          ? "Xem thông tin chi tiết và dòng thời gian của dự án nghiên cứu."
          : (isEditMode
              ? "Cập nhật các tham số có thể chỉnh sửa của dự án."
              : "Khởi tạo một dự án nghiên cứu mới theo quy trình chuẩn.")
      }
      maxWidth="max-w-2xl"
      side="right"
      /* Ghìm các nút Hủy / Lưu xuống chân trang của Drawer cố định cực kỳ đẹp mắt */
      footer={!isViewOnly ? (
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50",
              isSubmitting && "animate-pulse",
            )}
          >
            {isSubmitting ? (
              "Đang xử lý..."
            ) : (
              <>
                {isEditMode ? <FiSave size={18} /> : <FiPlus size={18} />}
                {isEditMode ? "Lưu thay đổi" : "Khởi tạo dự án"}
              </>
            )}
          </button>
        </div>
      ) : undefined}
    >
      {isInitialLoading && isEditMode ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">
            Đang tải thông tin...
          </p>
        </div>
      ) : isViewOnly ? (
        /* --- CHẾ ĐỘ 1: XEM CHI TIẾT (VIEW ONLY - CHỈ ĐỌC) --- */
        /* Loại bỏ hoàn toàn nút đóng thừa ở chân trang theo yêu cầu (đóng bằng nút X ở header) */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Mã dự án */}
              <div className="space-y-1 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <FiInfo size={12} className="text-indigo-400" />
                  Mã dự án (Không thể sửa)
                </div>
                <div className="text-sm font-black text-accent tracking-wider uppercase mt-1">
                  {formData.code || "N/A"}
                </div>
              </div>

              {/* Tiêu đề nghiên cứu */}
              <div className="space-y-1 px-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <FiFileText size={12} className="text-indigo-400" />
                  Tiêu đề nghiên cứu
                </div>
                <div className="text-sm font-bold text-slate-800 leading-relaxed mt-1">
                  {formData.title || "N/A"}
                </div>
              </div>

              {/* Lĩnh vực nghiên cứu */}
              <div className="space-y-1 px-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <FiLayers size={12} className="text-indigo-400" />
                  Lĩnh vực nghiên cứu
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {formData.domain || "N/A"}
                </div>
              </div>

              {/* Dòng thời gian (Ngày bắt đầu & Ngày kết thúc) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 border border-slate-100/50 rounded-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <FiCalendar size={12} className="text-indigo-400" />
                    Ngày bắt đầu
                  </div>
                  <div className="text-sm font-bold text-slate-700 mt-1">
                    {project?.startDate
                      ? new Date(project.startDate).toLocaleDateString("vi-VN")
                      : "Chưa bắt đầu"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <FiCalendar size={12} className="text-indigo-400" />
                    Ngày kết thúc
                  </div>
                  <div className="text-sm font-bold text-slate-700 mt-1">
                    {project?.endDate
                      ? new Date(project.endDate).toLocaleDateString("vi-VN")
                      : "Chưa xác định"}
                  </div>
                </div>
              </div>
            </div>

            {/* Tóm tắt mô tả */}
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <FiInfo size={12} className="text-indigo-400" />
                Tóm tắt dự án (Mô tả)
              </div>
              <div className="text-sm text-slate-700 font-medium italic leading-relaxed border-l-2 border-indigo-100 pl-4 py-1 mt-1 whitespace-pre-line bg-indigo-50/5 rounded-r-md">
                {formData.description || "Không có mô tả chi tiết."}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- CHẾ ĐỘ 2: CHỈNH SỬA / TẠO MỚI (EDIT / CREATE MODE) --- */
        /* Đặt ID form để kích hoạt nút submit từ footer cố định của Modal bên ngoài */
        <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-5">
            {!isEditMode && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode("manual");
                      setOsfFile(null);
                      setErrors({});
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                      creationMode === "manual"
                        ? "bg-white text-accent shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    Nhập thông tin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode("osf");
                      setErrors({});
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                      creationMode === "osf"
                        ? "bg-white text-accent shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    Upload file OSF
                  </button>
                </div>
              </div>
            )}
            {!isEditMode && creationMode === "osf" && (
              <div className="rounded-xl border border-dashed border-accent bg-primary-light/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary-light p-2 text-accent">
                    <FiUpload size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Tạo dự án bằng file OSF
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Chọn file .md, .markdown hoặc .txt đã xuất từ OSF. Hệ thống sẽ tự lấy tiêu đề,
                      lĩnh vực và mô tả để tạo dự án.
                    </p>
                    <label
                      htmlFor="osf-file"
                      className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-accent bg-white px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-primary-light"
                    >
                      <FiUpload size={16} />
                      {osfFile ? "Chọn file khác" : "Chọn file OSF"}
                    </label>
                    <input
                      id="osf-file"
                      name="osfFile"
                      type="file"
                      accept=".md,.markdown,.txt,text/markdown,text/plain"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setOsfFile(file);
                        if (file) {
                          setErrors({});
                        }
                      }}
                    />
                    {osfFile && (
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                        <FiFileText size={14} />
                        <span className="truncate">{osfFile.name}</span>
                        <button
                          type="button"
                          className="ml-1 text-slate-400 hover:text-red-600"
                          onClick={() => setOsfFile(null)}
                          aria-label="Xóa file OSF đã chọn"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {errors.osfFile && (
                      <p className="mt-2 text-xs font-medium text-red-600">{errors.osfFile}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {(isEditMode || creationMode === "manual") && (
            <div className="grid grid-cols-1 gap-5">
              {/* TIÊU ĐỀ NGHIÊN CỨU (Luôn hiển thị ở cả Edit và Create) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="title" className="text-sm font-semibold text-text-primary">
                    Tiêu đề nghiên cứu <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={cn(
                      "text-xs font-mono transition-colors",
                      formData.title.length > 200
                        ? "text-red-600 font-bold"
                        : formData.title.length > 180
                          ? "text-amber-600 font-semibold"
                          : "text-slate-400"
                    )}
                  >
                    {formData.title.length}/200 ký tự
                  </span>
                </div>

                <FormField
                  id="title"
                  label=""
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  errorMessage={errors.title}
                  placeholder="Ví dụ: Tác động của Generative AI trong Tự động hóa Lập trình"
                  containerClassName="space-y-0"
                  className={cn(
                    "rounded-lg border-border bg-white py-3 font-medium text-text-primary placeholder:text-text-secondary/60 focus:bg-white shadow-none",
                    formData.title.length > 200 && "border-red-500 focus:border-red-500 focus:ring-red-100"
                  )}
                  required={isEditMode || creationMode === "manual"}
                />

                {/* Alert cảnh báo trực quan khi vượt quá 200 ký tự */}
                {formData.title.length > 200 && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in duration-200">
                    <FiAlertCircle className="mt-0.5 shrink-0 text-red-500" size={16} />
                    <div className="leading-relaxed">
                      <span className="font-bold">Cảnh báo vượt quá 200 chữ: </span>
                      Tiêu đề nghiên cứu đang dài <strong>{formData.title.length} ký tự</strong> (vượt quá giới hạn cho phép là <strong>200 ký tự</strong>). Vui lòng rút gọn tiêu đề để có thể lưu thành công.
                    </div>
                  </div>
                )}
              </div>

              {/* LĨNH VỰC NGHIÊN CỨU (Hiển thị và cho phép chỉnh sửa ở cả Edit và Create) */}
              <div className="space-y-2">
                <FormField
                  id="domain"
                  label="Lĩnh vực nghiên cứu"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  errorMessage={errors.domain}
                  placeholder="Ví dụ: Khoa học máy tính, Y sinh, Giáo dục..."
                  containerClassName="space-y-1.5"
                  className="rounded-lg border-border bg-white py-3 font-medium text-text-primary placeholder:text-text-secondary/60 focus:bg-white shadow-none"
                  required={isEditMode || creationMode === "manual"}
                />
              </div>
              {/* DÒNG THỜI GIAN (Ngày bắt đầu & Ngày kết thúc) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="startDate"
                  label="Ngày bắt đầu"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  errorMessage={errors.startDate}
                  containerClassName="space-y-1.5"
                  className="rounded-lg border-border bg-white py-3 font-medium text-text-primary focus:bg-white shadow-none"
                />
                <FormField
                  id="endDate"
                  label="Ngày kết thúc"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  errorMessage={errors.endDate}
                  containerClassName="space-y-1.5"
                  className="rounded-lg border-border bg-white py-3 font-medium text-text-primary focus:bg-white shadow-none"
                />
              </div>
            </div>
            )}
          </div>

          {/* TÓM TẮT DỰ ÁN / MÔ TẢ (Kéo dài tối đa ra toàn bộ khung Drawer để cân đối với chiều cao màn hình) */}
          {(isEditMode || creationMode === "manual") && (
          <div className="space-y-2">

            <FormTextarea
              id="description"
              label="Tóm tắt dự án"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Mô tả ngắn gọn về mục tiêu và tầm quan trọng của nghiên cứu..."
              rows={7}
              containerClassName="space-y-2"
              className="min-h-[200px] resize-y rounded-lg border-border bg-white p-3.5 font-normal not-italic leading-6 text-text-primary placeholder:text-text-secondary/60 focus:bg-white shadow-none"
            />
          </div>
          )}

          {/* Huy hiệu Workflow tiêu chuẩn (Chỉ hiển thị khi Tạo mới) */}
          {!isEditMode && (
            <div className="p-5 bg-bg-secondary/50 border border-indigo-100/50 rounded-xl flex items-start gap-4 shadow-none shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-accent shrink-0 border border-indigo-200">
                <FiLayers size={18} />
              </div>
              <div className="space-y-1 mt-0.5">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                  Quy trình tiêu chuẩn
                </p>
                <p className="text-xs text-indigo-900 font-bold leading-tight mt-1">
                  Dự án sẽ được bắt đầu dưới dạng <span className="text-accent font-black">Bản nháp (Draft)</span>.
                </p>
                <p className="text-[10px] text-indigo-700/60 font-medium mt-1">
                  Bạn có thể tinh chỉnh các tham số trước khi kích hoạt quy trình đánh giá đầy đủ.
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </Drawer>
  );
}
