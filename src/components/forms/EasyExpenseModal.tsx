import React, { useState, useEffect } from "react";
import { ModalWrapper } from "../common/ModalWrapper";
import { Attachment, Expense, ExpenseCategory, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { todayStr } from "../../utils/formatters";
import {
  Camera, Upload, Calculator, Paperclip, X, Image as ImageIcon, MapPin, IndianRupee, Tag, Check, CalendarDays
} from "lucide-react";

type EasyExpenseModalProps = {
  projects: Project[];
  defaultProject?: string;
  currentUser: UserAccount;
  lang: Language;
  onSave: (expense: Omit<Expense, "id">) => void;
  onClose: () => void;
};

// Preset cascaded sub-categories and typical units
const CATEGORY_DATA: Record<ExpenseCategory, { subCategories: string[]; defaultUnit: string; commonRates?: number[] }> = {
  Material: {
    subCategories: [
      "Cement (OPC 53 Grade)",
      "Cement (PPC Grade)",
      "River Sand (Bhadar Reti)",
      "Crushed Sand (M-Sand)",
      "TMT Steel Bars (12mm / 16mm)",
      "TMT Steel Bars (8mm / 10mm)",
      "Binding Wire (Taar)",
      "Coarse Aggregate (20mm Kapchi)",
      "Coarse Aggregate (10mm Kapchi)",
      "Red Bricks (Laal Ita)",
      "Fly Ash / Solid Blocks",
      "PVC / Drainage Pipes",
      "Ready Mix Concrete (RMC)",
      "Tiles & Granite Stone",
      "Waterproofing Chemical"
    ],
    defaultUnit: "Bags"
  },
  Labour: {
    subCategories: [
      "Mason (Kadiyo / Karigar)",
      "Helper (Majdoor)",
      "Carpenter (Shuttering Mistri)",
      "Barbender (Steel Fitter)",
      "Welder & Fabricator",
      "Electrician",
      "Plumber",
      "Weekly Labour Gang Payment",
      "Overtime Wage"
    ],
    defaultUnit: "Days"
  },
  Machinery: {
    subCategories: [
      "Excavator (JCB 3DX)",
      "Poclain Excavator (Heavy)",
      "Concrete Mixer (1-Bag / 2-Bag)",
      "Tractor & Hydraulic Trolley",
      "Vibrator & Plate Compactor",
      "Road Roller / Soil Compactor",
      "Hydraulic Crane / Hydra",
      "High Pressure Dewatering Pump",
      "Diesel Generator (Silent DG Set)"
    ],
    defaultUnit: "Hours"
  },
  Fuel: {
    subCategories: [
      "Diesel for JCB / Excavator",
      "Diesel for Generator (DG)",
      "Diesel for Tractor / Dumper",
      "Petrol / 2T Oil",
      "Hydraulic Oil / Grease"
    ],
    defaultUnit: "Litres"
  },
  Transport: {
    subCategories: [
      "Material Freight / Transport",
      "Dumping & Disposal Cartage",
      "Tractor Trolley Trip",
      "Loading & Unloading Hamali",
      "Site Vehicle Fuel/Allowance"
    ],
    defaultUnit: "Trips"
  },
  Subcontractor: {
    subCategories: [
      "RCC Shuttering Work Contractor",
      "Plaster & Masonry Subcontractor",
      "Tiles & Flooring Subcontractor",
      "Fabrication & Gate Contractor",
      "Painting & Whitewashing Work",
      "Waterproofing Contractor"
    ],
    defaultUnit: "Sq.Ft"
  },
  "Govt Royalty & Fees": {
    subCategories: [
      "Mines & Minerals Royalty Pass",
      "Government Testing Lab Charges",
      "Third Party Quality Inspection",
      "Site Survey & Leveling Fee",
      "Tender Challan & Document Fees"
    ],
    defaultUnit: "Nos"
  },
  "Food & Refreshment": {
    subCategories: [
      "Site Labour Tea & Snacks",
      "Staff Lunch / Dinner on Night Shift",
      "Drinking Water Tanker / Jars"
    ],
    defaultUnit: "Nos"
  },
  "Site Maintenance": {
    subCategories: [
      "Safety Helmets & Jackets (PPE)",
      "Curing Pipe & Fittings",
      "Site Temporary Shed & Lights",
      "Tools, Spades & Buckets"
    ],
    defaultUnit: "Nos"
  },
  Other: {
    subCategories: [
      "Miscellaneous Cash Expense",
      "Stationery & Printouts",
      "Courier & Site Communication",
      "Emergency Site Cash Expense"
    ],
    defaultUnit: "Nos"
  }
};

const COMMON_UNITS = ["Bags", "Kg", "Tons", "Brass", "Cu.Ft", "Cu.M", "Litres", "Hours", "Days", "Trips", "Sq.Ft", "Meters", "Nos"];

export function EasyExpenseModal({
  projects,
  defaultProject,
  currentUser,
  lang,
  onSave,
  onClose,
}: EasyExpenseModalProps) {
  const t = getTranslation(lang);

  // Form State
  const [selectedSite, setSelectedSite] = useState<string>(
    defaultProject && defaultProject !== "ALL"
      ? defaultProject
      : projects[0]?.name || ""
  );
  const [category, setCategory] = useState<ExpenseCategory>("Material");
  const [subCategory, setSubCategory] = useState<string>(CATEGORY_DATA.Material.subCategories[0]);
  const [customDescription, setCustomDescription] = useState<string>("");
  const [vendor, setVendor] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>(CATEGORY_DATA.Material.defaultUnit);
  const [unitRate, setUnitRate] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [isManualAmount, setIsManualAmount] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<Expense["paymentMode"]>("Cash");
  const [billNumber, setBillNumber] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(todayStr());

  // Attachments State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // When category changes, update sub-categories and unit
  useEffect(() => {
    const data = CATEGORY_DATA[category];
    if (data) {
      setSubCategory(data.subCategories[0] || "");
      setUnit(data.defaultUnit);
    }
  }, [category]);

  // Auto-calculate Total Amount = Quantity * Unit Rate (unless user manually overrides)
  useEffect(() => {
    if (!isManualAmount) {
      const q = parseFloat(quantity);
      const r = parseFloat(unitRate);
      if (!isNaN(q) && !isNaN(r) && q > 0 && r > 0) {
        setTotalAmount(String(Math.round(q * r)));
      }
    }
  }, [quantity, unitRate, isManualAmount]);

  // Handle Photo Capture / File Upload (Requirement #5)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const newAtt: Attachment = {
            id: "att_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            name: file.name,
            dataUrl: String(reader.result),
            type: file.type || "image/jpeg",
            sizeBytes: file.size,
            uploadedAt: todayStr(),
          };
          setAttachments(prev => [...prev, newAtt]);
          setPhotoPreview(String(reader.result));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    if (attachments.length <= 1) setPhotoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      alert(t.selectSiteFirst);
      return;
    }

    const amt = parseFloat(totalAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    const desc = customDescription.trim() || subCategory;

    onSave({
      date: expenseDate,
      project: selectedSite,
      category,
      subCategory,
      description: desc,
      vendor: vendor.trim() || "Local Supplier / Site Cash",
      quantity: parseFloat(quantity) || 1,
      unit,
      unitRate: parseFloat(unitRate) || amt,
      amount: amt,
      paymentMode,
      billNumber: billNumber.trim() || undefined,
      status: "Paid",
      enteredBy: currentUser.name,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.addExpense}</h2>
          <p className="text-xs text-slate-500">{t.supervisorNotice}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
          Fast Data Entry
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Strict Site & Calendar Date Selection */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin size={14} className="text-amber-600" /> {t.siteRequired} *
            </label>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-800 focus:bg-white transition"
            >
              {projects.map(p => (
                <option key={p.id} value={p.name}>
                  🏗️ {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <CalendarDays size={14} className="text-amber-600" />
              <span>{lang === "gu" ? "તારીખ (Calendar)" : lang === "hi" ? "तारीख (Calendar)" : "Expense Date"} *</span>
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              className="w-full rounded-xl border-2 border-amber-400 bg-amber-50/40 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition cursor-pointer shadow-xs"
            />
          </div>
        </div>

        {/* Quick Date Shortcuts for missed / backdated entries */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
            <CalendarDays size={13} className="text-amber-600" />
            <span>{lang === "gu" ? "ઝડપી તારીખ:" : lang === "hi" ? "त्वरित तारीख:" : "Quick Date:"}</span>
          </span>
          <button
            type="button"
            onClick={() => setExpenseDate(todayStr())}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              expenseDate === todayStr()
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            {lang === "gu" ? "આજે (Today)" : lang === "hi" ? "आज (Today)" : "Today"}
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setExpenseDate(d.toISOString().split("T")[0]);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              (() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return expenseDate === d.toISOString().split("T")[0];
              })()
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            {lang === "gu" ? "ગઈકાલે (Yesterday)" : lang === "hi" ? "कल (Yesterday)" : "Yesterday"}
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 2);
              setExpenseDate(d.toISOString().split("T")[0]);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              (() => {
                const d = new Date();
                d.setDate(d.getDate() - 2);
                return expenseDate === d.toISOString().split("T")[0];
              })()
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            {lang === "gu" ? "૨ દિવસ પહેલાં" : lang === "hi" ? "२ दिन पहले" : "2 Days Ago"}
          </button>
        </div>

        {/* 2. Cascaded Expense Category & Sub-Category (Requirement #4) */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseType} *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-slate-800 transition"
            >
              <option value="Material">{t.catMaterial}</option>
              <option value="Labour">{t.catLabour}</option>
              <option value="Machinery">{t.catMachinery}</option>
              <option value="Fuel">{t.catFuel}</option>
              <option value="Transport">{t.catTransport}</option>
              <option value="Subcontractor">{t.catSubcontractor}</option>
              <option value="Govt Royalty & Fees">{t.catGovtFees}</option>
              <option value="Food & Refreshment">{t.catFood}</option>
              <option value="Site Maintenance">{t.catSiteMaintenance}</option>
              <option value="Other">{t.catOther}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.subCategory} *</label>
            <select
              value={subCategory}
              onChange={e => setSubCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-slate-800 transition"
            >
              {CATEGORY_DATA[category]?.subCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Description & Vendor */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <input
              type="text"
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              placeholder={`e.g. 100 bags for wall concrete...`}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.vendorName} *</label>
            <input
              type="text"
              required
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              placeholder="e.g. ABC Agency / Site Labour Team"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
            />
          </div>
        </div>

        {/* 4. Easy Quantity, Unit, Rate & Auto-Calculation (Requirement #4) */}
        <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-3">
            <Calculator size={15} className="text-amber-700" />
            <span>Fast Rate &amp; Amount Calculator</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.quantity}</label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={e => {
                  setQuantity(e.target.value);
                  setIsManualAmount(false);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.unit}</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:border-amber-600"
              >
                {COMMON_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.ratePerUnit}</label>
              <input
                type="number"
                step="any"
                min="0"
                value={unitRate}
                placeholder="Rate (Rs)"
                onChange={e => {
                  setUnitRate(e.target.value);
                  setIsManualAmount(false);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                {t.amountINR} *
              </label>
              <input
                type="number"
                required
                min="1"
                value={totalAmount}
                onChange={e => {
                  setTotalAmount(e.target.value);
                  setIsManualAmount(true);
                }}
                placeholder="Total Rs"
                className="w-full rounded-xl border-2 border-amber-500 bg-white px-3 py-2 text-sm font-black text-amber-900 outline-none shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* 5. Payment Mode & Voucher No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.paymentMode}</label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-slate-800"
            >
              <option value="Cash">💵 Cash</option>
              <option value="UPI">📱 UPI / GPay</option>
              <option value="Bank Transfer / RTGS">🏦 Bank / RTGS</option>
              <option value="Cheque">📜 Cheque</option>
              <option value="Credit / Udhar">⏳ Credit / Udhar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.billReceiptNo}</label>
            <input
              type="text"
              value={billNumber}
              onChange={e => setBillNumber(e.target.value)}
              placeholder="e.g. INV-1049 / Site Voucher No"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-slate-800"
            />
          </div>
        </div>

        {/* 6. Document & Bill Capture / Upload (Requirement #5) */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera size={15} className="text-blue-600" />
              {t.attachPhoto}
            </span>
            <span className="text-[10px] text-slate-500">Physical receipt / Challan / Voucher</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Camera Capture Input for Mobile/Tablet */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 text-xs font-bold transition">
              <Camera size={15} />
              <span>{t.takePhoto}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* General File Upload Input */}
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

            {/* Thumbnail Previews */}
            {attachments.map(att => (
              <div
                key={att.id}
                className="relative flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 p-1 pr-2.5 shadow-xs"
              >
                {att.dataUrl.startsWith("data:image") ? (
                  <img src={att.dataUrl} alt="Receipt preview" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <Paperclip size={14} />
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-700 max-w-[100px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md"
          >
            <Check size={16} />
            {t.save}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
