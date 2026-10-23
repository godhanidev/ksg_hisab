import React, { useState, useEffect } from "react";
import {
  Landmark, Upload, Camera, Trash2, Check, AlertCircle, FileText
} from "lucide-react";
import { Attachment, BankPayment, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr, toInputDateFormat, fromInputDateFormat } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";
import { compressImageFile } from "../../utils/imageCompressor";
import { generateUniqueIdString } from "../../utils/idGenerator";

type BankPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: Omit<BankPayment, "id"> | BankPayment) => void;
  editingPayment?: BankPayment | null;
  projects: Project[];
  currentUser: UserAccount;
  users?: UserAccount[];
  lang: Language;
  selectedSiteFilter?: string;
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
  users = [],
  lang,
  selectedSiteFilter,
}: BankPaymentModalProps) {
  const t = getTranslation(lang);

  const [date, setDate] = useState<string>(todayStr());
  const [project, setProject] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<BankPayment["paymentMode"]>("RTGS / NEFT");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [category, setCategory] = useState<string>("Material & Spares");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingPayment) {
      setDate(editingPayment.date);
      setProject(editingPayment.project);
      setPartyName(editingPayment.partyName);
      setAmount(editingPayment.amount ? String(editingPayment.amount) : "");
      setPaymentMode(editingPayment.paymentMode);
      setReferenceNo(editingPayment.referenceNo || "");
      const existingCat = editingPayment.category || "Material & Spares";
      if (COMMON_CATEGORIES.includes(existingCat) && existingCat !== "Other") {
        setCategory(existingCat);
        setCustomCategory("");
      } else {
        setCategory("Other");
        setCustomCategory(existingCat === "Other" ? "" : existingCat);
      }
      setAttachments(editingPayment.attachments || []);
    } else {
      setDate(todayStr());
      // Set valid default project matching available projects list
      const siteFilterMatch = selectedSiteFilter && selectedSiteFilter !== "ALL"
        ? projects.find(p => p.name === selectedSiteFilter)?.name
        : null;
      const userAssignedMatch = currentUser.assignedProjects.find(name =>
        projects.some(p => p.name === name)
      );
      const defaultProj = siteFilterMatch || userAssignedMatch || projects[0]?.name || currentUser.assignedProjects[0] || "";
      setProject(defaultProj);
      setPartyName("");
      setAmount("");
      setPaymentMode("RTGS / NEFT");
      setReferenceNo("");
      setCategory("Material & Spares");
      setCustomCategory("");
      setAttachments([]);
    }
    setIsCompressing(false);
    setErrorMsg(null);
  }, [editingPayment, isOpen, currentUser, projects, selectedSiteFilter]);

  // Ensure project state stays valid whenever projects list updates
  useEffect(() => {
    if (!editingPayment && projects.length > 0) {
      const isValid = projects.some(p => p.name === project);
      if (!isValid) {
        const siteFilterMatch = selectedSiteFilter && selectedSiteFilter !== "ALL"
          ? projects.find(p => p.name === selectedSiteFilter)?.name
          : null;
        const userAssignedMatch = currentUser.assignedProjects.find(name =>
          projects.some(p => p.name === name)
        );
        const best = siteFilterMatch || userAssignedMatch || projects[0]?.name || "";
        if (best) setProject(best);
      }
    }
  }, [projects, currentUser, editingPayment, project, selectedSiteFilter]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, 1280, 0.75);
      const newAtt: Attachment = {
        id: generateUniqueIdString("att_bank"),
        name: file.name,
        dataUrl: compressed.dataUrl,
        type: file.type || "image/jpeg",
        sizeBytes: compressed.sizeBytes,
        uploadedAt: todayStr(),
      };
      setAttachments([newAtt]);
    } catch (err) {
      console.error("Image processing error:", err);
      setErrorMsg("Failed to process attachment photo.");
    } finally {
      setIsCompressing(false);
    }
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
    if (category === "Other" && !customCategory.trim()) {
      setErrorMsg(
        lang === "gu"
          ? "કૃપા કરીને અન્ય કેટેગરીનું નામ લખો"
          : lang === "hi"
          ? "कृपया अन्य श्रेणी का नाम लिखें"
          : "Please specify the other category name"
      );
      return;
    }

    const finalCategory = category === "Other"
      ? (customCategory.trim() || "Other")
      : category;

    const isEditing = !!editingPayment;

    const originalCreator = isEditing && editingPayment
      ? users.find(u =>
          u.id === editingPayment.enteredById ||
          (editingPayment.enteredByUsername && u.username.toLowerCase() === editingPayment.enteredByUsername.toLowerCase()) ||
          (editingPayment.enteredBy && (
            u.name.toLowerCase() === editingPayment.enteredBy.toLowerCase() ||
            u.username.toLowerCase() === editingPayment.enteredBy.toLowerCase() ||
            u.name.toLowerCase().includes(editingPayment.enteredBy.toLowerCase())
          ))
        )
      : null;

    const preservedEnteredById = isEditing && editingPayment
      ? (editingPayment.enteredById ?? originalCreator?.id ?? currentUser.id)
      : currentUser.id;

    const preservedEnteredByUsername = isEditing && editingPayment
      ? (editingPayment.enteredByUsername ?? originalCreator?.username ?? currentUser.username)
      : currentUser.username;

    const preservedEnteredBy = isEditing && editingPayment
      ? (editingPayment.enteredBy || originalCreator?.name || currentUser.name)
      : currentUser.name;

    const payload = {
      ...(editingPayment ? { id: editingPayment.id } : {}),
      date,
      project,
      partyName: partyName.trim(),
      amount: numAmount,
      paymentMode,
      referenceNo: referenceNo.trim() || undefined,
      category: finalCategory,
      notes: editingPayment?.notes,
      enteredBy: preservedEnteredBy,
      enteredById: preservedEnteredById,
      enteredByUsername: preservedEnteredByUsername,
      ...(isEditing ? {
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
        updatedById: currentUser.id,
      } : {}),
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
              {project && !projects.some(p => p.name === project) && (
                <option value={project}>{project}</option>
              )}
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
            placeholder="e.g. Vrajesh Traders, Ashish Buildcon, Shree Vrajesh Steel"
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
              onChange={e => {
                const val = e.target.value;
                setCategory(val);
                if (val !== "Other") {
                  setCustomCategory("");
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {COMMON_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c === "Other" ? (lang === "gu" ? "Other (અન્ય)" : lang === "hi" ? "Other (अन्य)" : "Other") : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Other Category Writing Box */}
        {category === "Other" && (
          <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <FileText size={14} className="text-blue-600" />
                <span>
                  {lang === "gu"
                    ? "અન્ય કેટેગરીનું નામ લખો (Custom Category) *"
                    : lang === "hi"
                    ? "अन्य श्रेणी का नाम / विवरण लिखें *"
                    : "Specify Other Category *"}
                </span>
              </label>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                {lang === "gu" ? "લખવું જરૂરી" : lang === "hi" ? "आवश्यक" : "Required"}
              </span>
            </div>
            <input
              type="text"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              required
              autoFocus
              placeholder={
                lang === "gu"
                  ? "દા.ત. વીજળી બિલ, ઓફિસ ભાડું, સરકારી ફી..."
                  : lang === "hi"
                  ? "उदा. बिजली बिल, ऑफिस किराया, सरकारी फीस..."
                  : "e.g. Electricity Bill, Office Rent, Govt Fees..."
              }
              className="w-full rounded-lg border border-blue-300 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}

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
              placeholder="e.g. UTR-HDFC2026031891 or Cheque 004812"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Bank Receipt Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Bank Receipt / Slip Proof
          </label>
          {isCompressing ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs font-bold text-blue-800 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
              <span>{lang === "gu" ? "ફોટો ઓપ્ટિમાઇઝ થઈ રહ્યો છે..." : "Optimizing receipt photo..."}</span>
            </div>
          ) : attachments.length > 0 ? (
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
                    Proof attached [OK] {attachments[0].sizeBytes ? `(${(attachments[0].sizeBytes / 1024).toFixed(0)} KB)` : ""}
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
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition">
                <Upload size={16} className="text-slate-400" />
                <span>Attach Bank Receipt / UTR Slip</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                <Camera size={16} className="text-blue-600" />
                <span>Camera</span>
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
