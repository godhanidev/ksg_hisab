import React, { useState, useMemo, useEffect } from "react";
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight, Search, Filter,
  Download, Printer, Eye, Trash2, Edit2, Paperclip, Calendar, CheckCircle2, AlertCircle
} from "lucide-react";
import { Attachment, CashTransaction, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";
import { exportCashTransactionsExcel } from "../../utils/exportUtils";
import { StatCard } from "../common/StatCard";
import { DeleteConfirmModal, DeleteTargetInfo } from "../common/DeleteConfirmModal";
import { Pagination } from "../common/Pagination";

type DailyCashViewProps = {
  transactions: CashTransaction[];
  onAddCashIn: () => void;
  onAddCashOut: () => void;
  onEditTransaction: (tx: CashTransaction) => void;
  onDeleteTransaction: (id: number) => void;
  onViewAttachment: (data: { attachment: Attachment; title: string; subtitle?: string; amount?: string }) => void;
  projects: Project[];
  selectedSiteFilter: string;
  setSelectedSiteFilter: (site: string) => void;
  currentUser: UserAccount;
  lang: Language;
};

export const DailyCashView = React.memo(function DailyCashView({
  transactions,
  onAddCashIn,
  onAddCashOut,
  onEditTransaction,
  onDeleteTransaction,
  onViewAttachment,
  projects,
  selectedSiteFilter,
  setSelectedSiteFilter,
  currentUser,
  lang,
}: DailyCashViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "cash_in" | "cash_out">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
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

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDetails = tx.details.toLowerCase().includes(q);
        const matchCat = (tx.category || "").toLowerCase().includes(q);
        const matchSup = (tx.supervisorName || "").toLowerCase().includes(q);
        const matchNotes = (tx.notes || "").toLowerCase().includes(q);
        const matchVoucher = (tx.voucherNo || "").toLowerCase().includes(q);
        if (!matchDetails && !matchCat && !matchSup && !matchNotes && !matchVoucher) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, isAdmin, userAllowedSites, selectedSiteFilter, typeFilter, categoryFilter, searchQuery]);

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

  const cashInHand = totalCashIn - totalCashOut;

  // Running balance calculation for ledger display
  const transactionsWithRunningBalance = useMemo(() => {
    let currentBalance = 0;
    // Sort oldest first for running balance calculation, then we can present in order
    const sortedOldestFirst = [...filteredTransactions].sort((a, b) => a.id - b.id);
    const withBal = sortedOldestFirst.map(tx => {
      if (tx.type === "cash_in") {
        currentBalance += tx.amount;
      } else {
        currentBalance -= tx.amount;
      }
      return { ...tx, runningBalance: currentBalance };
    });
    // Return latest first for user view
    return withBal.reverse();
  }, [filteredTransactions]);

  // Reset pagination to first page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, categoryFilter, selectedSiteFilter]);

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

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header Title & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
              <Wallet size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {t.siteDailyCash}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                {lang === "gu"
                  ? "રોકડ જમા (Cash In) અને સાઇટ ખર્ચ (Cash Out) દૈનિક લેજર"
                  : lang === "hi"
                  ? "रोकड़ जमा (Cash In) और साइट खर्च (Cash Out) दैनिक लेजर"
                  : "Daily Site Cash Ledger & Live Cash in Hand"}
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
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition active:scale-95"
          >
            <ArrowUpRight size={16} />
            <span>{t.addCashOut}</span>
          </button>

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
              {t.totalCashGiven}
            </p>
            <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-700">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            {formatINR(totalCashIn)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {filteredTransactions.filter(t => t.type === "cash_in").length} {lang === "gu" ? "જમા વ્યવહારો" : "Credits Received"}
          </p>
        </div>

        {/* Total Site Cash Expense (ઉધાર) */}
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              {t.totalSiteExpense}
            </p>
            <div className="rounded-xl bg-rose-500/20 p-2 text-rose-700">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
            {formatINR(totalCashOut)}
          </p>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">
            {filteredTransactions.filter(t => t.type === "cash_out").length} {lang === "gu" ? "ખર્ચ વ્યવહારો" : "Expenses Incurred"}
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
              {t.cashInHand}
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
            {cashInHand >= 0
              ? lang === "gu"
                ? "હાથ પર પૂરતી રોકડ સિલક ઉપલબ્ધ"
                : "Active Available Site Cash Balance"
              : lang === "gu"
              ? "ધ્યાન: રોકડ સિલક માઈનસ છે (જમા રકમ જરૂરી)"
              : "Deficit Balance (Cash Top-up Needed)"}
          </p>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ──────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          {/* Search Input */}
          <div className="relative sm:col-span-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Site Filter (Admin or Multi-site) */}
          {isAdmin && (
            <div className="sm:col-span-3">
              <select
                value={selectedSiteFilter}
                onChange={e => setSelectedSiteFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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

          {/* Type Filter */}
          <div className={isAdmin ? "sm:col-span-3" : "sm:col-span-4"}>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">{t.allTypes}</option>
              <option value="cash_in">{t.cashIn}</option>
              <option value="cash_out">{t.cashOut}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-4"}>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {transactionsWithRunningBalance.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Search size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">{t.noRecordsFound}</p>
            <p className="text-xs text-slate-400 mt-1">Try changing filters or add a new cash transaction</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3 sm:px-4">{t.date}</th>
                  <th className="py-3 px-3 sm:px-4">{t.project}</th>
                  <th className="py-3 px-3 sm:px-4">{t.type}</th>
                  <th className="py-3 px-3 sm:px-4">{t.details}</th>
                  <th className="py-3 px-3 sm:px-4">{t.category}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.cashIn}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.cashOut}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Balance (₹)</th>
                  <th className="py-3 px-3 sm:px-4">{t.supervisor}</th>
                  <th className="py-3 px-3 sm:px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.map(tx => {
                  const isCashIn = tx.type === "cash_in";
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
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isCashIn ? (
                            <>
                              <ArrowDownLeft size={13} className="text-emerald-600" />
                              <span>{lang === "gu" ? "જમા" : "Cash In"}</span>
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

                      {/* Cash In Column */}
                      <td className="py-3 px-3 sm:px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {isCashIn ? formatINR(tx.amount) : "-"}
                      </td>

                      {/* Cash Out Column */}
                      <td className="py-3 px-3 sm:px-4 text-right font-bold text-rose-700 whitespace-nowrap">
                        {!isCashIn ? formatINR(tx.amount) : "-"}
                      </td>

                      {/* Running Balance Column */}
                      <td
                        className={`py-3 px-3 sm:px-4 text-right font-mono font-bold whitespace-nowrap ${
                          tx.runningBalance >= 0 ? "text-slate-800" : "text-rose-600"
                        }`}
                      >
                        {formatINR(tx.runningBalance)}
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-slate-600 whitespace-nowrap text-xs">
                        {tx.supervisorName || tx.enteredBy}
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
                                const isCashIn = tx.type === "cash_in";
                                const typeLabel = isCashIn
                                  ? (lang === "gu" ? "કેશ ઇન (જમા)" : lang === "hi" ? "कैश इन (जमा)" : "Cash In")
                                  : (lang === "gu" ? "કેશ આઉટ (ખર્ચ/ઉધાર)" : lang === "hi" ? "कैश आउट (खર્ચ)" : "Cash Out");

                                setDeleteTarget({
                                  id: tx.id,
                                  title: lang === "gu" ? "કેશ એન્ટ્રી ડિલીટ" : lang === "hi" ? "कैश प्रविष्टि हटाएं" : "Delete Cash Entry",
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
