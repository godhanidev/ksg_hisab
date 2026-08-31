import React, { useState } from "react";
import { ModalWrapper } from "../common/ModalWrapper";
import { Attachment, Bill, Language, Project } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { todayStr } from "../../utils/formatters";
import { Camera, Upload, Paperclip, X, MapPin, ReceiptIndianRupee, Check } from "lucide-react";

type EasyBillModalProps = {
  projects: Project[];
  defaultProject?: string;
  lang: Language;
  onSave: (bill: Omit<Bill, "id">) => void;
  onClose: () => void;
};

export function EasyBillModal({
  projects,
  defaultProject,
  lang,
  onSave,
  onClose,
}: EasyBillModalProps) {
  const t = getTranslation(lang);

  const [selectedSite, setSelectedSite] = useState(
    defaultProject && defaultProject !== "ALL" ? defaultProject : projects[0]?.name || ""
  );
  const [billNo, setBillNo] = useState(`RA-BILL-${String(Date.now()).slice(-4)}`);
  const [description, setDescription] = useState("1st Running Account Bill");
  const [amount, setAmount] = useState("");
  const [received, setReceived] = useState("");
  const [date, setDate] = useState(todayStr());
  const [paymentReference, setPaymentReference] = useState("");
  const [tenderItemRef, setTenderItemRef] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const newAtt: Attachment = {
            id: "att_bill_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            name: file.name,
            dataUrl: String(reader.result),
            type: file.type || "application/pdf",
            uploadedAt: todayStr(),
          };
          setAttachments(prev => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      alert(t.selectSiteFirst);
      return;
    }

    const totalAmt = parseFloat(amount) || 0;
    const recvAmt = parseFloat(received) || 0;

    const status: Bill["status"] =
      recvAmt === 0 ? "Pending" : recvAmt >= totalAmt ? "Received" : "Partial";

    onSave({
      billNo: billNo.trim() || `BILL-${Date.now()}`,
      date,
      project: selectedSite,
      description: description.trim() || "Govt Running Bill",
      amount: totalAmt,
      received: recvAmt,
      status,
      paymentReference: paymentReference.trim() || undefined,
      tenderItemRef: tenderItemRef.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.addBill}</h2>
          <p className="text-xs text-slate-500">Record Government Treasury RA Bill &amp; Payment</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
          Govt Billing
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <MapPin size={14} className="text-blue-600" /> {t.siteRequired} *
          </label>
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-800 transition"
          >
            {projects.map(p => (
              <option key={p.id} value={p.name}>
                🏗️ {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Number *</label>
            <input
              type="text"
              required
              value={billNo}
              onChange={e => setBillNo(e.target.value)}
              placeholder="e.g. RA-BILL-03"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Date</label>
            <input
              type="text"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Description / Stage</label>
          <input
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. 2nd Running Bill (Masonry & Spillway Wall)"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Total Bill Amount (Rs.) *</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 5000000"
              className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-emerald-800 mb-1">Cleared / Received Amount (Rs.)</label>
            <input
              type="number"
              min="0"
              value={received}
              onChange={e => setReceived(e.target.value)}
              placeholder="0 if pending"
              className="w-full rounded-xl border-2 border-emerald-300 bg-emerald-50/50 px-3.5 py-2.5 text-sm font-bold text-emerald-900 outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Treasury Payment Ref / Cheque #</label>
            <input
              type="text"
              value={paymentReference}
              onChange={e => setPaymentReference(e.target.value)}
              placeholder="e.g. TREASURY-NEFT-8891"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tender Item Reference</label>
            <input
              type="text"
              value={tenderItemRef}
              onChange={e => setTenderItemRef(e.target.value)}
              placeholder="e.g. Item 1 to 5"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-slate-800"
            />
          </div>
        </div>

        {/* Attach Tender Doc or Bill Copy */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera size={15} className="text-blue-600" />
              Attach Bill Copy / Govt Payment Voucher
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 text-xs font-bold transition">
              <Upload size={15} />
              <span>{t.uploadDoc}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {attachments.map(att => (
              <div key={att.id} className="flex items-center gap-1.5 rounded-xl bg-white border p-1 pr-2.5 text-xs">
                <Paperclip size={13} className="text-blue-600" />
                <span className="max-w-[120px] truncate">{att.name}</span>
                <button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}>
                  <X size={12} className="text-slate-400 hover:text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
          >
            <Check size={16} />
            {t.save}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
