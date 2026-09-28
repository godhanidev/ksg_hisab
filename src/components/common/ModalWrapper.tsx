import React, { useEffect } from "react";
import { X } from "lucide-react";

export function ModalWrapper({
  isOpen = true,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-xl",
}: {
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className={`relative w-full ${maxWidth} rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 md:p-7 shadow-2xl max-h-[88dvh] overflow-y-auto border border-slate-100 my-auto`}>
        {title ? (
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4 sticky -top-4 sm:-top-6 md:-top-7 -mt-4 sm:-mt-6 md:-mt-7 -mx-4 sm:-mx-6 md:-mx-7 px-4 sm:px-6 md:px-7 pt-4 sm:pt-6 md:pt-7 bg-white z-10 rounded-t-2xl sm:rounded-t-3xl">
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-tight truncate">{title}</h2>
              {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            type="button"
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition z-10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
