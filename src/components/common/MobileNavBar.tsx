import React, { useState } from "react";
import {
  LayoutDashboard, Building2, WalletCards, ReceiptIndianRupee,
  Menu, Plus, X, Users, Package, Truck, FileText, BarChart3,
  Shield, LogOut, Camera, HardHat, CheckCircle2
} from "lucide-react";
import { Language, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";

type MobileNavBarProps = {
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: UserAccount;
  lang: Language;
  onOpenExpenseModal: () => void;
  onOpenBillModal: () => void;
  onOpenLabourModal: () => void;
  onOpenMaterialModal: () => void;
  onOpenMachineryModal: () => void;
  onOpenReportModal: () => void;
  onOpenSidebar: () => void;
  onLogout: () => void;
};

export function MobileNavBar({
  activePage,
  setActivePage,
  currentUser,
  lang,
  onOpenExpenseModal,
  onOpenBillModal,
  onOpenLabourModal,
  onOpenMaterialModal,
  onOpenMachineryModal,
  onOpenReportModal,
  onOpenSidebar,
  onLogout,
}: MobileNavBarProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";
  const [showQuickSheet, setShowQuickSheet] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const navItems = [
    { id: "Dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "Projects", label: t.projects, icon: Building2 },
    { id: "Expenses", label: t.expenses, icon: WalletCards },
    { id: "Income & Bills", label: "Bills", icon: ReceiptIndianRupee },
  ];

  return (
    <>
      {/* ─── Mobile Bottom App Bar ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around">
          {/* Dashboard Tab */}
          <button
            type="button"
            onClick={() => setActivePage("Dashboard")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              activePage === "Dashboard" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activePage === "Dashboard" ? "bg-amber-400/15" : ""}`}>
              <LayoutDashboard size={20} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{t.dashboard}</span>
          </button>

          {/* Projects Tab */}
          <button
            type="button"
            onClick={() => setActivePage("Projects")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              activePage === "Projects" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activePage === "Projects" ? "bg-amber-400/15" : ""}`}>
              <Building2 size={20} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{t.projects}</span>
          </button>

          {/* Center Floating Action Button (FAB) for Instant Fast Entry */}
          <div className="relative -top-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowQuickSheet(prev => !prev)}
              aria-label="Quick Site Entry"
              className={`flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-4 ring-slate-950 transition active:scale-95 ${
                showQuickSheet ? "rotate-45" : ""
              }`}
            >
              <Plus size={28} />
            </button>
          </div>

          {/* Expenses Tab */}
          <button
            type="button"
            onClick={() => setActivePage("Expenses")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              activePage === "Expenses" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activePage === "Expenses" ? "bg-amber-400/15" : ""}`}>
              <WalletCards size={20} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{t.expenses}</span>
          </button>

          {/* More / Menu Drawer Trigger */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(prev => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              showMoreMenu || !["Dashboard", "Projects", "Expenses", "Income & Bills"].includes(activePage)
                ? "text-amber-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                showMoreMenu || !["Dashboard", "Projects", "Expenses", "Income & Bills"].includes(activePage)
                  ? "bg-amber-400/15"
                  : ""
              }`}
            >
              <Menu size={20} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">
              {lang === "gu" ? "મેનૂ" : lang === "hi" ? "अन्य" : "Menu"}
            </span>
          </button>
        </div>
      </nav>

      {/* ─── Mobile Fast Entry Bottom Sheet ──────────────────────────────── */}
      {showQuickSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                  KSG
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Fast Site Action &amp; Data Entry</h3>
                  <p className="text-[11px] text-amber-400">Select what you want to log right now</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickSheet(false)}
                className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Daily Expense & Camera Bill */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenExpenseModal();
                }}
                className="flex flex-col items-start p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                  <Camera size={18} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">Daily Expense</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Attach bill photo</p>
              </button>

              {/* Generate RA Bill */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenBillModal();
                }}
                className="flex flex-col items-start p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <ReceiptIndianRupee size={18} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">Govt RA Bill</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Itemized invoice</p>
              </button>

              {/* Labour Wage */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenLabourModal();
                }}
                className="flex flex-col items-start p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                  <Users size={18} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">Labour Wages</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Artisans &amp; staff</p>
              </button>

              {/* Material Stock */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenMaterialModal();
                }}
                className="flex flex-col items-start p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                  <Package size={18} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">Material Stock</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Cement, Steel, Sand</p>
              </button>

              {/* Machinery Log */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenMachineryModal();
                }}
                className="flex flex-col items-start p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-2">
                  <Truck size={18} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">Machinery Log</p>
                <p className="text-[10px] text-slate-400 mt-0.5">JCB, Mixer, Tractor</p>
              </button>

              {/* Daily Site Progress Report */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenReportModal();
                }}
                className="flex flex-col items-start p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2">
                  <FileText size={18} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">Daily DPR Log</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Site progress &amp; staff</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Full Menu Drawer ──────────────────────────────────────── */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 border border-slate-700 shadow-sm">
                  <img src="/logo.png" alt="KS" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{currentUser.name}</h3>
                  <p className="text-xs text-amber-400 font-semibold">{isAdmin ? t.adminRole : t.supervisorRole}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActivePage("Income & Bills");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
              >
                <ReceiptIndianRupee size={16} className="text-amber-400" />
                <span>Govt RA Bills</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePage("Labour");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
              >
                <Users size={16} className="text-blue-400" />
                <span>{t.labour}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePage("Material & Stock");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
              >
                <Package size={16} className="text-purple-400" />
                <span>{t.materialStock}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePage("Machinery");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
              >
                <Truck size={16} className="text-orange-400" />
                <span>{t.machinery}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePage("Daily Reports");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
              >
                <FileText size={16} className="text-sky-400" />
                <span>{t.dailyReports}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePage("Reports");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
              >
                <BarChart3 size={16} className="text-emerald-400" />
                <span>{t.reports}</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePage("User Management");
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
                >
                  <Shield size={16} className="text-amber-400" />
                  <span>User &amp; Roles</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActivePage("Settings");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-left border border-white/5"
              >
                <HardHat size={16} className="text-slate-400" />
                <span>Contractor Profile</span>
              </button>
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-xs border border-red-500/20 transition"
              >
                <LogOut size={15} />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
