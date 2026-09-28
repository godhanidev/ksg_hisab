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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 safe-header-top safe-nav-bottom relative overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-xl mb-3.5 overflow-hidden border-2 border-amber-500/50 bg-slate-900 ring-4 ring-amber-500/10">
            <img
              src="/logo.png"
              alt="K.S.Godhani Logo"
              className="w-full h-full object-cover rounded-full scale-[1.08]"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">{t.appName}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">{t.appSubtitle}</p>

          {/* Language Switcher on Login Form (Solid Clean Dark) */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 mt-3.5 shadow-md">
            <Globe size={13} className="text-amber-400 ml-2 mr-0.5" />
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                lang === "en" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("gu")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                lang === "gu" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ગુજરાતી
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("hi")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                lang === "hi" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Login Box (Solid Slate Card - No Glass/Blur) */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          {/* Multi-Device Logout Notice Alert */}
          {sessionExpiredNotice && (
            <div className="mb-5 rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-amber-200 text-xs sm:text-sm relative shadow-md">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                  <Smartphone size={18} />
                </div>
                <div className="flex-1 pr-6">
                  <p className="font-bold text-amber-100 mb-0.5">
                    {lang === "gu"
                      ? "સુરક્ષા સૂચના (Single Device Active)"
                      : lang === "hi"
                      ? "सुरक्षा सूचना (Single Device Active)"
                      : "Security Notice (Single Device Active)"}
                  </p>
                  <p className="text-amber-200/90 text-xs leading-relaxed">{sessionExpiredNotice}</p>
                </div>
                {onClearNotice && (
                  <button
                    type="button"
                    onClick={onClearNotice}
                    className="absolute right-2.5 top-2.5 text-amber-400/70 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.username}</label>
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
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.password}</label>
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
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 pl-10 pr-11 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-800/60 p-3 text-red-300 text-xs">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 py-3 text-sm font-extrabold hover:from-amber-300 hover:to-amber-400 transition shadow-lg disabled:opacity-60 cursor-pointer"
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
