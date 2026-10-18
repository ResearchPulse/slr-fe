import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Calculate visible pages (showing up to 5)
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Go to previous page"
        onClick={handlePrevious}
        disabled={disabled || currentPage === 1}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-0.5">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
            onClick={() => onPageChange(page)}
            disabled={disabled}
            className={`min-w-10 h-10 rounded-lg text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              currentPage === page
                ? "bg-text-primary text-bg-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-label="Go to next page"
        onClick={handleNext}
        disabled={disabled || currentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

export default Pagination;
