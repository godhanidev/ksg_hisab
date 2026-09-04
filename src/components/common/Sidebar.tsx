import React from "react";
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  FileCheck,
  Building2,
  Users,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { Language, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { getShortRoleLabel } from "../../utils/formatters";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: UserAccount;
  lang: Language;
};

type MenuItemConfig = {
  key: string;
  icon: React.ElementType;
  translateKey: keyof ReturnType<typeof getTranslation>;
  adminOnly?: boolean;
};

export const MENU_CONFIG: MenuItemConfig[] = [
  { key: "Dashboard", icon: LayoutDashboard, translateKey: "dashboard" },
  { key: "Site Daily Cash", icon: Wallet, translateKey: "siteDailyCash" },
  { key: "Bank Payments", icon: Landmark, translateKey: "bankPayments" },
  { key: "GST Bills", icon: FileCheck, translateKey: "gstBills" },
  { key: "Projects", icon: Building2, translateKey: "projects" },
  { key: "User Management", icon: Users, translateKey: "userManagement", adminOnly: true },
  { key: "Account", icon: UserCheck, translateKey: "account" },
];

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activePage,
  setActivePage,
  currentUser,
  lang,
}: SidebarProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const visibleMenuItems = MENU_CONFIG.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside
      className={`hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col bg-slate-950 text-slate-300 transition-all duration-300 shadow-2xl ${
        sidebarOpen ? "w-72" : "w-20"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center border-b border-slate-800/80 px-4">
        {sidebarOpen ? (
          <div className="flex w-full items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-md border border-slate-700">
              <img
                src="/logo.png"
                alt="K.S.Godhani Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-lg font-black tracking-wide text-white">{t.appName}</h1>
              <p className="whitespace-nowrap text-[11px] font-medium text-amber-400/90">{t.appSubtitle}</p>
            </div>
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md border border-slate-700">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3.5 scrollbar-thin scrollbar-thumb-slate-800">
        {visibleMenuItems.map(({ key, icon: Icon, translateKey }) => {
          const active = activePage === key;
          const label = t[translateKey] || key;

          return (
            <button
              key={key}
              onClick={() => {
                setActivePage(key);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              title={String(label)}
              className={`group flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                active
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:bg-slate-900/90 hover:text-slate-100"
              }`}
            >
              <Icon size={20} className={active ? "text-slate-950" : "text-slate-400 group-hover:text-amber-400 transition"} />
              {sidebarOpen && (
                <div className="flex flex-1 items-center justify-between truncate text-left">
                  <span className="truncate">{String(label)}</span>
                  {active && <ChevronRight size={14} className="opacity-80 shrink-0" />}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info Footer: Clickable to go to Account Profile */}
      <div className="border-t border-slate-800/80 p-3.5 bg-slate-950/80">
        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setActivePage("Account")}
            className={`w-full flex items-center gap-3 rounded-2xl p-3 border transition text-left ${
              activePage === "Account"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-slate-900/90 border-slate-800 hover:bg-slate-800/80"
            }`}
            title="Open Account Profile"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-0.5 shadow-md border border-slate-700 overflow-hidden">
              <img
                src="/logo.png"
                alt="KS Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-amber-400/80 font-semibold truncate">
                {isAdmin ? t.adminRole : `${getShortRoleLabel(currentUser.role)} (${currentUser.assignedProjects.length > 0 ? currentUser.assignedProjects[0] : "Site"})`}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActivePage("Account")}
            className={`w-full flex justify-center p-1.5 rounded-xl transition ${
              activePage === "Account" ? "bg-amber-500/20" : "hover:bg-slate-900"
            }`}
            title="Open Account Profile"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-0.5 shadow-md border border-slate-700 overflow-hidden">
              <img
                src="/logo.png"
                alt="KS Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
