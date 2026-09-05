import React, { useState } from "react";
import {
  LayoutDashboard, Wallet, Landmark, FileCheck,
  Plus, X, ArrowDownLeft, ArrowUpRight
} from "lucide-react";
import { Language, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";

type MobileNavBarProps = {
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: UserAccount;
  lang: Language;
  onOpenCashInModal: () => void;
  onOpenCashOutModal: () => void;
  onOpenBankPaymentModal: () => void;
  onOpenGstBillModal: () => void;
};

export function MobileNavBar({
  activePage,
  setActivePage,
  currentUser,
  lang,
  onOpenCashInModal,
  onOpenCashOutModal,
  onOpenBankPaymentModal,
  onOpenGstBillModal,
}: MobileNavBarProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";
  const [showQuickSheet, setShowQuickSheet] = useState(false);

  return (
    <>
      {/* ─── Mobile Bottom Navigation Bar ───────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-nav-bottom shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around">
          {/* Dashboard Tab */}
          <button
            type="button"
            onClick={() => setActivePage("Dashboard")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activePage === "Dashboard" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activePage === "Dashboard" ? "bg-amber-400/15" : ""}`}>
              <LayoutDashboard size={19} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{t.dashboard}</span>
          </button>

          {/* Site Daily Cash Tab */}
          <button
            type="button"
            onClick={() => setActivePage("Site Daily Cash")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activePage === "Site Daily Cash" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activePage === "Site Daily Cash" ? "bg-amber-400/15" : ""}`}>
              <Wallet size={19} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{lang === "gu" ? "દૈનિક રોકડ" : lang === "hi" ? "दैनिक रोकड़" : "Daily Cash"}</span>
          </button>

          {/* Center Floating Action Button (FAB) */}
          <div className="relative -top-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowQuickSheet(prev => !prev)}
              aria-label="Quick Entry"
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-4 ring-slate-950 transition active:scale-95 ${
                showQuickSheet ? "rotate-45" : ""
              }`}
            >
              <Plus size={26} />
            </button>
          </div>

          {/* Bank Payments Tab */}
          <button
            type="button"
            onClick={() => setActivePage("Bank Payments")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activePage === "Bank Payments" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activePage === "Bank Payments" ? "bg-amber-400/15" : ""}`}>
              <Landmark size={19} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{lang === "gu" ? "બેંક પેમેન્ટ" : lang === "hi" ? "बैंक भुगतान" : "Bank"}</span>
          </button>

          {/* GST Bills Tab */}
          <button
            type="button"
            onClick={() => setActivePage("GST Bills")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activePage === "GST Bills" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activePage === "GST Bills" ? "bg-amber-400/15" : ""}`}>
              <FileCheck size={19} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{lang === "gu" ? "GST બીલ" : lang === "hi" ? "GST बिल" : "GST Bills"}</span>
          </button>
        </div>
      </nav>

      {/* ─── Mobile Fast Entry Sheet ────────────────────────────────────── */}
      {showQuickSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">{t.quickAdd}</h3>
                <p className="text-[11px] text-amber-400">Select what you want to add or open</p>
              </div>
              <button
                onClick={() => setShowQuickSheet(false)}
                className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Cash In (જમા) */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenCashInModal();
                }}
                className="flex flex-col items-start p-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <ArrowDownLeft size={20} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">{t.addCashIn}</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Office to Site / Supervisor</p>
              </button>

              {/* Cash Out (ઉધાર) */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenCashOutModal();
                }}
                className="flex flex-col items-start p-3.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-left transition active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-2">
                  <ArrowUpRight size={20} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">{t.addCashOut}</p>
                <p className="text-[10px] text-red-400 mt-0.5">JCB, Labour, Material, Kharchi</p>
              </button>

              {/* Direct Bank Payment */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickSheet(false);
                    onOpenBankPaymentModal();
                  }}
                  className="flex flex-col items-start p-3.5 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-left transition active:scale-95"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                    <Landmark size={20} />
                  </div>
                  <p className="text-xs font-bold text-white leading-tight">{t.addBankPayment}</p>
                  <p className="text-[10px] text-blue-400 mt-0.5">Party RTGS / NEFT / Cheque</p>
                </button>
              )}

              {/* GST Bill */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  onOpenGstBillModal();
                }}
                className={`flex flex-col items-start p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition active:scale-95 ${
                  !isAdmin ? "col-span-2" : ""
                }`}
              >
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                  <FileCheck size={20} />
                </div>
                <p className="text-xs font-bold text-white leading-tight">{t.addGstBill}</p>
                <p className="text-[10px] text-amber-400 mt-0.5">Tax invoice with auto GST</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
