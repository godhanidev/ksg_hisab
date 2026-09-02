import React from "react";
import {
  Menu, X, Wifi, WifiOff, RefreshCw, LogOut, Shield, HardHat, CheckCircle2,
  Cloud, CloudOff, Database
} from "lucide-react";
import { Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { getShortRoleLabel } from "../../utils/formatters";

type HeaderProps = {
  activePage: string;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: UserAccount;
  onLogout: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onManualSync: () => void;
  isSyncing: boolean;
  isCloudConnected?: boolean;
  onOpenCloudModal?: () => void;
  projects?: Project[];
  userAllowedProjects?: Project[];
  selectedSiteFilter?: string;
  onSiteFilterChange?: (site: string) => void;
};

export function Header({
  activePage,
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  onLogout,
  lang,
  onLanguageChange,
  isOnline,
  pendingSyncCount,
  onManualSync,
  isSyncing,
  isCloudConnected = false,
  onOpenCloudModal,
}: HeaderProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-8 backdrop-blur shadow-xs">
      {/* Left section: Desktop Sidebar Toggle / Mobile Company Logo & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="hidden lg:flex rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shrink-0 items-center justify-center"
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
        </button>

        {/* Company Logo on Mobile (in place of upper-left menu bar) */}
        <div className="flex lg:hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-xs border border-slate-200">
          <img
            src="/logo.png"
            alt="K.S.Godhani Logo"
            className="h-full w-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>

        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
            <span>K.S.Godhani</span>
            <span>/</span>
            <span className="text-slate-500 font-semibold">{getShortRoleLabel(currentUser.role)}</span>
          </div>
          <h2 className="text-base sm:text-xl font-black text-slate-900 leading-tight truncate">{activePage}</h2>
        </div>
      </div>

      {/* Right section: Language, Offline status, User Profile, Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Multi-Language Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-0.5 sm:p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => onLanguageChange("en")}
            className={`px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition ${lang === "en" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            title="English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange("gu")}
            className={`px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition ${lang === "gu" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            title="ગુજરાતી (Gujarati)"
          >
            ગુજ
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange("hi")}
            className={`px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition ${lang === "hi" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            title="हिन्दी (Hindi)"
          >
            हिં
          </button>
        </div>

        {/* Offline Status Badge & Sync */}
        <div className="hidden lg:flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <Wifi size={13} className="text-emerald-600" />
              <span>{t.online}</span>
              {pendingSyncCount > 0 ? (
                <button
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="ml-1 inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white hover:bg-emerald-700"
                >
                  <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                  {pendingSyncCount} {t.pendingSync}
                </button>
              ) : (
                <CheckCircle2 size={12} className="text-emerald-600 ml-0.5" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-800 animate-pulse">
              <WifiOff size={13} className="text-amber-600" />
              <span>{t.offline}</span>
              {pendingSyncCount > 0 && (
                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                  {pendingSyncCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* User Pill with Role Indicator */}
        <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-0.5 shadow-xs border border-slate-200 overflow-hidden">
            <img
              src="/logo.png"
              alt="KS Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">{currentUser.name}</p>
            <p className="text-[10px] font-semibold text-slate-500">{getShortRoleLabel(currentUser.role)}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          title={t.logout}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{t.logout}</span>
        </button>
      </div>
    </header>
  );
}
