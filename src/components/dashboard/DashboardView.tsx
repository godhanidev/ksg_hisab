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
import { Expense, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";

type DashboardViewProps = {
  projects: Project[];
  expenses: Expense[];
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
};

export function DashboardView({
  projects,
  expenses,
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
}: DashboardViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";
  const activeCount = projects.filter(p => p.status === "Active").length;

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
