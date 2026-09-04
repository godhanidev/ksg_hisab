import React, { useState } from "react";
import { Lock, Eye, EyeOff, Check, AlertCircle, KeyRound, ShieldCheck } from "lucide-react";
import { Language, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { ModalWrapper } from "../common/ModalWrapper";

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSaveNewPassword: (newPassword: string) => void;
  lang: Language;
};

export function ChangePasswordModal({
  isOpen,
  onClose,
  currentUser,
  onSaveNewPassword,
  lang,
}: ChangePasswordModalProps) {
  const t = getTranslation(lang);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate current password
    if (currentPassword !== currentUser.password) {
      setErrorMsg(
        lang === "gu"
          ? "તમારો હાલનો પાસવર્ડ ખોટો છે!"
          : "Current password is incorrect!"
      );
      return;
    }

    // Validate new password length
    if (newPassword.trim().length < 4) {
      setErrorMsg(
        lang === "gu"
          ? "નવો પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરનો હોવો જોઈએ!"
          : "New password must be at least 4 characters!"
      );
      return;
    }

    // Validate match
    if (newPassword !== confirmPassword) {
      setErrorMsg(
        lang === "gu"
          ? "નવો પાસવર્ડ અને કન્ફર્મ પાસવર્ડ સરખા નથી!"
          : "New password and confirm password do not match!"
      );
      return;
    }

    onSaveNewPassword(newPassword.trim());
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={lang === "gu" ? "પાસવર્ડ બદલો" : "Change Password"}
      subtitle={
        lang === "gu"
          ? `વપરાશકર્તા: @${currentUser.username} (${currentUser.name})`
          : `Update login password for @${currentUser.username} (${currentUser.name})`
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {lang === "gu" ? "હાલનો પાસવર્ડ (Current Password) *" : "Current Password *"}
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {lang === "gu" ? "નવો પાસવર્ડ (New Password) *" : "New Password *"}
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {lang === "gu" ? "નવો પાસવર્ડ ફરીથી લખો (Confirm New Password) *" : "Confirm New Password *"}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-[11px] text-amber-900 flex items-start gap-2">
          <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            {lang === "gu"
              ? "પાસવર્ડ બદલાતા જ ક્લાઉડ ડેટાબેઝમાં તરત જ અપડેટ થઈ જશે અને એડમિન યુઝર મેનેજમેન્ટમાં પણ નવો પાસવર્ડ સિંક થઈ જશે."
              : "New password will be securely updated in Firebase Cloud immediately and synchronized with User Management."}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95"
          >
            <Check size={16} />
            <span>{lang === "gu" ? "પાસવર્ડ સેવ કરો" : "Update Password"}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
