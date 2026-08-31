import React, { useState } from "react";
import { Shield, HardHat, Lock, User, Eye, EyeOff, RefreshCw, AlertTriangle, Globe } from "lucide-react";
import { Language, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";

type LoginPageProps = {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
};

export function LoginPage({ users, onLogin, lang, onLanguageChange }: LoginPageProps) {
  const t = getTranslation(lang);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (found) {
      onLogin(found);
    } else {
      setError(lang === "gu" ? "ખોટો યુઝરનેમ અથવા પાસવર્ડ." : lang === "hi" ? "गलत यूजरनेम या पासवर्ड।" : "Invalid username or password.");
    }
  };

  const handleQuickLogin = (u: UserAccount) => {
    setUsername(u.username);
    setPassword(u.password);
    onLogin(u);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden">
      {/* Background ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-2xl mb-3 p-1.5 overflow-hidden border border-white/20">
            <img
              src="/logo.png"
              alt="K.S.Godhani Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">{t.appName}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">{t.appSubtitle}</p>

          {/* Language Switcher on Login */}
          <div className="inline-flex items-center gap-1 rounded-full bg-white/10 p-1 border border-white/10 mt-3 backdrop-blur">
            <Globe size={12} className="text-slate-400 ml-2 mr-0.5" />
            <button
              onClick={() => onLanguageChange("en")}
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition ${lang === "en" ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:text-white"}`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange("gu")}
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition ${lang === "gu" ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:text-white"}`}
            >
              ગુજરાતી
            </button>
            <button
              onClick={() => onLanguageChange("hi")}
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition ${lang === "hi" ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:text-white"}`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.username}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin / supervisor1"
                  className="w-full rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-500 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:bg-white/15 transition"
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
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-500 pl-10 pr-11 py-2.5 text-sm outline-none focus:border-amber-400 focus:bg-white/15 transition"
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
              <div className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-red-300 text-xs">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 py-3 text-sm font-extrabold hover:from-amber-300 hover:to-amber-400 transition shadow-lg disabled:opacity-60"
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

          {/* Quick Demo Role Accounts */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
              1-Click Demo Accounts (RBAC)
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin(users[0])}
                className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-left border border-white/10 transition"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/logo.png" alt="KS" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Owner / Admin</p>
                    <p className="text-[10px] text-slate-400">All Sites &bull; Full P&amp;L</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(users[1])}
                className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-left border border-white/10 transition"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/logo.png" alt="KS" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Supervisor 1 (Ramesh)</p>
                    <p className="text-[10px] text-slate-400">Assigned: Check Dam Amreli</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">supervisor1</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(users[2])}
                className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-left border border-white/10 transition"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/logo.png" alt="KS" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Supervisor 2 (Suresh)</p>
                    <p className="text-[10px] text-slate-400">Rajkot &amp; Bhavnagar Sites</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">supervisor2</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
