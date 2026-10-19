import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookmarkCheck,
  Check,
  MoreHorizontal,
  UserPlus,
  XCircle,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import type { CandidatePaperDto } from "../../../types/paper";
import { formatAuthors } from "./formatAuthors";

interface CandidateRowProps {
  candidate: CandidatePaperDto;
  isSelected: boolean;
  isBulkSelected: boolean;
  onToggleBulkSelect: (id: string) => void;
  onSelect: (candidate: CandidatePaperDto) => void;
  onAction?: (id: string, action: "select" | "reject") => void;
  isProcessing?: boolean;
}

const MENU_WIDTH = 208;
const MENU_HEIGHT = 116;

const CandidateRow: React.FC<CandidateRowProps> = ({
  candidate,
  isSelected,
  isBulkSelected,
  onToggleBulkSelect,
  onSelect,
  onAction,
  isProcessing = false,
}) => {
  const {
    candidateId,
    title,
    authors,
    publicationYear,
    statusText,
    extractionQualityScore,
    matchConfidenceScore,
    isSelectedInProjectRepository,
  } = candidate;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const isRejected = statusText === "Rejected";
  const isUnavailable = isSelectedInProjectRepository || isRejected;

  const quality = Number.isFinite(extractionQualityScore)
    ? Math.max(0, Math.min(100, Math.round(extractionQualityScore * 100)))
    : 0;
  const match = Number.isFinite(matchConfidenceScore)
    ? Math.max(0, Math.min(100, Math.round(matchConfidenceScore * 100)))
    : 0;

  const updateMenuPosition = () => {
    const bounds = triggerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const top = bounds.bottom + MENU_HEIGHT + 8 > window.innerHeight
      ? Math.max(8, bounds.top - MENU_HEIGHT - 8)
      : bounds.bottom + 8;
    const left = Math.max(8, Math.min(window.innerWidth - MENU_WIDTH - 8, bounds.right - MENU_WIDTH));
    setMenuPosition({ top, left });
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    updateMenuPosition();

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    const reposition = () => updateMenuPosition();

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen && menuPosition) firstActionRef.current?.focus();
  }, [isMenuOpen, menuPosition]);

  const qualityColor = quality < 40
    ? "bg-error"
    : quality < 70
      ? "bg-warning"
      : "bg-success";

  const statusColor = isRejected
    ? "bg-error"
    : statusText === "Suggested"
      ? "bg-success"
      : statusText === "Matched"
        ? "bg-accent"
        : "bg-text-muted";

  const actionsMenu = isMenuOpen && menuPosition
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Actions for ${title}`}
          className="fixed z-(--z-index-dropdown) w-52 rounded-lg border border-border bg-surface-white py-1 shadow-[0_4px_8px_rgba(18,35,49,0.12)]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onKeyDown={(event) => {
            const items = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']");
            if (!items?.length) return;
            const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLButtonElement);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              items[(currentIndex + step + items.length) % items.length]?.focus();
            }
          }}
        >
          <button
            ref={firstActionRef}
            type="button"
            role="menuitem"
            disabled={isProcessing}
            onClick={() => {
              setIsMenuOpen(false);
              triggerRef.current?.focus();
              onAction?.(candidateId, "select");
            }}
            className="flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm text-text-primary transition-colors hover:bg-bg-secondary focus-visible:bg-bg-secondary focus-visible:outline-none disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4 text-accent" aria-hidden="true" />
            Add to repository
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={isProcessing}
            onClick={() => {
              setIsMenuOpen(false);
              triggerRef.current?.focus();
              onAction?.(candidateId, "reject");
            }}
            className="flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm text-error transition-colors hover:bg-error/5 focus-visible:bg-error/5 focus-visible:outline-none disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Reject
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <article
      onClick={() => onSelect(candidate)}
      className={cn(
        "group flex min-w-0 flex-col gap-3 px-2 py-3 transition-colors hover:bg-bg-primary/70 sm:px-3 md:flex-row md:items-center md:gap-5",
        isSelected && "bg-primary-light",
        isSelectedInProjectRepository && "bg-bg-secondary/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={isBulkSelected}
          aria-label={`Select ${title}`}
          disabled={isUnavailable}
          onClick={(event) => {
            event.stopPropagation();
            onToggleBulkSelect(candidateId);
          }}
          className={cn(
            "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            isBulkSelected
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface-white text-transparent hover:border-accent",
            isUnavailable && "cursor-not-allowed opacity-50",
          )}
        >
          {isBulkSelected && <Check className="h-3 w-3" aria-hidden="true" />}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(candidate);
            }}
            className="block max-w-full text-left text-sm font-semibold leading-5 text-accent hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [text-wrap:pretty]"
          >
            {title || "Untitled reference"}
          </button>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary sm:text-sm">
            <span className="min-w-0 break-words">{formatAuthors(authors)}</span>
            {publicationYear && (
              <>
                <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-text-muted/50" />
                <span className="tabular-nums">{publicationYear}</span>
              </>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <span className={cn("h-1.5 w-1.5 rounded-full", statusColor)} aria-hidden="true" />
              {isSelectedInProjectRepository ? "In repository" : statusText}
            </span>
            {candidate.validationNote && (
              <span className="text-xs text-text-secondary">{candidate.validationNote}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-2 md:w-48 md:shrink-0 md:justify-end md:border-0 md:pt-0">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:block md:flex-none">
          <div className="min-w-0 flex-1 md:w-32">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-text-secondary">Data quality</span>
              <span className="shrink-0 font-medium tabular-nums text-text-primary">{quality}%</span>
            </div>
            <div
              className="h-1 overflow-hidden rounded-full bg-bg-secondary"
              role="progressbar"
              aria-label="Data quality"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={quality}
            >
              <div className={cn("h-full rounded-full", qualityColor)} style={{ width: `${quality}%` }} />
            </div>
          </div>
          <div className="min-w-0 text-right md:mt-1 md:text-left">
            <span className="text-[11px] text-text-secondary">Identity </span>
            <span className="text-[11px] font-medium tabular-nums text-text-primary">
              {match === 0 ? "New entry" : `${match}%`}
            </span>
          </div>
        </div>

        {isSelectedInProjectRepository ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center text-success" title="Already in repository">
            <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : isRejected ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center text-error" title="Rejected">
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Actions for ${title}`}
            aria-haspopup="menu"
            aria-controls={menuId}
            aria-expanded={isMenuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((open) => !open);
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
      {actionsMenu}
    </article>
  );
};

export default CandidateRow;
