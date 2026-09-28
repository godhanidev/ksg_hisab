import React, { useState } from "react";
import { Shield, Lock, User, Eye, EyeOff, RefreshCw, AlertTriangle, Globe, Smartphone, X } from "lucide-react";
import { Language, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";

type LoginPageProps = {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  sessionExpiredNotice?: string | null;
  onClearNotice?: () => void;
};

export function LoginPage({
  users,
  onLogin,
  lang,
  onLanguageChange,
  sessionExpiredNotice,
  onClearNotice,
}: LoginPageProps) {
  const t = getTranslation(lang);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (onClearNotice) onClearNotice();

    const found = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (found) {
      onLogin(found);
    } else {
      setError(
        lang === "gu"
          ? "ખોટો યુઝરનેમ અથવા પાસવર્ડ."
          : lang === "hi"
          ? "गलत यूजरनेम या पासवर्ड।"
          : "Invalid username or password."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8 safe-header-top safe-nav-bottom relative overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg mb-3.5 overflow-hidden border-2 border-amber-500/40 bg-white p-1 ring-4 ring-amber-500/10">
            <img
              src="/logo.png"
              alt="K.S.Godhani Logo"
              className="w-full h-full object-cover rounded-full"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t.appName}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{t.appSubtitle}</p>

          {/* Language Switcher */}
          <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 border border-slate-200 mt-3.5 shadow-xs">
            <Globe size={14} className="text-amber-500 ml-2 mr-0.5" />
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                lang === "en" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("gu")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                lang === "gu" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ગુજરાતી
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("hi")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                lang === "hi" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Normal Clean Solid White Login Card */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
          {/* Multi-Device Logout Notice Alert */}
          {sessionExpiredNotice && (
            <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-amber-900 text-xs sm:text-sm relative shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <Smartphone size={18} />
                </div>
                <div className="flex-1 pr-6">
                  <p className="font-bold text-amber-950 mb-0.5">
                    {lang === "gu"
                      ? "સુરક્ષા સૂચના (Single Device Active)"
                      : lang === "hi"
                      ? "सुरक्षा सूचना (Single Device Active)"
                      : "Security Notice (Single Device Active)"}
                  </p>
                  <p className="text-amber-800 text-xs leading-relaxed">{sessionExpiredNotice}</p>
                </div>
                {onClearNotice && (
                  <button
                    type="button"
                    onClick={onClearNotice}
                    className="absolute right-2.5 top-2.5 text-amber-700 hover:text-amber-950 p-1 rounded-lg hover:bg-amber-100 transition"
                    title="Dismiss"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.username}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (sessionExpiredNotice && onClearNotice) onClearNotice();
                  }}
                  placeholder={lang === "gu" ? "યુઝરનેમ દાખલ કરો" : lang === "hi" ? "यूजरनेम दर्ज करें" : "Enter username"}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (sessionExpiredNotice && onClearNotice) onClearNotice();
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 pl-10 pr-11 py-2.5 text-sm outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-xs">
                <AlertTriangle size={15} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3 text-sm font-black transition shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{t.loggingIn}</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>{t.loginBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
