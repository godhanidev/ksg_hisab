import React from "react";
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  FileCheck,
  Building2,
  Users,
  User,
  UserCheck,
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
    { key: "Account", icon: UserCheck, translateKey: "account" },
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* ── Sidebar Container ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between bg-slate-950 text-white transition-all duration-300 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20 xl:w-64"
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="flex h-16 sm:h-20 items-center justify-between px-4 xl:px-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md border border-slate-700 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="KS Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 xl:block hidden">
                <h1 className="text-sm font-black tracking-tight text-white truncate">K.S.GODHANI</h1>
                <p className="text-[10px] font-semibold text-amber-400 truncate">Civil Works & Construction</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 p-3 xl:p-4">
            {allowedMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              const title = t[item.translateKey];

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActivePage(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-900/80 hover:text-white"
                  }`}
                  title={title}
                >
                  <Icon size={18} className={isActive ? "text-slate-950 shrink-0" : "text-slate-400 shrink-0"} />
                  <span className="truncate xl:block hidden flex-1 text-left">{title}</span>
                  {isActive && <ChevronRight size={14} className="xl:block hidden text-slate-950/70" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Current User Card (Click to open Account) */}
        <div className="p-3 xl:p-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setActivePage("Account");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 rounded-2xl p-2.5 xl:p-3 border transition text-left group ${
              activePage === "Account"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-slate-900/90 border-slate-800 hover:bg-slate-800/80"
            }`}
            title="Open Account Profile"
          >
            <div className="flex h-9 w-9 xl:h-10 xl:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md border border-amber-400/40">
              <User size={20} className="text-slate-950" />
            </div>
            <div className="min-w-0 flex-1 xl:block hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-amber-400/80 font-semibold truncate">
                {isAdmin ? t.adminRole : `${getShortRoleLabel(currentUser.role)} (${currentUser.assignedProjects.length > 0 ? currentUser.assignedProjects[0] : "Site"})`}
              </p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
