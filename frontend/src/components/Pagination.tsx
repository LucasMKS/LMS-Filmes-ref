import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  // TMDB cap at 500
  const maxPages = Math.min(totalPages, 500);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;

    for (let i = 1; i <= maxPages; i++) {
      if (
        i === 1 ||
        i === maxPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-8 w-full max-w-full px-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 sm:px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        title="Página Anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Mobile Page Indicator */}
      <div className="flex sm:hidden items-center justify-center px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300">
        <span className="text-amber-400 mr-1">{currentPage}</span>
        <span className="text-zinc-500">/ {maxPages}</span>
      </div>

      {/* Desktop Page Numbers */}
      <div className="hidden sm:flex items-center gap-1 sm:gap-2">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 text-zinc-500 select-none">
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-colors ${
                isCurrent
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= maxPages}
        className="p-2 sm:px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        title="Próxima Página"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
