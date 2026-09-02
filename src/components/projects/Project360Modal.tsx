import React, { useState } from "react";
import {
  X, Building2, MapPin, Wallet, Landmark, FileCheck, Printer, Download,
  ArrowDownLeft, ArrowUpRight, Paperclip, CheckCircle2, AlertTriangle, Calendar
} from "lucide-react";
import {
  Attachment, BankPayment, CashTransaction, GSTBill, Language, Project
} from "../../types";
import { formatINR } from "../../utils/formatters";
import { getTranslation } from "../../i18n/translations";
import { StatusBadge } from "../common/StatusBadge";
import { printAuditReport, exportCashTransactionsExcel } from "../../utils/exportUtils";

type Project360ModalProps = {
  project: Project;
  cashTransactions: CashTransaction[];
  bankPayments: BankPayment[];
  gstBills: GSTBill[];
  lang: Language;
  onClose: () => void;
  onViewAttachment?: (data: { attachment: Attachment; title: string; subtitle?: string; amount?: string }) => void;
};

export function Project360Modal({
  project,
  cashTransactions,
  bankPayments,
  gstBills,
  lang,
  onClose,
  onViewAttachment,
}: Project360ModalProps) {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<"overview" | "cash" | "bank" | "gst">("overview");

  // Filter for this specific project site
  const siteCash = cashTransactions.filter(c => c.project === project.name);
  const siteBank = bankPayments.filter(b => b.project === project.name);
  const siteGST = gstBills.filter(g => g.project === project.name);

  const totalCashIn = siteCash.filter(c => c.type === "cash_in").reduce((s, c) => s + c.amount, 0);
  const totalCashOut = siteCash.filter(c => c.type === "cash_out").reduce((s, c) => s + c.amount, 0);
  const cashInHand = totalCashIn - totalCashOut;
  const totalBank = siteBank.reduce((s, b) => s + b.amount, 0);
  const totalGst = siteGST.reduce((s, g) => s + g.totalAmount, 0);
  const totalProjectCost = totalCashOut + totalBank;

  const handlePrintAudit = () => {
    printAuditReport({
      title: `360° Site Hisab & Audit - ${project.name}`,
      project,
      cashTransactions: siteCash,
      bankPayments: siteBank,
      gstBills: siteGST,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[94vh] rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-slate-950 p-5 sm:px-7 text-white gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-lg shadow-md shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">{project.name}</h2>
                <StatusBadge status={project.status} lang={lang} />
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                <MapPin size={12} className="text-amber-400" /> {project.location || project.department} &bull; Code: {project.code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAudit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
              title="Print Official Site Audit Statement"
            >
              <Printer size={15} />
              <span>{t.exportPdf}</span>
            </button>

            <button
              onClick={() => exportCashTransactionsExcel(siteCash, project.name)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition border border-white/10"
              title="Export Site Cash Ledger to Excel"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 sm:px-7 overflow-x-auto gap-2 py-2">
          {[
            { id: "overview", label: "Overview & Totals", icon: Building2 },
            { id: "cash", label: `Daily Cash (${siteCash.length})`, icon: Wallet },
            { id: "bank", label: `Bank Payments (${siteBank.length})`, icon: Landmark },
            { id: "gst", label: `GST Bills (${siteGST.length})`, icon: FileCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Site KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tender Value</p>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">{formatINR(project.value)}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Cash Given (જમા)</p>
                  <p className="text-base sm:text-lg font-extrabold text-emerald-800 mt-1">{formatINR(totalCashIn)}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5">
                  <p className="text-[10px] font-bold text-rose-800 uppercase">Cash Spent (ઉધાર)</p>
                  <p className="text-base sm:text-lg font-extrabold text-rose-800 mt-1">{formatINR(totalCashOut)}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3.5">
                  <p className="text-[10px] font-bold text-blue-800 uppercase">Cash in Hand</p>
                  <p className={`text-base sm:text-lg font-extrabold mt-1 ${cashInHand >= 0 ? "text-blue-900" : "text-red-700"}`}>
                    {formatINR(cashInHand)}
                  </p>
                </div>
                <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-3.5">
                  <p className="text-[10px] font-bold text-indigo-800 uppercase">Bank RTGS</p>
                  <p className="text-base sm:text-lg font-extrabold text-indigo-900 mt-1">{formatINR(totalBank)}</p>
                </div>
                <div className="rounded-2xl bg-slate-900 text-white p-3.5">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Total Site Cost</p>
                  <p className="text-base sm:text-lg font-extrabold text-white mt-1">{formatINR(totalProjectCost)}</p>
                </div>
              </div>

              {/* Site Description & Notes */}
              {project.notes && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-600">
                    <strong>Site Description: </strong> {project.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "cash" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{t.siteDailyCash}</h3>
                <span className="text-xs font-bold text-slate-600">Balance: {formatINR(cashInHand)}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Details</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-right">Cash In</th>
                      <th className="p-3 text-right">Cash Out</th>
                      <th className="p-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteCash.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono">{c.date}</td>
                        <td className="p-3 font-bold">
                          <span className={c.type === "cash_in" ? "text-emerald-700" : "text-rose-700"}>
                            {c.type === "cash_in" ? "જમા (In)" : "ઉધાર (Out)"}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{c.details}</td>
                        <td className="p-3 text-slate-600">{c.category || "-"}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {c.type === "cash_in" ? formatINR(c.amount) : "-"}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-700">
                          {c.type === "cash_out" ? formatINR(c.amount) : "-"}
                        </td>
                        <td className="p-3 text-center">
                          {c.attachments && c.attachments.length > 0 ? (
                            <button
                              onClick={() =>
                                onViewAttachment?.({
                                  attachment: c.attachments![0],
                                  title: c.details,
                                  subtitle: `${c.project} • ${c.date}`,
                                  amount: formatINR(c.amount),
                                })
                              }
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Paperclip size={14} />
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "bank" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{t.bankPayments}</h3>
                <span className="text-xs font-bold text-blue-700">Total: {formatINR(totalBank)}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Party Name</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Mode</th>
                      <th className="p-3 text-left">Ref / UTR</th>
                      <th className="p-3 text-right">Amount (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteBank.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono">{b.date}</td>
                        <td className="p-3 font-bold text-slate-900">{b.partyName}</td>
                        <td className="p-3 text-slate-600">{b.category || "-"}</td>
                        <td className="p-3">{b.paymentMode}</td>
                        <td className="p-3 font-mono">{b.referenceNo || "-"}</td>
                        <td className="p-3 text-right font-black text-blue-700">{formatINR(b.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "gst" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{t.gstBills}</h3>
                <span className="text-xs font-bold text-purple-700">Total: {formatINR(totalGst)}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Bill No</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Party Name</th>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Basic Amount</th>
                      <th className="p-3 text-center">GST %</th>
                      <th className="p-3 text-right">GST Amount</th>
                      <th className="p-3 text-right">Total Amount</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteGST.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{g.billNo}</td>
                        <td className="p-3 font-mono">{g.date}</td>
                        <td className="p-3 font-semibold">{g.partyName}</td>
                        <td className="p-3">{g.product}</td>
                        <td className="p-3 text-right">{formatINR(g.basicAmount)}</td>
                        <td className="p-3 text-center">{g.gstRate}%</td>
                        <td className="p-3 text-right text-emerald-700">{formatINR(g.gstAmount)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(g.totalAmount)}</td>
                        <td className="p-3 text-center">{g.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
