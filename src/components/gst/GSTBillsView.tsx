import React, { useState, useMemo } from "react";
import {
  FileCheck, Plus, Search, Filter, Download, Printer,
  Eye, Trash2, Edit2, Paperclip, CheckCircle2, Clock, AlertTriangle, FileText
} from "lucide-react";
import { Attachment, GSTBill, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";
import { exportGSTBillsExcel } from "../../utils/exportUtils";

type GSTBillsViewProps = {
  bills: GSTBill[];
  onAddBill: () => void;
  onEditBill: (bill: GSTBill) => void;
  onDeleteBill: (id: number) => void;
  onViewAttachment: (data: { attachment: Attachment; title: string; subtitle?: string; amount?: string }) => void;
  projects: Project[];
  selectedSiteFilter: string;
  setSelectedSiteFilter: (site: string) => void;
  currentUser: UserAccount;
  lang: Language;
};

export function GSTBillsView({
  bills,
  onAddBill,
  onEditBill,
  onDeleteBill,
  onViewAttachment,
  projects,
  selectedSiteFilter,
  setSelectedSiteFilter,
  currentUser,
  lang,
}: GSTBillsViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  // Allowed site list based on user role
  const userAllowedSites = useMemo(() => {
    if (isAdmin) return projects.map(p => p.name);
    return currentUser.assignedProjects.length > 0
      ? currentUser.assignedProjects
      : projects.map(p => p.name);
  }, [isAdmin, projects, currentUser]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      if (!isAdmin && !userAllowedSites.includes(b.project)) return false;
      if (selectedSiteFilter !== "ALL" && b.project !== selectedSiteFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (productFilter !== "all" && b.product !== productFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchBillNo = b.billNo.toLowerCase().includes(q);
        const matchParty = b.partyName.toLowerCase().includes(q);
        const matchProduct = b.product.toLowerCase().includes(q);
        const matchNotes = (b.notes || "").toLowerCase().includes(q);
        if (!matchBillNo && !matchParty && !matchProduct && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [bills, isAdmin, userAllowedSites, selectedSiteFilter, statusFilter, productFilter, searchQuery]);

  // Products list
  const products = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => {
      if (b.product) set.add(b.product);
    });
    return Array.from(set);
  }, [bills]);

  // Financial totals
  const totalBasic = useMemo(() => {
    return filteredBills.reduce((s, b) => s + b.basicAmount, 0);
  }, [filteredBills]);

  const totalGST = useMemo(() => {
    return filteredBills.reduce((s, b) => s + b.gstAmount, 0);
  }, [filteredBills]);

  const totalAmount = useMemo(() => {
    return filteredBills.reduce((s, b) => s + b.totalAmount, 0);
  }, [filteredBills]);

  const handleExport = () => {
    exportGSTBillsExcel(
      filteredBills,
      selectedSiteFilter !== "ALL" ? selectedSiteFilter : undefined
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header Title & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <FileCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.gstBills}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {lang === "gu"
                  ? "જીએસટી ટેક્સ ઇન્વોઇસ બીલ, મૂળ રકમ અને જીએસટી ગણતરી લેજર"
                  : lang === "hi"
                  ? "जीएसटी टैक्स इनवॉइस बिल, मूल राशि और जीएसटी गणना लेजर"
                  : "GST Material Tax Invoices with Auto GST Calculation"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddBill}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition active:scale-95"
          >
            <Plus size={16} />
            <span>{t.addGstBill}</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download size={15} />
            <span className="hidden sm:inline">{t.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Total Gross GST Bills */}
        <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-purple-800 uppercase tracking-wider">
              {t.totalGstBills}
            </p>
            <div className="rounded-xl bg-purple-500/20 p-2 text-purple-700">
              <FileCheck size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
            {formatINR(totalAmount)}
          </p>
          <p className="mt-1 text-[11px] text-purple-600 font-medium">
            {filteredBills.length} {lang === "gu" ? "કુલ જીએસટી બીલ" : "Tax Invoices"}
          </p>
        </div>

        {/* Total Base / Basic Amount */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t.basicAmount}
            </p>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <FileText size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatINR(totalBasic)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            {lang === "gu" ? "ટેક્સ પહેલાની મૂળ કિંમત" : "Tax Exclusive Base Amount"}
          </p>
        </div>

        {/* Total GST Tax Claimable */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t.gstAmount}
            </p>
            <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            {formatINR(totalGST)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {lang === "gu" ? "ઇનપુટ ટેક્સ ક્રેડિટ (ITC Claim)" : "Input Tax Credit (ITC)"}
          </p>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ──────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          {/* Search Input */}
          <div className="relative sm:col-span-5">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`${t.search} (Bill No, Party, Product...)`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Site Filter */}
          {isAdmin && (
            <div className="sm:col-span-3">
              <select
                value={selectedSiteFilter}
                onChange={e => setSelectedSiteFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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

          {/* Status Filter */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-4"}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="Paid">{t.paid}</option>
              <option value="Pending">{t.pending}</option>
              <option value="Partial">{t.partial}</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-3"}>
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">{t.allCategories}</option>
              {products.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── GST Bills Table ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileCheck size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">{t.noRecordsFound}</p>
            <p className="text-xs text-slate-400 mt-1">No GST bills found matching the current criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3 sm:px-4">{t.billNo}</th>
                  <th className="py-3 px-3 sm:px-4">{t.date}</th>
                  <th className="py-3 px-3 sm:px-4">{t.partyName}</th>
                  <th className="py-3 px-3 sm:px-4">{t.product}</th>
                  <th className="py-3 px-3 sm:px-4">{t.project}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.basicAmount}</th>
                  <th className="py-3 px-3 sm:px-4 text-center">{t.gstRate}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.gstAmount}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.totalAmount}</th>
                  <th className="py-3 px-3 sm:px-4 text-center">{t.status}</th>
                  <th className="py-3 px-3 sm:px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {b.billNo}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium text-slate-700">
                      {b.date}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-bold text-slate-900">
                      <div>
                        <span>{b.partyName}</span>
                        {b.notes && (
                          <p className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
                            {b.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span className="rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold">
                        {b.product}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 max-w-[150px] truncate">
                      {b.project}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                      {formatINR(b.basicAmount)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-600 whitespace-nowrap">
                      {b.gstRate}%
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatINR(b.gstAmount)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-slate-950 whitespace-nowrap">
                      {formatINR(b.totalAmount)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          b.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "Partial"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {b.status === "Paid" ? t.paid : b.status === "Partial" ? t.partial : t.pending}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {b.attachments && b.attachments.length > 0 && (
                          <button
                            onClick={() =>
                              onViewAttachment({
                                attachment: b.attachments![0],
                                title: `Bill #${b.billNo} - ${b.partyName}`,
                                subtitle: `${b.project} • ${b.product} • ${b.date}`,
                                amount: formatINR(b.totalAmount),
                              })
                            }
                            title={t.viewPhoto}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Paperclip size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => onEditBill(b)}
                          title={t.edit}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                          <Edit2 size={15} />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm(t.confirmDelete)) {
                                onDeleteBill(b.id);
                              }
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
