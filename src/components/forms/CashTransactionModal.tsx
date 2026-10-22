import React, { useState, useEffect, useMemo } from "react";
import {
  X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Camera, Upload, Trash2,
  Check, AlertCircle, Building2, User, FileText, Calendar, ArrowRight, Wallet
} from "lucide-react";
import { Attachment, CashTransaction, CashTransactionType, Language, Project, Role, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, todayStr, toInputDateFormat, fromInputDateFormat } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";
import { compressImageFile } from "../../utils/imageCompressor";
import { generateUniqueIdString } from "../../utils/idGenerator";
import { getSiteTeamMembers, calculateSiteTeamBalances } from "../../utils/cashCalculations";

type CashTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<CashTransaction, "id"> | CashTransaction) => void;
  editingTransaction?: CashTransaction | null;
  defaultType?: CashTransactionType;
  projects: Project[];
  currentUser: UserAccount;
  users: UserAccount[];
  cashTransactions?: CashTransaction[];
  lang: Language;
  selectedSiteFilter?: string;
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
  "Site Internal Transfer",
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
  users = [],
  cashTransactions = [],
  lang,
  selectedSiteFilter,
}: CashTransactionModalProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  const [type, setType] = useState<CashTransactionType>(defaultType);
  const [date, setDate] = useState<string>(todayStr());
  const [project, setProject] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [category, setCategory] = useState<string>("Labour");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Cheque">("Cash");
  const [voucherNo, setVoucherNo] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Person-to-person tracking state
  const [paidByName, setPaidByName] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");

  // Get active site project object
  const activeProjectObj = useMemo(() => {
    return projects.find(p => p.name === project);
  }, [projects, project]);

  // Get site team members assigned to this selected site
  const siteTeamMembers = useMemo(() => {
    return getSiteTeamMembers(project, users, activeProjectObj);
  }, [project, users, activeProjectObj]);

  // Live balances of members on this site
  const siteBalances = useMemo(() => {
    return calculateSiteTeamBalances(project, cashTransactions, users, activeProjectObj);
  }, [project, cashTransactions, users, activeProjectObj]);

  const getMemberBalance = (name: string): number => {
    if (!name) return 0;
    const match = siteBalances.find(b =>
      b.name.toLowerCase() === name.toLowerCase() ||
      b.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(b.name.toLowerCase())
    );
    return match ? match.balance : 0;
  };

  const getMemberRoleLabel = (role?: Role): string => {
    switch (role) {
      case "admin":
        return lang === "gu" ? "ઓનર / હેડ ઓફિસ" : lang === "hi" ? "ओनर / मुख्य कार्यालय" : "Owner / Head Office";
      case "site_partner":
        return lang === "gu" ? "સાઇટ પાર્ટનર" : lang === "hi" ? "साइट पार्टनर" : "Site Partner";
      case "site_engineer":
        return lang === "gu" ? "સાઇટ એન્જિનિયર" : lang === "hi" ? "साइट इंजीनियर" : "Site Engineer";
      case "supervisor":
      default:
        return lang === "gu" ? "સાઇટ સુપરવાઇઝર" : lang === "hi" ? "साइट सुपरवाइजर" : "Site Supervisor";
    }
  };

  // Initialize or reset form when modal opens or editing changes
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setProject(editingTransaction.project);
      setDetails(editingTransaction.details);

      const existingCat = editingTransaction.category ||
        (editingTransaction.type === "cash_in"
          ? "Office Cash Top-up"
          : editingTransaction.type === "transfer"
          ? "Site Internal Transfer"
          : "Labour");

      if (COMMON_CATEGORIES.includes(existingCat) && existingCat !== "Other") {
        setCategory(existingCat);
        setCustomCategory("");
      } else {
        setCategory("Other");
        setCustomCategory(existingCat === "Other" ? "" : existingCat);
      }

      setAmount(editingTransaction.amount ? String(editingTransaction.amount) : "");
      setPaymentMode(editingTransaction.paymentMode || "Cash");
      setVoucherNo(editingTransaction.voucherNo || "");
      setAttachments(editingTransaction.attachments || []);

      setPaidByName(editingTransaction.paidByName || (editingTransaction.type === "cash_in" ? "Kanjibhai S. Godhani (Head Office)" : editingTransaction.supervisorName || ""));
      setRecipientName(editingTransaction.recipientName || (editingTransaction.type === "cash_in" ? editingTransaction.supervisorName || "" : ""));
    } else {
      setType(defaultType);
      setDate(todayStr());

      const siteFilterMatch = selectedSiteFilter && selectedSiteFilter !== "ALL"
        ? projects.find(p => p.name === selectedSiteFilter)?.name
        : null;
      const userAssignedMatch = currentUser.assignedProjects.find(name =>
        projects.some(p => p.name === name)
      );
      const defaultProj = siteFilterMatch || userAssignedMatch || projects[0]?.name || currentUser.assignedProjects[0] || "";
      setProject(defaultProj);
      setDetails("");

      setCategory(
        defaultType === "cash_in"
          ? "Office Cash Top-up"
          : defaultType === "transfer"
          ? "Site Internal Transfer"
          : "Labour"
      );
      setCustomCategory("");
      setAmount("");
      setPaymentMode("Cash");
      setVoucherNo("");
      setAttachments([]);

      // Intelligent default person assignments
      const siteMembers = getSiteTeamMembers(defaultProj, users);
      const nonAdmins = siteMembers.filter(m => m.role !== "admin");
      const defaultReceiver = nonAdmins[0]?.name || siteMembers[0]?.name || currentUser.name;
      const defaultGiver = siteMembers.find(m => m.role === "admin")?.name || currentUser.name;

      if (defaultType === "cash_in") {
        setPaidByName(defaultGiver);
        setRecipientName(defaultReceiver);
      } else if (defaultType === "transfer") {
        setPaidByName(currentUser.name || siteMembers[0]?.name || "");
        const otherMember = siteMembers.find(m => m.name !== currentUser.name);
        setRecipientName(otherMember ? otherMember.name : "");
      } else {
        // cash_out
        const matchingCurrent = siteMembers.find(m => m.name === currentUser.name);
        setPaidByName(matchingCurrent ? matchingCurrent.name : defaultReceiver);
        setRecipientName("");
      }
    }
    setIsCompressing(false);
    setErrorMsg(null);
  }, [editingTransaction, defaultType, isOpen, currentUser, projects, selectedSiteFilter, users]);

  // Adjust defaults when project changes
  useEffect(() => {
    if (!editingTransaction && project) {
      const siteMembers = getSiteTeamMembers(project, users, activeProjectObj);
      if (siteMembers.length > 0) {
        if (type === "cash_in") {
          if (!paidByName) {
            const adminUser = siteMembers.find(m => m.role === "admin");
            setPaidByName(adminUser ? adminUser.name : currentUser.name);
          }
          if (!recipientName || !siteMembers.some(m => m.name === recipientName)) {
            const nonAdmin = siteMembers.find(m => m.role !== "admin");
            setRecipientName(nonAdmin ? nonAdmin.name : (siteMembers[0]?.name || currentUser.name));
          }
        } else if (type === "cash_out") {
          if (!paidByName || !siteMembers.some(m => m.name === paidByName)) {
            const currentMatch = siteMembers.find(m => m.name === currentUser.name);
            setPaidByName(currentMatch ? currentMatch.name : (siteMembers[0]?.name || currentUser.name));
          }
        } else if (type === "transfer") {
          if (!paidByName || !siteMembers.some(m => m.name === paidByName)) {
            setPaidByName(siteMembers[0]?.name || currentUser.name);
          }
          if (!recipientName || recipientName === paidByName || !siteMembers.some(m => m.name === recipientName)) {
            const other = siteMembers.find(m => m.name !== (paidByName || siteMembers[0]?.name));
            setRecipientName(other ? other.name : "");
          }
        }
      }
    }
  }, [project, type, editingTransaction, users, activeProjectObj, currentUser]);

  if (!isOpen) return null;

  // Handle Photo / File Attachment with High-Speed Compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, 1280, 0.75);
      const newAtt: Attachment = {
        id: generateUniqueIdString("att_cash"),
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

  const handleRemoveAttachment = () => {
    setAttachments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!project) {
      setErrorMsg(lang === "gu" ? "કૃપા કરીને સાઇટ પસંદ કરો" : "Please select a project site");
      return;
    }
    if (!details.trim()) {
      setErrorMsg(lang === "gu" ? "કૃપા કરીને વિગત / હેતુ લખો" : "Please enter details / purpose of transaction");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(lang === "gu" ? "કૃપા કરીને યોગ્ય રકમ દાખલ કરો" : "Please enter a valid amount greater than zero");
      return;
    }

    if (type === "cash_in" && !recipientName) {
      setErrorMsg(lang === "gu" ? "કૃપા કરીને રકમ મેળવનાર વ્યક્તિ પસંદ કરો" : "Please select the person receiving cash");
      return;
    }

    if (type === "cash_out" && !paidByName) {
      setErrorMsg(lang === "gu" ? "કૃપા કરીને ખર્ચ કરનાર વ્યક્તિ પસંદ કરો" : "Please select the person who paid the expense");
      return;
    }

    if (type === "transfer") {
      if (!paidByName) {
        setErrorMsg(lang === "gu" ? "કૃપા કરીને રકમ આપનાર વ્યક્તિ પસંદ કરો" : "Please select the person transferring cash");
        return;
      }
      if (!recipientName) {
        setErrorMsg(lang === "gu" ? "કૃપા કરીને રકમ મેળવનાર વ્યક્તિ પસંદ કરો" : "Please select the recipient person");
        return;
      }
      if (paidByName === recipientName) {
        setErrorMsg(lang === "gu" ? "આપનાર અને મેળવનાર એક જ વ્યક્તિ ન હોઈ શકે!" : "Sender and recipient cannot be the same person!");
        return;
      }
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

    // Resolve user IDs and roles
    const giverObj = users.find(u => u.name === paidByName);
    const receiverObj = users.find(u => u.name === recipientName);

    const payload = {
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      date,
      type,
      project,
      details: details.trim(),
      category: finalCategory,
      amount: numAmount,
      paymentMode,
      voucherNo: voucherNo.trim() || undefined,
      notes: editingTransaction?.notes,

      // Member tracking
      recipientId: receiverObj?.id,
      recipientName: recipientName || undefined,
      recipientRole: receiverObj?.role,

      paidById: giverObj?.id,
      paidByName: paidByName || undefined,
      paidByRole: giverObj?.role,

      // Legacy fallback
      supervisorId: type === "cash_in" ? receiverObj?.id : giverObj?.id || currentUser.id,
      supervisorName: type === "cash_in" ? recipientName : paidByName || currentUser.name,

      enteredBy: currentUser.name,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    onSave(payload as any);
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const currentPaidByBalance = getMemberBalance(paidByName);
  const currentReceiverBalance = getMemberBalance(recipientName);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingTransaction
          ? `${t.edit}: ${editingTransaction.details}`
          : type === "cash_in"
          ? t.addCashIn
          : type === "transfer"
          ? (lang === "gu" ? "+ સાઇટ આંતરિક ટ્રાન્સફર (ફેરબદલી)" : "+ Site Internal Cash Transfer")
          : t.addCashOut
      }
      subtitle={
        type === "cash_in"
          ? (lang === "gu"
            ? "ઓફિસ અથવા ઓનર તરફથી સાઇટ સભ્યને મળેલ રોકડ જમા"
            : "Cash received from head office/owner to a site member's wallet")
          : type === "transfer"
          ? (lang === "gu"
            ? "સાઇટ પાર્ટનર, એન્જિનિયર કે સુપરવાઇઝર વચ્ચે અંદરોઅંદર રોકડ ફેરબદલી"
            : "Internal cash handover between partner, engineer, or supervisor on site")
          : (lang === "gu"
            ? "સાઇટ પર થયેલ દૈનિક ખર્ચ જે સભ્યના બેલેન્સમાંથી બાદ થશે"
            : "Daily site expense deducted from the member's cash-in-hand balance")
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Transaction Type Selector: Cash In vs Cash Out vs Internal Transfer ── */}
        {!editingTransaction && (
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
            {/* 1. Cash In */}
            <button
              type="button"
              onClick={() => {
                setType("cash_in");
                setCategory("Office Cash Top-up");
                setCustomCategory("");
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all ${
                type === "cash_in"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowDownLeft size={15} className="shrink-0" />
              <span className="truncate">{t.cashIn}</span>
            </button>

            {/* 2. Cash Out */}
            <button
              type="button"
              onClick={() => {
                setType("cash_out");
                setCategory("Labour");
                setCustomCategory("");
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all ${
                type === "cash_out"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowUpRight size={15} className="shrink-0" />
              <span className="truncate">{t.cashOut}</span>
            </button>

            {/* 3. Internal Transfer */}
            <button
              type="button"
              onClick={() => {
                setType("transfer");
                setCategory("Site Internal Transfer");
                setCustomCategory("");
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all ${
                type === "transfer"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowLeftRight size={14} className="shrink-0" />
              <span className="truncate">{lang === "gu" ? "આંતરિક ટ્રાન્સફર" : "Transfer"}</span>
            </button>
          </div>
        )}

        {/* ── Site & Date Row ── */}
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
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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

          {/* Date Picker */}
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

        {/* ── Dynamic Member Selection & Live Cash Ledger Preview ── */}
        {/* CASE 1: Cash In (ઓફિસ/ઓનર થી સાઇટ પર રકમ જમા) */}
        {type === "cash_in" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Wallet size={15} className="text-emerald-600" />
                {lang === "gu" ? "પૈસા કોને આપ્યા / કોના ખાતામાં જમા થયા? *" : "Cash Given To (Received By Site Member) *"}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                {siteTeamMembers.length} {lang === "gu" ? "સાઇટ સભ્યો" : "Site Members"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Given By */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {lang === "gu" ? "આપનાર (સ્ત્રોત / From):" : "Given By (Source):"}
                </label>
                <input
                  type="text"
                  value={paidByName}
                  onChange={e => setPaidByName(e.target.value)}
                  placeholder="e.g. Kanjibhai S. Godhani (Head Office)"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Received By (ONLY SITE MEMBERS) */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                  {lang === "gu" ? "મેળવનાર (સાઇટ ટીમ સભ્ય) *:" : "Received By (Site Member) *:"}
                </label>
                <select
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-emerald-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- {lang === "gu" ? "સભ્ય પસંદ કરો" : "Select Site Member"} --</option>
                  {siteTeamMembers.map(m => {
                    const bal = getMemberBalance(m.name);
                    return (
                      <option key={m.id} value={m.name}>
                        {m.name} ({getMemberRoleLabel(m.role)}) • હાલ સિલક: ₹{bal.toLocaleString("en-IN")}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Live Recipient Balance Card */}
            {recipientName && (
              <div className="rounded-xl bg-white border border-emerald-200 p-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                    👤
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{recipientName}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5">
                      (હાલ હાથ પર સિલક: <strong className="text-slate-800">{formatINR(currentReceiverBalance)}</strong>)
                    </span>
                  </div>
                </div>
                {parsedAmount > 0 && (
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    જમા પછી નવી સિલક: {formatINR(currentReceiverBalance + parsedAmount)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CASE 2: Cash Out (સાઇટ ખર્ચ - જે સભ્યના પૈસા વપરાયા તેમાંથી બાદ) */}
        {type === "cash_out" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                <User size={15} className="text-rose-600" />
                {lang === "gu" ? "આ ખર્ચ કોના હાથમાંથી / કોણે ચૂકવ્યો? *" : "Expense Paid By (Deducted from) *"}
              </span>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                {lang === "gu" ? "આ સભ્યની સિલકમાંથી બાદ થશે" : "Deducted from wallet"}
              </span>
            </div>

            <div>
              <select
                value={paidByName}
                onChange={e => setPaidByName(e.target.value)}
                required
                className="w-full rounded-xl border border-rose-300 bg-white p-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="">-- {lang === "gu" ? "સાઇટ સભ્ય પસંદ કરો (ખર્ચ કરનાર)" : "Select Site Member"} --</option>
                {siteTeamMembers.map(m => {
                  const bal = getMemberBalance(m.name);
                  return (
                    <option key={m.id} value={m.name}>
                      {m.name} ({getMemberRoleLabel(m.role)}) • હાથ પર સિલક: ₹{bal.toLocaleString("en-IN")}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Live Deduction Preview Card */}
            {paidByName && (
              <div className="rounded-xl bg-white border border-rose-200 p-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-xs shrink-0">
                    💳
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{paidByName}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5">
                      હાલ સિલક: <strong className={currentPaidByBalance >= 0 ? "text-slate-800" : "text-rose-600"}>{formatINR(currentPaidByBalance)}</strong>
                    </span>
                  </div>
                </div>

                {parsedAmount > 0 && (
                  <div
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      currentPaidByBalance - parsedAmount >= 0
                        ? "bg-slate-50 text-slate-800 border-slate-200"
                        : "bg-rose-100 text-rose-700 border-rose-300"
                    }`}
                  >
                    ખર્ચ બાદ બાકી સિલક: {formatINR(currentPaidByBalance - parsedAmount)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CASE 3: Internal Transfer (સાઇટ પર અંદરોઅંદર રોકડ ફેરબદલી) */}
        {type === "transfer" && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <ArrowLeftRight size={15} className="text-indigo-600" />
                {lang === "gu" ? "સાઇટ આંતરિક રોકડ ફેરબદલી (કોણે કોને પૈસા આપ્યા?)" : "Internal Cash Handover"}
              </span>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                {lang === "gu" ? "સાઇટ ખર્ચ બદલાશે નહીં" : "Internal Site Only"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* From Person */}
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                  {lang === "gu" ? "કોણે પૈસા આપ્યા (આપનાર - From) *:" : "From (Sender) *:"}
                </label>
                <select
                  value={paidByName}
                  onChange={e => setPaidByName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-indigo-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- {lang === "gu" ? "આપનાર પસંદ કરો" : "Select Sender"} --</option>
                  {siteTeamMembers.map(m => {
                    const bal = getMemberBalance(m.name);
                    return (
                      <option key={m.id} value={m.name}>
                        {m.name} ({getMemberRoleLabel(m.role)}) • સિલક: ₹{bal.toLocaleString("en-IN")}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* To Person */}
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                  {lang === "gu" ? "કોને આપ્યા (મેળવનાર - To) *:" : "To (Recipient) *:"}
                </label>
                <select
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-indigo-300 bg-white p-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- {lang === "gu" ? "મેળવનાર પસંદ કરો" : "Select Recipient"} --</option>
                  {siteTeamMembers
                    .filter(m => m.name !== paidByName)
                    .map(m => {
                      const bal = getMemberBalance(m.name);
                      return (
                        <option key={m.id} value={m.name}>
                          {m.name} ({getMemberRoleLabel(m.role)}) • સિલક: ₹{bal.toLocaleString("en-IN")}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {/* Live Transfer Calculation Card */}
            {paidByName && recipientName && (
              <div className="rounded-xl bg-white border border-indigo-200 p-2.5 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span>
                    🔴 આપનાર <strong>{paidByName}</strong>: {formatINR(currentPaidByBalance)}
                    {parsedAmount > 0 && ` ➔ ${formatINR(currentPaidByBalance - parsedAmount)}`}
                  </span>
                  <span className="font-bold text-rose-600">-{formatINR(parsedAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>
                    🟢 મેળવનાર <strong>{recipientName}</strong>: {formatINR(currentReceiverBalance)}
                    {parsedAmount > 0 && ` ➔ ${formatINR(currentReceiverBalance + parsedAmount)}`}
                  </span>
                  <span className="font-bold text-emerald-600">+{formatINR(parsedAmount)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Details Input ── */}
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
                ? (lang === "gu"
                  ? `દા.ત. ઓનર તરફથી ${recipientName || "સાઇટ સભ્ય"}ને મળેલ રોકડ એડવાન્સ`
                  : "e.g. Cash advance from Owner to site member")
                : type === "transfer"
                ? (lang === "gu"
                  ? `દા.ત. ${paidByName || "પાર્ટનર"} તરફથી ${recipientName || "સુપરવાઇઝર"}ને રોકડ સોંપી`
                  : "e.g. Cash handover between partner/engineer and supervisor")
                : (lang === "gu"
                  ? "દા.ત. JCB ભાડું, મજૂર ખર્ચી, ડીઝલ, રેતી-કપચી, પૂજા"
                  : "e.g. JCB Bhut Pagla, MP Labour Kharchi, Diesel")
            }
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* ── Amount & Category ── */}
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                {t.category} *
              </label>
              <button
                type="button"
                onClick={() => {
                  if (category === "Other") {
                    setCategory(type === "cash_in" ? "Office Cash Top-up" : type === "transfer" ? "Site Internal Transfer" : "Labour");
                    setCustomCategory("");
                  } else {
                    setCategory("Other");
                  }
                }}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition ${
                  category === "Other"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
              >
                {category === "Other"
                  ? (lang === "gu" ? "✓ અન્ય (Other)" : "✓ Other")
                  : (lang === "gu" ? "✏️ અન્ય (Other)" : "✏️ Other")}
              </button>
            </div>
            <select
              value={category}
              onChange={e => {
                const val = e.target.value;
                setCategory(val);
                if (val !== "Other") {
                  setCustomCategory("");
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
            >
              {COMMON_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c === "Other"
                    ? (lang === "gu" ? "Other (અન્ય)" : lang === "hi" ? "Other (अन्य)" : "Other")
                    : c === "Site Internal Transfer"
                    ? (lang === "gu" ? "આંતરિક રોકડ ફેરબદલી (Site Transfer)" : c)
                    : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Other Category Writing Box */}
        {category === "Other" && (
          <div className="rounded-xl bg-amber-50/70 border border-amber-300/80 p-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <FileText size={14} className="text-amber-600" />
                <span>
                  {lang === "gu"
                    ? "અન્ય કેટેગરીનું નામ લખો (Custom Category) *"
                    : lang === "hi"
                    ? "अन्य श्रेणी का नाम / विवरण लिखें *"
                    : "Specify Other Category *"}
                </span>
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
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
                  ? "દા.ત. વાહન ભાડું, સ્ટેશનરી, પાઈપ રિપેરિંગ, મશીન પાર્ટ્સ..."
                  : "e.g. Vehicle Rent, Stationery, Machine Spares..."
              }
              className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        )}

        {/* ── Payment Mode & Voucher No ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.paymentMode}
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
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
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
            />
          </div>
        </div>

        {/* ── Bill / Receipt Photo Attachment ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t.uploadBillPhoto}
          </label>
          {isCompressing ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs font-bold text-amber-800 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-amber-600/30 border-t-amber-600 animate-spin" />
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
                  <p className="text-[10px] text-emerald-600 font-medium">
                    Photo attached [OK] {attachments[0].sizeBytes ? `(${(attachments[0].sizeBytes / 1024).toFixed(0)} KB)` : ""}
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

        {/* ── Submit & Cancel Buttons ── */}
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
                : type === "transfer"
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
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
