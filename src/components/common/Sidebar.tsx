import React from "react";
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  FileCheck,
  Building2,
  Users,
  User,
  ChevronRight,
  X,
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

  // Menu items config (3 Core Modules Architecture + Projects)
  const menuItems: MenuItemConfig[] = [
    { key: "Dashboard", icon: LayoutDashboard, translateKey: "dashboard" },
    { key: "Site Daily Cash", icon: Wallet, translateKey: "siteDailyCash" },
    { key: "Bank Payments", icon: Landmark, translateKey: "bankPayments" },
    { key: "GST Bills", icon: FileCheck, translateKey: "gstBills" },
    { key: "Projects", icon: Building2, translateKey: "projects" },
    { key: "User Management", icon: Users, translateKey: "userManagement", adminOnly: true },
  ];

  // Filter menu items by role
  const allowedMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <>
      {/* ── Mobile Backdrop Overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* ── Sidebar Drawer ───────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between bg-slate-950 text-white transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl safe-header-top safe-nav-bottom ${
          sidebarOpen
            ? "translate-x-0 w-72 max-w-[85vw] lg:w-64 xl:w-72"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex h-16 sm:h-20 items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-transparent shadow-md border border-amber-400/40 ring-2 ring-amber-400/10 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="KS Logo"
                  className="h-full w-full object-cover rounded-full scale-[1.08]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className={`min-w-0 ${sidebarOpen ? "block" : "hidden lg:hidden"}`}>
                <h1 className="text-sm font-black tracking-tight text-white truncate">K.S.GODHANI</h1>
                <p className="text-[10px] font-semibold text-amber-400 truncate">Civil Works & Construction</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition lg:hidden"
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items (Scrollable on small screens) */}
          <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {allowedMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              const title = t[item.translateKey];

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActivePage(item.key);
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-900/90 hover:text-white"
                  }`}
                  title={String(title)}
                >
                  <Icon size={20} className={isActive ? "text-slate-950 shrink-0" : "text-slate-400 shrink-0"} />
                  <span className={`truncate flex-1 text-left ${sidebarOpen ? "block" : "hidden lg:hidden"}`}>
                    {title}
                  </span>
                  {isActive && (
                    <ChevronRight size={16} className={`text-slate-950/80 shrink-0 ${sidebarOpen ? "block" : "hidden lg:hidden"}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Current User Display Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 rounded-2xl p-2 sm:p-2.5 bg-slate-900/90 border border-slate-800/90 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md border border-amber-400/40">
              <User size={20} className="text-slate-950" />
            </div>
            <div className={`min-w-0 flex-1 ${sidebarOpen ? "block" : "hidden lg:hidden"}`}>
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-amber-400/80 font-semibold truncate">
                {isAdmin ? t.adminRole : `${getShortRoleLabel(currentUser.role)} (${currentUser.assignedProjects.length > 0 ? currentUser.assignedProjects[0] : "Site"})`}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
