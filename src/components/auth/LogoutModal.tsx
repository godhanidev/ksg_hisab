import React, { useState } from "react";
import { LogOut, X, ShieldAlert, Sparkles, User, Check, RefreshCw } from "lucide-react";
import { Language, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { getShortRoleLabel } from "../../utils/formatters";

type LogoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentUser: UserAccount;
  lang: Language;
};

export function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  currentUser,
  lang,
}: LogoutModalProps) {
  const t = getTranslation(lang);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    setIsLoggingOut(true);
    // Smooth 600ms exit animation transition
    setTimeout(() => {
      onConfirm();
      setIsLoggingOut(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Glow Ambient Behind Modal */}
      <div className="absolute w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none -top-10 -right-10 animate-pulse" />
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -bottom-10 -left-10 animate-pulse" />

      {/* Main Animated Modal Card */}
      <div
        className={`relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 border border-slate-700/70 p-6 sm:p-7 shadow-2xl text-center transform transition-all duration-300 ${
          isLoggingOut ? "scale-95 opacity-60" : "animate-in zoom-in-95 duration-200"
        }`}
      >
        {/* Close Button */}
        {!isLoggingOut && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Cancel"
          >
            <X size={18} />
          </button>
        )}

        {/* Animated Logout Icon */}
        <div className="relative mx-auto mb-4 flex items-center justify-center">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-500/20 via-rose-500/10 to-amber-500/20 border border-rose-500/30 text-rose-400 shadow-xl ring-8 ring-rose-500/10">
            {isLoggingOut ? (
              <RefreshCw size={28} className="animate-spin text-amber-400" />
            ) : (
              <LogOut size={30} className="stroke-[2.2]" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
          {lang === "gu"
            ? "લૉગ આઉટ કન્ફર્મેશન"
            : lang === "hi"
            ? "लॉग आउट पुष्टि"
            : "Confirm Sign Out"}
        </h3>

        {/* Reassuring Subtitle */}
        <p className="mt-1.5 text-xs sm:text-sm text-slate-300/90 leading-relaxed px-2">
          {lang === "gu"
            ? "શું તમે ખરેખર KSG Hisab માંથી લૉગ આઉટ કરવા માંગો છો? તમારો બધો જ હિસાબ અને ડેટા ક્લાઉડમાં સુરક્ષિત છે."
            : lang === "hi"
            ? "क्या आप वाकई KSG Hisab से लॉग आउट करना चाहते हैं? आपका सारा हिसाब और डेटा क्लाउड में सुरक्षित है।"
            : "Are you sure you want to log out of KSG Hisab? All your accounting records remain securely saved."}
        </p>

        {/* Active Account Pill */}
        <div className="my-4 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-sm">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shrink-0">
            {getShortRoleLabel(currentUser.role)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-700 bg-white/5 py-3 text-xs sm:text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleConfirmClick}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-amber-400 transition active:scale-95 disabled:opacity-75"
          >
            {isLoggingOut ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>
                  {lang === "gu"
                    ? "લૉગ આઉટ થઇ રહ્યું છે..."
                    : lang === "hi"
                    ? "लॉग आउट हो रहा है..."
                    : "Signing Out..."}
                </span>
              </>
            ) : (
              <>
                <LogOut size={16} />
                <span>
                  {lang === "gu"
                    ? "હા, લૉગ આઉટ કરો"
                    : lang === "hi"
                    ? "हाँ, लॉग आउट करें"
                    : "Yes, Log Out"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
