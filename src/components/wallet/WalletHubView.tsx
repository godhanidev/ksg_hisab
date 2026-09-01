import React, { useState, useMemo } from "react";
import {
  Attachment, Expense, FundTransfer, Language, Project, UserAccount, WalletSummary
} from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr } from "../../utils/formatters";
import { exportToExcelCSV } from "../../utils/exportUtils";
import {
  WalletCards, ArrowDownRight, ArrowUpRight, Building2, Plus,
  Search, Filter, Download, Printer, User, Eye, CheckCircle2,
  CalendarDays, Tag, Shield, IndianRupee, Layers, FileText, ArrowRightLeft
} from "lucide-react";

type WalletHubViewProps = {
  projects: Project[];
  supervisors: UserAccount[];
  expenses: Expense[];
  fundTransfers: FundTransfer[];
  currentUser: UserAccount;
  lang: Language;
  onOpenTransferModal: (defaultSupervisorId?: number, defaultProject?: string) => void;
  onOpenExpenseModal: (defaultProject?: string) => void;
  onViewAttachment: (att: Attachment, title: string, subtitle?: string) => void;
};

type LedgerRow = {
  id: string;
  date: string;
  rawDate: string;
  txId: string;
  type: "credit" | "debit" | "direct_office";
  description: string;
  category: string;
  project: string;
  supervisorName: string;
  vendorOrReceiver: string;
  paymentMode: string;
  referenceNo?: string;
  attachment?: Attachment;
  creditAmount: number;
  debitAmount: number;
  walletImpact: number; // + for credit, - for supervisor debit, 0 for direct office
  runningBalance?: number;
};

export function WalletHubView({
  projects,
  supervisors,
  expenses,
  fundTransfers,
  currentUser,
  lang,
  onOpenTransferModal,
  onOpenExpenseModal,
  onViewAttachment,
}: WalletHubViewProps) {
  const t = getTranslation(lang) as any;
  const isAdmin = currentUser.role === "admin";

  // Filter valid supervisors
  const supervisorList = supervisors.filter(u => u.role === "supervisor" || u.id !== 1);

  // Search & Filter State
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>(
    isAdmin ? "ALL" : String(currentUser.id)
  );
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Calculate Real-Time Wallets for Each Supervisor
  const walletSummaries: WalletSummary[] = useMemo(() => {
    return supervisorList.map(sup => {
      // Sum of all fund transfers to this supervisor
      const supTransfers = fundTransfers.filter(ft => ft.supervisorId === sup.id);
      const totalReceived = supTransfers.reduce((sum, ft) => sum + ft.amount, 0);

      // Sum of all expenses debited from supervisor wallet
      const supExpenses = expenses.filter(exp => {
        const isThisSup = exp.supervisorId === sup.id || exp.enteredBy === sup.name;
        const isFromWallet = !exp.paymentSource || exp.paymentSource === "Supervisor Wallet";
        return isThisSup && isFromWallet;
      });
      const totalSpent = supExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      const balance = totalReceived - totalSpent;

      const lastTransfer = supTransfers[supTransfers.length - 1];
      const lastExp = supExpenses[supExpenses.length - 1];

      return {
        supervisorId: sup.id,
        supervisorName: sup.name,
        phone: sup.phone,
        assignedProjects: sup.assignedProjects,
        totalReceived,
        totalSpent,
        balance,
        lastTransferDate: lastTransfer?.date,
        lastExpenseDate: lastExp?.date,
      };
    });
  }, [supervisorList, fundTransfers, expenses]);

  // Overall Totals
  const totalAllocatedBudget = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.value || 0), 0);
  }, [projects]);

  const totalFundsTransferred = useMemo(() => {
    return fundTransfers.reduce((sum, ft) => sum + ft.amount, 0);
  }, [fundTransfers]);

  const totalSupervisorExpenses = useMemo(() => {
    return expenses
      .filter(exp => !exp.paymentSource || exp.paymentSource === "Supervisor Wallet")
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const totalDirectOfficeExpenses = useMemo(() => {
    return expenses
      .filter(exp => exp.paymentSource === "Direct Office Payment")
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const totalCurrentCashInHand = useMemo(() => {
    return totalFundsTransferred - totalSupervisorExpenses;
  }, [totalFundsTransferred, totalSupervisorExpenses]);

  // 2. Build Unified Master Ledger (Chronological Passbook)
  const masterLedgerRows: LedgerRow[] = useMemo(() => {
    const rows: LedgerRow[] = [];

    // Add Fund Transfers (Credits)
    fundTransfers.forEach(ft => {
      rows.push({
        id: `ft_${ft.id}`,
        date: ft.date,
        rawDate: ft.date,
        txId: ft.transferNo,
        type: "credit",
        description: ft.notes || "Funds issued from Head Office (Imprest Advance)",
        category: "Fund Transfer",
        project: ft.project,
        supervisorName: ft.supervisorName,
        vendorOrReceiver: ft.supervisorName,
        paymentMode: ft.paymentMode,
        referenceNo: ft.referenceNo,
        attachment: ft.proofAttachment,
        creditAmount: ft.amount,
        debitAmount: 0,
        walletImpact: ft.amount,
      });
    });

    // Add Expenses (Debits or Direct Office)
    expenses.forEach(exp => {
      const isDirectOffice = exp.paymentSource === "Direct Office Payment";
      rows.push({
        id: `exp_${exp.id}`,
        date: exp.date,
        rawDate: exp.date,
        txId: exp.billNumber || `EXP-${exp.id}`,
        type: isDirectOffice ? "direct_office" : "debit",
        description: exp.description,
        category: exp.category,
        project: exp.project,
        supervisorName: exp.supervisorName || exp.enteredBy || "Site Team",
        vendorOrReceiver: exp.vendor,
        paymentMode: exp.paymentMode,
        referenceNo: exp.billNumber,
        attachment: exp.attachments?.[0],
        creditAmount: 0,
        debitAmount: exp.amount,
        walletImpact: isDirectOffice ? 0 : -exp.amount,
      });
    });

    // Sort chronologically (oldest to newest for running balance)
    rows.sort((a, b) => {
      const parseDate = (d: string) => {
        const parts = d.split("/");
        if (parts.length === 3) {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        }
        return new Date(d).getTime() || 0;
      };
      return parseDate(a.date) - parseDate(b.date);
    });

    // Calculate Running Balance
    let running = 0;
    rows.forEach(r => {
      running += r.walletImpact;
      r.runningBalance = running;
    });

    // Return reversed for latest-first view
    return rows.reverse();
  }, [fundTransfers, expenses]);

  // Filter Ledger Rows
  const filteredLedger = useMemo(() => {
    return masterLedgerRows.filter(row => {
      // Supervisor Filter
      if (selectedSupervisorFilter !== "ALL") {
        const targetSup = supervisorList.find(s => String(s.id) === selectedSupervisorFilter);
        if (targetSup && !row.supervisorName.toLowerCase().includes(targetSup.name.toLowerCase())) {
          return false;
        }
      }

      // Project Filter
      if (selectedProjectFilter !== "ALL" && row.project !== selectedProjectFilter) {
        return false;
      }

      // Type Filter
      if (selectedTypeFilter === "credit" && row.type !== "credit") return false;
      if (selectedTypeFilter === "debit" && row.type !== "debit") return false;
      if (selectedTypeFilter === "direct_office" && row.type !== "direct_office") return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          row.txId.toLowerCase().includes(q) ||
          row.description.toLowerCase().includes(q) ||
          row.project.toLowerCase().includes(q) ||
          row.supervisorName.toLowerCase().includes(q) ||
          row.vendorOrReceiver.toLowerCase().includes(q) ||
          (row.referenceNo && row.referenceNo.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [masterLedgerRows, selectedSupervisorFilter, selectedProjectFilter, selectedTypeFilter, searchQuery, supervisorList]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = [
      "Date",
      "Transaction ID",
      "Type",
      "Description",
      "Category",
      "Project Site",
      "Supervisor",
      "Vendor / Receiver",
      "Payment Mode",
      "UTR / Ref No",
      "Credit (+) Rs",
      "Debit (-) Rs",
      "Running Balance Rs"
    ];

    const rows = filteredLedger.map(r => [
      r.date,
      r.txId,
      r.type === "credit" ? "Fund Transfer (Credit)" : r.type === "direct_office" ? "Direct HO Payment" : "Site Expense (Debit)",
      r.description,
      r.category,
      r.project,
      r.supervisorName,
      r.vendorOrReceiver,
      r.paymentMode,
      r.referenceNo || "-",
      r.creditAmount || 0,
      r.debitAmount || 0,
      r.runningBalance || 0
    ]);

    exportToExcelCSV(`KSG_Petty_Cash_Ledger_${todayStr().replace(/\//g, "-")}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Primary Action Bar ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <WalletCards size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {lang === "gu" ? "રોકડ હિસાબ અને સુપરવાઇઝર વૉલેટ" : lang === "hi" ? "पेटी कैश और सुपरवाइजर वॉलेट" : "Petty Cash & Supervisor Wallets"}
              </h1>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? (lang === "gu" ? "ઓફિસ ફંડ ટ્રાન્સફર, સાઇટ ખર્ચા અને દૈનિક રોકડ સિલક (Cash in Hand)" : "Head office fund allocations, site expenses & master cash in hand ledger")
                  : (lang === "gu" ? "તમારું દૈનિક રોકડ વૉલેટ (Petty Cash Wallet) અને હિસાબ પાસબુક" : "Your personal digital petty cash wallet balance & passbook")}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Download size={14} className="text-slate-500" />
            <span>{lang === "gu" ? "એક્સેલ ડાઉનલોડ" : "Export Excel"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Printer size={14} className="text-slate-500" />
            <span>Print</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onOpenTransferModal()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition active:scale-95"
            >
              <Plus size={16} />
              <span>{lang === "gu" ? "પૈસા મોકલો (Issue Funds)" : "Issue Funds"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Financial KPI Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Funds Transferred */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
              {lang === "gu" ? "કુલ આપેલ રકમ (Issued)" : "Total Funds Issued"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatINR(totalFundsTransferred)}
          </p>
          <p className="text-[11px] font-semibold text-blue-600 mt-1 flex items-center gap-1">
            <span>{fundTransfers.length} Transfers from HO</span>
          </p>
        </div>

        {/* Supervisor Site Expenses */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
              {lang === "gu" ? "સાઇટ રોકડ ખર્ચા" : "Site Cash Expenses"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatINR(totalSupervisorExpenses)}
          </p>
          <p className="text-[11px] font-semibold text-red-600 mt-1">
            Debited from Petty Cash
          </p>
        </div>

        {/* Direct Office Payments */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
              {lang === "gu" ? "ઓફિસ સીધા પેમેન્ટ્સ" : "Direct Office Payments"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatINR(totalDirectOfficeExpenses)}
          </p>
          <p className="text-[11px] font-semibold text-purple-600 mt-1">
            Zero Wallet Deduction
          </p>
        </div>

        {/* Current Cash in Hand (Master Balance) */}
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-800 tracking-wide uppercase flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" />
              {lang === "gu" ? "હાથ પર રોકડ (Cash in Hand)" : "Total Cash in Hand"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-2xl font-black text-emerald-700 tracking-tight">
            {formatINR(totalCurrentCashInHand)}
          </p>
          <p className="text-[11px] font-bold text-emerald-800 mt-1">
            Available with Supervisors
          </p>
        </div>
      </div>

      {/* ─── Supervisor Digital Wallet Cards ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <User size={18} className="text-amber-500" />
            <span>{lang === "gu" ? "સુપરવાઇઝર રોકડ વૉલેટ સ્થિતિ" : "Supervisors' Digital Wallets"}</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {walletSummaries.length} {lang === "gu" ? "સુપરવાઇઝરો" : "Supervisors Active"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {walletSummaries.map(wallet => {
            const isPositive = wallet.balance > 0;
            const isLow = wallet.balance < 10000 && wallet.balance >= 0;

            return (
              <div
                key={wallet.supervisorId}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-slate-900 font-black text-sm border border-amber-500/20">
                        {wallet.supervisorName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 leading-tight">
                          {wallet.supervisorName}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          📱 {wallet.phone || "No Phone"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                        isLow
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : isPositive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                      }`}
                    >
                      {isLow ? "Low Cash" : isPositive ? "Healthy" : "Zero Balance"}
                    </span>
                  </div>

                  {/* Assigned Sites */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {wallet.assignedProjects.length > 0 ? (
                      wallet.assignedProjects.map(proj => (
                        <span
                          key={proj}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                        >
                          🏗️ {proj.split(" - ")[0]}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">All Sites (Floating)</span>
                    )}
                  </div>

                  {/* Balance Display */}
                  <div className="mt-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">
                        {lang === "gu" ? "હાથ પર રોકડ (Cash in Hand)" : "Current Cash in Hand"}
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatINR(wallet.balance)}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-[10px]">
                      <div>
                        <span className="text-slate-400">Received (HO):</span>
                        <p className="font-bold text-blue-700">{formatINR(wallet.totalReceived)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Spent (Site):</span>
                        <p className="font-bold text-red-600">{formatINR(wallet.totalSpent)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSupervisorFilter(String(wallet.supervisorId))}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 transition underline underline-offset-2"
                  >
                    View Passbook →
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenTransferModal(wallet.supervisorId, wallet.assignedProjects[0])}
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-slate-950 px-2.5 py-1 text-xs font-black transition"
                    >
                      <Plus size={13} />
                      <span>Issue Funds</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Unified Master Financial Ledger (Passbook Table) ────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Controls & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                <span>{lang === "gu" ? "દૈનિક રોકડ ખતાવાહી (Master Ledger Statement)" : "Master Petty Cash Ledger Statement"}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {filteredLedger.length} {lang === "gu" ? "ટ્રાન્ઝેક્શન્સ મળ્યા" : "Transactions Recorded"}
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search UTR, Vendor, Ref..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-8.5 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 shadow-xs"
              />
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Supervisor Filter */}
            <div>
              <select
                value={selectedSupervisorFilter}
                onChange={e => setSelectedSupervisorFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
              >
                <option value="ALL">👤 All Supervisors ({supervisorList.length})</option>
                {supervisorList.map(s => (
                  <option key={s.id} value={String(s.id)}>
                    👤 {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Site Filter */}
            <div>
              <select
                value={selectedProjectFilter}
                onChange={e => setSelectedProjectFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
              >
                <option value="ALL">📍 All Project Sites ({projects.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>
                    🏗️ {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
              >
                <option value="ALL">🔄 All Transactions (Credits &amp; Debits)</option>
                <option value="credit">🟢 Credits (Funds Issued from HO)</option>
                <option value="debit">🔴 Debits (Supervisor Site Expenses)</option>
                <option value="direct_office">🏢 Direct Head Office Payments</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Date &amp; Ref ID</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3.5">Description &amp; Purpose</th>
                <th className="py-3 px-3">Project Site</th>
                <th className="py-3 px-3">Supervisor / Vendor</th>
                <th className="py-3 px-3">Payment Mode &amp; UTR</th>
                <th className="py-3 px-3 text-right">Credit (+)</th>
                <th className="py-3 px-3 text-right">Debit (-)</th>
                <th className="py-3 px-3.5 text-right font-black">Cash Balance</th>
                <th className="py-3 px-2.5 text-center">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-semibold">
                    No transactions match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((row, idx) => (
                  <tr
                    key={row.id + "_" + idx}
                    className={`hover:bg-slate-50/80 transition ${
                      row.type === "credit"
                        ? "bg-blue-50/20"
                        : row.type === "direct_office"
                        ? "bg-purple-50/20"
                        : ""
                    }`}
                  >
                    {/* Date & Ref */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{row.date}</div>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{row.txId}</span>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {row.type === "credit" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                          <ArrowDownRight size={11} /> Fund Issued
                        </span>
                      ) : row.type === "direct_office" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-800">
                          <Building2 size={11} /> Direct HO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800">
                          <ArrowUpRight size={11} /> Site Cash
                        </span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3.5 max-w-[220px]">
                      <p className="font-bold text-slate-900 truncate" title={row.description}>
                        {row.description}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{row.category}</p>
                    </td>

                    {/* Site */}
                    <td className="py-3 px-3 whitespace-nowrap max-w-[140px] truncate" title={row.project}>
                      🏗️ {row.project.split(" - ")[0]}
                    </td>

                    {/* Supervisor / Vendor */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 truncate max-w-[120px]">{row.supervisorName}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        To: {row.vendorOrReceiver}
                      </div>
                    </td>

                    {/* Payment Mode & UTR */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{row.paymentMode}</div>
                      {row.referenceNo && (
                        <div className="font-mono text-[10px] text-amber-700 truncate max-w-[130px]" title={row.referenceNo}>
                          {row.referenceNo}
                        </div>
                      )}
                    </td>

                    {/* Credit (+) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {row.creditAmount > 0 ? (
                        <span className="font-black text-blue-700">+{formatINR(row.creditAmount)}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Debit (-) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {row.debitAmount > 0 ? (
                        <span className={`font-black ${row.type === "direct_office" ? "text-purple-700" : "text-red-600"}`}>
                          -{formatINR(row.debitAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Cash in Hand Balance */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap font-black text-slate-900 bg-slate-50/50">
                      {formatINR(row.runningBalance || 0)}
                    </td>

                    {/* Proof Slip Viewer */}
                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      {row.attachment ? (
                        <button
                          type="button"
                          onClick={() => onViewAttachment(row.attachment!, `${row.txId} - Payment Proof`, row.description)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="View Proof Receipt"
                        >
                          <Eye size={15} />
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
