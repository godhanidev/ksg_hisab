import React from "react";
import {
  Menu, X, WifiOff, RefreshCw, LogOut, CheckCircle2, User
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
  onOpenAccount?: () => void;
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onManualSync: () => void;
  isSyncing: boolean;
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
  onOpenAccount,
  lang,
  isOnline,
  pendingSyncCount,
  onManualSync,
  isSyncing,
}: HeaderProps) {
  const t = getTranslation(lang);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur transition-all safe-header-top shadow-xs">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition lg:hidden"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile App Brand Title */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent shadow-2xs border border-amber-500/40 ring-1 ring-amber-500/20 overflow-hidden">
              <img
                src="/logo.png"
                alt="KS Logo"
                className="h-full w-full object-cover rounded-full scale-[1.08]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900 leading-none">KS GODHANI</h1>
              <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">{activePage}</p>
            </div>
          </div>

          {/* Desktop Page Title Breadcrumb */}
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-slate-400">Civil Works & Construction Accounting</p>
            <h2 className="text-base font-bold text-slate-900">{activePage}</h2>
          </div>
        </div>

        {/* Right Action Tools: Sync Status, User Profile, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sync Status Badge (Online / Offline / Pending Sync) */}
          <div className="flex items-center">
            {isOnline ? (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">{t.online}</span>
                {pendingSyncCount > 0 ? (
                  <button
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="ml-1 inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white hover:bg-emerald-700"
                  >
                    <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                    {pendingSyncCount} <span className="hidden md:inline">{t.pendingSync}</span>
                  </button>
                ) : (
                  <CheckCircle2 size={12} className="text-emerald-600 ml-0.5" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-800 animate-pulse">
                <WifiOff size={13} className="text-amber-600" />
                <span>{t.offline}</span>
              </div>
            )}
          </div>

          {/* User Pill: Click to open My Account & Profile */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition group"
            title={lang === "gu" ? "મારું એકાઉન્ટ / પ્રોફાઇલ ખોલો" : "View My Account & Profile"}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 shadow-xs border border-slate-700/60 transition shrink-0">
              <User size={18} />
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">{currentUser.name}</p>
              <p className="text-[10px] font-semibold text-slate-500">{getShortRoleLabel(currentUser.role)}</p>
            </div>
          </button>

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
      </div>
    </header>
  );
}
