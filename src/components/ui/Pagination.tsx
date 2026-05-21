import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    disabled = false
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
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handlePrevious}
                disabled={disabled || currentPage === 1}
                className="p-2 rounded-[4px] text-[#5C5C5C] hover:text-[#111111] hover:bg-[#ECE8E1] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-0.5">
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        disabled={disabled}
                        className={`min-w-[34px] h-8 rounded-[4px] text-[11px] font-medium uppercase tracking-[0.05em] transition-colors ${
                            currentPage === page
                                ? "bg-[#111111] text-[#F4F0E8]"
                                : "text-[#5C5C5C] hover:text-[#111111] hover:bg-[#ECE8E1]"
                        }`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                onClick={handleNext}
                disabled={disabled || currentPage === totalPages}
                className="p-2 rounded-[4px] text-[#5C5C5C] hover:text-[#111111] hover:bg-[#ECE8E1] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Pagination;
