import React, { useState, useMemo } from "react";
import {
  ReceiptIndianRupee, Plus, Search, Filter, Printer, Download, Eye,
  Trash2, Edit, CheckCircle2, Clock, AlertTriangle, Paperclip, Building2,
  FileCheck, ShieldCheck, Camera, FileText
} from "lucide-react";
import { Attachment, Bill, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";
import { StatCard } from "../common/StatCard";
import { StatusBadge } from "../common/StatusBadge";
import { exportBillsExcel } from "../../utils/exportUtils";

type BillsViewProps = {
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  projects: Project[];
  currentUser: UserAccount;
  lang: Language;
  selectedSiteFilter: string;
  onOpenBillGenerator: (billToEdit?: Bill | null) => void;
  onViewAttachment: (data: { attachment: Attachment; title: string; subtitle?: string; amount?: string }) => void;
};

export function BillsView({
  bills,
  setBills,
  projects,
  currentUser,
  lang,
  selectedSiteFilter,
  onOpenBillGenerator,
  onViewAttachment,
}: BillsViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      // Site lock for supervisor or selected filter
      if (selectedSiteFilter !== "ALL" && b.project !== selectedSiteFilter) return false;
      if (!isAdmin && !currentUser.assignedProjects.includes(b.project)) return false;

      // Status filter
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== "ALL" && b.billType !== typeFilter) return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesNo = b.billNo.toLowerCase().includes(q);
        const matchesProj = b.project.toLowerCase().includes(q);
        const matchesDesc = (b.description || "").toLowerCase().includes(q);
        const matchesTender = (b.workOrderNo || "").toLowerCase().includes(q);
        const matchesMb = (b.mbBookNo || "").toLowerCase().includes(q);
        if (!matchesNo && !matchesProj && !matchesDesc && !matchesTender && !matchesMb) return false;
      }

      return true;
    });
  }, [bills, selectedSiteFilter, isAdmin, currentUser, statusFilter, typeFilter, search]);

  // Aggregate KPI metrics
  const totalBilled = filteredBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalReceived = filteredBills.reduce((sum, b) => sum + (Number(b.received) || 0), 0);
  const totalPending = Math.max(0, totalBilled - totalReceived);
  const totalSDHeld = filteredBills.reduce((sum, b) => sum + (Number(b.deductions?.securityDepositAmount) || 0), 0);

  const handleDeleteBill = (id: number) => {
    if (!isAdmin) {
      alert(t.restrictedAction);
      return;
    }
    if (window.confirm("Are you sure you want to delete this bill record?")) {
      setBills(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleQuickStatusChange = (id: number, newStatus: Bill["status"]) => {
    if (!isAdmin) {
      alert(t.restrictedAction);
      return;
    }
    setBills(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        return {
          ...b,
          status: newStatus,
          received: newStatus === "Received" ? (b.netPayable || b.amount) : b.received,
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ReceiptIndianRupee size={24} className="text-amber-500" />
            <span>Government Project Bills &amp; RA Invoice Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate itemized RA bills, calculate statutory government deductions (SD, TDS, Cess), and attach physical MB sheets &amp; signed vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportBillsExcel(filteredBills, selectedSiteFilter)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download size={15} />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={() => onOpenBillGenerator(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md"
          >
            <Plus size={16} />
            <span>+ Generate RA Bill / Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Billed (Gross + GST)"
          value={formatINR(totalBilled)}
          subValue={`${filteredBills.length} Invoices Generated`}
          icon={ReceiptIndianRupee}
          trend="All project bills"
          color="bg-blue-100 text-blue-800"
        />
        <StatCard
          title="Cleared by Govt Treasury"
          value={formatINR(totalReceived)}
          subValue="Credited to Bank Account"
          icon={CheckCircle2}
          trend="Govt treasury passed"
          color="bg-emerald-100 text-emerald-800"
        />
        <StatCard
          title="Pending in Govt Treasury"
          value={formatINR(totalPending)}
          subValue="Under Scrutiny / Passing"
          icon={Clock}
          trend="Awaiting clearance"
          positive={false}
          color="bg-amber-100 text-amber-800"
        />
        <StatCard
          title="Security Deposit (SD) Held"
          value={formatINR(totalSDHeld)}
          subValue="Refundable after Defect Liability"
          icon={ShieldCheck}
          trend="Tender retention money"
          color="bg-indigo-100 text-indigo-800"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Bill No, Site, Tender No, MB..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter("Received")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "Received" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Cleared
              </button>
              <button
                onClick={() => setStatusFilter("Pending")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "Pending" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Pending
              </button>
            </div>

            {/* Bill Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="ALL">All Bill Types</option>
              <option value="RA Bill">RA Bills Only</option>
              <option value="Final Bill">Final Bills Only</option>
              <option value="Tax Invoice">Tax Invoices Only</option>
            </select>
          </div>
        </div>

        {/* Bills Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Bill Info / Title</th>
                <th className="py-3 px-4">Project &amp; Department</th>
                <th className="py-3 px-4 text-right">Gross Amount</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Receivable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Vouchers / MB</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ReceiptIndianRupee size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-slate-600">No project bills found.</p>
                    <p className="text-xs mt-0.5">Click "+ Generate RA Bill / Invoice" to create a new one.</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => {
                  const hasAttachments = bill.attachments && bill.attachments.length > 0;
                  const gross = bill.amount;
                  const net = bill.netPayable ?? bill.amount;
                  const deductionsTotal = bill.deductions?.totalDeductions ?? 0;

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 font-bold">
                            <ReceiptIndianRupee size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900">{bill.billNo}</span>
                              {bill.raBillNo && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                                  {bill.raBillNo}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {bill.date} &bull; {bill.billType || "RA Bill"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-900">{bill.project}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                          {bill.department || "Govt Civil Works"}
                        </p>
                        {bill.mbBookNo && (
                          <p className="text-[10px] text-amber-700 font-semibold font-mono mt-0.5">
                            MB: {bill.mbBookNo}
                          </p>
                        )}
                      </td>

                      <td className="p-4 text-right font-black text-slate-900 text-xs">
                        {formatINR(gross)}
                      </td>

                      <td className="p-4 text-right">
                        {deductionsTotal > 0 ? (
                          <span className="font-bold text-red-600 text-xs">
                            -{formatINR(deductionsTotal)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td className="p-4 text-right font-black text-emerald-700 text-sm">
                        {formatINR(net)}
                      </td>

                      <td className="p-4 text-center">
                        <StatusBadge status={bill.status} lang={lang} />
                      </td>

                      <td className="p-4 text-center">
                        {hasAttachments ? (
                          <button
                            onClick={() => {
                              onViewAttachment({
                                attachment: bill.attachments![0],
                                title: `${bill.billNo} - Attachment`,
                                subtitle: bill.project,
                                amount: formatINR(bill.amount),
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition"
                            title="View Attached Physical Bill / MB Photo"
                          >
                            <Paperclip size={12} />
                            <span>{bill.attachments!.length} Attached</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300">None</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onOpenBillGenerator(bill)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="View / Edit / Print Bill"
                          >
                            <Printer size={15} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteBill(bill.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
