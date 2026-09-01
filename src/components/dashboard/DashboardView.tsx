import React from "react";
import {
  Building2,
  IndianRupee,
  WalletCards,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Eye,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ReceiptIndianRupee,
} from "lucide-react";
import { StatCard } from "../common/StatCard";
import { StatusBadge } from "../common/StatusBadge";
import { VisualCharts } from "./VisualCharts";
import { formatINR } from "../../utils/formatters";
import { Expense, FundTransfer, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { Plus, ArrowRight, User } from "lucide-react";

type DashboardViewProps = {
  projects: Project[];
  expenses: Expense[];
  fundTransfers?: FundTransfer[];
  supervisors?: UserAccount[];
  currentUser: UserAccount;
  totalReceived: number;
  totalExpense: number;
  totalProjectValue: number;
  profit: number;
  pendingReceivable: number;
  lang: Language;
  onViewProject360: (project: Project) => void;
  onViewAllProjects: () => void;
  onViewExpenseAttachment?: (expense: Expense) => void;
  onNavigateToWallets?: () => void;
  onOpenTransferModal?: (defaultSupervisorId?: number) => void;
};

export function DashboardView({
  projects,
  expenses,
  fundTransfers = [],
  supervisors = [],
  currentUser,
  totalReceived,
  totalExpense,
  totalProjectValue,
  profit,
  pendingReceivable,
  lang,
  onViewProject360,
  onViewAllProjects,
  onViewExpenseAttachment,
  onNavigateToWallets,
  onOpenTransferModal,
}: DashboardViewProps) {
  const t = getTranslation(lang) as any;
  const isAdmin = currentUser.role === "admin";
  const activeCount = projects.filter(p => p.status === "Active").length;

  // Real-time Petty Cash stats
  const totalFundsTransferred = fundTransfers.reduce((sum, ft) => sum + ft.amount, 0);
  const totalSupervisorExpenses = expenses
    .filter(exp => !exp.paymentSource || exp.paymentSource === "Supervisor Wallet")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const totalCashInHand = totalFundsTransferred - totalSupervisorExpenses;

  // If supervisor, calculate their specific Cash in Hand
  const myTransfers = fundTransfers.filter(ft => ft.supervisorId === currentUser.id);
  const myTotalReceived = myTransfers.reduce((sum, ft) => sum + ft.amount, 0);
  const myExpenses = expenses.filter(exp => {
    const isMe = exp.supervisorId === currentUser.id || exp.enteredBy === currentUser.name;
    const isFromWallet = !exp.paymentSource || exp.paymentSource === "Supervisor Wallet";
    return isMe && isFromWallet;
  });
  const myTotalSpent = myExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const myCashInHand = myTotalReceived - myTotalSpent;

  return (
    <div className="space-y-7">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-7 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {isAdmin ? "Admin / Management Control" : "Site Supervisor Workspace"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
            {t.goodDay}, {currentUser.name} 👋
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl">
            {isAdmin ? t.adminOverviewMsg : t.supervisorOverviewMsg}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/10 text-right">
            <p className="text-[11px] text-slate-300 font-medium">Active Sites</p>
            <p className="text-xl font-black text-amber-400">{activeCount} / {projects.length}</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.contractValue}
          value={formatINR(totalProjectValue)}
          icon={Building2}
          trend={`${projects.length} Sites registered`}
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
          trend="Material, Labour & Machinery"
          positive={false}
          color="bg-red-100 text-red-700"
        />
        <StatCard
          title={t.netProfit}
          value={formatINR(profit)}
          icon={TrendingUp}
          trend={profit >= 0 ? "Surplus Profit" : "Deficit"}
          positive={profit >= 0}
          color={profit >= 0 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-700"}
        />
      </div>

      {/* ─── Petty Cash & Supervisor Digital Wallet Bar (Requirement #1 & #6) ─── */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left info */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black">
              <WalletCards size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {isAdmin
                    ? (lang === "gu" ? "સુપરવાઇઝર રોકડ સિલક (Cash in Hand)" : "Supervisor Petty Cash Flow")
                    : (lang === "gu" ? "તમારું રોકડ વૉલેટ (Petty Cash Wallet)" : "Your Site Petty Cash Wallet")}
                </h3>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isAdmin
                  ? (lang === "gu" ? "ઓફિસથી આપેલ કુલ રકમમાંથી સાઇટ પર થયેલા રોકડ ખર્ચા બાદ થતાં હાલમાં ઉપલબ્ધ સિલક." : "Real-time cash available across site supervisors after deducting site expenses.")
                  : (lang === "gu" ? "ઓફિસથી મળેલ રકમમાંથી તમે સાઇટ પર કરેલ રોકડ ખર્ચા બાદ થતાં તમારી પાસે બાકી રોકડ." : "Current available cash in hand for your site operations.")}
              </p>
            </div>
          </div>

          {/* Right Metrics & Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Amount display */}
            <div className="rounded-2xl bg-white px-4 py-2.5 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isAdmin ? (lang === "gu" ? "કુલ હાથ પર રોકડ" : "Total Cash in Hand") : (lang === "gu" ? "તમારી પાસે રોકડ" : "Your Cash in Hand")}
              </span>
              <span className="text-lg font-black text-emerald-700">
                {formatINR(isAdmin ? totalCashInHand : myCashInHand)}
              </span>
            </div>

            {/* Quick Actions */}
            {isAdmin && onOpenTransferModal && (
              <button
                type="button"
                onClick={() => onOpenTransferModal()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition active:scale-95"
              >
                <Plus size={15} />
                <span>{lang === "gu" ? "પૈસા મોકલો" : "Issue Funds"}</span>
              </button>
            )}

            {onNavigateToWallets && (
              <button
                type="button"
                onClick={onNavigateToWallets}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                <span>{lang === "gu" ? "વૉલેટ હિસાબ / લેજર" : "View Wallet Ledger"}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts & Budget Breakdown */}
      <VisualCharts
        projects={projects}
        totalContractValue={totalProjectValue}
        totalReceived={totalReceived}
        totalExpense={totalExpense}
        profit={profit}
        lang={lang}
      />

      {/* Active Construction Sites Summary Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-7">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t.activeProjects}</h2>
            <p className="text-xs text-slate-500">{t.financialSummary}</p>
          </div>
          <button
            onClick={onViewAllProjects}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            {t.viewAll} <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Site / Project</th>
                <th className="px-6 py-4">Govt Department</th>
                <th className="px-6 py-4">Contract Budget</th>
                <th className="px-6 py-4">Work Progress</th>
                <th className="px-6 py-4">Cleared Payment</th>
                <th className="px-6 py-4">Total Expense</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">360° Hisab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4">
                    <p
                      className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                      onClick={() => onViewProject360(p)}
                    >
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.code}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{p.department}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatINR(p.value)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full bg-slate-900 rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="font-semibold text-xs text-slate-700">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-emerald-700 font-bold">{formatINR(p.received)}</td>
                  <td className="px-6 py-4 text-red-600 font-bold">{formatINR(p.expense)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} lang={lang} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onViewProject360(p)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                    >
                      <Eye size={13} /> {t.site360Hisab}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Site Activity & Document Attachment Feed */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{t.recentActivity}</h3>
            <p className="text-xs text-slate-500">Latest expenses with verified bill attachments</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {expenses.slice(0, 6).map(e => (
            <div key={e.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 hover:bg-slate-100/60 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                    {e.category}
                  </span>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 mt-1.5 line-clamp-1">{e.description}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{e.project}</p>
                </div>
                <p className="font-extrabold text-sm text-red-600 shrink-0">{formatINR(e.amount)}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>{e.date} &middot; {e.vendor}</span>
                {e.attachments && e.attachments.length > 0 && (
                  <button
                    onClick={() => onViewExpenseAttachment?.(e)}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800"
                    title="View attached bill photo"
                  >
                    <Paperclip size={12} /> Bill Photo
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
