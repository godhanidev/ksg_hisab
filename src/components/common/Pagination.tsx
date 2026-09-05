import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Language } from "../../types";
import { getTranslation } from "../../i18n/translations";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  lang: Language;
  pageSizeOptions?: number[];
};

export const Pagination = React.memo(function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  lang,
  pageSizeOptions = [25, 50, 100],
}: PaginationProps) {
  const t = getTranslation(lang);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
      {/* Left: Range and total info + Per page selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {t.showingRecords} <strong className="font-bold text-slate-900">{startRecord}</strong> {t.to}{" "}
          <strong className="font-bold text-slate-900">{endRecord}</strong> {t.of}{" "}
          <strong className="font-bold text-slate-900">{totalItems}</strong> {t.records}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <select
              value={pageSize}
              onChange={e => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size} / {t.page}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title={t.prevPage}
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">{t.prevPage}</span>
          </button>

          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((p, idx) => {
              if (typeof p === "string") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold">
                    ...
                  </span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title={t.nextPage}
          >
            <span className="hidden sm:inline">{t.nextPage}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
});
