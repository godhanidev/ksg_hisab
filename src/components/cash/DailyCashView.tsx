import React, { useState, useMemo, useEffect } from "react";
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Search, Filter,
  Download, Printer, Eye, Trash2, Edit2, Paperclip, Calendar, CheckCircle2,
  AlertCircle, Users, ArrowRight, UserCheck, Shield
} from "lucide-react";
import { Attachment, CashTransaction, Language, Project, Role, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";
import { exportCashTransactionsExcel } from "../../utils/exportUtils";
import { DeleteConfirmModal, DeleteTargetInfo } from "../common/DeleteConfirmModal";
import { Pagination } from "../common/Pagination";
import { calculateSiteTeamBalances, getSiteTeamMembers } from "../../utils/cashCalculations";

type DailyCashViewProps = {
  transactions: CashTransaction[];
  onAddCashIn: () => void;
  onAddCashOut: () => void;
  onAddTransfer?: () => void;
  onEditTransaction: (tx: CashTransaction) => void;
  onDeleteTransaction: (id: number) => void;
  onViewAttachment: (data: { attachment: Attachment; title: string; subtitle?: string; amount?: string }) => void;
  projects: Project[];
  selectedSiteFilter: string;
  setSelectedSiteFilter: (site: string) => void;
  currentUser: UserAccount;
  users: UserAccount[];
  lang: Language;
};

export const DailyCashView = React.memo(function DailyCashView({
  transactions,
  onAddCashIn,
  onAddCashOut,
  onAddTransfer,
  onEditTransaction,
  onDeleteTransaction,
  onViewAttachment,
  projects,
  selectedSiteFilter,
  setSelectedSiteFilter,
  currentUser,
  users = [],
  lang,
}: DailyCashViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "cash_in" | "cash_out" | "transfer">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Allowed site list based on user role
  const userAllowedSites = useMemo(() => {
    if (isAdmin) return projects.map(p => p.name);
    return currentUser.assignedProjects.length > 0
      ? currentUser.assignedProjects
      : projects.map(p => p.name);
  }, [isAdmin, projects, currentUser]);

  // Active project object
  const activeProjectObj = useMemo(() => {
    return projects.find(p => p.name === selectedSiteFilter);
  }, [projects, selectedSiteFilter]);

  // Live balances per team member on the selected site (or all sites)
  const siteTeamBalances = useMemo(() => {
    return calculateSiteTeamBalances(selectedSiteFilter, transactions, users, activeProjectObj);
  }, [selectedSiteFilter, transactions, users, activeProjectObj]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Role site check
      if (!isAdmin && !userAllowedSites.includes(tx.project)) return false;

      // Header site filter
      if (selectedSiteFilter !== "ALL" && tx.project !== selectedSiteFilter) return false;

      // Type filter
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;

      // Member filter (Person's personal hisab)
      if (selectedMemberFilter !== "ALL") {
        const target = selectedMemberFilter.toLowerCase().trim();
        const recipient = (tx.recipientName || tx.supervisorName || "").toLowerCase().trim();
        const paidBy = (tx.paidByName || tx.supervisorName || tx.enteredBy || "").toLowerCase().trim();
        const inDetails = (tx.details || "").toLowerCase().includes(target);

        const matchRecipient = recipient === target || recipient.includes(target) || target.includes(recipient);
        const matchPaidBy = paidBy === target || paidBy.includes(target) || target.includes(paidBy);

        if (!matchRecipient && !matchPaidBy && !inDetails) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDetails = tx.details.toLowerCase().includes(q);
        const matchCat = (tx.category || "").toLowerCase().includes(q);
        const matchSup = (tx.supervisorName || "").toLowerCase().includes(q);
        const matchRecipient = (tx.recipientName || "").toLowerCase().includes(q);
        const matchPaidBy = (tx.paidByName || "").toLowerCase().includes(q);
        const matchNotes = (tx.notes || "").toLowerCase().includes(q);
        const matchVoucher = (tx.voucherNo || "").toLowerCase().includes(q);

        if (!matchDetails && !matchCat && !matchSup && !matchRecipient && !matchPaidBy && !matchNotes && !matchVoucher) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    isAdmin,
    userAllowedSites,
    selectedSiteFilter,
    typeFilter,
    categoryFilter,
    selectedMemberFilter,
    searchQuery
  ]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Financial summary calculations
  const totalCashIn = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "cash_in")
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const totalCashOut = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "cash_out")
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const totalTransfers = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "transfer")
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  // If a specific member is filtered, show that member's net cash balance; else show overall site cash balance
  const activeMemberSummary = useMemo(() => {
    if (selectedMemberFilter === "ALL") return null;
    return siteTeamBalances.find(b =>
      b.name.toLowerCase() === selectedMemberFilter.toLowerCase() ||
      b.name.toLowerCase().includes(selectedMemberFilter.toLowerCase())
    ) || null;
  }, [selectedMemberFilter, siteTeamBalances]);

  const cashInHand = activeMemberSummary
    ? activeMemberSummary.balance
    : (totalCashIn - totalCashOut);

  // Running balance calculation for ledger display
  const transactionsWithRunningBalance = useMemo(() => {
    let currentBalance = 0;
    // Sort oldest first for running balance calculation, then reverse for display
    const sortedOldestFirst = [...filteredTransactions].sort((a, b) => a.id - b.id);

    const withBal = sortedOldestFirst.map(tx => {
      const amt = Number(tx.amount) || 0;

      if (selectedMemberFilter !== "ALL") {
        const mem = selectedMemberFilter.toLowerCase().trim();
        const rec = (tx.recipientName || tx.supervisorName || "").toLowerCase().trim();
        const pBy = (tx.paidByName || tx.supervisorName || tx.enteredBy || "").toLowerCase().trim();

        if (tx.type === "cash_in") {
          if (rec === mem || rec.includes(mem) || mem.includes(rec)) {
            currentBalance += amt;
          }
        } else if (tx.type === "cash_out") {
          if (pBy === mem || pBy.includes(mem) || mem.includes(pBy)) {
            currentBalance -= amt;
          }
        } else if (tx.type === "transfer") {
          const isReceiver = rec === mem || rec.includes(mem) || mem.includes(rec);
          const isGiver = pBy === mem || pBy.includes(mem) || mem.includes(pBy);
          if (isReceiver) currentBalance += amt;
          if (isGiver) currentBalance -= amt;
        }
      } else {
        // Site running balance: cash_in increases, cash_out decreases, internal transfers do not affect site total
        if (tx.type === "cash_in") {
          currentBalance += amt;
        } else if (tx.type === "cash_out") {
          currentBalance -= amt;
        }
      }

      return { ...tx, runningBalance: currentBalance };
    });

    return withBal.reverse();
  }, [filteredTransactions, selectedMemberFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, categoryFilter, selectedSiteFilter, selectedMemberFilter]);

  // Paginated records for table
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactionsWithRunningBalance.slice(start, start + pageSize);
  }, [transactionsWithRunningBalance, currentPage, pageSize]);

  const handleExport = () => {
    exportCashTransactionsExcel(
      filteredTransactions,
      selectedSiteFilter !== "ALL" ? selectedSiteFilter : undefined
    );
  };

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case "admin":
        return {
          label: lang === "gu" ? "ઓનર / એડમિન" : "Owner / Admin",
          bg: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "site_partner":
        return {
          label: lang === "gu" ? "સાઇટ પાર્ટનર" : "Site Partner",
          bg: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "site_engineer":
        return {
          label: lang === "gu" ? "સાઇટ એન્જિનિયર" : "Site Engineer",
          bg: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "supervisor":
      default:
        return {
          label: lang === "gu" ? "સાઇટ સુપરવાઇઝર" : "Site Supervisor",
          bg: "bg-sky-100 text-sky-800 border-sky-200",
        };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header Title & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
              <Wallet size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {t.siteDailyCash}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                {lang === "gu"
                  ? "રોકડ જમા, સાઇટ ખર્ચ અને ટીમ વચ્ચે અંદરોઅંદર ફેરબદલીનો લાઈવ હિસાબ"
                  : "Cash In, Site Expenses & Internal Cash Handover Ledger"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Add Cash In (જમા) Button */}
          {isAdmin && (
            <button
              onClick={onAddCashIn}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-95"
            >
              <ArrowDownLeft size={16} />
              <span>{t.addCashIn}</span>
            </button>
          )}

          {/* Add Cash Out (ઉધાર / ખર્ચ) Button */}
          <button
            onClick={onAddCashOut}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition active:scale-95"
          >
            <ArrowUpRight size={16} />
            <span>{t.addCashOut}</span>
          </button>

          {/* Add Internal Transfer (આંતરિક ફેરબદલી) Button */}
          {onAddTransfer && (
            <button
              onClick={onAddTransfer}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95"
            >
              <ArrowLeftRight size={15} />
              <span>{lang === "gu" ? "આંતરિક ટ્રાન્સફર" : "Internal Transfer"}</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download size={15} />
            <span className="hidden sm:inline">{t.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* ── Live Financial Summary KPI Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Total Cash Given (જમા) */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {activeMemberSummary ? `${activeMemberSummary.name}: મળેલ જમા` : t.totalCashGiven}
            </p>
            <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-700">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            {formatINR(activeMemberSummary ? activeMemberSummary.totalReceived : totalCashIn)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {activeMemberSummary
              ? `${lang === "gu" ? "ઓફિસ + ટ્રાન્સફરથી મળેલ" : "Total Received"}`
              : `${filteredTransactions.filter(t => t.type === "cash_in").length} ${lang === "gu" ? "જમા વ્યવહારો" : "Credits Received"}`}
          </p>
        </div>

        {/* Total Site Cash Expense (ઉધાર) */}
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              {activeMemberSummary ? `${activeMemberSummary.name}: ખર્ચ કરેલ` : t.totalSiteExpense}
            </p>
            <div className="rounded-xl bg-rose-500/20 p-2 text-rose-700">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
            {formatINR(activeMemberSummary ? activeMemberSummary.totalSpent : totalCashOut)}
          </p>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">
            {activeMemberSummary && activeMemberSummary.totalTransferredOut > 0
              ? `+ ${formatINR(activeMemberSummary.totalTransferredOut)} અન્યને આપેલ`
              : `${filteredTransactions.filter(t => t.type === "cash_out").length} ${lang === "gu" ? "ખર્ચ વ્યવહારો" : "Expenses Incurred"}`}
          </p>
        </div>

        {/* Live Cash in Hand (હાથ પર રોકડ સિલક) */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-xs ${
            cashInHand >= 0
              ? "border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white"
              : "border-red-300 bg-gradient-to-br from-red-500/15 via-red-500/5 to-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeMemberSummary ? `${activeMemberSummary.name}: હાથ પર સિલક` : t.cashInHand}
            </p>
            <div
              className={`rounded-xl p-2 font-black ${
                cashInHand >= 0 ? "bg-blue-500/20 text-blue-700" : "bg-red-500/20 text-red-700"
              }`}
            >
              <Wallet size={18} />
            </div>
          </div>
          <p
            className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${
              cashInHand >= 0 ? "text-blue-700" : "text-red-600"
            }`}
          >
            {formatINR(cashInHand)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {activeMemberSummary
              ? lang === "gu"
                ? `આ સભ્ય પાસે અત્યારે ${formatINR(cashInHand)} રોકડા ઉપલબ્ધ છે`
                : `Active balance currently held by ${activeMemberSummary.name}`
              : cashInHand >= 0
              ? lang === "gu"
                ? "હાથ પર પૂરતી રોકડ સિલક ઉપલબ્ધ"
                : "Active Available Site Cash Balance"
              : lang === "gu"
              ? "ધ્યાન: રોકડ સિલક માઈનસ છે (જમા રકમ જરૂરી)"
              : "Deficit Balance (Cash Top-up Needed)"}
          </p>
        </div>
      </div>

      {/* ── 🌟 NEW: Site Team Cash in Hand (સાઇટ સભ્યોની હાથ પર રોકડ સિલક) ──── */}
      {siteTeamBalances.length > 0 && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-500" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {lang === "gu" ? "સાઇટ સભ્યોની હાથ પર રોકડ સિલક (Site Team Cash in Hand)" : "Site Team Cash Balances"}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === "gu"
                  ? "દરેક પાર્ટનર, એન્જિનિયર કે સુપરવાઇઝર પાસે અત્યારે કેટલા પૈસા છે તેનો લાઈવ હિસાબ"
                  : "Live petty cash currently held by each site partner, engineer, or supervisor"}
              </p>
            </div>

            {selectedMemberFilter !== "ALL" && (
              <button
                onClick={() => setSelectedMemberFilter("ALL")}
                className="self-start sm:self-auto text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition"
              >
                ✕ {lang === "gu" ? "બધા સભ્યોનો હિસાબ જુઓ" : "Show All Members"}
              </button>
            )}
          </div>

          {/* Cards Grid for each member */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {siteTeamBalances.map(member => {
              const badge = getRoleBadge(member.role);
              const isSelected = selectedMemberFilter.toLowerCase() === member.name.toLowerCase();

              return (
                <div
                  key={member.name}
                  onClick={() => {
                    setSelectedMemberFilter(isSelected ? "ALL" : member.name);
                  }}
                  className={`relative flex flex-col justify-between rounded-2xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/30 scale-[1.01]"
                      : "border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div>
                    {/* Top row: Name & Role Badge */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={member.name}>
                          {member.name}
                        </p>
                        <span className={`inline-block mt-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>

                      {isSelected && (
                        <span className="rounded-full bg-amber-500 p-1 text-slate-950 shrink-0 shadow-xs">
                          <CheckCircle2 size={12} />
                        </span>
                      )}
                    </div>

                    {/* Breakdown Numbers */}
                    <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>{lang === "gu" ? "મળેલ (Received):" : "Received:"}</span>
                        <span className="font-bold text-emerald-700">+{formatINR(member.totalReceived)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{lang === "gu" ? "ખર્ચ (Expenses):" : "Expenses:"}</span>
                        <span className="font-bold text-rose-700">-{formatINR(member.totalSpent)}</span>
                      </div>
                      {member.totalTransferredOut > 0 && (
                        <div className="flex items-center justify-between">
                          <span>{lang === "gu" ? "અન્યને આપેલ:" : "Transferred Out:"}</span>
                          <span className="font-bold text-indigo-700">-{formatINR(member.totalTransferredOut)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Net Cash in Hand Badge */}
                  <div
                    className={`mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between ${
                      member.balance >= 0 ? "text-slate-900" : "text-rose-600"
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {lang === "gu" ? "હાથ પર સિલક" : "In Hand"}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black px-2 py-0.5 rounded-lg ${
                        member.balance >= 0
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {formatINR(member.balance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters & Search Control Bar ──────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          {/* Search Input */}
          <div className="relative sm:col-span-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Site Filter */}
          {isAdmin && (
            <div className="sm:col-span-3">
              <select
                value={selectedSiteFilter}
                onChange={e => {
                  setSelectedSiteFilter(e.target.value);
                  setSelectedMemberFilter("ALL");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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

          {/* Member Filter (Filter by specific site member) */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-3"}>
            <select
              value={selectedMemberFilter}
              onChange={e => setSelectedMemberFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">{lang === "gu" ? "બધા સભ્યો (All Members)" : "All Members"}</option>
              {siteTeamBalances.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name} (₹{m.balance.toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-3"}>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
            >
              <option value="all">{t.allTypes}</option>
              <option value="cash_in">{t.cashIn}</option>
              <option value="cash_out">{t.cashOut}</option>
              <option value="transfer">{lang === "gu" ? "આંતરિક ટ્રાન્સફર (Transfer)" : "Internal Transfer"}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-3"}>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Transaction Ledger Table ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {transactionsWithRunningBalance.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Search size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">{t.noRecordsFound}</p>
            <p className="text-xs text-slate-400 mt-1">Try changing filters or add a new cash transaction</p>
          </div>
        ) : (
          <>
            {/* ── Mobile Phone Card View (sm:hidden) ────────────────── */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedTransactions.map(tx => {
                const isCashIn = tx.type === "cash_in";
                const isTransfer = tx.type === "transfer";

                return (
                  <div key={tx.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition">
                    {/* Top Row: Type Badge, Date, Site */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                            isCashIn
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isTransfer
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isCashIn ? (
                            <>
                              <ArrowDownLeft size={13} className="text-emerald-600" />
                              <span>{lang === "gu" ? "જમા" : "Cash In"}</span>
                            </>
                          ) : isTransfer ? (
                            <>
                              <ArrowLeftRight size={13} className="text-indigo-600" />
                              <span>{lang === "gu" ? "ટ્રાન્સફર" : "Transfer"}</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight size={13} className="text-rose-600" />
                              <span>{lang === "gu" ? "ઉધાર" : "Cash Out"}</span>
                            </>
                          )}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {tx.date}
                        </span>
                      </div>

                      {/* Site Tag */}
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                        {tx.project}
                      </span>
                    </div>

                    {/* Middle Row: Details & Amount */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 leading-snug">
                          {tx.details}
                        </p>
                        {tx.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tx.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {tx.category || "General"}
                          </span>
                          {tx.voucherNo && (
                            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              #{tx.voucherNo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Big Amount & Running Balance */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-base font-black ${
                            isCashIn
                              ? "text-emerald-700"
                              : isTransfer
                              ? "text-indigo-700"
                              : "text-rose-700"
                          }`}
                        >
                          {isCashIn ? `+${formatINR(tx.amount)}` : isTransfer ? `${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          સિલક: <strong className={tx.runningBalance >= 0 ? "text-slate-800" : "text-rose-600"}>{formatINR(tx.runningBalance)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Handled By Row */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 text-xs text-slate-700 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {isCashIn ? (
                          <span className="text-[11px] font-semibold">
                            🟢 મેળવનાર: <strong className="text-emerald-900">{tx.recipientName || tx.supervisorName || "Rajubhai"}</strong>
                            {tx.paidByName && <span className="text-slate-400 ml-1">({tx.paidByName})</span>}
                          </span>
                        ) : isTransfer ? (
                          <span className="text-[11px] font-semibold flex items-center gap-1 flex-wrap">
                            🔴 <strong className="text-indigo-900">{tx.paidByName || "Sender"}</strong>
                            <span className="text-slate-400">➔</span>
                            🟢 <strong className="text-emerald-900">{tx.recipientName || "Receiver"}</strong>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold">
                            💳 ખર્ચ કરનાર: <strong className="text-rose-900">{tx.paidByName || tx.supervisorName || tx.enteredBy}</strong>
                          </span>
                        )}
                      </div>

                      {/* Action Buttons for Mobile */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {tx.attachments && tx.attachments.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onViewAttachment({
                                attachment: tx.attachments![0],
                                title: tx.details,
                                subtitle: `${tx.project} • ${tx.date}`,
                                amount: formatINR(tx.amount),
                              })
                            }
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"
                            title={t.viewPhoto}
                          >
                            <Paperclip size={14} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
                          title={t.edit}
                        >
                          <Edit2 size={14} />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              const typeLabel = isCashIn
                                ? (lang === "gu" ? "કેશ ઇન (જમા)" : "Cash In")
                                : isTransfer
                                ? (lang === "gu" ? "આંતરિક ટ્રાન્સફર" : "Transfer")
                                : (lang === "gu" ? "કેશ આઉટ (ખર્ચ/ઉધાર)" : "Cash Out");

                              setDeleteTarget({
                                id: tx.id,
                                title: lang === "gu" ? "કેશ એન્ટ્રી ડિલીટ" : "Delete Cash Entry",
                                itemName: tx.details,
                                itemDetails: `${tx.project} • ${tx.date} • ${tx.category || "General"} ${tx.supervisorName || tx.enteredBy ? `• By: ${tx.supervisorName || tx.enteredBy}` : ""}`,
                                itemAmount: formatINR(tx.amount),
                                itemTypeBadge: typeLabel,
                                onConfirm: () => onDeleteTransaction(tx.id),
                              });
                            }}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                            title={t.delete}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop & Tablet Table View (hidden sm:block) ────── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3 sm:px-4">{t.date}</th>
                  <th className="py-3 px-3 sm:px-4">{t.project}</th>
                  <th className="py-3 px-3 sm:px-4">{t.type}</th>
                  <th className="py-3 px-3 sm:px-4">{t.details}</th>
                  <th className="py-3 px-3 sm:px-4">{t.category}</th>
                  <th className="py-3 px-3 sm:px-4">{lang === "gu" ? "સભ્ય હિસાબ (Handled By)" : "Handled By"}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.cashIn}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.cashOut}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{lang === "gu" ? "સિલક (₹)" : "Balance (₹)"}</th>
                  <th className="py-3 px-3 sm:px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.map(tx => {
                  const isCashIn = tx.type === "cash_in";
                  const isTransfer = tx.type === "transfer";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium text-slate-700">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-semibold text-slate-900 max-w-[150px] truncate">
                        {tx.project}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                            isCashIn
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isTransfer
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isCashIn ? (
                            <>
                              <ArrowDownLeft size={13} className="text-emerald-600" />
                              <span>{lang === "gu" ? "જમા" : "Cash In"}</span>
                            </>
                          ) : isTransfer ? (
                            <>
                              <ArrowLeftRight size={13} className="text-indigo-600" />
                              <span>{lang === "gu" ? "ટ્રાન્સફર" : "Transfer"}</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight size={13} className="text-rose-600" />
                              <span>{lang === "gu" ? "ઉધાર" : "Cash Out"}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.details}</span>
                          {tx.notes && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({tx.notes})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-600 whitespace-nowrap">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {tx.category || "General"}
                        </span>
                      </td>

                      {/* Member / Handled By Column */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs">
                        {isCashIn ? (
                          <div>
                            <span className="font-bold text-emerald-800">
                              To: {tx.recipientName || tx.supervisorName || "Rajubhai"}
                            </span>
                            {tx.paidByName && (
                              <span className="text-[10px] text-slate-400 block">
                                By: {tx.paidByName}
                              </span>
                            )}
                          </div>
                        ) : isTransfer ? (
                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-indigo-900">{tx.paidByName || "Sender"}</span>
                            <span className="text-slate-400 font-normal">➔</span>
                            <span className="text-emerald-800">{tx.recipientName || "Receiver"}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-rose-800">
                              By: {tx.paidByName || tx.supervisorName || tx.enteredBy}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cash In Column */}
                      <td className="py-3 px-3 sm:px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {isCashIn ? formatINR(tx.amount) : isTransfer ? "-" : "-"}
                      </td>

                      {/* Cash Out Column */}
                      <td className="py-3 px-3 sm:px-4 text-right font-bold text-rose-700 whitespace-nowrap">
                        {!isCashIn && !isTransfer ? formatINR(tx.amount) : "-"}
                      </td>

                      {/* Running Balance Column */}
                      <td
                        className={`py-3 px-3 sm:px-4 text-right font-mono font-bold whitespace-nowrap ${
                          tx.runningBalance >= 0 ? "text-slate-800" : "text-rose-600"
                        }`}
                      >
                        {formatINR(tx.runningBalance)}
                      </td>

                      {/* Action icons */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Attachment Button */}
                          {tx.attachments && tx.attachments.length > 0 && (
                            <button
                              onClick={() =>
                                onViewAttachment({
                                  attachment: tx.attachments![0],
                                  title: tx.details,
                                  subtitle: `${tx.project} • ${tx.date}`,
                                  amount: formatINR(tx.amount),
                                })
                              }
                              title={t.viewPhoto}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Paperclip size={15} />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title={t.edit}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete Button (Admin only or Creator) */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                const typeLabel = isCashIn
                                  ? (lang === "gu" ? "કેશ ઇન (જમા)" : "Cash In")
                                  : isTransfer
                                  ? (lang === "gu" ? "આંતરિક ટ્રાન્સફર" : "Transfer")
                                  : (lang === "gu" ? "કેશ આઉટ (ખર્ચ/ઉધાર)" : "Cash Out");

                                setDeleteTarget({
                                  id: tx.id,
                                  title: lang === "gu" ? "કેશ એન્ટ્રી ડિલીટ" : "Delete Cash Entry",
                                  itemName: tx.details,
                                  itemDetails: `${tx.project} • ${tx.date} • ${tx.category || "General"} ${tx.supervisorName || tx.enteredBy ? `• By: ${tx.supervisorName || tx.enteredBy}` : ""}`,
                                  itemAmount: formatINR(tx.amount),
                                  itemTypeBadge: typeLabel,
                                  onConfirm: () => onDeleteTransaction(tx.id),
                                });
                              }}
                              title={t.delete}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={transactionsWithRunningBalance.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          lang={lang}
        />
      </div>

      {/* Animated Deletion Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        target={deleteTarget}
        lang={lang}
      />
    </div>
  );
});
