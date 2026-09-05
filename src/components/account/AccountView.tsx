import React, { useState, useRef } from "react";
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building2,
  MapPin,
  ShieldCheck,
  Pencil,
  Download,
  Upload,
  Database,
  Server,
  HardDrive,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Layers,
} from "lucide-react";
import { BankPayment, CashTransaction, GSTBill, Language, Project, Role, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, getShortRoleLabel } from "../../utils/formatters";
import {
  exportFullSystemBackupJSON,
  parseSystemBackupJSON,
  exportConsolidatedSiteExcel,
} from "../../utils/exportUtils";

type AccountViewProps = {
  currentUser: UserAccount;
  projects: Project[];
  users: UserAccount[];
  cashTransactions?: CashTransaction[];
  bankPayments?: BankPayment[];
  gstBills?: GSTBill[];
  lang: Language;
  onSaveNewPassword: (newPassword: string) => void;
  onUpdateProfile?: (updatedData: { name: string; username: string; phone?: string }) => void;
  onRestoreBackup?: (backupData: any) => void;
  isCloudConnected: boolean;
  onOpenCloudModal?: () => void;
};

export const AccountView = React.memo(function AccountView({
  currentUser,
  projects,
  users,
  cashTransactions = [],
  bankPayments = [],
  gstBills = [],
  lang,
  onSaveNewPassword,
  onUpdateProfile,
  onRestoreBackup,
  isCloudConnected,
  onOpenCloudModal,
}: AccountViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editPhone, setEditPhone] = useState(currentUser.phone || "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Backup & Restore States
  const [restoreConfirmData, setRestoreConfirmData] = useState<any | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sync state if currentUser changes from outside
  React.useEffect(() => {
    setEditName(currentUser.name);
    setEditUsername(currentUser.username);
    setEditPhone(currentUser.phone || "");
  }, [currentUser]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const trimmedName = editName.trim();
    const trimmedUsername = editUsername.trim().toLowerCase();
    const trimmedPhone = editPhone.trim();

    if (!trimmedName) {
      setProfileError(
        lang === "gu" ? "કૃપા કરીને તમારું પૂરું નામ દાખલ કરો!" : "Full Name is required!"
      );
      return;
    }

    if (!trimmedUsername) {
      setProfileError(
        lang === "gu" ? "કૃપા કરીને યુઝરનેમ દાખલ કરો!" : "Username is required!"
      );
      return;
    }

    if (trimmedUsername.length < 3) {
      setProfileError(
        lang === "gu"
          ? "યુઝરનેમ ઓછામાં ઓછું 3 અક્ષરનું હોવું જોઈએ!"
          : "Username must be at least 3 characters!"
      );
      return;
    }

    // Check if username is already taken by another user
    const isDuplicate = users.some(
      u => u.id !== currentUser.id && u.username.toLowerCase() === trimmedUsername
    );
    if (isDuplicate) {
      setProfileError(
        lang === "gu"
          ? `આ યુઝરનેમ '@${trimmedUsername}' પહેલેથી ઉપયોગમાં છે! કૃપા કરીને બીજું યુઝરનેમ લખો.`
          : `Username '@${trimmedUsername}' is already taken! Please choose another.`
      );
      return;
    }

    // Validate phone number if provided (10 digits)
    if (trimmedPhone && !/^[0-9]{10}$/.test(trimmedPhone)) {
      setProfileError(
        lang === "gu"
          ? "કૃપા કરીને 10 અંકનો માન્ય મોબાઇલ નંબર દાખલ કરો!"
          : "Please enter a valid 10-digit mobile number!"
      );
      return;
    }

    setIsSavingProfile(true);
    setTimeout(() => {
      if (onUpdateProfile) {
        onUpdateProfile({
          name: trimmedName,
          username: trimmedUsername,
          phone: trimmedPhone,
        });
      }
      setIsSavingProfile(false);
      setProfileSuccess(
        lang === "gu"
          ? "પ્રોફાઇલ માહિતી સફળતાપૂર્વક અપડેટ થઈ ગઈ છે!"
          : "Profile details updated successfully!"
      );
      setTimeout(() => setProfileSuccess(null), 3500);
      setIsEditingProfile(false);
    }, 250);
  };

  // Password Change Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate current password
    if (currentPassword !== currentUser.password) {
      setErrorMsg(
        lang === "gu"
          ? "તમારો હાલનો પાસવર્ડ ખોટો છે!"
          : lang === "hi"
          ? "आपका वर्तमान पासवर्ड गलत है!"
          : "Current password is incorrect!"
      );
      return;
    }

    // Validate new password length
    if (newPassword.trim().length < 4) {
      setErrorMsg(
        lang === "gu"
          ? "નવો પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરનો હોવો જોઈએ!"
          : lang === "hi"
          ? "नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए!"
          : "New password must be at least 4 characters!"
      );
      return;
    }

    // Validate match
    if (newPassword !== confirmPassword) {
      setErrorMsg(
        lang === "gu"
          ? "નવો પાસવર્ડ અને કન્ફર્મ પાસવર્ડ સરખા નથી!"
          : lang === "hi"
          ? "नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते!"
          : "New password and confirm password do not match!"
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSaveNewPassword(newPassword.trim());
      setIsSubmitting(false);
      setSuccessMsg(
        lang === "gu"
          ? "પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો છે!"
          : lang === "hi"
          ? "पासवर्ड सफलतापूर्वक अपडेट हो गया है!"
          : "Password updated successfully!"
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 300);
  };

  // ── Backup Download & Restore Handlers ─────────────────────────────────────
  const handleDownloadFullBackup = () => {
    try {
      exportFullSystemBackupJSON({
        projects,
        cashTransactions,
        bankPayments,
        gstBills,
        users,
      });
      setBackupMsg({
        text: lang === "gu" ? "સંપૂર્ણ બેકઅપ ફાઈલ ડાઉનલોડ થઈ ગઈ છે!" : "Full backup file downloaded successfully!",
        type: "success",
      });
      setTimeout(() => setBackupMsg(null), 4000);
    } catch (err: any) {
      setBackupMsg({ text: `Backup error: ${err.message || err}`, type: "error" });
    }
  };

  const handleDownloadExcelBackup = () => {
    try {
      exportConsolidatedSiteExcel(projects, cashTransactions, bankPayments, gstBills);
      setBackupMsg({
        text: lang === "gu" ? "સાઇટ હિસાબ એક્સેલ શીટ ડાઉનલોડ થઈ ગઈ છે!" : "Consolidated Excel report downloaded!",
        type: "success",
      });
      setTimeout(() => setBackupMsg(null), 4000);
    } catch (err: any) {
      setBackupMsg({ text: `Excel export error: ${err.message || err}`, type: "error" });
    }
  };

  const handleFileRestoreSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseSystemBackupJSON(reader.result as string);
      if (parsed) {
        setRestoreConfirmData(parsed);
      } else {
        setBackupMsg({
          text: lang === "gu" ? "અમાન્ય બેકઅપ ફાઇલ. કૃપા કરીને સાચી .json બેકઅપ ફાઇલ પસંદ કરો." : "Invalid backup file format. Please upload a valid JSON backup.",
          type: "error",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmRestore = () => {
    if (!restoreConfirmData || !onRestoreBackup) return;
    onRestoreBackup(restoreConfirmData);
    setRestoreConfirmData(null);
    setBackupMsg({
      text: lang === "gu" ? "ડેટાબેઝ સફળતાપૂર્વક પુનઃસ્થાપિત (Restore) થઈ ગયો છે!" : "Database restored and synced successfully!",
      type: "success",
    });
    setTimeout(() => setBackupMsg(null), 4000);
  };

  const getRoleInfo = (role: Role) => {
    switch (role) {
      case "admin":
        return {
          title: lang === "gu" ? "ઓનર / મુખ્ય સંચાલક (Head Office)" : lang === "hi" ? "मालिक / मुख्य प्रशासक" : "Owner / Head Office Admin",
          badge: "bg-amber-500 text-slate-950 font-black",
          description:
            lang === "gu"
              ? "તમામ સાઇટ્સ, બેંક પેમેન્ટ, યુઝર્સ, ટેક્સ ઇન્વોઇસ અને સિસ્ટમ સેટિંગ્સનું સંપૂર્ણ નિયંત્રણ."
              : "Full access across all projects, bank transfers, GST tax bills, and user accounts.",
        };
      case "site_partner":
        return {
          title: lang === "gu" ? "સાઇટ પાર્ટનર (Site Partner)" : "Site Partner",
          badge: "bg-purple-100 text-purple-800 border border-purple-200",
          description:
            lang === "gu"
              ? "સોંપાયેલ સાઇટના ખર્ચ અને હિસાબ જોવા તથા મેનેજ કરવાની પરવાનગી."
              : "Access to view & manage site expenses and progress for assigned projects.",
        };
      case "site_engineer":
        return {
          title: lang === "gu" ? "સાઇટ એન્જિનિયર (Site Engineer)" : "Site Engineer",
          badge: "bg-blue-100 text-blue-800 border border-blue-200",
          description:
            lang === "gu"
              ? "સાઇટ કામગીરી, મટીરીયલ રિસીપ્ટ અને વાઉચર એન્ટ્રી અધિકાર."
              : "Authority to log site operations, bills and construction vouchers.",
        };
      case "supervisor":
      default:
        return {
          title: lang === "gu" ? "સાઇટ સુપરવાઇઝર (Site Supervisor)" : "Site Supervisor",
          badge: "bg-sky-100 text-sky-800 border border-sky-200",
          description:
            lang === "gu"
              ? "દૈનિક સાઇટ રોકડ ખર્ચ, JCB, મજૂરી ખર્ચી અને GST બીલ એન્ટ્રી અધિકાર."
              : "Authorized for daily site cash management, labour kharchi, JCB, and GST bill logging.",
        };
    }
  };

  const roleInfo = getRoleInfo(currentUser.role);

  // Dynamic Head Office / Admin Contact Info from users list
  const adminAccount =
    users.find(u => u.role === "admin" || u.id === 1) ||
    (currentUser.role === "admin" ? currentUser : null);
  const adminName = adminAccount?.name || "Kanjibhai S. Godhani (Head Office)";
  const rawAdminPhone = adminAccount?.phone || "9825012345";
  const formattedAdminPhone = rawAdminPhone.startsWith("+91")
    ? rawAdminPhone
    : `+91 ${rawAdminPhone}`;
  const cleanAdminPhone = rawAdminPhone.replace(/[^0-9]/g, "");

  const assignedProjectsList = projects.filter(p =>
    currentUser.assignedProjects.includes(p.name)
  );

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 max-w-full overflow-hidden">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shrink-0">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {lang === "gu" ? "મારું એકાઉન્ટ અને પ્રોફાઇલ" : lang === "hi" ? "मेरा अकाउंट और प्रोफ़ाइल" : "My Account & Security"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                @{currentUser.username} • {roleInfo.title}
              </p>
            </div>
          </div>
        </div>

        {/* Cloud Connection Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onOpenCloudModal}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition shadow-xs border ${
              isCloudConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isCloudConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>
              {isCloudConnected
                ? lang === "gu" ? "ક્લાઉડ લાઈવ: ચાલુ" : "Cloud Sync: Connected"
                : lang === "gu" ? "ક્લાઉડ કનેક્ટ કરો" : "Connect Cloud"}
            </span>
          </button>
        </div>
      </div>

      {backupMsg && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold shadow-sm ${
            backupMsg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          {backupMsg.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{backupMsg.text}</span>
        </div>
      )}

      {/* ── Main Two-Column Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        {/* Left Column: Profile Card & Information (7 Cols) */}
        <div className="space-y-6 lg:col-span-7 w-full min-w-0">
          {/* Profile Details Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <User size={18} className="text-amber-600 shrink-0" />
                <span className="truncate">{lang === "gu" ? "પ્રોફાઇલ માહિતી" : "Profile Details"}</span>
              </h2>
              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 px-3 py-1.5 text-xs font-bold text-slate-700 transition shrink-0"
                >
                  <Pencil size={13} />
                  <span>{lang === "gu" ? "એડિટ કરો" : "Edit Profile"}</span>
                </button>
              )}
            </div>

            {profileError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === "gu" ? "પૂરું નામ (Full Name) *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Kanjibhai Godhani"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === "gu" ? "યુઝરનેમ / Login ID *" : "Username *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      placeholder="e.g. admin"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === "gu" ? "મોબાઇલ નંબર (Mobile Phone)" : "Phone Number"}
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="e.g. 98250 12345"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditName(currentUser.name);
                      setEditUsername(currentUser.username);
                      setEditPhone(currentUser.phone || "");
                      setProfileError(null);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>{isSavingProfile ? (lang === "gu" ? "સેવ થઈ રહ્યું છે..." : "Saving...") : (lang === "gu" ? "વિગત સાચવો" : "Save Changes")}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2 w-full min-w-0">
                <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100 min-w-0 overflow-hidden">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {lang === "gu" ? "પૂરું નામ (Full Name)" : "Full Name"}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 sm:mt-1 truncate break-all">{currentUser.name}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100 min-w-0 overflow-hidden">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {lang === "gu" ? "યુઝરનેમ / Login ID" : "Username"}
                  </p>
                  <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 mt-0.5 sm:mt-1 truncate break-all">@{currentUser.username}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100 min-w-0 overflow-hidden">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {lang === "gu" ? "સિસ્ટમ હોદ્દો (Role)" : "Account Role"}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 sm:mt-1 truncate break-all">{roleInfo.title}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100 min-w-0 overflow-hidden">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {lang === "gu" ? "મોબાઇલ નંબર (Mobile)" : "Phone Number"}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 sm:mt-1 truncate break-all">
                    {currentUser.phone ? `+91 ${currentUser.phone}` : "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Permissions & Scope description */}
            <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3 sm:p-4 min-w-0 overflow-hidden">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-950 truncate">
                    {lang === "gu" ? "તમારા અધિકાર અને પરવાનગી (Access Scope)" : "Permissions & Security Level"}
                  </p>
                  <p className="text-xs text-amber-900 mt-0.5 leading-relaxed break-words">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Non-Admin Assigned Sites ────────────────────────────────────── */}
          {!isAdmin && (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 w-full min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <Building2 size={18} className="text-amber-600 shrink-0" />
                  <span className="truncate">{lang === "gu" ? "તમને સોંપાયેલ સાઇટ્સ (Assigned Sites)" : "Your Assigned Sites"}</span>
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 shrink-0">
                  {assignedProjectsList.length} {lang === "gu" ? "સાઇટ" : "Sites"}
                </span>
              </div>

              {assignedProjectsList.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-6 text-center text-xs text-slate-500">
                  {lang === "gu"
                    ? "હાલમાં તમને કોઈ સાઇટ ફાળવેલ નથી. કૃપા કરીને મુખ્ય કચેરીનો સંપર્ક કરો."
                    : "No specific site assigned to this account yet. Please contact Head Office."}
                </div>
              ) : (
                <div className="space-y-3 w-full min-w-0">
                  {assignedProjectsList.map(p => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4 hover:border-amber-300 transition overflow-hidden min-w-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{p.name}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                              {p.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                            <MapPin size={12} className="text-amber-600 shrink-0" />
                            <span className="truncate">{p.location}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-[10px] sm:text-[11px] text-slate-500">Tender Value</p>
                          <p className="text-xs sm:text-sm font-black text-slate-900">{formatINR(p.value)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Data Backup & Safety Vault (Admin Exclusive) ─────────────────── */}
          {isAdmin && (
            <div className="rounded-3xl border border-amber-200 bg-linear-to-b from-amber-50/50 to-white p-4 sm:p-6 shadow-sm space-y-5 w-full min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0 font-bold shadow-xs">
                    <Database size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {lang === "gu" ? "ડેટા બેકઅપ અને સુરક્ષા વૉલ્ટ" : "Data Backup & Safety Vault"}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {lang === "gu" ? "સંપૂર્ણ ડેટાબેઝ બેકઅપ ડાઉનલોડ અને ઇમરજન્સી પુનઃપ્રાપ્તિ" : "One-click JSON snapshot download & emergency restore"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5-Layer Live Protection Health Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-2xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                  <Server size={16} className="text-emerald-600 mb-1" />
                  <p className="text-[10px] text-slate-500 font-semibold">Cloud Database</p>
                  <p className="text-xs font-bold text-slate-900">Encrypted (Active)</p>
                </div>

                <div className="rounded-2xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                  <Smartphone size={16} className="text-blue-600 mb-1" />
                  <p className="text-[10px] text-slate-500 font-semibold">Single Device Lock</p>
                  <p className="text-xs font-bold text-slate-900">Protected</p>
                </div>

                <div className="rounded-2xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                  <Layers size={16} className="text-purple-600 mb-1" />
                  <p className="text-[10px] text-slate-500 font-semibold">Image Compressor</p>
                  <p className="text-xs font-bold text-slate-900">Safe Quota</p>
                </div>

                <div className="rounded-2xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                  <ShieldCheck size={16} className="text-amber-600 mb-1" />
                  <p className="text-[10px] text-slate-500 font-semibold">Master Admin Shield</p>
                  <p className="text-xs font-bold text-slate-900">Non-deletable</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadFullBackup}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
                >
                  <Download size={16} className="text-amber-400" />
                  <span>{lang === "gu" ? "સંપૂર્ણ બેકઅપ ડાઉનલોડ (JSON)" : "Download Full Backup (JSON)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcelBackup}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
                >
                  <FileSpreadsheet size={16} />
                  <span>{lang === "gu" ? "સાઇટ હિસાબ એક્સેલ રિપોર્ટ" : "Export Excel Report"}</span>
                </button>
              </div>

              {/* Restore Section */}
              <div className="pt-3 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-800">{lang === "gu" ? "ઇમરજન્સી ડેટા પુનઃપ્રાપ્તિ (Restore)" : "Emergency Data Restore"}</p>
                  <p className="text-[11px] text-slate-500">
                    {lang === "gu" ? "અગાઉ ડાઉનલોડ કરેલ .json બેકઅપ ફાઈલમાંથી ડેટા રિસ્ટોર કરો" : "Upload previously saved .json backup file to restore records"}
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileRestoreSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition"
                  >
                    <Upload size={14} />
                    <span>{lang === "gu" ? "બેકઅપ ફાઈલ પસંદ કરો" : "Upload Backup File"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Password Change Form (5 Cols) */}
        <div className="space-y-6 lg:col-span-5 w-full min-w-0">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <KeyRound size={18} className="text-amber-600 shrink-0" />
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">
                {lang === "gu" ? "પાસવર્ડ બદલો" : lang === "hi" ? "पासवर्ड बदलें" : "Change Password"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 sm:mb-5 break-words">
              {lang === "gu"
                ? "તમારા એકાઉન્ટનો નવો સુરક્ષિત પાસવર્ડ સેટ કરો."
                : "Update your login password to keep your account secure."}
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 animate-shake">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="break-words">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span className="truncate">{successMsg}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === "gu" ? "હાલનો પાસવર્ડ (Current Password) *" : "Current Password *"}
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === "gu" ? "નવો પાસવર્ડ (New Password) *" : "New Password *"}
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === "gu" ? "નવો પાસવર્ડ ફરીથી લખો (Confirm Password) *" : "Confirm New Password *"}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 flex items-start gap-2">
                <Lock size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {lang === "gu"
                    ? "નવો પાસવર્ડ સુરક્ષિત રીતે સેવ થઈ જશે."
                    : "Password changes are encrypted and saved securely."}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
              >
                <Check size={16} />
                <span>
                  {isSubmitting
                    ? lang === "gu" ? "સેવ થઈ રહ્યું છે..." : "Saving..."
                    : lang === "gu" ? "પાસવર્ડ અપડેટ કરો" : "Save New Password"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Restore Confirmation Modal ────────────────────────────────────── */}
      {restoreConfirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === "gu" ? "બેકઅપ પુનઃસ્થાપિત કરો?" : "Restore Database Backup?"}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === "gu" ? "આ ફાઇલમાંથી ડેટા લોડ થઈ જશે." : "This will load and sync records from the backup file."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-800">
                {lang === "gu" ? "ફાઇલમાં રહેલ વિગતો:" : "Backup Content Summary:"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <span>📍 Sites: {restoreConfirmData.projects?.length || 0}</span>
                <span>💵 Daily Cash: {restoreConfirmData.cashTransactions?.length || 0}</span>
                <span>🏦 Bank Payments: {restoreConfirmData.bankPayments?.length || 0}</span>
                <span>🧾 GST Bills: {restoreConfirmData.gstBills?.length || 0}</span>
                <span>👥 Users: {restoreConfirmData.users?.length || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmData(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 text-xs font-bold shadow-md transition"
              >
                <Check size={16} />
                <span>{lang === "gu" ? "હા, રિસ્ટોર કરો" : "Yes, Restore Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
