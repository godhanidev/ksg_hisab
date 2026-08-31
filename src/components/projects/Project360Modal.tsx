import React, { useState } from "react";
import {
  X, Building2, MapPin, IndianRupee, WalletCards, ReceiptIndianRupee, Users, Package,
  Truck, FileText, Printer, Download, Eye, Paperclip, CheckCircle2, AlertTriangle, Calendar
} from "lucide-react";
import { Bill, DailyReport, Expense, LabourWorker, Language, Machinery, MaterialItem, Project } from "../../types";
import { formatINR } from "../../utils/formatters";
import { getTranslation } from "../../i18n/translations";
import { StatusBadge } from "../common/StatusBadge";
import { printAuditReport, exportExpensesExcel, exportBillsExcel } from "../../utils/exportUtils";

type Project360ModalProps = {
  project: Project;
  bills: Bill[];
  expenses: Expense[];
  labour: LabourWorker[];
  materials: MaterialItem[];
  machinery: Machinery[];
  reports: DailyReport[];
  lang: Language;
  onClose: () => void;
  onViewAttachment?: (att: any, title: string) => void;
};

export function Project360Modal({
  project,
  bills,
  expenses,
  labour,
  materials,
  machinery,
  reports,
  lang,
  onClose,
  onViewAttachment,
}: Project360ModalProps) {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "bills" | "labour" | "materials" | "machinery" | "reports">("overview");

  // Strict Site Filtered Data
  const siteBills = bills.filter(b => b.project === project.name);
  const siteExpenses = expenses.filter(e => e.project === project.name);
  const siteLabour = labour.filter(l => l.project === project.name);
  const siteMaterials = materials.filter(m => m.project === project.name);
  const siteMachinery = machinery.filter(m => m.project === project.name);
  const siteReports = reports.filter(r => r.project === project.name);

  const totalExp = siteExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRecv = siteBills.reduce((s, b) => s + b.received, 0);
  const profit = totalRecv - totalExp;
  const profitMargin = totalRecv > 0 ? ((profit / totalRecv) * 100).toFixed(1) : "0";

  const handlePrintAudit = () => {
    printAuditReport({
      title: `360° Site Financial Audit - ${project.name}`,
      project,
      expenses: siteExpenses,
      bills: siteBills,
      labour: siteLabour,
      materials: siteMaterials,
      machinery: siteMachinery,
      reports: siteReports,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[94vh] rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-slate-900 p-5 sm:px-7 text-white gap-3">
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
              title="Print Official CA/Govt Audit Report"
            >
              <Printer size={15} />
              <span>{t.exportPdf}</span>
            </button>

            <button
              onClick={() => exportExpensesExcel(siteExpenses, project.name)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition border border-white/10"
              title="Export Site Expenses to Excel"
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
            { id: "overview", label: "Overview & P&L", icon: Building2 },
            { id: "bills", label: `Govt Bills (${siteBills.length})`, icon: ReceiptIndianRupee },
            { id: "expenses", label: `Expenses (${siteExpenses.length})`, icon: WalletCards },
            { id: "labour", label: `Labour (${siteLabour.length})`, icon: Users },
            { id: "materials", label: `Stock (${siteMaterials.length})`, icon: Package },
            { id: "machinery", label: `Machinery (${siteMachinery.length})`, icon: Truck },
            { id: "reports", label: `Daily Logs (${siteReports.length})`, icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Contract Budget</p>
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">{formatINR(project.value)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Sanctioned Tender Value</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase">Cleared Payment</p>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-800 mt-1">{formatINR(totalRecv)}</p>
                  <p className="text-[10px] text-emerald-600 mt-1">Received from Treasury</p>
                </div>
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                  <p className="text-[11px] font-bold text-red-800 uppercase">Site Expenses</p>
                  <p className="text-lg sm:text-xl font-extrabold text-red-800 mt-1">{formatINR(totalExp)}</p>
                  <p className="text-[10px] text-red-600 mt-1">Material, Labour &amp; Plant</p>
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                  <p className="text-[11px] font-bold text-blue-800 uppercase">Site Profit Position</p>
                  <p className={`text-lg sm:text-xl font-extrabold mt-1 ${profit >= 0 ? "text-blue-900" : "text-red-700"}`}>
                    {formatINR(profit)}
                  </p>
                  <p className="text-[10px] text-blue-700 font-bold mt-1">{profitMargin}% Net Margin</p>
                </div>
              </div>

              {/* Progress and Work Status Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Work Execution Progress</h3>
                  <span className="font-extrabold text-slate-900">{project.progress}% Complete</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${project.progress}%` }} />
                </div>
                {project.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong>Site Notes: </strong> {project.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "bills" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Government Running Account (RA) Bills</h3>
                <button
                  onClick={() => exportBillsExcel(siteBills, project.name)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Download size={13} /> Export Bills CSV
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Bill No</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Stage / Description</th>
                      <th className="p-3 text-right">Bill Amount</th>
                      <th className="p-3 text-right">Cleared (Rs)</th>
                      <th className="p-3 text-right">Pending</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteBills.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{b.billNo}</td>
                        <td className="p-3 font-mono">{b.date}</td>
                        <td className="p-3">{b.description}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(b.amount)}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">{formatINR(b.received)}</td>
                        <td className="p-3 text-right font-bold text-amber-700">{formatINR(b.amount - b.received)}</td>
                        <td className="p-3 text-center"><StatusBadge status={b.status} lang={lang} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Site Daily Expenses &amp; Bills</h3>
                <span className="text-xs font-bold text-red-600">Total: {formatINR(totalExp)}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Vendor / Receiver</th>
                      <th className="p-3 text-right">Qty / Unit</th>
                      <th className="p-3 text-right">Amount (Rs)</th>
                      <th className="p-3 text-center">Bill Attachment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono">{e.date}</td>
                        <td className="p-3 font-semibold text-slate-800">{e.category}</td>
                        <td className="p-3">{e.description}</td>
                        <td className="p-3 text-slate-600">{e.vendor}</td>
                        <td className="p-3 text-right font-mono">{e.quantity ? `${e.quantity} ${e.unit || ""}` : "-"}</td>
                        <td className="p-3 text-right font-bold text-red-600">{formatINR(e.amount)}</td>
                        <td className="p-3 text-center">
                          {e.attachments && e.attachments.length > 0 ? (
                            <button
                              onClick={() => onViewAttachment?.(e.attachments![0], `${e.category}: ${e.description}`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 font-bold"
                            >
                              <Paperclip size={12} /> View
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "labour" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Assigned Labour Gang &amp; Wages</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Worker Name</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Phone</th>
                      <th className="p-3 text-right">Daily Wage</th>
                      <th className="p-3 text-right">Days</th>
                      <th className="p-3 text-right">Total Earned</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteLabour.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{l.name}</td>
                        <td className="p-3">{l.role}</td>
                        <td className="p-3 font-mono text-slate-500">{l.phone}</td>
                        <td className="p-3 text-right font-mono">{formatINR(l.dailyWage)}</td>
                        <td className="p-3 text-right font-mono">{l.daysWorked}d</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(l.totalEarned)}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">{formatINR(l.paid)}</td>
                        <td className="p-3 text-right font-bold text-red-600">{formatINR(l.totalEarned - l.paid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "materials" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Site Materials &amp; Inventory Stock</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Material</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Min Stock</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-right">Stock Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteMaterials.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{m.name}</td>
                        <td className="p-3">{m.category}</td>
                        <td className="p-3 text-right font-bold">{m.quantity} {m.unit}</td>
                        <td className="p-3 text-right text-slate-500">{m.minStock} {m.unit}</td>
                        <td className="p-3 text-right font-mono">{formatINR(m.pricePerUnit)}</td>
                        <td className="p-3 text-right font-bold text-emerald-800">{formatINR(m.quantity * m.pricePerUnit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "machinery" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Deployed Machinery &amp; Equipment</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 text-left">Machine Name</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Reg No</th>
                      <th className="p-3 text-right">Daily Rate</th>
                      <th className="p-3 text-right">Days Used</th>
                      <th className="p-3 text-right">Total Cost</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteMachinery.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{m.name}</td>
                        <td className="p-3">{m.type}</td>
                        <td className="p-3 font-mono text-slate-500">{m.registrationNo}</td>
                        <td className="p-3 text-right font-mono">{formatINR(m.dailyRate)}</td>
                        <td className="p-3 text-right font-mono">{m.daysUsed}d</td>
                        <td className="p-3 text-right font-bold text-red-600">{formatINR(m.totalCost)}</td>
                        <td className="p-3 text-center"><StatusBadge status={m.status} lang={lang} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Daily Site Progress Logs</h3>
              <div className="space-y-3">
                {siteReports.map(r => (
                  <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border">
                        📅 {r.date} &bull; By: {r.reportedBy}
                      </span>
                      <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                        {r.progress}% Work Completed
                      </span>
                    </div>
                    <p className="text-slate-800 mt-1"><strong>Work Done: </strong>{r.workDone}</p>
                    <p className="text-slate-600 mt-0.5"><strong>Material Used: </strong>{r.materialUsed}</p>
                    {r.issues !== "None" && (
                      <p className="text-amber-700 mt-0.5"><strong>Issues: </strong>{r.issues}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
