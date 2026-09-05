import React, { useMemo } from "react";
import { PieChart, BarChart3, TrendingUp, Wallet, Landmark } from "lucide-react";
import { BankPayment, CashTransaction, GSTBill, Language, Project } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";

type VisualChartsProps = {
  cashTransactions: CashTransaction[];
  bankPayments: BankPayment[];
  gstBills: GSTBill[];
  projects: Project[];
  lang: Language;
};

export const VisualCharts = React.memo(function VisualCharts({
  cashTransactions,
  bankPayments,
  gstBills,
  projects,
  lang,
}: VisualChartsProps) {
  const t = getTranslation(lang);

  // Category breakdown for cash expenses
  const categoryStats = useMemo(() => {
    const map: { [cat: string]: number } = {};
    const cashOuts = cashTransactions.filter(c => c.type === "cash_out");
    let total = 0;

    cashOuts.forEach(c => {
      const cat = c.category || "Other";
      map[cat] = (map[cat] || 0) + c.amount;
      total += c.amount;
    });

    const entries = Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      pct: total > 0 ? ((amount / total) * 100).toFixed(1) : "0",
    }));

    // Sort highest first
    return {
      entries: entries.sort((a, b) => b.amount - a.amount),
      total,
    };
  }, [cashTransactions]);

  // Comparison totals memoized
  const { totalCashGiven, totalCashSpent, totalBankSpent, totalCombinedOut } = useMemo(() => {
    const cashGiven = cashTransactions
      .filter(c => c.type === "cash_in")
      .reduce((s, c) => s + c.amount, 0);

    const cashSpent = cashTransactions
      .filter(c => c.type === "cash_out")
      .reduce((s, c) => s + c.amount, 0);

    const bankSpent = bankPayments.reduce((s, b) => s + b.amount, 0);
    const combinedOut = cashSpent + bankSpent;

    return {
      totalCashGiven: cashGiven,
      totalCashSpent: cashSpent,
      totalBankSpent: bankSpent,
      totalCombinedOut: combinedOut,
    };
  }, [cashTransactions, bankPayments]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ── 1. Site Cash Expense Breakdown by Category ──────────────────── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <PieChart size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === "gu" ? "સાઇટ રોકડ ખર્ચ વિભાજન (Category Breakdown)" : "Site Cash Expense Breakdown"}
              </h3>
              <p className="text-[11px] text-slate-400">JCB, Labour, Material, Tractor &amp; Miscellaneous</p>
            </div>
          </div>
          <span className="text-xs font-black text-rose-700">
            {formatINR(categoryStats.total)}
          </span>
        </div>

        {categoryStats.entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No site cash expenses recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {categoryStats.entries.slice(0, 5).map((item, idx) => {
              const barColors = [
                "bg-rose-500",
                "bg-amber-500",
                "bg-blue-500",
                "bg-purple-500",
                "bg-emerald-500",
              ];
              const color = barColors[idx % barColors.length];

              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-bold">{formatINR(item.amount)}</span>
                      <span className="text-[11px] text-slate-400 font-normal">({item.pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Payment Channel Flow (Bank RTGS vs Site Cash) ─────────────── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === "gu" ? "ચુકવણી માધ્યમ સરખામણી" : "Payment Channel Comparison"}
              </h3>
              <p className="text-[11px] text-slate-400">Bank RTGS vs Site Cash Outflow</p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-900">
            {formatINR(totalCombinedOut)}
          </span>
        </div>

        <div className="space-y-4">
          {/* Direct Office Bank Transfers */}
          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Direct Office Bank RTGS</p>
                  <p className="text-[10px] text-slate-500">Party / Vendor Direct Transfers</p>
                </div>
              </div>
              <p className="text-sm font-black text-blue-700">{formatINR(totalBankSpent)}</p>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-blue-200/60">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: totalCombinedOut > 0 ? `${(totalBankSpent / totalCombinedOut) * 100}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* Site Cash Expenses */}
          <div className="rounded-2xl bg-rose-50/60 border border-rose-100 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-rose-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Site Daily Cash Expenses</p>
                  <p className="text-[10px] text-slate-500">JCB, Labour, Carting &amp; Site Cash</p>
                </div>
              </div>
              <p className="text-sm font-black text-rose-700">{formatINR(totalCashSpent)}</p>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-rose-200/60">
              <div
                className="h-full rounded-full bg-rose-600"
                style={{
                  width: totalCombinedOut > 0 ? `${(totalCashSpent / totalCombinedOut) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
