import React, { useEffect } from "react";
import { X } from "lucide-react";

export function ModalWrapper({
  onClose,
  children,
  maxWidth = "max-w-xl",
}: {
  onClose: () => void;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full ${maxWidth} rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-7 shadow-2xl max-h-[94vh] overflow-y-auto border border-slate-100`}>
        <button
          onClick={onClose}
          type="button"
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
