import React, { useState, useEffect } from "react";
import {
  FileCheck, Upload, Camera, Trash2, Check, AlertCircle, Calculator, FileText
} from "lucide-react";
import { Attachment, GSTBill, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr, toInputDateFormat, fromInputDateFormat } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";
import { compressImageFile } from "../../utils/imageCompressor";
import { generateUniqueIdString } from "../../utils/idGenerator";

type GSTBillModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (billData: Omit<GSTBill, "id"> | GSTBill) => void;
  editingBill?: GSTBill | null;
  projects: Project[];
  currentUser: UserAccount;
  lang: Language;
  selectedSiteFilter?: string;
};

const COMMON_PRODUCTS = [
  "HDPE Pipe",
  "Steel / TMT Bars",
  "Cement",
  "DI Pipes & Fittings",
  "Stone Aggregate (Kapchi)",
  "Sand / Reti",
  "Binding Wire & Nails",
  "Hardware & Tools",
  "Other",
];

const GST_RATES = [18, 5, 12, 28];

export function GSTBillModal({
  isOpen,
  onClose,
  onSave,
  editingBill,
  projects,
  currentUser,
  lang,
  selectedSiteFilter,
}: GSTBillModalProps) {
  const t = getTranslation(lang);

  const [date, setDate] = useState<string>(todayStr());
  const [billNo, setBillNo] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [product, setProduct] = useState<string>("HDPE Pipe");
  const [customProduct, setCustomProduct] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [basicAmount, setBasicAmount] = useState<string>("");
  const [gstRate, setGstRate] = useState<number>(18);
  const [status, setStatus] = useState<"Paid" | "Pending" | "Partial">("Paid");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-calculated fields
  const numBasic = parseFloat(basicAmount) || 0;
  const calculatedGSTAmount = parseFloat(((numBasic * gstRate) / 100).toFixed(2));
  const calculatedTotalAmount = parseFloat((numBasic + calculatedGSTAmount).toFixed(2));

  useEffect(() => {
    if (editingBill) {
      setDate(editingBill.date);
      setBillNo(editingBill.billNo);
      setPartyName(editingBill.partyName);
      const existingProduct = editingBill.product || "HDPE Pipe";
      if (COMMON_PRODUCTS.includes(existingProduct) && existingProduct !== "Other") {
        setProduct(existingProduct);
        setCustomProduct("");
      } else {
        setProduct("Other");
        setCustomProduct(existingProduct === "Other" ? "" : existingProduct);
      }
      setProject(editingBill.project);
      setBasicAmount(String(editingBill.basicAmount));
      setGstRate(editingBill.gstRate || 18);
      setStatus(editingBill.status || "Paid");
      setPaymentReference(editingBill.paymentReference || "");
      setAttachments(editingBill.attachments || []);
    } else {
      setDate(todayStr());
      setBillNo("");
      setPartyName("");
      setProduct("HDPE Pipe");
      setCustomProduct("");
      // Set valid default project matching available projects list
      const siteFilterMatch = selectedSiteFilter && selectedSiteFilter !== "ALL"
        ? projects.find(p => p.name === selectedSiteFilter)?.name
        : null;
      const userAssignedMatch = currentUser.assignedProjects.find(name =>
        projects.some(p => p.name === name)
      );
      const defaultProj = siteFilterMatch || userAssignedMatch || projects[0]?.name || currentUser.assignedProjects[0] || "";
      setProject(defaultProj);
      setBasicAmount("");
      setGstRate(18);
      setStatus("Paid");
      setPaymentReference("");
      setAttachments([]);
    }
    setIsCompressing(false);
    setErrorMsg(null);
  }, [editingBill, isOpen, currentUser, projects, selectedSiteFilter]);

  // Ensure project state stays valid whenever projects list updates
  useEffect(() => {
    if (!editingBill && projects.length > 0) {
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
  }, [projects, currentUser, editingBill, project, selectedSiteFilter]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, 1280, 0.75);
      const newAtt: Attachment = {
        id: generateUniqueIdString("att_gst"),
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

    if (!billNo.trim()) {
      setErrorMsg("Please enter Bill / Invoice number");
      return;
    }
    if (!partyName.trim()) {
      setErrorMsg("Please enter party / supplier name");
      return;
    }
    if (!project) {
      setErrorMsg("Please select a project site");
      return;
    }
    if (isNaN(numBasic) || numBasic <= 0) {
      setErrorMsg("Please enter a valid basic amount greater than zero");
      return;
    }
    if (product === "Other" && !customProduct.trim()) {
      setErrorMsg(
        lang === "gu"
          ? "કૃપા કરીને અન્ય પ્રોડક્ટ / મટિરિયલનું નામ લખો"
          : lang === "hi"
          ? "कृपया अन्य उत्पाद / सामग्री का नाम लिखें"
          : "Please specify the other product / material name"
      );
      return;
    }

    const finalProduct = product === "Other"
      ? (customProduct.trim() || "Other")
      : product;

    const payload = {
      ...(editingBill ? { id: editingBill.id } : {}),
      billNo: billNo.trim(),
      date,
      partyName: partyName.trim(),
      product: finalProduct,
      project,
      basicAmount: numBasic,
      gstRate,
      gstAmount: calculatedGSTAmount,
      totalAmount: calculatedTotalAmount,
      status,
      paymentReference: paymentReference.trim() || undefined,
      notes: editingBill?.notes,
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
      title={editingBill ? `${t.edit}: ${editingBill.billNo}` : t.addGstBill}
      subtitle={
        lang === "gu"
          ? "જીએસટી ટેક્સ ઇન્વોઇસ બીલ, મૂળ રકમ અને જીએસટી ઓટો કેલ્ક્યુલેશન"
          : "Tax Invoice entry with automatic GST % and Total calculation"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bill No & Date */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.billNo} *
            </label>
            <input
              type="text"
              value={billNo}
              onChange={e => setBillNo(e.target.value)}
              required
              placeholder="e.g. 413 or 25-26/4128"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Date with Calendar Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{t.date} *</span>
              <span className="text-[11px] font-mono font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                📅 {date || todayStr()}
              </span>
            </label>
            <input
              type="date"
              value={toInputDateFormat(date)}
              onChange={e => setDate(fromInputDateFormat(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
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
            placeholder="e.g. Khodiyar Sales and Service, Shree Vrajesh Steel Traders"
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Product / Material & Project Site */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                {t.product} *
              </label>
              <button
                type="button"
                onClick={() => {
                  if (product === "Other") {
                    setProduct("HDPE Pipe");
                    setCustomProduct("");
                  } else {
                    setProduct("Other");
                  }
                }}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition ${
                  product === "Other"
                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                    : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                }`}
              >
                {product === "Other"
                  ? (lang === "gu" ? "✓ અન્ય (Other)" : "✓ Other")
                  : (lang === "gu" ? "✏️ અન્ય (Other)" : "✏️ Other")}
              </button>
            </div>
            <select
              value={product}
              onChange={e => {
                const val = e.target.value;
                setProduct(val);
                if (val !== "Other") {
                  setCustomProduct("");
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              {COMMON_PRODUCTS.map(p => (
                <option key={p} value={p}>
                  {p === "Other" ? (lang === "gu" ? "Other (અન્ય)" : lang === "hi" ? "Other (अन्य)" : "Other") : p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.project} *
            </label>
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
        </div>

        {/* Other Product / Material Writing Box */}
        {product === "Other" && (
          <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <FileText size={14} className="text-purple-600" />
                <span>
                  {lang === "gu"
                    ? "અન્ય પ્રોડક્ટ / મટિરિયલનું નામ લખો (Custom Product) *"
                    : lang === "hi"
                    ? "अन्य उत्पाद / सामग्री का नाम लिखें *"
                    : "Specify Other Product / Material *"}
                </span>
              </label>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                {lang === "gu" ? "લખવું જરૂરી" : lang === "hi" ? "आवश्यक" : "Required"}
              </span>
            </div>
            <input
              type="text"
              value={customProduct}
              onChange={e => setCustomProduct(e.target.value)}
              required
              autoFocus
              placeholder={
                lang === "gu"
                  ? "દા.ત. ઈંટો (Bricks), પેવર બ્લોક, સેફ્ટી નેટ, ઇલેક્ટ્રિક વાયરીંગ..."
                  : lang === "hi"
                  ? "उदा. ईंटें (Bricks), पेवर ब्लॉक, सेफ्टी नेट, इलेक्ट्रिकल वायरिंग..."
                  : "e.g. Red Bricks, Paver Blocks, Safety Nets, Electrical Wiring..."
              }
              className="w-full rounded-lg border border-purple-300 bg-white p-2.5 text-base sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <p className="mt-1 text-[11px] text-purple-800">
              {lang === "gu"
                ? "💡 આ નામ પ્રોડક્ટ લિસ્ટ અને GST રિપોર્ટમાં સેવ થશે."
                : lang === "hi"
                ? "💡 यह नाम उत्पाद सूची और GST रिपोर्ट में दिखेगा।"
                : "💡 This custom name will appear in product filters & GST reports."}
            </p>
          </div>
        )}

        {/* ── Auto GST Calculation Panel ─────────────────────────────────── */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900 border-b border-purple-200 pb-2">
            <Calculator size={16} className="text-purple-600" />
            <span>Tax &amp; Price Breakdown (Auto-Calculated)</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Basic Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.basicAmount} (Before Tax) *
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
                  value={basicAmount}
                  onChange={e => setBasicAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm font-bold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* GST Rate (%) Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.gstRate}
              </label>
              <div className="flex items-center gap-1.5">
                {GST_RATES.map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGstRate(rate)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      gstRate === rate
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculated Output Summary Cards */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl bg-white p-2.5 border border-purple-100">
              <p className="text-[10px] font-bold text-purple-700 uppercase">
                {t.gstAmount} ({gstRate}%)
              </p>
              <p className="text-sm font-black text-purple-700 mt-0.5">
                {formatINR(calculatedGSTAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-purple-700 p-2.5 text-white shadow-xs">
              <p className="text-[10px] font-bold text-purple-200 uppercase">
                {t.totalAmount} (Final)
              </p>
              <p className="text-sm font-black text-white mt-0.5">
                {formatINR(calculatedTotalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Payment Ref */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.status}
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="Paid">{t.paid} (ચૂકવેલ)</option>
              <option value="Pending">{t.pending} (બાકી)</option>
              <option value="Partial">{t.partial} (અંશતઃ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment / Ref ID
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={e => setPaymentReference(e.target.value)}
              placeholder="e.g. INV-413 or Cheque Ref"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Bill Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t.uploadBillPhoto}
          </label>
          {isCompressing ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs font-bold text-purple-800 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-purple-600/30 border-t-purple-600 animate-spin" />
              <span>{lang === "gu" ? "ફોટો ઓપ્ટિમાઇઝ થઈ રહ્યો છે..." : "Optimizing bill photo..."}</span>
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
                  <p className="text-[10px] text-purple-600 font-medium">
                    Invoice photo attached [OK] {attachments[0].sizeBytes ? `(${(attachments[0].sizeBytes / 1024).toFixed(0)} KB)` : ""}
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
              <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-600 hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer transition">
                <Upload size={16} className="text-slate-400" />
                <span>Attach GST Invoice Photo / PDF</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                <Camera size={16} className="text-purple-600" />
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
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition active:scale-95"
          >
            <Check size={16} />
            <span>{t.save}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
