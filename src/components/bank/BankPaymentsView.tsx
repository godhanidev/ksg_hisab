import React, { useState, useMemo } from "react";
import {
  Landmark, Plus, Search, Filter, Download, Printer,
  Eye, Trash2, Edit2, Paperclip, CheckCircle2, Building, ArrowRight
} from "lucide-react";
import { Attachment, BankPayment, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";
import { exportBankPaymentsExcel } from "../../utils/exportUtils";

type BankPaymentsViewProps = {
  payments: BankPayment[];
  onAddPayment: () => void;
  onEditPayment: (payment: BankPayment) => void;
  onDeletePayment: (id: number) => void;
  onViewAttachment: (data: { attachment: Attachment; title: string; subtitle?: string; amount?: string }) => void;
  projects: Project[];
  selectedSiteFilter: string;
  setSelectedSiteFilter: (site: string) => void;
  currentUser: UserAccount;
  lang: Language;
};

export function BankPaymentsView({
  payments,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onViewAttachment,
  projects,
  selectedSiteFilter,
  setSelectedSiteFilter,
  currentUser,
  lang,
}: BankPaymentsViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Allowed site list based on user role
  const userAllowedSites = useMemo(() => {
    if (isAdmin) return projects.map(p => p.name);
    return currentUser.assignedProjects.length > 0
      ? currentUser.assignedProjects
      : projects.map(p => p.name);
  }, [isAdmin, projects, currentUser]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Role site check
      if (!isAdmin && !userAllowedSites.includes(p.project)) return false;

      // Header site filter
      if (selectedSiteFilter !== "ALL" && p.project !== selectedSiteFilter) return false;

      // Mode filter
      if (modeFilter !== "all" && p.paymentMode !== modeFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchParty = p.partyName.toLowerCase().includes(q);
        const matchRef = (p.referenceNo || "").toLowerCase().includes(q);
        const matchCat = (p.category || "").toLowerCase().includes(q);
        const matchNotes = (p.notes || "").toLowerCase().includes(q);
        if (!matchParty && !matchRef && !matchCat && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [payments, isAdmin, userAllowedSites, selectedSiteFilter, modeFilter, categoryFilter, searchQuery]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [payments]);

  // Total summary
  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((s, p) => s + p.amount, 0);
  }, [filteredPayments]);

  const handleExport = () => {
    exportBankPaymentsExcel(
      filteredPayments,
      selectedSiteFilter !== "ALL" ? selectedSiteFilter : undefined
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header Title & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Landmark size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.bankPayments}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {lang === "gu"
                  ? "મુખ્ય કચેરીથી સીધી બેંક / RTGS / NEFT દ્વારા થયેલ પાર્ટી ચુકવણી"
                  : lang === "hi"
                  ? "मुख्य कार्यालय से सीधे बैंक / RTGS द्वारा की गई पार्टी भुगतान"
                  : "Direct Head Office Bank Transfers & RTGS to Parties / Vendors"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={onAddPayment}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95"
            >
              <Plus size={16} />
              <span>{t.addBankPayment}</span>
            </button>
          )}

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
        {/* Total Bank Payment */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              {t.totalBankPayment}
            </p>
            <div className="rounded-xl bg-blue-500/20 p-2 text-blue-700">
              <Landmark size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
            {formatINR(totalAmount)}
          </p>
          <p className="mt-1 text-[11px] text-blue-600 font-medium">
            {filteredPayments.length} {lang === "gu" ? "કુલ RTGS વ્યવહારો" : "Direct Transfers Cleared"}
          </p>
        </div>

        {/* Unique Parties / Vendors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {lang === "gu" ? "પાર્ટીઓ / વેપારીઓ" : "Parties / Vendors Paid"}
            </p>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <Building size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {new Set(filteredPayments.map(p => p.partyName)).size}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {lang === "gu" ? "મટીરીયલ અને સબકોન્ટ્રાક્ટર" : "Material Suppliers & Subcontractors"}
          </p>
        </div>

        {/* Largest Bank Payment */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              {lang === "gu" ? "સૌથી મોટું પેમેન્ટ" : "Highest Single RTGS"}
            </p>
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
            {filteredPayments.length > 0
              ? formatINR(Math.max(...filteredPayments.map(p => p.amount)))
              : "₹0"}
          </p>
          <p className="mt-1 text-[11px] text-amber-600 font-medium truncate">
            {filteredPayments.length > 0
              ? filteredPayments.reduce((prev, curr) => (prev.amount > curr.amount ? prev : curr)).partyName
              : "-"}
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
              placeholder={`${t.search} (Party, UTR No...)`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Site Filter */}
          {isAdmin && (
            <div className="sm:col-span-3">
              <select
                value={selectedSiteFilter}
                onChange={e => setSelectedSiteFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

          {/* Payment Mode Filter */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-4"}>
            <select
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">{t.allTypes}</option>
              <option value="RTGS / NEFT">RTGS / NEFT</option>
              <option value="Cheque">Cheque</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Direct Transfer">Direct Transfer</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-3"}>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

      {/* ── Bank Payments Table ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Landmark size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">{t.noRecordsFound}</p>
            <p className="text-xs text-slate-400 mt-1">No direct bank payments recorded for this criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3 sm:px-4">#</th>
                  <th className="py-3 px-3 sm:px-4">{t.date}</th>
                  <th className="py-3 px-3 sm:px-4">{t.partyName}</th>
                  <th className="py-3 px-3 sm:px-4">{t.project}</th>
                  <th className="py-3 px-3 sm:px-4">{t.category}</th>
                  <th className="py-3 px-3 sm:px-4">{t.paymentMode}</th>
                  <th className="py-3 px-3 sm:px-4">{t.referenceNo}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.amount}</th>
                  <th className="py-3 px-3 sm:px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-slate-400 font-mono text-[11px]">
                      {p.id}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium text-slate-700">
                      {p.date}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-bold text-slate-900">
                      <div>
                        <span>{p.partyName}</span>
                        {p.notes && (
                          <p className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 max-w-[150px] truncate">
                      {p.project}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-600 whitespace-nowrap">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {p.category || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {p.referenceNo || "-"}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-blue-700 whitespace-nowrap">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.attachments && p.attachments.length > 0 && (
                          <button
                            onClick={() =>
                              onViewAttachment({
                                attachment: p.attachments![0],
                                title: p.partyName,
                                subtitle: `${p.project} • ${p.date} • ${p.referenceNo || ""}`,
                                amount: formatINR(p.amount),
                              })
                            }
                            title={t.viewPhoto}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Paperclip size={15} />
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onEditPayment(p)}
                              title={t.edit}
                              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(t.confirmDelete)) {
                                  onDeletePayment(p.id);
                                }
                              }}
                              title={t.delete}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
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
