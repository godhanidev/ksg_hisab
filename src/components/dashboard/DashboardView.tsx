import React, { useMemo } from "react";
import {
  Wallet, Landmark, FileCheck, Building2, TrendingUp,
  ArrowDownLeft, ArrowUpRight, Plus, Eye, Paperclip, CheckCircle2,
  Calendar, ArrowRight, Activity, DollarSign
} from "lucide-react";
import {
  Attachment, BankPayment, CashTransaction, GSTBill, Language, Project, UserAccount
} from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, getUserRoleLabel } from "../../utils/formatters";
import { VisualCharts } from "./VisualCharts";

type DashboardViewProps = {
  projects: Project[];
  cashTransactions: CashTransaction[];
  bankPayments: BankPayment[];
  gstBills: GSTBill[];
  currentUser: UserAccount;
  selectedSiteFilter: string;
  setSelectedSiteFilter: (site: string) => void;
  lang: Language;
  onAddCashIn: () => void;
  onAddCashOut: () => void;
  onAddBankPayment: () => void;
  onAddGstBill: () => void;
  onNavigateToTab: (tab: string) => void;
  onViewAttachment: (data: { attachment: Attachment; title: string; subtitle?: string; amount?: string }) => void;
  onViewProject360: (project: Project) => void;
};

export function DashboardView({
  projects,
  cashTransactions,
  bankPayments,
  gstBills,
  currentUser,
  selectedSiteFilter,
  setSelectedSiteFilter,
  lang,
  onAddCashIn,
  onAddCashOut,
  onAddBankPayment,
  onAddGstBill,
  onNavigateToTab,
  onViewAttachment,
  onViewProject360,
}: DashboardViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  // Filter lists based on selected site and user access
  const userAllowedSites = useMemo(() => {
    if (isAdmin) return projects.map(p => p.name);
    return currentUser.assignedProjects.length > 0
      ? currentUser.assignedProjects
      : projects.map(p => p.name);
  }, [isAdmin, projects, currentUser]);

  const filteredCash = useMemo(() => {
    return cashTransactions.filter(c => {
      if (!isAdmin && !userAllowedSites.includes(c.project)) return false;
      if (selectedSiteFilter !== "ALL" && c.project !== selectedSiteFilter) return false;
      return true;
    });
  }, [cashTransactions, isAdmin, userAllowedSites, selectedSiteFilter]);

  const filteredBank = useMemo(() => {
    return bankPayments.filter(b => {
      if (!isAdmin && !userAllowedSites.includes(b.project)) return false;
      if (selectedSiteFilter !== "ALL" && b.project !== selectedSiteFilter) return false;
      return true;
    });
  }, [bankPayments, isAdmin, userAllowedSites, selectedSiteFilter]);

  const filteredGST = useMemo(() => {
    return gstBills.filter(g => {
      if (!isAdmin && !userAllowedSites.includes(g.project)) return false;
      if (selectedSiteFilter !== "ALL" && g.project !== selectedSiteFilter) return false;
      return true;
    });
  }, [gstBills, isAdmin, userAllowedSites, selectedSiteFilter]);

  // Master Summary Calculations
  const totalCashGiven = useMemo(() => {
    return filteredCash
      .filter(c => c.type === "cash_in")
      .reduce((s, c) => s + c.amount, 0);
  }, [filteredCash]);

  const totalSiteExpense = useMemo(() => {
    return filteredCash
      .filter(c => c.type === "cash_out")
      .reduce((s, c) => s + c.amount, 0);
  }, [filteredCash]);

  const cashInHand = totalCashGiven - totalSiteExpense;

  const totalBankPayments = useMemo(() => {
    return filteredBank.reduce((s, b) => s + b.amount, 0);
  }, [filteredBank]);

  const totalGstBills = useMemo(() => {
    return filteredGST.reduce((s, g) => s + g.totalAmount, 0);
  }, [filteredGST]);

  const totalProjectCost = totalSiteExpense + totalBankPayments;

  // Active Projects filtered
  const activeProjects = useMemo(() => {
    return projects.filter(p => {
      if (!isAdmin && !userAllowedSites.includes(p.name)) return false;
      if (selectedSiteFilter !== "ALL" && p.name !== selectedSiteFilter) return false;
      return true;
    });
  }, [projects, isAdmin, userAllowedSites, selectedSiteFilter]);

  // Recent 6 transactions combined (Cash, Bank, GST)
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      title: string;
      subtitle: string;
      amount: number;
      type: "cash_in" | "cash_out" | "bank" | "gst";
      attachment?: Attachment;
    }> = [];

    filteredCash.forEach(c => {
      list.push({
        id: `cash_${c.id}`,
        date: c.date,
        title: c.details,
        subtitle: `${c.project} • ${c.category || "Site"}`,
        amount: c.amount,
        type: c.type,
        attachment: c.attachments?.[0],
      });
    });

    filteredBank.forEach(b => {
      list.push({
        id: `bank_${b.id}`,
        date: b.date,
        title: b.partyName,
        subtitle: `${b.project} • ${b.paymentMode}`,
        amount: b.amount,
        type: "bank",
        attachment: b.attachments?.[0],
      });
    });

    filteredGST.forEach(g => {
      list.push({
        id: `gst_${g.id}`,
        date: g.date,
        title: `Bill #${g.billNo} - ${g.partyName}`,
        subtitle: `${g.project} • ${g.product}`,
        amount: g.totalAmount,
        type: "gst",
        attachment: g.attachments?.[0],
      });
    });

    // Sort by id descending
    return list.slice(0, 6);
  }, [filteredCash, filteredBank, filteredGST]);

  return (
    <div className="space-y-6 pb-20">
      {/* ── Executive Welcome Banner ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-7 text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {getUserRoleLabel(currentUser.role, lang)}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black mt-1.5 tracking-tight text-white">
            {currentUser.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl">
            {isAdmin
              ? lang === "gu"
                ? "મુખ્ય કચેરી હિસાબ કંટ્રોલ પેનલ - સાઇટ રોકડ, બેંક RTGS અને GST બીલ વ્યવહારોનું જીવંત વિશ્લેષણ."
                : "Head Office Executive Dashboard - Live tracking of Site Cash, Direct Bank RTGS & GST Invoices."
              : `${t.supervisorNotice}`}
          </p>
        </div>

        {/* Site Filter in Banner if Admin */}
        {isAdmin && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 text-left">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {t.filterBySite}
            </label>
            <select
              value={selectedSiteFilter}
              onChange={e => setSelectedSiteFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 py-1.5 px-3 text-xs sm:text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">{t.allSites}</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── 6 Excel-Matching Core KPI Metric Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Total Cash Given (જમા) */}
        <div
          onClick={() => onNavigateToTab("Site Daily Cash")}
          className="cursor-pointer rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-4 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              {t.totalCashGiven}
            </span>
            <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-700">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-emerald-700 tracking-tight">
            {formatINR(totalCashGiven)}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600 font-medium">Office Top-up (જમા)</p>
        </div>

        {/* 2. Total Site Expense (ઉધાર) */}
        <div
          onClick={() => onNavigateToTab("Site Daily Cash")}
          className="cursor-pointer rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-4 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              {t.totalSiteExpense}
            </span>
            <div className="rounded-lg bg-rose-500/20 p-1.5 text-rose-700">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-rose-700 tracking-tight">
            {formatINR(totalSiteExpense)}
          </p>
          <p className="mt-1 text-[10px] text-rose-600 font-medium">Site Cash Out (ઉધાર)</p>
        </div>

        {/* 3. Cash in Hand (સિલક) */}
        <div
          onClick={() => onNavigateToTab("Site Daily Cash")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs hover:shadow-md transition ${
            cashInHand >= 0
              ? "border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white"
              : "border-red-300 bg-gradient-to-br from-red-500/15 via-red-500/5 to-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
              {t.cashInHand}
            </span>
            <div
              className={`rounded-lg p-1.5 ${
                cashInHand >= 0 ? "bg-blue-500/20 text-blue-700" : "bg-red-500/20 text-red-700"
              }`}
            >
              <Wallet size={16} />
            </div>
          </div>
          <p
            className={`mt-2 text-xl font-black tracking-tight ${
              cashInHand >= 0 ? "text-blue-700" : "text-red-600"
            }`}
          >
            {formatINR(cashInHand)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Live Available</p>
        </div>

        {/* 4. Total Bank Payment (RTGS) */}
        <div
          onClick={() => onNavigateToTab("Bank Payments")}
          className="cursor-pointer rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white p-4 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
              {t.totalBankPayment}
            </span>
            <div className="rounded-lg bg-indigo-500/20 p-1.5 text-indigo-700">
              <Landmark size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-indigo-700 tracking-tight">
            {formatINR(totalBankPayments)}
          </p>
          <p className="mt-1 text-[10px] text-indigo-600 font-medium">Direct Party RTGS</p>
        </div>

        {/* 5. Total GST Bills */}
        <div
          onClick={() => onNavigateToTab("GST Bills")}
          className="cursor-pointer rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white p-4 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
              {t.totalGstBills}
            </span>
            <div className="rounded-lg bg-purple-500/20 p-1.5 text-purple-700">
              <FileCheck size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-purple-700 tracking-tight">
            {formatINR(totalGstBills)}
          </p>
          <p className="mt-1 text-[10px] text-purple-600 font-medium">{filteredGST.length} Invoices</p>
        </div>

        {/* 6. Total Project Cost */}
        <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              {t.totalProjectCost}
            </span>
            <div className="rounded-lg bg-amber-400/20 p-1.5 text-amber-400">
              <Activity size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-white tracking-tight">
            {formatINR(totalProjectCost)}
          </p>
          <p className="mt-1 text-[10px] text-slate-300 font-medium">Cash Out + Bank RTGS</p>
        </div>
      </div>

      {/* ── Quick Action Fast Entry Bar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 leading-tight">{t.quickAdd}</h3>
          <p className="text-xs text-slate-500">Fast transaction and bill logging</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={onAddCashIn}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
            >
              <ArrowDownLeft size={15} />
              <span>{t.addCashIn}</span>
            </button>
          )}

          <button
            onClick={onAddCashOut}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition active:scale-95"
          >
            <ArrowUpRight size={15} />
            <span>{t.addCashOut}</span>
          </button>

          {isAdmin && (
            <button
              onClick={onAddBankPayment}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
            >
              <Landmark size={15} />
              <span>{t.addBankPayment}</span>
            </button>
          )}

          <button
            onClick={onAddGstBill}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition active:scale-95"
          >
            <FileCheck size={15} />
            <span>{t.addGstBill}</span>
          </button>
        </div>
      </div>

      {/* ── Visual Analytics & Expense Breakdown Charts ─────────────────── */}
      <VisualCharts
        cashTransactions={filteredCash}
        bankPayments={filteredBank}
        gstBills={filteredGST}
        projects={activeProjects}
        lang={lang}
      />

      {/* ── Active Construction Sites Summary ────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.activeProjects}</h2>
            <p className="text-xs text-slate-500">{t.siteWiseReport}</p>
          </div>
          <button
            onClick={() => onNavigateToTab("Projects")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>View Sites</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Site Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Tender Value</th>
                <th className="py-3 px-4 text-right">Cash Given (જમા)</th>
                <th className="py-3 px-4 text-right">Cash Spent (ઉધાર)</th>
                <th className="py-3 px-4 text-right">Cash in Hand</th>
                <th className="py-3 px-4 text-right">Bank RTGS</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeProjects.map(p => {
                const siteCashIn = cashTransactions
                  .filter(c => c.project === p.name && c.type === "cash_in")
                  .reduce((s, c) => s + c.amount, 0);
                const siteCashOut = cashTransactions
                  .filter(c => c.project === p.name && c.type === "cash_out")
                  .reduce((s, c) => s + c.amount, 0);
                const siteBalance = siteCashIn - siteCashOut;
                const siteBank = bankPayments
                  .filter(b => b.project === p.name)
                  .reduce((s, b) => s + b.amount, 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.code}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs max-w-[180px] truncate">
                      {p.department}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {formatINR(p.value)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {formatINR(siteCashIn)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                      {formatINR(siteCashOut)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold ${
                        siteBalance >= 0 ? "text-blue-700" : "text-red-600"
                      }`}
                    >
                      {formatINR(siteBalance)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatINR(siteBank)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onViewProject360(p)}
                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                      >
                        Site 360°
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Transactions Activity Feed ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{t.recentTransactions}</h3>
            <p className="text-xs text-slate-500">Latest entries across Daily Cash, Bank &amp; GST bills</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentActivities.map(item => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 hover:bg-slate-100/80 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      item.type === "cash_in"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.type === "cash_out"
                        ? "bg-rose-100 text-rose-800"
                        : item.type === "bank"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {item.type === "cash_in"
                      ? "Cash In (જમા)"
                      : item.type === "cash_out"
                      ? "Site Expense"
                      : item.type === "bank"
                      ? "Bank RTGS"
                      : "GST Bill"}
                  </span>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 mt-1.5 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                </div>
                <p
                  className={`font-black text-sm shrink-0 ${
                    item.type === "cash_in"
                      ? "text-emerald-700"
                      : item.type === "cash_out"
                      ? "text-rose-700"
                      : item.type === "bank"
                      ? "text-blue-700"
                      : "text-purple-700"
                  }`}
                >
                  {formatINR(item.amount)}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>{item.date}</span>
                {item.attachment && (
                  <button
                    onClick={() =>
                      onViewAttachment({
                        attachment: item.attachment!,
                        title: item.title,
                        subtitle: item.subtitle,
                        amount: formatINR(item.amount),
                      })
                    }
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800"
                  >
                    <Paperclip size={12} /> Photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
