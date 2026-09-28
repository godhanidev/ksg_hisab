import React, { useState } from "react";
import { Trash2, X, AlertTriangle, RefreshCw, ShieldAlert, Sparkles, Building2 } from "lucide-react";
import { Language } from "../../types";
import { getTranslation } from "../../i18n/translations";

export type DeleteTargetInfo = {
  id: number | string;
  title: string;
  itemName?: string;
  itemDetails?: string;
  itemAmount?: string;
  itemTypeBadge?: string;
  onConfirm: () => void;
};

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  target: DeleteTargetInfo | null;
  lang: Language;
};

export function DeleteConfirmModal({
  isOpen,
  onClose,
  target,
  lang,
}: DeleteConfirmModalProps) {
  const t = getTranslation(lang);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !target) return null;

  const handleConfirmClick = () => {
    setIsDeleting(true);
    // Smooth 500ms exit transition with animated spinner
    setTimeout(() => {
      target.onConfirm();
      setIsDeleting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Ambient Red/Rose Danger Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-rose-500/15 blur-3xl pointer-events-none -top-10 -right-10 animate-pulse" />
      <div className="absolute w-72 h-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none -bottom-10 -left-10 animate-pulse" />

      {/* Main Animated Modal Card */}
      <div
        className={`relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-center transform transition-all duration-300 ${
          isDeleting ? "scale-95 opacity-60" : "animate-in zoom-in-95 duration-200"
        }`}
      >
        {/* Close Button */}
        {!isDeleting && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            title={t.cancel}
          >
            <X size={18} />
          </button>
        )}

        {/* Animated Trash / Danger Icon */}
        <div className="relative mx-auto mb-4 flex items-center justify-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-600/20 via-rose-500/10 to-red-500/20 border border-rose-500/30 text-rose-400 shadow-xl ring-8 ring-rose-500/10">
            {isDeleting ? (
              <RefreshCw size={28} className="animate-spin text-amber-400" />
            ) : (
              <Trash2 size={32} className="stroke-[2.2] animate-bounce-subtle" />
            )}
          </div>
        </div>

        {/* Modal Title */}
        <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
          {target.title || (lang === "gu" ? "એન્ટ્રી ડિલીટ કન્ફર્મેશન" : lang === "hi" ? "प्रविष्टि हटाने की पुष्टि" : "Confirm Deletion")}
        </h3>

        {/* Warning Note */}
        <p className="mt-1.5 text-xs sm:text-sm text-slate-300/90 leading-relaxed px-2">
          {lang === "gu"
            ? "શું તમે ખરેખર આ રેકોર્ડ કાયમી ધોરણે કાઢી નાખવા માંગો છો? આ પ્રક્રિયા પાછી ખેંચી શકાશે નહીં."
            : lang === "hi"
            ? "क्या आप वाकई इस रिकॉर्ड को स्थायी रूप से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।"
            : "Are you sure you want to permanently delete this entry? This action cannot be undone."}
        </p>

        {/* Item Preview Pill Box */}
        {(target.itemName || target.itemAmount || target.itemDetails) && (
          <div className="my-4 rounded-2xl bg-white/5 border border-white/10 p-3.5 text-left space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {target.itemTypeBadge && (
                  <span className="inline-block rounded-md bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider mb-1">
                    {target.itemTypeBadge}
                  </span>
                )}
                {target.itemName && (
                  <p className="text-sm font-bold text-white truncate" title={target.itemName}>
                    {target.itemName}
                  </p>
                )}
                {target.itemDetails && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {target.itemDetails}
                  </p>
                )}
              </div>

              {target.itemAmount && (
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">રકમ / Amount</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                    {target.itemAmount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-700 bg-white/5 py-3 text-xs sm:text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirmClick}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-red-500 transition active:scale-95 disabled:opacity-75"
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>
                  {lang === "gu"
                    ? "ડિલીટ થઈ રહ્યું છે..."
                    : lang === "hi"
                    ? "हटाया जा रहा है..."
                    : "Deleting..."}
                </span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>
                  {lang === "gu"
                    ? "હા, ડિલીટ કરો"
                    : lang === "hi"
                    ? "हाँ, हटाएं"
                    : "Yes, Delete"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
