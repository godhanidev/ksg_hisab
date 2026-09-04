import React, { useState, useEffect } from "react";
import {
  Landmark, Upload, Camera, Trash2, Check, AlertCircle
} from "lucide-react";
import { Attachment, BankPayment, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr, toInputDateFormat, fromInputDateFormat } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";

type BankPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: Omit<BankPayment, "id"> | BankPayment) => void;
  editingPayment?: BankPayment | null;
  projects: Project[];
  currentUser: UserAccount;
  lang: Language;
};

const COMMON_CATEGORIES = [
  "Steel",
  "Cement",
  "Material & Spares",
  "Subcontractor",
  "Machinery Hire / JCB",
  "Transport & Freight",
  "Fuel & Diesel",
  "Other",
];

export function BankPaymentModal({
  isOpen,
  onClose,
  onSave,
  editingPayment,
  projects,
  currentUser,
  lang,
}: BankPaymentModalProps) {
  const t = getTranslation(lang);

  const [date, setDate] = useState<string>(todayStr());
  const [project, setProject] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<BankPayment["paymentMode"]>("RTGS / NEFT");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [category, setCategory] = useState<string>("Material & Spares");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingPayment) {
      setDate(editingPayment.date);
      setProject(editingPayment.project);
      setPartyName(editingPayment.partyName);
      setAmount(editingPayment.amount ? String(editingPayment.amount) : "");
      setPaymentMode(editingPayment.paymentMode);
      setReferenceNo(editingPayment.referenceNo || "");
      setCategory(editingPayment.category || "Material & Spares");
      setAttachments(editingPayment.attachments || []);
    } else {
      setDate(todayStr());
      if (currentUser.assignedProjects.length > 0) {
        setProject(currentUser.assignedProjects[0]);
      } else if (projects.length > 0) {
        setProject(projects[0].name);
      }
      setPartyName("");
      setAmount("");
      setPaymentMode("RTGS / NEFT");
      setReferenceNo("");
      setCategory("Material & Spares");
      setAttachments([]);
    }
    setErrorMsg(null);
  }, [editingPayment, isOpen, currentUser, projects]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: Attachment = {
        id: "att_bank_" + Date.now(),
        name: file.name,
        dataUrl: reader.result as string,
        type: file.type,
        sizeBytes: file.size,
        uploadedAt: todayStr(),
      };
      setAttachments([newAtt]);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!project) {
      setErrorMsg("Please select a project site");
      return;
    }
    if (!partyName.trim()) {
      setErrorMsg("Please enter party / supplier name");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than zero");
      return;
    }

    const payload = {
      ...(editingPayment ? { id: editingPayment.id } : {}),
      date,
      project,
      partyName: partyName.trim(),
      amount: numAmount,
      paymentMode,
      referenceNo: referenceNo.trim() || undefined,
      category: category || "Other",
      notes: editingPayment?.notes,
      enteredBy: currentUser.name,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    onSave(payload as any);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editingPayment ? `${t.edit}: ${editingPayment.partyName}` : t.addBankPayment}
      subtitle={
        lang === "gu"
          ? "હેડ ઓફિસ બેંક એકાઉન્ટથી સીધી પાર્ટી RTGS / ચેક ચુકવણી એન્ટ્રી"
          : "Direct office RTGS / NEFT / Cheque payment to vendor or party"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Site & Date */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.project} *
            </label>
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {projects.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date with Calendar Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{t.date} *</span>
              <span className="text-[11px] font-mono font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                📅 {date || todayStr()}
              </span>
            </label>
            <input
              type="date"
              value={toInputDateFormat(date)}
              onChange={e => setDate(fromInputDateFormat(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            />
          </div>
        </div>

        {/* Party Name Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t.partyName} *
          </label>
          <input
            type="text"
            value={partyName}
            onChange={e => setPartyName(e.target.value)}
            required
            placeholder="Vrajesh Traders, Ashish Buildcon, Shree Vrajesh Steel"
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Amount & Category */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.amount} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-base font-black text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {parseFloat(amount) > 0 && (
              <p className="mt-1 text-[11px] font-bold text-blue-600">
                {formatINR(parseFloat(amount))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.category}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {COMMON_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Mode & Reference / UTR */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.paymentMode}
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="RTGS / NEFT">RTGS / NEFT</option>
              <option value="Cheque">Cheque</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Direct Transfer">Direct Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.referenceNo}
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder="UTR-HDFC2026031891, Cheque No, Ref No"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Bank Receipt Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Bank Receipt / Slip Proof
          </label>
          {attachments.length > 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={attachments[0].dataUrl}
                  alt="Receipt Preview"
                  className="h-12 w-12 rounded-lg object-cover border border-slate-300"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {attachments[0].name}
                  </p>
                  <p className="text-[10px] text-blue-600 font-medium">
                    Proof attached [OK]
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachments([])}
                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition">
              <Upload size={16} className="text-slate-400" />
              <span>Attach Bank Receipt / UTR Slip</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95"
          >
            <Check size={16} />
            <span>{t.save}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
