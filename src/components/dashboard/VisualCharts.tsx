import React from "react";
import { formatINR } from "../../utils/formatters";
import { Language, Project } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { Building2, TrendingUp, WalletCards, IndianRupee, ShieldCheck, CheckCircle2 } from "lucide-react";

type VisualChartsProps = {
  projects: Project[];
  totalContractValue: number;
  totalReceived: number;
  totalExpense: number;
  profit: number;
  lang: Language;
};

export function VisualCharts({
  projects,
  totalContractValue,
  totalReceived,
  totalExpense,
  profit,
  lang,
}: VisualChartsProps) {
  const t = getTranslation(lang);

  // Maximum value for proportional scaling
  const maxVal = Math.max(totalContractValue, totalReceived + totalExpense, 1);

  const budgetPct = Math.min(100, Math.round((totalContractValue / maxVal) * 100));
  const receivedPct = Math.min(100, Math.round((totalReceived / maxVal) * 100));
  const expensePct = Math.min(100, Math.round((totalExpense / maxVal) * 100));
  const profitPct = totalReceived > 0 ? ((profit / totalReceived) * 100).toFixed(1) : "0";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Visual Comparison Chart Card */}
      <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t.budgetVsExpense}</h2>
            <p className="text-xs text-slate-500">{t.financialSummary}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <TrendingUp size={13} /> {profitPct}% Margin
            </span>
          </div>
        </div>

        {/* Triple Bar Comparative Display */}
        <div className="space-y-5">
          {/* 1. Total Tender / Contract Budget */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="h-3 w-3 rounded-full bg-slate-900 inline-block" />
                {t.contractValue}
              </span>
              <span className="font-bold text-slate-900">{formatINR(totalContractValue)}</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-700"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>

          {/* 2. Cleared Govt Payments (Received) */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-2 text-emerald-700">
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                {t.clearedGovtPayment}
              </span>
              <span className="font-bold text-emerald-700">{formatINR(totalReceived)}</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${receivedPct}%` }}
              />
            </div>
          </div>

          {/* 3. Total Expenses Incurred */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-2 text-red-600">
                <span className="h-3 w-3 rounded-full bg-red-500 inline-block" />
                {t.totalExpenses}
              </span>
              <span className="font-bold text-red-600">{formatINR(totalExpense)}</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-700"
                style={{ width: `${expensePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Insights Footer */}
        <div className="mt-7 pt-5 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] font-medium text-slate-500">{t.collectionRate}</p>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
              {totalContractValue > 0 ? Math.round((totalReceived / totalContractValue) * 100) : 0}%
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50/70 p-3 border border-emerald-100">
            <p className="text-[11px] font-medium text-emerald-700">{t.netProfit}</p>
            <p className="text-sm sm:text-base font-extrabold text-emerald-800 mt-0.5">{formatINR(profit)}</p>
          </div>
          <div className="rounded-2xl bg-amber-50/70 p-3 border border-amber-100">
            <p className="text-[11px] font-medium text-amber-700">{t.pendingReceivable}</p>
            <p className="text-sm sm:text-base font-extrabold text-amber-800 mt-0.5">
              {formatINR(totalContractValue - totalReceived)}
            </p>
          </div>
        </div>
      </div>

      {/* Active Sites Health Mini Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{t.activeProjects}</h3>
            <span className="rounded-full bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 text-xs border border-blue-200">
              {projects.length} Sites
            </span>
          </div>

          <div className="space-y-3.5">
            {projects.slice(0, 4).map(p => {
              const pProfit = p.received - p.expense;
              return (
                <div key={p.id} className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 hover:bg-slate-100/80 transition">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{p.name}</p>
                    <span className="text-[11px] font-bold text-slate-700 shrink-0">{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Recv: <strong className="text-emerald-700">{formatINR(p.received)}</strong></span>
                    <span>Exp: <strong className="text-red-600">{formatINR(p.expense)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> Govt Approved</span>
          <span>KSG Audited Ledger</span>
        </div>
      </div>
    </div>
  );
}
