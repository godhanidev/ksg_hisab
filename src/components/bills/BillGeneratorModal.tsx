import React, { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, Camera, Upload, Eye, Download, Printer,
  ReceiptIndianRupee, Building2, CheckCircle2, AlertTriangle, ShieldCheck, X,
  FileCheck, Calculator, HardHat, RefreshCw
} from "lucide-react";
import { Attachment, Bill, BillDeductions, BillLineItem, Language, Project } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";

type BillGeneratorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaveBill: (bill: Bill) => void;
  projects: Project[];
  defaultProject?: string;
  editBill?: Bill | null;
  lang: Language;
};

export function BillGeneratorModal({
  isOpen,
  onClose,
  onSaveBill,
  projects,
  defaultProject,
  editBill,
  lang,
}: BillGeneratorModalProps) {
  const t = getTranslation(lang);

  // Selected Project & Auto-filled Govt Dept info
  const initialProjName = editBill?.project || defaultProject || (projects[0]?.name || "");
  const [selectedProjectName, setSelectedProjectName] = useState(initialProjName);
  const selectedProj = projects.find(p => p.name === selectedProjectName);

  // Bill Metadata
  const [billNo, setBillNo] = useState(editBill?.billNo || `KSG/RA-${Math.floor(100 + Math.random() * 900)}/2026-27`);
  const [billType, setBillType] = useState<Bill["billType"]>(editBill?.billType || "RA Bill");
  const [raBillNo, setRaBillNo] = useState(editBill?.raBillNo || "1st R.A. Bill");
  const [billDate, setBillDate] = useState(editBill?.date || todayStr());
  const [workOrderNo, setWorkOrderNo] = useState(editBill?.workOrderNo || (selectedProj ? `WO-${selectedProj.code}-01` : "WO/2026/094"));
  const [mbBookNo, setMbBookNo] = useState(editBill?.mbBookNo || "MB-104, Page 22-26");
  const [department, setDepartment] = useState(editBill?.department || selectedProj?.department || "Irrigation & Water Resources Dept, Gujarat");
  const [description, setDescription] = useState(editBill?.description || "Running Account Bill for civil construction work executed at site");
  const [notes, setNotes] = useState(editBill?.notes || "");

  // Status and payment tracking
  const [status, setStatus] = useState<Bill["status"]>(editBill?.status || "Pending");
  const [receivedAmount, setReceivedAmount] = useState<number>(editBill?.received || 0);
  const [paymentRef, setPaymentRef] = useState(editBill?.paymentReference || "");

  // Line Items (Measurement Book / SOR items)
  const defaultItems: BillLineItem[] = [
    {
      id: "item_1",
      itemNo: "Item 1",
      description: "Excavation in foundation and trenches in all types of soil including disposal",
      unit: "Cu.M",
      quantity: 450,
      rate: 185,
      amount: 450 * 185,
    },
    {
      id: "item_2",
      itemNo: "Item 2",
      description: "Providing and laying M-25 Grade Reinforced Cement Concrete (RCC) for columns & slabs",
      unit: "Cu.M",
      quantity: 120,
      rate: 6800,
      amount: 120 * 6800,
    },
    {
      id: "item_3",
      itemNo: "Item 3",
      description: "Providing, cutting, bending & placing TMT Fe-500D steel bars for reinforcement",
      unit: "MT",
      quantity: 8.5,
      rate: 64500,
      amount: 8.5 * 64500,
    },
  ];

  const [items, setItems] = useState<BillLineItem[]>(editBill?.items && editBill.items.length > 0 ? editBill.items : defaultItems);

  // Tax & Deductions
  const [includeGst, setIncludeGst] = useState(true);
  const [gstPercent, setGstPercent] = useState<number>(editBill?.gstPercent ?? 18);
  const [sdPercent, setSdPercent] = useState<number>(editBill?.deductions?.securityDepositPercent ?? 5);
  const [tdsPercent, setTdsPercent] = useState<number>(editBill?.deductions?.tdsPercent ?? 2);
  const [gstTdsPercent, setGstTdsPercent] = useState<number>(editBill?.deductions?.gstTdsPercent ?? 2);
  const [cessPercent, setCessPercent] = useState<number>(editBill?.deductions?.labourCessPercent ?? 1);
  const [royaltyPenalty, setRoyaltyPenalty] = useState<number>(editBill?.deductions?.royaltyOrPenalty ?? 0);
  const [otherDeduction, setOtherDeduction] = useState<number>(editBill?.deductions?.otherDeduction ?? 0);

  // Attachments (Physical Bills, MB sheets, Signed vouchers)
  const [attachments, setAttachments] = useState<Attachment[]>(editBill?.attachments || []);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  // Active sub-tab in modal: "builder", "deductions", "uploads", "preview"
  const [activeTab, setActiveTab] = useState<"builder" | "deductions" | "uploads" | "preview">("builder");

  // When project changes, update default department & work order
  useEffect(() => {
    if (selectedProj) {
      setDepartment(selectedProj.department);
      if (!editBill) {
        setWorkOrderNo(`WO-${selectedProj.code}-01`);
      }
    }
  }, [selectedProjectName]);

  // Calculations
  const grossWorkAmount = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const gstAmount = includeGst ? Math.round((grossWorkAmount * gstPercent) / 100) : 0;
  const grossWithGst = grossWorkAmount + gstAmount;

  const sdAmount = Math.round((grossWorkAmount * sdPercent) / 100);
  const tdsAmount = Math.round((grossWorkAmount * tdsPercent) / 100);
  const gstTdsAmount = includeGst ? Math.round((grossWorkAmount * gstTdsPercent) / 100) : 0;
  const cessAmount = Math.round((grossWorkAmount * cessPercent) / 100);
  const totalDeductions = sdAmount + tdsAmount + gstTdsAmount + cessAmount + Number(royaltyPenalty) + Number(otherDeduction);

  const netPayable = Math.max(0, grossWithGst - totalDeductions);

  // Item modifications
  const handleItemChange = (id: string, field: keyof BillLineItem, val: any) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "quantity" || field === "rate") {
          const q = field === "quantity" ? parseFloat(val) || 0 : item.quantity;
          const r = field === "rate" ? parseFloat(val) || 0 : item.rate;
          updated.amount = Math.round(q * r);
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: BillLineItem = {
      id: "item_" + Date.now(),
      itemNo: `Item ${items.length + 1}`,
      description: "Civil work item description as per tender schedule / SOR",
      unit: "Cu.M",
      quantity: 1,
      rate: 1000,
      amount: 1000,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("At least 1 measurement line item is required.");
      return;
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Upload handler for scanned physical bills
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAtt: Attachment = {
          id: "att_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: file.type || "image/jpeg",
          sizeBytes: file.size,
          dataUrl: reader.result as string,
          uploadedAt: todayStr(),
        };
        setAttachments(prev => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Form Submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectName) {
      alert("Please select a project site");
      return;
    }

    if (items.length === 0 || grossWorkAmount <= 0) {
      alert("Please add at least one valid work item with amount.");
      return;
    }

    const deductionsData: BillDeductions = {
      securityDepositPercent: sdPercent,
      securityDepositAmount: sdAmount,
      tdsPercent: tdsPercent,
      tdsAmount: tdsAmount,
      gstTdsPercent: gstTdsPercent,
      gstTdsAmount: gstTdsAmount,
      labourCessPercent: cessPercent,
      labourCessAmount: cessAmount,
      royaltyOrPenalty: Number(royaltyPenalty),
      otherDeduction: Number(otherDeduction),
      totalDeductions: totalDeductions,
    };

    const finalBill: Bill = {
      id: editBill ? editBill.id : Date.now(),
      billNo: billNo.trim() || `KSG/RA-${Date.now()}`,
      billType: billType,
      raBillNo: raBillNo,
      date: billDate,
      project: selectedProjectName,
      department: department,
      workOrderNo: workOrderNo,
      mbBookNo: mbBookNo,
      description: description,
      items: items,
      grossAmount: grossWorkAmount,
      gstPercent: includeGst ? gstPercent : 0,
      gstAmount: gstAmount,
      deductions: deductionsData,
      netPayable: netPayable,
      amount: grossWithGst,
      received: status === "Received" ? (receivedAmount || netPayable) : Number(receivedAmount),
      status: status,
      paymentReference: paymentRef,
      attachments: attachments,
      notes: notes,
      syncedOffline: true,
    };

    onSaveBill(finalBill);
    onClose();
  };

  // 1-Click Print A4 Invoice
  const handlePrintInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the bill.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RA Bill Invoice - ${billNo} - K.S.Godhani</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 12px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .logo-title { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
          .sub { font-size: 11px; color: #64748b; }
          .badge { background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
          .card-title { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
          th { background: #0f172a; color: white; text-align: left; padding: 7px 8px; font-size: 11px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; }
          .text-right { text-align: right; }
          .deductions-table { width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin-top: 5px; }
          .deductions-table td { padding: 4px 8px; border: 1px solid #e2e8f0; }
          .total-box { background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a; }
          .net-box { background: #ecfdf5; border: 2px solid #10b981; color: #065f46; font-weight: bold; font-size: 14px; padding: 10px; border-radius: 6px; text-align: right; margin-top: 10px; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; }
          .sig-box { width: 28%; border-top: 1px dashed #64748b; padding-top: 6px; font-size: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-title">K.S.Godhani Construction &amp; Civil Works</div>
            <div class="sub">Class-AA Approved Government Civil Contractor | Reg: GUJ/PWD/2026/AA-109</div>
            <div class="sub">Office: Station Road, Amreli / Rajkot, Gujarat | Contact: 98250 12345</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">${raBillNo} (${billType})</div>
            <div style="font-size: 14px; font-weight: 800; margin-top: 4px;">${billNo}</div>
            <div class="sub">Date: ${billDate}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Client / Government Department</div>
            <div style="font-weight: bold; font-size: 12px;">${department}</div>
            <div style="margin-top: 2px;"><b>Project Site:</b> ${selectedProjectName}</div>
            <div><b>Work Order No:</b> ${workOrderNo}</div>
            <div><b>MB Reference:</b> ${mbBookNo}</div>
          </div>
          <div class="card">
            <div class="card-title">Bill &amp; Payment Status</div>
            <div><b>Contractor:</b> Kanjibhai S. Godhani</div>
            <div><b>Bill Status:</b> ${status}</div>
            <div><b>Payment Ref / RTGS:</b> ${paymentRef || "Pending Verification"}</div>
            <div><b>Gross Amount:</b> ${formatINR(grossWithGst)}</div>
          </div>
        </div>

        <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Itemized Measurement &amp; Work Execution Sheet (Schedule-B / SOR)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Item #</th>
              <th>Description of Work Executed</th>
              <th style="width: 10%; text-align: center;">Unit</th>
              <th style="width: 12%;" class="text-right">Quantity</th>
              <th style="width: 15%;" class="text-right">Rate (₹)</th>
              <th style="width: 18%;" class="text-right">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
              <tr>
                <td>${item.itemNo || `Item ${idx + 1}`}</td>
                <td>${item.description}</td>
                <td style="text-align: center;">${item.unit}</td>
                <td class="text-right">${item.quantity.toLocaleString('en-IN')}</td>
                <td class="text-right">₹${item.rate.toLocaleString('en-IN')}</td>
                <td class="text-right" style="font-weight: bold;">₹${item.amount.toLocaleString('en-IN')}</td>
              </tr>
            `).join("")}
            <tr class="total-box">
              <td colspan="5" style="text-align: right;">Gross Work Done Value:</td>
              <td class="text-right" style="font-size: 12px;">${formatINR(grossWorkAmount)}</td>
            </tr>
            ${includeGst ? `
              <tr>
                <td colspan="5" style="text-align: right;">Add: GST (${gstPercent}%):</td>
                <td class="text-right" style="font-weight: bold; color: #1e293b;">+ ${formatINR(gstAmount)}</td>
              </tr>
              <tr class="total-box">
                <td colspan="5" style="text-align: right;">Total Bill Amount (Gross + GST):</td>
                <td class="text-right" style="font-size: 13px; color: #0f172a;">${formatINR(grossWithGst)}</td>
              </tr>
            ` : ""}
          </tbody>
        </table>

        <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Statutory Deductions &amp; Recoveries</div>
        <table class="deductions-table">
          <tr>
            <td>1. Security Deposit (SD @ ${sdPercent}%)</td>
            <td class="text-right">₹${sdAmount.toLocaleString('en-IN')}</td>
            <td>4. Labour Welfare Cess (1%)</td>
            <td class="text-right">₹${cessAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td>2. Income Tax TDS (@ ${tdsPercent}%)</td>
            <td class="text-right">₹${tdsAmount.toLocaleString('en-IN')}</td>
            <td>5. Royalty / Penalty / Material Recovery</td>
            <td class="text-right">₹${Number(royaltyPenalty).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td>3. GST TDS (@ ${gstTdsPercent}%)</td>
            <td class="text-right">₹${gstTdsAmount.toLocaleString('en-IN')}</td>
            <td>6. Other Recoveries / Withheld</td>
            <td class="text-right">₹${Number(otherDeduction).toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background: #fef2f2; font-weight: bold;">
            <td colspan="3" style="text-align: right; color: #991b1b;">Total Statutory Deductions:</td>
            <td class="text-right" style="color: #991b1b;">- ${formatINR(totalDeductions)}</td>
          </tr>
        </table>

        <div class="net-box">
          Net Payable Amount to Contractor: ${formatINR(netPayable)}
        </div>

        <div class="sig-row">
          <div class="sig-box">
            Prepared &amp; Submitted By<br/>
            <b>Site Engineer / Supervisor</b><br/>
            K.S.Godhani Construction
          </div>
          <div class="sig-box">
            Measurement Verified &amp; Checked<br/>
            <b>Junior / Deputy Executive Engineer</b><br/>
            ${department.split(',')[0]}
          </div>
          <div class="sig-box">
            Passed &amp; Approved By<br/>
            <b>Executive Engineer / Treasury</b><br/>
            Govt of Gujarat
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-5xl">
      <form onSubmit={handleSave} className="flex flex-col max-h-[88vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-md border border-slate-700">
              <img src="/logo.png" alt="KS" className="h-full w-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ReceiptIndianRupee size={20} className="text-amber-400" />
                {editBill ? "Edit Government Project Bill" : "Government Project RA Bill Generator & Invoice Studio"}
              </h2>
              <p className="text-xs text-amber-400 font-medium">
                K.S.Godhani Construction &bull; Itemized Measurement Sheet, Deductions &amp; Document Uploader
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 py-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === "builder" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileText size={15} />
            <span>1. Bill &amp; Work Items (SOR)</span>
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{items.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deductions")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === "deductions" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calculator size={15} />
            <span>2. Taxes &amp; Statutory Deductions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("uploads")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === "uploads" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Upload size={15} />
            <span>3. Upload Physical Bills &amp; MB Sheets</span>
            {attachments.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 text-[10px]">
                {attachments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === "preview" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Eye size={15} />
            <span>4. Live Invoice &amp; Print</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ─────────────────────────────────────────────────────────────
              TAB 1: BILL HEADER & ITEM BUILDER
          ────────────────────────────────────────────────────────────── */}
          {activeTab === "builder" && (
            <div className="space-y-6">
              {/* Site & Bill Metadata Card */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Project / Site <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProjectName}
                    onChange={e => setSelectedProjectName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-800"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        🏗️ {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Type</label>
                  <select
                    value={billType}
                    onChange={e => setBillType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
                  >
                    <option value="RA Bill">Running Account (RA) Bill</option>
                    <option value="Final Bill">Final Completion Bill</option>
                    <option value="Tax Invoice">Tax Invoice / GST Bill</option>
                    <option value="Advance Bill">Mobilization Advance Bill</option>
                    <option value="Subcontractor Bill">Subcontractor Bill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RA Bill No. / Title</label>
                  <input
                    type="text"
                    value={raBillNo}
                    onChange={e => setRaBillNo(e.target.value)}
                    placeholder="e.g. 1st R.A. Bill"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Number</label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={e => setBillNo(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={e => setBillDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Order / Tender No.</label>
                  <input
                    type="text"
                    value={workOrderNo}
                    onChange={e => setWorkOrderNo(e.target.value)}
                    placeholder="e.g. WO/2026/094"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MB Book &amp; Page Ref</label>
                  <input
                    type="text"
                    value={mbBookNo}
                    onChange={e => setMbBookNo(e.target.value)}
                    placeholder="e.g. MB-104, Page 22-26"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Government Department / Client</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Irrigation &amp; Water Resources Dept, Gujarat"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck size={18} className="text-amber-500" />
                      Measurement Sheet &amp; SOR Work Items (Schedule-B)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add itemized quantities and rates verified by the Site Engineer / JE.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-3 w-20">Item #</th>
                        <th className="py-3 px-3 min-w-[280px]">Work Description / SOR Ref</th>
                        <th className="py-3 px-3 w-28">Unit</th>
                        <th className="py-3 px-3 w-28 text-right">Quantity</th>
                        <th className="py-3 px-3 w-32 text-right">Rate (₹)</th>
                        <th className="py-3 px-3 w-36 text-right">Amount (₹)</th>
                        <th className="py-3 px-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.itemNo}
                              onChange={e => handleItemChange(item.id, "itemNo", e.target.value)}
                              placeholder={`Item ${idx + 1}`}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={e => handleItemChange(item.id, "description", e.target.value)}
                              placeholder="Description of work item executed as per tender SOR"
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-slate-800 resize-none"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={item.unit}
                              onChange={e => handleItemChange(item.id, "unit", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-800"
                            >
                              <option value="Cu.M">Cu.M (ઘન મીટર)</option>
                              <option value="Sq.M">Sq.M (ચો. મીટર)</option>
                              <option value="R.M">R.M (રનિંગ મીટર)</option>
                              <option value="MT">MT (મેટ્રિક ટન)</option>
                              <option value="Nos">Nos (નંગ)</option>
                              <option value="Bags">Bags (થેલા)</option>
                              <option value="LS">LS (લમસમ)</option>
                              <option value="Trips">Trips (ફેરા)</option>
                              <option value="Hours">Hours (કલાક)</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              step="any"
                              value={item.quantity}
                              onChange={e => handleItemChange(item.id, "quantity", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-right text-slate-900 outline-none focus:border-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              step="any"
                              value={item.rate}
                              onChange={e => handleItemChange(item.id, "rate", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-right text-slate-900 outline-none focus:border-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-right font-black text-slate-900 text-xs">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                              title="Delete Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal Summary Bar */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/20 text-amber-400 p-2 font-bold text-xs">
                      {items.length} Items Billed
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Gross Work Executed Value</p>
                      <p className="text-lg font-black text-white">{formatINR(grossWorkAmount)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("deductions")}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-slate-950 px-4 py-2 text-xs font-black hover:bg-amber-300 transition"
                  >
                    <span>Next: Taxes &amp; Deductions</span>
                    <Calculator size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: TAXES & STATUTORY DEDUCTIONS
          ────────────────────────────────────────────────────────────── */}
          {activeTab === "deductions" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Goods &amp; Services Tax (GST)</h3>
                    <p className="text-xs text-slate-500">Enable GST if this is a Tax Invoice or RA Bill with GST claim.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeGst}
                      onChange={e => setIncludeGst(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {includeGst && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">GST Rate (%)</label>
                      <select
                        value={gstPercent}
                        onChange={e => setGstPercent(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900"
                      >
                        <option value={18}>18% (9% CGST + 9% SGST)</option>
                        <option value={12}>12% (6% CGST + 6% SGST)</option>
                        <option value={5}>5% (Work Contract Concessional)</option>
                      </select>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Calculated GST Amount</p>
                        <p className="text-sm font-black text-slate-900">{formatINR(gstAmount)}</p>
                      </div>
                      <span className="rounded-lg bg-amber-100 text-amber-800 font-bold px-2 py-1 text-xs">
                        +{gstPercent}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Statutory Deductions Grid */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    Government &amp; Tender Statutory Deductions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standard deductions deducted by the Government Treasury before payment release.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Security Deposit (SD) */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">1. Security Deposit (SD)</label>
                      <span className="text-xs font-mono font-bold text-red-600">-{formatINR(sdAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={sdPercent}
                        onChange={e => setSdPercent(Number(e.target.value))}
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-semibold">% of Gross</span>
                    </div>
                  </div>

                  {/* IT TDS */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">2. Income Tax (TDS)</label>
                      <span className="text-xs font-mono font-bold text-red-600">-{formatINR(tdsAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={tdsPercent}
                        onChange={e => setTdsPercent(Number(e.target.value))}
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-semibold">% IT TDS</span>
                    </div>
                  </div>

                  {/* GST TDS */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">3. GST TDS</label>
                      <span className="text-xs font-mono font-bold text-red-600">-{formatINR(gstTdsAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={gstTdsPercent}
                        onChange={e => setGstTdsPercent(Number(e.target.value))}
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-semibold">% (1% CGST+1% SGST)</span>
                    </div>
                  </div>

                  {/* Labour Welfare Cess */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">4. Labour Welfare Cess</label>
                      <span className="text-xs font-mono font-bold text-red-600">-{formatINR(cessAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={cessPercent}
                        onChange={e => setCessPercent(Number(e.target.value))}
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-semibold">% BOCW Cess</span>
                    </div>
                  </div>

                  {/* Royalty / Material Recovery */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">5. Royalty / Penalty</label>
                      <span className="text-xs font-mono font-bold text-red-600">-{formatINR(royaltyPenalty)}</span>
                    </div>
                    <input
                      type="number"
                      value={royaltyPenalty}
                      onChange={e => setRoyaltyPenalty(Number(e.target.value))}
                      placeholder="₹ 0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900"
                    />
                  </div>

                  {/* Other Deductions */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">6. Other Withheld</label>
                      <span className="text-xs font-mono font-bold text-red-600">-{formatINR(otherDeduction)}</span>
                    </div>
                    <input
                      type="number"
                      value={otherDeduction}
                      onChange={e => setOtherDeduction(Number(e.target.value))}
                      placeholder="₹ 0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Net Payable Banner */}
                <div className="mt-4 rounded-2xl bg-emerald-950 text-white p-5 border border-emerald-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                      Contractor Net Receivable
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-300 mt-0.5">
                      {formatINR(netPayable)}
                    </div>
                    <p className="text-[11px] text-emerald-400/80 mt-1">
                      Gross ({formatINR(grossWithGst)}) - Deductions ({formatINR(totalDeductions)})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("uploads")}
                      className="rounded-xl bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-bold hover:bg-amber-300 transition shadow-sm"
                    >
                      Next: Upload Physical Bills &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Status and Treasury cleared payment tracking */}
              <div className="grid gap-4 sm:grid-cols-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Clearance Status</label>
                  <select
                    value={status}
                    onChange={e => {
                      const newStatus = e.target.value as any;
                      setStatus(newStatus);
                      if (newStatus === "Received") {
                        setReceivedAmount(netPayable);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-800"
                  >
                    <option value="Pending">⏳ Pending at Treasury (Under Scrutiny)</option>
                    <option value="Partial">⚠️ Partially Received / Cleared</option>
                    <option value="Received">✅ Cleared &amp; Credited to Bank Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cleared Amount Received (₹)</label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={e => setReceivedAmount(Number(e.target.value))}
                    placeholder="₹ Received in bank"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Payment Ref / RTGS UTR</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="e.g. SBIN00084729103"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: UPLOAD PHYSICAL BILLS & MB SHEETS
          ────────────────────────────────────────────────────────────── */}
          {activeTab === "uploads" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <FileCheck size={24} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold text-sm">Attach Physical Signed Documents &amp; Vouchers</p>
                  <p className="mt-0.5">
                    Capture and upload photos of physical measurement sheets (MB Sheet), Government passed bill copies,
                    Junior Engineer sign-off letters, and Bank RTGS payment advice.
                  </p>
                </div>
              </div>

              {/* Upload Drop Zone & Camera Buttons */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-amber-500 hover:bg-amber-50/50 transition cursor-pointer">
                  <Upload size={28} className="text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-800">Click or Drag &amp; Drop Files</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PDF, Scanned Images (PNG, JPG)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/30 p-6 text-center hover:border-amber-500 hover:bg-amber-50 transition cursor-pointer">
                  <Camera size={28} className="text-amber-600 mb-2" />
                  <span className="text-xs font-bold text-amber-950">Capture Photo with Camera</span>
                  <span className="text-[11px] text-amber-700 mt-0.5">Take live snapshot of physical voucher/bill</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Attachments Gallery */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Attached Documents ({attachments.length})
                </h4>

                {attachments.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No physical bills or MB sheets attached yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {attachments.map((att, idx) => (
                      <div
                        key={att.id}
                        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {att.type.includes("pdf") ? (
                            <div className="h-12 w-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                              PDF
                            </div>
                          ) : (
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              className="h-12 w-12 rounded-xl object-cover border shrink-0 cursor-pointer"
                              onClick={() => setPreviewAttachment(att)}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate" title={att.name}>
                              {att.name}
                            </p>
                            <p className="text-[10px] text-slate-400">{att.uploadedAt}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-amber-600"
                          >
                            <Eye size={12} />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                            title="Remove attachment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 4: LIVE INVOICE PREVIEW & PRINT
          ────────────────────────────────────────────────────────────── */}
          {activeTab === "preview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-100 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Ready for submission to Government Executive Engineer or Chartered Accountant (CA).</span>
                </div>

                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800 shadow-md transition"
                >
                  <Printer size={14} />
                  <span>Print / Download PDF (A4)</span>
                </button>
              </div>

              {/* Printable Canvas Mockup */}
              <div className="rounded-3xl border border-slate-300 bg-white p-6 sm:p-8 shadow-md text-slate-900 space-y-6">
                <div className="flex justify-between items-start border-b border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-white p-1 border shadow-xs">
                      <img src="/logo.png" alt="KS" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-950 uppercase">K.S.Godhani Construction &amp; Civil Works</h1>
                      <p className="text-xs text-slate-500 font-medium">Class-AA Government Approved Contractor &bull; Gujarat</p>
                      <p className="text-[11px] text-slate-400">Proprietor: Kanjibhai S. Godhani</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded-lg bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 text-xs">
                      {raBillNo} ({billType})
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 mt-1">{billNo}</p>
                    <p className="text-xs text-slate-500">Date: {billDate}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 rounded-2xl bg-slate-50 p-4 border text-xs">
                  <div>
                    <p className="font-bold text-slate-500 uppercase text-[10px]">Client / Department</p>
                    <p className="font-bold text-slate-900 mt-0.5">{department}</p>
                    <p className="text-slate-600 mt-1"><b>Site:</b> {selectedProjectName}</p>
                    <p className="text-slate-600"><b>Work Order:</b> {workOrderNo}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-500 uppercase text-[10px]">Audit Reference</p>
                    <p className="text-slate-700 mt-0.5"><b>MB Reference:</b> {mbBookNo}</p>
                    <p className="text-slate-700"><b>Status:</b> {status}</p>
                    <p className="text-slate-700"><b>Payment Ref:</b> {paymentRef || "Pending"}</p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-2.5">Item #</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-center">Unit</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Rate</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="p-2 font-bold">{it.itemNo || `Item ${idx + 1}`}</td>
                          <td className="p-2">{it.description}</td>
                          <td className="p-2 text-center">{it.unit}</td>
                          <td className="p-2 text-right">{it.quantity.toLocaleString("en-IN")}</td>
                          <td className="p-2 text-right">₹{it.rate.toLocaleString("en-IN")}</td>
                          <td className="p-2 text-right font-bold">₹{it.amount.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Net Payable */}
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3.5 border space-y-1">
                    <p className="font-bold text-slate-900 mb-1 text-[11px] uppercase">Deductions Summary</p>
                    <div className="flex justify-between text-slate-600">
                      <span>SD ({sdPercent}%):</span>
                      <span>₹{sdAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IT TDS ({tdsPercent}%):</span>
                      <span>₹{tdsAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Labour Cess ({cessPercent}%):</span>
                      <span>₹{cessAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-bold text-red-600 pt-1 border-t">
                      <span>Total Deductions:</span>
                      <span>- {formatINR(totalDeductions)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex flex-col justify-between text-right">
                    <div>
                      <p className="text-xs text-emerald-700 font-bold uppercase">Net Payable to Contractor</p>
                      <p className="text-2xl font-black text-emerald-950 mt-1">{formatINR(netPayable)}</p>
                    </div>
                    <p className="text-[10px] text-emerald-700">Gross: {formatINR(grossWithGst)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Gross:</span>
            <span className="text-sm font-black text-slate-900">{formatINR(grossWithGst)}</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-emerald-600 font-bold">Net: {formatINR(netPayable)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md"
            >
              <CheckCircle2 size={16} />
              <span>{editBill ? "Save Changes" : "Create & Save Bill"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Lightbox attachment preview */}
      {previewAttachment && (
        <ModalWrapper onClose={() => setPreviewAttachment(null)} maxWidth="max-w-3xl">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 truncate">{previewAttachment.name}</h3>
              <button onClick={() => setPreviewAttachment(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-center bg-slate-950 p-2 rounded-2xl">
              {previewAttachment.type.includes("pdf") ? (
                <iframe src={previewAttachment.dataUrl} className="w-full h-96 rounded-xl" title="PDF" />
              ) : (
                <img src={previewAttachment.dataUrl} alt="Preview" className="max-h-[70vh] rounded-xl object-contain" />
              )}
            </div>
          </div>
        </ModalWrapper>
      )}
    </ModalWrapper>
  );
}
