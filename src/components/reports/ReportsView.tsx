import React, { useState } from "react";
import {
  BarChart3, Download, Printer, Filter, Building2, IndianRupee, WalletCards, TrendingUp,
  FileCheck, ShieldCheck, PieChart, ArrowUpRight
} from "lucide-react";
import { Bill, DailyReport, Expense, LabourWorker, Language, Machinery, MaterialItem, Project, UserAccount } from "../../types";
import { formatINR } from "../../utils/formatters";
import { getTranslation } from "../../i18n/translations";
import { StatCard } from "../common/StatCard";
import { StatusBadge } from "../common/StatusBadge";
import { printAuditReport, exportExpensesExcel, exportBillsExcel, exportSiteSummaryExcel } from "../../utils/exportUtils";

type ReportsViewProps = {
  projects: Project[];
  expenses: Expense[];
  bills: Bill[];
  labour: LabourWorker[];
  materials: MaterialItem[];
  machinery: Machinery[];
  reports: DailyReport[];
  currentUser: UserAccount;
  lang: Language;
};

export function ReportsView({
  projects,
  expenses,
  bills,
  labour,
  materials,
  machinery,
  reports,
  currentUser,
  lang,
}: ReportsViewProps) {
  const t = getTranslation(lang);
  const [selectedSite, setSelectedSite] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  // Filter expenses and bills based on selected filters
  const filteredProjects = selectedSite === "ALL" ? projects : projects.filter(p => p.name === selectedSite);
  const filteredExpenses = selectedSite === "ALL" ? expenses : expenses.filter(e => e.project === selectedSite);
  const filteredBills = selectedSite === "ALL" ? bills : bills.filter(b => b.project === selectedSite);
  const filteredLabour = selectedSite === "ALL" ? labour : labour.filter(l => l.project === selectedSite);
  const filteredMachinery = selectedSite === "ALL" ? machinery : machinery.filter(m => m.project === selectedSite);

  const totalContract = filteredProjects.reduce((s, p) => s + p.value, 0);
  const totalReceived = filteredBills.reduce((s, b) => s + b.received, 0);
  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalReceived - totalExpense;
  const profitMargin = totalReceived > 0 ? ((netProfit / totalReceived) * 100).toFixed(1) : "0";

  // Category breakdown
  const materialCost = filteredExpenses.filter(e => e.category === "Material").reduce((s, e) => s + e.amount, 0);
  const labourCost = filteredLabour.reduce((s, l) => s + l.paid, 0);
  const machineryCost = filteredMachinery.reduce((s, m) => s + m.totalCost, 0);
  const otherCost = Math.max(0, totalExpense - materialCost - labourCost - machineryCost);

  const breakdown = [
    { label: t.materialCost, amount: materialCost, color: "bg-blue-500", pct: totalExpense > 0 ? Math.round((materialCost / totalExpense) * 100) : 0 },
    { label: t.labourCost, amount: labourCost, color: "bg-emerald-500", pct: totalExpense > 0 ? Math.round((labourCost / totalExpense) * 100) : 0 },
    { label: t.machineryCost, amount: machineryCost, color: "bg-amber-500", pct: totalExpense > 0 ? Math.round((machineryCost / totalExpense) * 100) : 0 },
    { label: t.otherExpenses, amount: otherCost, color: "bg-slate-400", pct: totalExpense > 0 ? Math.round((otherCost / totalExpense) * 100) : 0 },
  ];

  const handlePrintFullAudit = () => {
    const activePrj = selectedSite === "ALL" ? undefined : projects.find(p => p.name === selectedSite);
    printAuditReport({
      title: selectedSite === "ALL" ? "Comprehensive Government Civil Accounting Audit" : `Site Audit Statement - ${selectedSite}`,
      project: activePrj,
      projects: filteredProjects,
      expenses: filteredExpenses,
      bills: filteredBills,
      labour: filteredLabour,
      materials,
      machinery: filteredMachinery,
      reports,
      dateRange: selectedMonth !== "ALL" ? selectedMonth : "Financial Year 2026-27",
    });
  };

  return (
    <div className="space-y-7">
      {/* Top Banner with CA Audit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{t.reports}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{t.caSubmission}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportSiteSummaryExcel(projects, expenses, bills)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download size={15} />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handlePrintFullAudit}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md"
          >
            <Printer size={16} />
            <span>{t.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <Filter size={15} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{t.filterBySite}:</span>
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold bg-slate-50 outline-none flex-1 max-w-sm"
          >
            <option value="ALL">📁 {t.allSites} ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>🏗️ {p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">{t.monthFilter}:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold bg-slate-50 outline-none"
          >
            <option value="ALL">{t.allMonths}</option>
            <option value="August 2026">August 2026</option>
            <option value="July 2026">July 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="May 2026">May 2026</option>
          </select>
        </div>
      </div>

      {/* P&L Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.contractValue}
          value={formatINR(totalContract)}
          icon={Building2}
          trend={`${filteredProjects.length} Sites Selected`}
          color="bg-slate-100 text-slate-800"
        />
        <StatCard
          title={t.clearedGovtPayment}
          value={formatINR(totalReceived)}
          icon={IndianRupee}
          trend="Cleared in Govt Treasury"
          color="bg-emerald-100 text-emerald-800"
        />
        <StatCard
          title={t.totalExpenses}
          value={formatINR(totalExpense)}
          icon={WalletCards}
          trend="Site operating costs"
          positive={false}
          color="bg-red-100 text-red-700"
        />
        <StatCard
          title={t.netProfit}
          value={formatINR(netProfit)}
          icon={TrendingUp}
          trend={`${profitMargin}% Net Margin`}
          positive={netProfit >= 0}
          color={netProfit >= 0 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-700"}
        />
      </div>

      {/* Site-wise P&L Table and Expense Breakdown Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Project-Wise P&L Cards */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">{t.profitLossStatement}</h2>
              <p className="text-xs text-slate-500">Site-by-site revenue vs actual expense</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {filteredProjects.length} Sites
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredProjects.map(p => {
              const pProfit = p.received - p.expense;
              const margin = p.received > 0 ? ((pProfit / p.received) * 100).toFixed(1) : "0";
              return (
                <div key={p.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 hover:bg-slate-100/70 transition">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.department} &bull; {p.code}</p>
                    </div>
                    <StatusBadge status={p.status} lang={lang} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-white p-2 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Budget</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatINR(p.value)}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50/80 p-2 border border-emerald-100">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase">Received</p>
                      <p className="font-bold text-emerald-800 mt-0.5">{formatINR(p.received)}</p>
                    </div>
                    <div className={`rounded-xl p-2 border ${pProfit >= 0 ? "bg-blue-50/80 border-blue-100" : "bg-red-50/80 border-red-100"}`}>
                      <p className={`text-[10px] font-bold uppercase ${pProfit >= 0 ? "text-blue-700" : "text-red-700"}`}>
                        Profit ({margin}%)
                      </p>
                      <p className={`font-bold mt-0.5 ${pProfit >= 0 ? "text-blue-900" : "text-red-800"}`}>
                        {formatINR(pProfit)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">{t.expenseBreakdown}</h2>
                <p className="text-xs text-slate-500">Distribution across operational heads</p>
              </div>
              <span className="text-xs font-bold text-red-600">Total: {formatINR(totalExpense)}</span>
            </div>

            <div className="space-y-4">
              {breakdown.map(({ label, amount, color, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="flex items-center gap-2 text-slate-800">
                      <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
                      {label}
                    </span>
                    <span className="text-slate-900">
                      {formatINR(amount)} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-amber-50/80 border border-amber-200 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <ShieldCheck size={16} className="text-amber-700" />
              <span>CA Audit Ready Documentation</span>
            </div>
            <p className="text-xs text-amber-800/90 mt-1">
              All entries include complete vendor names, voucher references, payment mode tags, and attached photo receipts for smooth tax and government department audits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
