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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full ${maxWidth} rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl max-h-[94vh] overflow-y-auto border border-slate-100`}>
        {title ? (
          <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ml-2 shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            type="button"
            className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
