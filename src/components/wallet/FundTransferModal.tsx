import React, { useState } from "react";
import { ModalWrapper } from "../common/ModalWrapper";
import { Attachment, FundTransfer, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr } from "../../utils/formatters";
import {
  WalletCards, Camera, Upload, X, Check, IndianRupee, ShieldCheck,
  Building2, User, FileText, Image as ImageIcon, CalendarDays
} from "lucide-react";

type FundTransferModalProps = {
  projects: Project[];
  supervisors: UserAccount[];
  defaultSupervisorId?: number;
  defaultProject?: string;
  currentUser: UserAccount;
  lang: Language;
  onSave: (transfer: Omit<FundTransfer, "id">) => void;
  onClose: () => void;
};

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 200000];

export function FundTransferModal({
  projects,
  supervisors,
  defaultSupervisorId,
  defaultProject,
  currentUser,
  lang,
  onSave,
  onClose,
}: FundTransferModalProps) {
  const t = getTranslation(lang) as any;

  // Filter valid site supervisors (users with supervisor role or specific non-admin)
  const supervisorList = supervisors.filter(u => u.role === "supervisor" || u.id !== 1);

  // Form State
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<number>(
    defaultSupervisorId || supervisorList[0]?.id || 2
  );
  
  const selectedSupervisor = supervisorList.find(s => s.id === Number(selectedSupervisorId)) || supervisorList[0];

  const [selectedSite, setSelectedSite] = useState<string>(() => {
    if (defaultProject && defaultProject !== "ALL") return defaultProject;
    if (selectedSupervisor?.assignedProjects?.[0]) return selectedSupervisor.assignedProjects[0];
    return projects[0]?.name || "";
  });

  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<FundTransfer["paymentMode"]>("UPI");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [transferDate, setTransferDate] = useState<string>(todayStr());

  // Payment Proof Attachment State
  const [proofAttachment, setProofAttachment] = useState<Attachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // When supervisor changes, auto-switch to their assigned project if available
  const handleSupervisorChange = (supId: number) => {
    setSelectedSupervisorId(supId);
    const sup = supervisorList.find(s => s.id === supId);
    if (sup && sup.assignedProjects.length > 0) {
      setSelectedSite(sup.assignedProjects[0]);
    }
  };

  // Handle Photo / File Attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setProofAttachment({
          id: "proof_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          name: file.name,
          dataUrl: String(reader.result),
          type: file.type || "image/jpeg",
          sizeBytes: file.size,
          uploadedAt: todayStr(),
        });
      }
      setIsProcessingFile(false);
    };
    reader.onerror = () => setIsProcessingFile(false);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid transfer amount.");
      return;
    }

    if (!selectedSite) {
      alert("Please select a project site for this fund allocation.");
      return;
    }

    // Require UTR / Ref No for online, UPI, or Cheque transfers
    if (paymentMode !== "Cash" && !referenceNo.trim()) {
      alert(`Please enter the UTR / Transaction Reference Number for ${paymentMode} payment.`);
      return;
    }

    const transferNo = `FT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    onSave({
      transferNo,
      date: transferDate,
      supervisorId: Number(selectedSupervisorId),
      supervisorName: selectedSupervisor?.name || "Site Supervisor",
      project: selectedSite,
      amount: amt,
      paymentMode,
      referenceNo: referenceNo.trim() || undefined,
      proofAttachment: proofAttachment || undefined,
      notes: notes.trim() || undefined,
      transferredBy: currentUser.name,
      transferredAt: `${todayStr()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    });

    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header Alert Pill */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-900">
          <WalletCards size={22} className="text-amber-600 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">
              {lang === "gu" ? "ડિજિટલ પેટી કેશ વૉલેટ ક્રેડિટ" : "Instant Supervisor Digital Wallet Credit"}
            </p>
            <p className="text-amber-700/90 text-[11px] mt-0.5">
              {lang === "gu"
                ? "આ રકમ સુપરવાઇઝરના વૉલેટમાં સીધી જમા થશે અને તેમના 'Cash in Hand' બેલેન્સમાં ઉમેરાશે."
                : "Funds will be credited directly to the supervisor's digital petty cash wallet balance."}
            </p>
          </div>
        </div>

        {/* Supervisor & Site Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-slate-500" />
              {lang === "gu" ? "સુપરવાઇઝર (પ્રાપ્તકર્તા) *" : "Supervisor (Recipient) *"}
            </label>
            <select
              value={selectedSupervisorId}
              onChange={e => handleSupervisorChange(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 shadow-xs"
            >
              {supervisorList.map(s => (
                <option key={s.id} value={s.id}>
                  👤 {s.name} {s.assignedProjects.length > 0 ? `(${s.assignedProjects[0].split(" - ")[0]})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-500" />
              {lang === "gu" ? "પ્રોજેક્ટ સાઇટ *" : "Project Site *"}
            </label>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 shadow-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.name}>
                  🏗️ {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transfer Amount (₹) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <IndianRupee size={13} className="text-amber-600" />
            {lang === "gu" ? "મોકલવાની રકમ (રૂપિયા) *" : "Transfer Amount (₹) *"}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-xl border-2 border-slate-200 pl-8 pr-4 py-2.5 text-base font-black text-slate-900 outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          {/* Quick Amount Pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  amount === String(amt)
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                +{formatINR(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method & UTR Ref No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === "gu" ? "ચુકવણીનો પ્રકાર (Payment Method) *" : "Payment Method *"}
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="UPI">⚡ UPI (GPay / PhonePe / Paytm)</option>
              <option value="Bank Transfer (NEFT/RTGS)">🏦 Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="Cash">💵 Cash (રોકડ Handover)</option>
              <option value="Cheque">📑 Cheque (ચેક)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>
                {paymentMode === "Cash"
                  ? (lang === "gu" ? "કેશ વાઉચર નં. (ઓપ્શનલ)" : "Cash Voucher No (Optional)")
                  : (lang === "gu" ? "UTR / રેફરન્સ નં. *" : "UTR / Ref No *")}
              </span>
              {paymentMode !== "Cash" && (
                <span className="text-[10px] text-amber-600 font-bold">Mandatory</span>
              )}
            </label>
            <input
              type="text"
              required={paymentMode !== "Cash"}
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder={paymentMode === "Cash" ? "e.g. CASH-VOUCHER-01" : "e.g. UTR / IMPS20260901..."}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CalendarDays size={13} className="text-slate-500" />
              {lang === "gu" ? "ટ્રાન્સફર તારીખ *" : "Transfer Date *"}
            </label>
            <input
              type="text"
              required
              value={transferDate}
              onChange={e => setTransferDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === "gu" ? "ઓફિસ રિમાર્ક્સ / નોંધ" : "Purpose / Office Notes"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Imprest advance for cement & fuel"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* Proof of Transfer Attachment (Screenshot / Receipt) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={15} className="text-slate-600" />
              <span className="text-xs font-bold text-slate-900">
                {lang === "gu" ? "પેમેન્ટ રસીદ / બેંક સ્લિપ ફોટો" : "Payment Proof / Receipt Slip"}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">(Optional screenshot/slip)</span>
          </div>

          {proofAttachment ? (
            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={proofAttachment.dataUrl}
                  alt="Proof Slip"
                  className="h-10 w-10 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{proofAttachment.name}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={11} /> Proof Attached
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProofAttachment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* File upload */}
              <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 transition">
                <Upload size={14} className="text-slate-500" />
                <span>Upload Slip / Screenshot</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Live Camera (Mobile) */}
              <label className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 transition shrink-0">
                <Camera size={14} className="text-slate-500" />
                <span className="hidden sm:inline">Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            {t.cancel || "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isProcessingFile}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition active:scale-95"
          >
            <ShieldCheck size={16} />
            <span>{lang === "gu" ? "પૈસા ટ્રાન્સફર કરો (Credit Wallet)" : "Confirm & Issue Funds"}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
