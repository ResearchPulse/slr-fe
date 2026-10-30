import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiUploadCloud,
} from "react-icons/fi";
import { Modal } from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Select from "../../components/ui/Select";
import { studySelectionService } from "../../services/studySelectionService";
import {
  getAdminPaperAssetInventory,
  type AdminPaperAsset,
} from "../../services/adminPaperAssetService";
import { toastError, toastSuccess } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errorUtils";

type DocumentFilter = "all" | "pdf" | "markdown" | "missing" | "failed";

const PAGE_SIZE = 10;

function isMarkdownReady(item: AdminPaperAsset): boolean {
  return Boolean(item.paper.metadataUrl || item.paper.metadataFile?.url)
    && (item.paper.pdfFullTextStatus === "COMPLETED" || item.paper.pdfFullTextStatus === "PARTIAL");
}

function PaperAssetsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("all");
  const [uploadTarget, setUploadTarget] = useState<AdminPaperAsset | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [retryingPaperId, setRetryingPaperId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const inventoryQuery = useQuery({
    queryKey: ["admin-paper-assets"],
    queryFn: getAdminPaperAssetInventory,
    staleTime: 60_000,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadTarget?.projectId || !uploadFile) throw new Error("Bài báo này chưa được gắn với dự án để thay PDF.");
      return studySelectionService.uploadPaperFullText({
        file: uploadFile,
        projectId: uploadTarget.projectId,
        paperId: uploadTarget.paper.id,
        extractWithGrobid: true,
      });
    },
    onSuccess: async () => {
      toastSuccess("Đã tải PDF lên. Hệ thống đang trích xuất Markdown toàn văn.");
      const paperId = uploadTarget?.paper.id;
      setUploadTarget(null);
      setUploadFile(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-paper-assets"] });
      if (paperId) {
        await queryClient.invalidateQueries({ queryKey: ["admin-paper-asset-detail", paperId] });
      }
    },
    onError: (error) => toastError(getErrorMessage(error, "Không tải được PDF lên.")),
  });

  const retryMutation = useMutation({
    mutationFn: (item: AdminPaperAsset) => {
      if (!item.projectId) throw new Error("Bài báo trong kho chung chưa có dự án để chạy lại trích xuất.");
      setRetryingPaperId(item.paper.id);
      return studySelectionService.retryExtraction(item.paper.id, {
        provider: "GROBID",
        projectId: item.projectId,
      });
    },
    onSuccess: async () => {
      toastSuccess("Đã gửi yêu cầu trích xuất lại Markdown.");
      await queryClient.invalidateQueries({ queryKey: ["admin-paper-assets"] });
    },
    onError: (error) => toastError(getErrorMessage(error, "Không thể chạy lại trích xuất.")),
    onSettled: () => setRetryingPaperId(null),
  });

  const inventory = inventoryQuery.data ?? [];
  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return inventory.filter((item) => {
      if (normalizedSearch) {
        const searchable = [
          item.paper.title,
          item.paper.authors,
          item.paper.doi,
          item.paper.id,
          item.projectTitle,
        ].filter(Boolean).join(" ").toLocaleLowerCase();
        if (!searchable.includes(normalizedSearch)) return false;
      }

      const hasPdf = Boolean(item.paper.fullTextAvailable || item.paper.pdfUrl);
      const markdownReady = isMarkdownReady(item);
      if (documentFilter === "pdf" && !hasPdf) return false;
      if (documentFilter === "markdown" && !markdownReady) return false;
      if (documentFilter === "missing" && hasPdf && markdownReady) return false;
      if (documentFilter === "failed" && item.paper.pdfProcessingStatus !== "FAILED") return false;
      return true;
    });
  }, [documentFilter, inventory, search]);

  const pdfCount = inventory.filter((item) => item.paper.fullTextAvailable || item.paper.pdfUrl).length;
  const markdownCount = inventory.filter(isMarkdownReady).length;
  const processingCount = inventory.filter((item) =>
    item.paper.pdfProcessingStatus === "PENDING" || item.paper.pdfProcessingStatus === "PROCESSING",
  ).length;
  const failedCount = inventory.filter((item) => item.paper.pdfProcessingStatus === "FAILED").length;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleUpload = () => {
    if (!uploadFile) return;
    const validExtension = uploadFile.name.toLocaleLowerCase().endsWith(".pdf");
    if (!validExtension || (uploadFile.type && uploadFile.type !== "application/pdf")) {
      toastError("Chỉ hỗ trợ file PDF.");
      return;
    }
    uploadMutation.mutate();
  };

  const openUpload = (item: AdminPaperAsset) => {
    setUploadTarget(item);
    setUploadFile(null);
  };

  const viewAsset = (item: AdminPaperAsset) => {
    if (item.repositoryOnly || !item.projectId) {
      navigate(`/admin/paper-files/repository/${encodeURIComponent(item.workId || item.paper.id)}`);
      return;
    }
    navigate(`/admin/paper-files/${encodeURIComponent(item.projectId)}/${encodeURIComponent(item.paper.id)}`);
  };

  if (inventoryQuery.isLoading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-sm text-text-secondary">Đang tải danh mục bài báo và tài liệu…</span>
      </div>
    );
  }

  if (inventoryQuery.isError) {
    return (
      <section className="mx-auto max-w-[1600px] rounded-2xl border border-error/20 bg-surface-white p-6">
        <div className="flex items-start gap-3 text-error">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-text-primary">Không tải được kho tài liệu</h1>
            <p className="mt-1 text-sm text-text-secondary">{getErrorMessage(inventoryQuery.error, "Vui lòng thử lại sau.")}</p>
            <Button className="mt-4" variant="secondary" onClick={() => void inventoryQuery.refetch()}>
              <FiRefreshCw aria-hidden="true" /> Thử tải lại
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-4">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Admin workspace</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-text-primary sm:text-[30px]">Quản lý tài liệu bài báo</h1>
          <p className="mt-1 text-sm text-text-secondary">Theo dõi PDF, trạng thái trích xuất và Markdown toàn văn trên toàn hệ thống.</p>
        </div>
        <Button variant="secondary" onClick={() => void inventoryQuery.refetch()} isLoading={inventoryQuery.isFetching}>
          <FiRefreshCw aria-hidden="true" /> Làm mới dữ liệu
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Thống kê tài liệu">
        <MetricCard icon={<FiBookOpen />} label="Bài báo" value={inventory.length} tone="blue" />
        <MetricCard icon={<FiFileText />} label="Có PDF" value={pdfCount} tone="slate" />
        <MetricCard icon={<FiCheckCircle />} label="Markdown sẵn sàng" value={markdownCount} tone="green" />
        <MetricCard icon={<FiClock />} label="Đang trích xuất" value={processingCount} tone="amber" />
        <MetricCard icon={<FiAlertCircle />} label="Trích xuất lỗi" value={failedCount} tone="red" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1 lg:max-w-md">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <span className="sr-only">Tìm bài báo</span>
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Tìm tiêu đề, tác giả, DOI hoặc ID…"
              className="h-11 w-full rounded-xl border border-border bg-surface-white pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <div className="min-w-0 lg:w-52">
            <Select
              aria-label="Lọc theo trạng thái tài liệu"
              value={documentFilter}
              onChange={(event) => { setDocumentFilter(event.target.value as DocumentFilter); setPage(1); }}
              className="h-11 rounded-xl px-3.5"
              options={[
                { value: "all", label: "Tất cả tài liệu" },
                { value: "pdf", label: "Có PDF" },
                { value: "markdown", label: "Markdown sẵn sàng" },
                { value: "missing", label: "Thiếu PDF / Markdown" },
                { value: "failed", label: "Trích xuất lỗi" },
              ]}
            />
          </div>
          {(search || documentFilter !== "all") && (
            <button type="button" onClick={() => { setSearch(""); setDocumentFilter("all"); setPage(1); }} className="min-h-11 rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Danh mục bài báo</h2>
          <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-secondary">{filteredItems.length.toLocaleString("vi-VN")} bài báo</span>
        </div>

        {visibleItems.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-secondary text-primary"><FiSearch className="h-5 w-5" aria-hidden="true" /></span>
            <h3 className="mt-4 text-sm font-semibold text-text-primary">Không tìm thấy bài báo</h3>
            <p className="mt-1 max-w-md text-sm text-text-secondary">Thử đổi từ khóa hoặc xóa bộ lọc để xem thêm kết quả.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-bg-secondary/70 text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-5 py-3">Bài báo</th>
                  <th className="px-4 py-3">Dự án / nguồn</th>
                  <th className="px-4 py-3">PDF</th>
                  <th className="px-4 py-3">Markdown toàn văn</th>
                  <th className="px-4 py-3">Trích xuất</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleItems.map((item) => (
                  <PaperAssetRow
                    key={item.workId || `${item.projectId || "repository"}-${item.paper.id}`}
                    item={item}
                    onView={() => viewAsset(item)}
                    onUpload={() => openUpload(item)}
                    onRetry={() => retryMutation.mutate(item)}
                    retrying={retryingPaperId === item.paper.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-border px-5 py-3 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>Hiển thị {filteredItems.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} trên {filteredItems.length.toLocaleString("vi-VN")}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="min-h-9 rounded-lg border border-border px-3 disabled:cursor-not-allowed disabled:opacity-40">Trước</button>
            <span className="min-w-20 text-center">Trang {currentPage} / {totalPages}</span>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} className="min-h-9 rounded-lg border border-border px-3 disabled:cursor-not-allowed disabled:opacity-40">Sau</button>
          </div>
        </footer>
      </section>

      <Modal
        isOpen={Boolean(uploadTarget)}
        onClose={() => { if (!uploadMutation.isPending) { setUploadTarget(null); setUploadFile(null); } }}
        title="Tải lên hoặc thay PDF"
        description="File PDF mới sẽ thay tài liệu hiện tại và khởi chạy lại quá trình trích xuất Markdown."
        size="md"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={uploadMutation.isPending} onClick={() => { setUploadTarget(null); setUploadFile(null); }}>Hủy</Button>
            <Button isLoading={uploadMutation.isPending} disabled={!uploadFile} onClick={handleUpload}>
              <FiUploadCloud aria-hidden="true" /> Tải PDF lên
            </Button>
          </div>
        )}
      >
        {uploadTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-bg-secondary/60 p-3">
              <p className="text-xs text-text-muted">Bài báo</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-text-primary">{uploadTarget.paper.title || "Chưa có tiêu đề"}</p>
              <p className="mt-1 text-xs text-text-secondary">{uploadTarget.projectTitle}</p>
            </div>
            <label className="block rounded-xl border border-dashed border-border bg-bg-secondary/40 p-5 text-center focus-within:ring-2 focus-within:ring-primary/20">
              <FiUploadCloud className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
              <span className="mt-2 block text-sm font-medium text-text-primary">Chọn file PDF</span>
              <span className="mt-1 block text-xs text-text-secondary">Chấp nhận định dạng .pdf</span>
              <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
              {uploadFile && <span className="mt-3 block truncate text-xs font-medium text-primary">{uploadFile.name} · {formatBytes(uploadFile.size)}</span>}
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: "blue" | "slate" | "green" | "amber" | "red" }) {
  const colors = {
    blue: "bg-primary-light text-primary",
    slate: "bg-bg-secondary text-text-secondary",
    green: "bg-success/10 text-success",
    amber: "bg-warning/10 text-warning",
    red: "bg-error/10 text-error",
  };
  return (
    <div className="rounded-2xl border border-border bg-surface-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`} aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-text-primary">{value.toLocaleString("vi-VN")}</p>
        </div>
      </div>
    </div>
  );
}

function PaperAssetRow({ item, onView, onUpload, onRetry, retrying }: { item: AdminPaperAsset; onView: () => void; onUpload: () => void; onRetry: () => void; retrying: boolean }) {
  const hasPdf = Boolean(item.paper.fullTextAvailable || item.paper.pdfUrl);
  const markdownReady = isMarkdownReady(item);
  const markdownUrl = item.paper.metadataUrl || item.paper.metadataFile?.url;
  const pdfName = item.paper.pdfFileName || "PDF bài báo";
  const markdownName = item.paper.metadataFile?.fileName || "Markdown toàn văn";

  return (
    <tr className="align-top hover:bg-bg-secondary/40">
      <td className="px-5 py-4">
        <button type="button" onClick={onView} className="block max-w-[440px] text-left focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="line-clamp-2 text-sm font-semibold text-text-primary hover:text-primary">{item.paper.title || "Chưa có tiêu đề"}</span>
          <span className="mt-1 block truncate text-xs text-text-secondary">{item.paper.authors || "Chưa có thông tin tác giả"}</span>
          <span className="mt-1 block truncate text-[11px] text-text-muted">{item.paper.doi || `ID: ${item.paper.id}`}{item.paper.publicationYear ? ` · ${item.paper.publicationYear}` : ""}</span>
        </button>
      </td>
      <td className="max-w-48 px-4 py-4 text-sm text-text-secondary"><span className="line-clamp-2">{item.projectTitle}</span></td>
      <td className="px-4 py-4">
        <StatusBadge tone={hasPdf ? "green" : "neutral"} label={hasPdf ? "Đã có PDF" : "Chưa có PDF"} />
        {hasPdf && item.paper.pdfUrl && (
          <a href={item.paper.pdfUrl} target="_blank" rel="noreferrer" className="mt-1.5 flex max-w-40 items-center gap-1 truncate text-xs text-primary hover:underline" title={pdfName}>
            <FiExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{pdfName}</span>
          </a>
        )}
      </td>
      <td className="px-4 py-4">
        <StatusBadge
          tone={markdownReady ? "green" : item.paper.pdfProcessingStatus === "PENDING" || item.paper.pdfProcessingStatus === "PROCESSING" ? "amber" : item.paper.pdfProcessingStatus === "FAILED" ? "red" : "neutral"}
          label={markdownReady ? "Sẵn sàng" : item.paper.pdfProcessingStatus === "PENDING" || item.paper.pdfProcessingStatus === "PROCESSING" ? "Đang xử lý" : item.paper.pdfProcessingStatus === "FAILED" ? "Trích xuất lỗi" : "Chưa có"}
        />
        {markdownReady && markdownUrl && (
          <a href={markdownUrl} target="_blank" rel="noreferrer" className="mt-1.5 flex max-w-44 items-center gap-1 truncate text-xs text-primary hover:underline" title={markdownName}>
            <FiDownload className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{markdownName}</span>
          </a>
        )}
      </td>
      <td className="px-4 py-4"><ProcessingBadge status={item.paper.pdfProcessingStatus} fullTextStatus={item.paper.pdfFullTextStatus} error={item.paper.pdfProcessingError} /></td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={onView} className="min-h-9 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Chi tiết</button>
          {!item.repositoryOnly && item.projectId && item.paper.pdfProcessingStatus === "FAILED" && <button type="button" onClick={onRetry} disabled={retrying} className="min-h-9 rounded-lg border border-warning/30 px-3 text-xs font-semibold text-warning hover:bg-warning/5 disabled:opacity-50">{retrying ? "Đang gửi…" : "Thử trích xuất lại"}</button>}
          {!item.repositoryOnly && item.projectId && <button type="button" onClick={onUpload} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <FiUploadCloud aria-hidden="true" /> {hasPdf ? "Thay PDF" : "Tải PDF"}
          </button>}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ tone, label }: { tone: "green" | "amber" | "neutral" | "red"; label: string }) {
  const styles = {
    green: "bg-success/10 text-success",
    amber: "bg-warning/10 text-warning",
    neutral: "bg-bg-secondary text-text-secondary",
    red: "bg-error/10 text-error",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}>{label}</span>;
}

function ProcessingBadge({ status, fullTextStatus, error }: { status?: string | null; fullTextStatus?: string | null; error?: string | null }) {
  if (status === "FAILED") {
    return <span className="inline-flex max-w-40 items-center gap-1.5 text-xs font-medium text-error" title={error || "Trích xuất PDF thất bại"}><FiAlertCircle aria-hidden="true" /> Thất bại</span>;
  }
  if (status === "PENDING" || status === "PROCESSING") {
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning"><FiClock aria-hidden="true" /> Đang xử lý</span>;
  }
  if (status === "COMPLETED") {
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success"><FiCheckCircle aria-hidden="true" /> {fullTextStatus === "PARTIAL" ? "Hoàn tất một phần" : "Hoàn tất"}</span>;
  }
  return <span className="text-xs text-text-muted">—</span>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; value >= 1024 && index < units.length; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}

export default PaperAssetsPage;


