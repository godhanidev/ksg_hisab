import React, { useState, useEffect } from "react";
import {
  X, ArrowDownLeft, ArrowUpRight, Camera, Upload, Trash2,
  Check, AlertCircle, Building2, User, FileText, Calendar
} from "lucide-react";
import { Attachment, CashTransaction, CashTransactionType, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr, toInputDateFormat, fromInputDateFormat } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";

type CashTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<CashTransaction, "id"> | CashTransaction) => void;
  editingTransaction?: CashTransaction | null;
  defaultType?: CashTransactionType;
  projects: Project[];
  currentUser: UserAccount;
  lang: Language;
};

const COMMON_CATEGORIES = [
  "Labour",
  "JCB / Excavator",
  "Tractor / Carting",
  "Material & Tools",
  "Diesel / Fuel",
  "Pooja & Ceremony",
  "Food & Refreshment",
  "Office Cash Top-up",
  "Site Miscellaneous",
  "Other",
];

export function CashTransactionModal({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  defaultType = "cash_out",
  projects,
  currentUser,
  lang,
}: CashTransactionModalProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const [type, setType] = useState<CashTransactionType>(defaultType);
  const [date, setDate] = useState<string>(todayStr());
  const [project, setProject] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [category, setCategory] = useState<string>("Labour");
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Cheque">("Cash");
  const [voucherNo, setVoucherNo] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form when modal opens or editing changes
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setProject(editingTransaction.project);
      setDetails(editingTransaction.details);
      setCategory(editingTransaction.category || "Labour");
      setAmount(editingTransaction.amount ? String(editingTransaction.amount) : "");
      setPaymentMode(editingTransaction.paymentMode || "Cash");
      setVoucherNo(editingTransaction.voucherNo || "");
      setAttachments(editingTransaction.attachments || []);
    } else {
      setType(defaultType);
      setDate(todayStr());
      // Set default project based on user
      if (currentUser.assignedProjects.length > 0) {
        setProject(currentUser.assignedProjects[0]);
      } else if (projects.length > 0) {
        setProject(projects[0].name);
      }
      setDetails("");
      setCategory(defaultType === "cash_in" ? "Office Cash Top-up" : "Labour");
      setAmount("");
      setPaymentMode("Cash");
      setVoucherNo("");
      setAttachments([]);
    }
    setErrorMsg(null);
  }, [editingTransaction, defaultType, isOpen, currentUser, projects]);

  if (!isOpen) return null;

  // Handle Photo / File Attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: Attachment = {
        id: "att_" + Date.now(),
        name: file.name,
        dataUrl: reader.result as string,
        type: file.type,
        sizeBytes: file.size,
        uploadedAt: todayStr(),
      };
      setAttachments([newAtt]); // replace or keep single primary receipt
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!project) {
      setErrorMsg("Please select a project site");
      return;
    }
    if (!details.trim()) {
      setErrorMsg("Please enter details / purpose of transaction");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than zero");
      return;
    }

    const payload = {
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      date,
      type,
      project,
      details: details.trim(),
      category: category || "Other",
      amount: numAmount,
      paymentMode,
      voucherNo: voucherNo.trim() || undefined,
      notes: editingTransaction?.notes,
      supervisorId: currentUser.id,
      supervisorName: currentUser.name,
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
      title={
        editingTransaction
          ? `${t.edit}: ${editingTransaction.details}`
          : type === "cash_in"
          ? t.addCashIn
          : t.addCashOut
      }
      subtitle={
        type === "cash_in"
          ? lang === "gu"
            ? "ઓફિસ તરફથી સાઇટ અથવા સુપરવાઇઝરને મળેલ રોકડ જમા"
            : "Cash received from head office to site / supervisor wallet"
          : lang === "gu"
          ? "સાઇટ પર થયેલ દૈનિક રોકડ ખર્ચ / ઉધાર હિસાબ"
          : "Daily site expense paid in cash on site"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Transaction Type Selector (જમા vs ઉધાર) */}
        {!editingTransaction && (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setType("cash_in");
                setCategory("Office Cash Top-up");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                type === "cash_in"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowDownLeft size={16} />
              <span>{t.cashIn}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("cash_out");
                setCategory("Labour");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                type === "cash_out"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowUpRight size={16} />
              <span>{t.cashOut}</span>
            </button>
          </div>
        )}

        {/* Site & Date Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Site Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.project} *
            </label>
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
              <span className="text-[11px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                📅 {date || todayStr()}
              </span>
            </label>
            <input
              type="date"
              value={toInputDateFormat(date)}
              onChange={e => setDate(fromInputDateFormat(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            />
          </div>
        </div>

        {/* Details Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t.details} *
          </label>
          <input
            type="text"
            value={details}
            onChange={e => setDetails(e.target.value)}
            required
            placeholder={
              type === "cash_in"
                ? "e.g. Cash received from Head Office / Kanjibhai"
                : "e.g. JCB Bhut Pagla, MP Labour Kharchi, Diesel"
            }
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Amount & Category */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Amount */}
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
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-base font-black text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            {parseFloat(amount) > 0 && (
              <p className="mt-1 text-[11px] font-bold text-emerald-600">
                {formatINR(parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.category}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {COMMON_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Mode & Voucher / Ref */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.paymentMode}
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="Cash">Cash (રોકડ)</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Voucher No */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.voucherNo}
            </label>
            <input
              type="text"
              value={voucherNo}
              onChange={e => setVoucherNo(e.target.value)}
              placeholder="e.g. V-102 or Slip No."
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Bill / Receipt Photo Attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t.uploadBillPhoto}
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
                  <p className="text-[10px] text-emerald-600 font-medium">
                    Photo attached [OK]
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-600 hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer transition">
                <Upload size={16} className="text-slate-400" />
                <span>{t.attachFile}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                <Camera size={16} className="text-amber-500" />
                <span>{t.takePhoto}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Submit & Cancel Buttons */}
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
            className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-95 ${
              type === "cash_in"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
            }`}
          >
            <Check size={16} />
            <span>{t.save}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
