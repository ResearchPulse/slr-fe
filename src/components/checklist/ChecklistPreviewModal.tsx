import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { FiDownload, FiPrinter, FiCheckCircle, FiXCircle } from "react-icons/fi";
import type { ReviewChecklist } from "../../types/checklist";

interface ChecklistPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: ReviewChecklist | null;
  onDownloadWord: () => void;
  isDownloading?: boolean;
}

export const ChecklistPreviewModal: React.FC<ChecklistPreviewModalProps> = ({
  isOpen,
  onClose,
  checklist,
  onDownloadWord,
  isDownloading = false,
}) => {
  if (!checklist) return null;

  const sections = checklist.sections ?? [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xem trước Báo cáo PRISMA 2020"
      size="xl"
      description="Bản xem trước danh mục đối soát PRISMA trước khi xuất ra tài liệu Word chính thức."
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="inline-flex items-center gap-2"
          >
            <FiPrinter className="w-4 h-4" />
            In báo cáo
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={onDownloadWord}
              disabled={isDownloading}
              className="inline-flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              {isDownloading ? "Đang tạo file..." : "Tải file Word (.docx)"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 print:overflow-visible print:max-h-none">
        {/* Report Header */}
        <div className="rounded-lg border border-border bg-bg-primary/50 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {checklist.title}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Khuôn mẫu: {checklist.templateName} ({checklist.typeName})
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Tiến độ: {checklist.completionPercentage}%
              </span>
              <p className="text-[11px] text-text-secondary mt-1">
                {checklist.completedItems} / {checklist.totalItems} mục hoàn thành
              </p>
            </div>
          </div>
        </div>

        {/* Sections & Items Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-800 text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-3 w-[20%]">Chủ đề (Topic)</th>
                <th className="px-2 py-3 w-[10%] text-center">Mã số (#)</th>
                <th className="px-4 py-3 w-[45%]">Mục đối soát PRISMA 2020</th>
                <th className="px-3 py-3 w-[15%] text-center">Vị trí (Location)</th>
                <th className="px-2 py-3 w-[10%] text-center">Báo cáo?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface-white">
              {sections.map((section) => (
                <React.Fragment key={section.section}>
                  {/* Section Divider */}
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <td colSpan={5} className="px-3 py-2 text-xs uppercase tracking-wide">
                      {section.displayName}
                      {section.description && (
                        <span className="font-normal text-text-secondary normal-case ml-2">
                          — {section.description}
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Section Items */}
                  {(section.items ?? []).map((item) => {
                    const isCompleted = item.isCompleted || item.isReported;
                    const location = (item.reportLocation || "").trim();

                    return (
                      <tr key={item.itemTemplateId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-text-primary align-top">
                          {item.topic}
                        </td>
                        <td className="px-2 py-2.5 text-center font-bold text-slate-600 align-top">
                          {item.itemNumber}
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary leading-relaxed align-top">
                          {item.description}
                        </td>
                        <td className="px-3 py-2.5 text-center align-top font-mono text-[11px]">
                          {location ? (
                            <span className="text-text-primary font-medium">{location}</span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa điền</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center align-top">
                          {item.isSectionHeaderOnly ? (
                            <span className="text-slate-400">—</span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <FiCheckCircle className="w-3.5 h-3.5" /> Có
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <FiXCircle className="w-3.5 h-3.5" /> Chưa
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              {sections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    Chưa có mục đối soát nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-text-secondary italic">
          Nguồn tham chiếu: The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ 2021;372:n71.
        </p>
      </div>
    </Modal>
  );
};

export default ChecklistPreviewModal;
