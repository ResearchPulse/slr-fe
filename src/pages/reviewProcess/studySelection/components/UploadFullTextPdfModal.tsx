import { useRef, useState } from "react";
import {
  FiCheckSquare,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiFileText,
  FiInfo,
  FiLoader,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { toastError } from "../../../../utils/toast";
import Modal from "../../../../components/ui/Modal";
import Tooltip from "../../../../components/ui/Tooltip";
import Button from "../../../../components/ui/Button";
import { cn } from "../../../../utils/cn";
import { hasIncompleteMetadata } from "../metadataEnhancement";
import type { UploadPdfOptions } from "../uploadTypes";

interface UploadFullTextPdfModalProps {
  isOpen: boolean;
  isUploading: boolean;
  paper: {
    title: string;
    authors: string | null;
    doi: string | null;
    abstract: string | null;
    journal: string | null;
  };
  onClose: () => void;
  onSubmit: (file: File, options: UploadPdfOptions) => Promise<unknown>;
}

const MAX_PDF_SIZE_BYTES = 1 * 1024 * 1024;

export default function UploadFullTextPdfModal({
  isOpen,
  isUploading,
  paper,
  onClose,
  onSubmit,
}: UploadFullTextPdfModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const extractWithGrobid = true;
  const [isMetadataSectionExpanded, setIsMetadataSectionExpanded] = useState(
    () => (typeof window === "undefined" ? true : window.innerWidth >= 768),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    const isPdfType = file.type === "application/pdf";
    const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfType && !hasPdfExtension) {
      toastError("Only PDF files are allowed.");
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      toastError("File size exceeds 1 MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    validateAndSetFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || isUploading) {
      return;
    }

    await onSubmit(selectedFile, { extractWithGrobid });
  };

  const incompleteMetadata = hasIncompleteMetadata(paper);
  const actionLabel = "Upload & Extract Metadata";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Full Text PDF"
      description="Upload the paper PDF and enhance missing metadata with AI extraction."
      size="lg"
      bodyClassName="modal-scroll-area"
      closeOnOutsideClick={!isUploading}
      closeOnEsc={!isUploading}
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
                Section 1
              </p>
              <h4 className="text-lg font-semibold text-text-primary">
                PDF Upload
              </h4>
            </div>
            <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary">
              Required
            </span>
          </div>

          <div className="rounded-xl border border-border bg-bg-secondary/80 p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileSelected}
            />

            {selectedFile ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="rounded-xl bg-surface-white p-3 text-accent shadow-sm">
                    <FiFileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · PDF
                      ready to upload
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="secondary"
                    size="md"
                  >
                    Replace File
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-white text-text-secondary transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove selected PDF"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-white px-6 py-10 text-center transition-colors hover:border-accent hover:bg-bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="mb-4 rounded-xl bg-bg-secondary p-4 text-accent">
                  <FiUpload className="h-6 w-6" />
                </div>
                <p className="text-base font-semibold text-text-primary">
                  Choose a PDF to upload
                </p>
                <p className="mt-1 max-w-md text-sm text-text-secondary">
                  Select one full-text article PDF. Maximum file size: 1 MB.
                </p>
              </button>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setIsMetadataSectionExpanded((prev) => !prev)}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
            aria-expanded={isMetadataSectionExpanded}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
                Section 2
              </p>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-text-primary">
                  Metadata Enhancement
                </h4>
                <Tooltip
                  content="This feature uses machine learning to read the PDF header and extract bibliographic information."
                  position="top"
                >
                  <span
                    className="inline-flex rounded-full border border-border bg-surface-white p-1.5 text-text-secondary"
                    aria-label="What AI metadata extraction does"
                    tabIndex={0}
                  >
                    <FiInfo className="h-3.5 w-3.5" />
                  </span>
                </Tooltip>
              </div>
            </div>
            <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-accent">
              Enabled
            </span>
            <span className="ml-auto rounded-full bg-bg-secondary p-2 text-text-secondary md:hidden">
              {isMetadataSectionExpanded ? (
                <FiChevronUp className="h-4 w-4" />
              ) : (
                <FiChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>

          <div
            className={cn(
              "grid overflow-hidden rounded-xl transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
              isMetadataSectionExpanded
                ? "grid-rows-[1fr]"
                : "grid-rows-[0fr]",
            )}
          >
            <div
              className={cn(
                "min-h-0 overflow-hidden rounded-xl border transition-[padding,border-color,background-color] duration-200 ease-out motion-reduce:transition-none",
                isMetadataSectionExpanded
                  ? "border-accent/30 bg-primary-light p-5"
                  : "border-transparent bg-transparent p-0",
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-surface-white p-3 text-accent shadow-sm">
                    <FiCpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-base font-semibold text-text-primary">
                      Enhance Metadata with AI
                    </h5>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      Automatically extract missing metadata (authors, abstract,
                      DOI, journal information) from the uploaded PDF.
                    </p>
                  </div>
                </div>

                {incompleteMetadata && (
          <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                    This paper has incomplete metadata. AI extraction may improve
                    it.
                  </div>
                )}

                <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-surface-white px-4 py-4 shadow-sm transition-colors">
                  <div className="mt-1 flex h-4 w-4 items-center justify-center rounded bg-accent text-white">
                    <FiCheckSquare className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        AI metadata extraction enabled
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      Automatically extract missing metadata from the PDF to
                      improve paper details.
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">
                      Estimated time: 3–6 seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-bg-secondary p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
              Section 3
            </p>
            <h4 className="text-lg font-semibold text-text-primary">
              Upload Action
            </h4>
          </div>

          <div
            className="rounded-xl bg-surface-white p-4"
            aria-live="polite"
            aria-busy={isUploading}
          >
            {isUploading ? (
              <div className="space-y-3">
                <LoadingRow label="Uploading PDF..." />
                <LoadingRow
                  label="Queuing AI metadata extraction..."
                  subdued={true}
                />
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                Upload the PDF. Metadata extraction will happen automatically in
                the background.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              onClick={onClose}
              disabled={isUploading}
              variant="secondary"
              size="md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
              aria-busy={isUploading}
              className="min-w-52"
            >
              {isUploading ? (
                <FiLoader
                  aria-hidden="true"
                  className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none"
                />
              ) : (
                <FiUpload className="h-4 w-4" />
              )}
              {isUploading ? "Working..." : actionLabel}
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function LoadingRow({
  label,
  subdued = false,
}: {
  label: string;
  subdued?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full bg-accent motion-safe:animate-pulse motion-reduce:animate-none",
        subdued && "bg-text-secondary",
          )}
        />
        <span className="h-2.5 w-2.5 rounded-full bg-accent motion-safe:animate-pulse motion-reduce:animate-none [animation-delay:120ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent motion-safe:animate-pulse motion-reduce:animate-none [animation-delay:240ms]" />
      </span>
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </div>
  );
}
