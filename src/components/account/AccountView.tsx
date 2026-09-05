import React, { useState } from "react";
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
  Users,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Language, Project, Role, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, getShortRoleLabel } from "../../utils/formatters";
import { DeleteConfirmModal, DeleteTargetInfo } from "../common/DeleteConfirmModal";

type AccountViewProps = {
  currentUser: UserAccount;
  projects: Project[];
  users: UserAccount[];
  lang: Language;
  onSaveNewPassword: (newPassword: string) => void;
  onUpdateProfile?: (updatedData: { name: string; username: string; phone?: string }) => void;
  isCloudConnected: boolean;
  onNavigateToTab?: (tabName: string) => void;
  onOpenCloudModal?: () => void;
  onAddNewProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: number) => void;
  onViewProject360?: (project: Project) => void;
};

export function AccountView({
  currentUser,
  projects,
  users,
  lang,
  onSaveNewPassword,
  onUpdateProfile,
  isCloudConnected,
  onNavigateToTab,
  onOpenCloudModal,
  onAddNewProject,
  onEditProject,
  onDeleteProject,
  onViewProject360,
}: AccountViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editPhone, setEditPhone] = useState(currentUser.phone || "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);

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
  const cleanAdminPhone = rawAdminPhone.replace(/\D/g, "");

  // Projects assigned to this user
  const assignedProjectsList = isAdmin
    ? projects
    : projects.filter(p => currentUser.assignedProjects.includes(p.name));

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-6xl w-full min-w-0 mx-auto overflow-hidden">
      {/* ── 1. Top Profile Hero Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-4 sm:p-6 lg:p-8 text-white shadow-xl w-full min-w-0">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 min-w-0 w-full">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
            {/* User Profile Avatar Box */}
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-1.5 shadow-2xl border-2 border-amber-300/40 flex items-center justify-center shrink-0">
              <User size={28} className="sm:w-8 sm:h-8 text-slate-950" />
            </div>

            {/* Name & Details */}
            <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-black tracking-tight text-white truncate max-w-full">
                  {currentUser.name}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shrink-0 ${roleInfo.badge}`}>
                  {roleInfo.title}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-amber-400 font-bold truncate max-w-full">
                @{currentUser.username}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 pt-0.5 min-w-0">
                {currentUser.phone && (
                  <a
                    href={`tel:${currentUser.phone}`}
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-amber-400 transition truncate max-w-full"
                  >
                    <Phone size={11} className="text-amber-400 shrink-0" />
                    <span className="truncate">+91 {currentUser.phone}</span>
                  </a>
                )}
                <span className="inline-flex items-center gap-1 text-slate-300 shrink-0">
                  <Shield size={11} className="text-amber-400 shrink-0" />
                  <span>ID #{currentUser.id}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info & Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-start md:items-end gap-2 w-full md:w-auto shrink-0 min-w-0">
            {isAdmin && onAddNewProject && (
              <button
                type="button"
                onClick={onAddNewProject}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 transition shadow-lg active:scale-95 w-full sm:w-auto"
              >
                <Plus size={15} />
                <span>{lang === "gu" ? "+ નવી સાઇટ ઉમેરો" : "+ Add New Site"}</span>
              </button>
            )}

            {isAdmin && onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab("User Management")}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition backdrop-blur w-full sm:w-auto"
              >
                <Users size={14} className="text-amber-400" />
                <span>{lang === "gu" ? "યુઝર એકાઉન્ટ્સ મેનેજ કરો" : "Manage User Accounts"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Grid Layout: Details Column + Password Column ─────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 w-full min-w-0">
        {/* Left Column: Profile & Site Details (7 Cols) */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-7 w-full min-w-0">
          {/* Account Profile Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm w-full min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <User size={18} className="text-amber-600 shrink-0" />
                <span className="truncate">{lang === "gu" ? "પ્રોફાઇલ માહિતી (Account Details)" : "Account Profile Information"}</span>
              </h2>

              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setEditName(currentUser.name);
                    setEditUsername(currentUser.username);
                    setEditPhone(currentUser.phone || "");
                    setProfileError(null);
                    setProfileSuccess(null);
                    setIsEditingProfile(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-amber-400 hover:text-slate-900 transition shadow-2xs active:scale-95 shrink-0 ml-auto"
                >
                  <Pencil size={13} className="text-amber-600 shrink-0" />
                  <span>{lang === "gu" ? "વિગત સુધારો" : "Edit Profile"}</span>
                </button>
              )}
            </div>

            {/* Profile Success Alert */}
            {profileSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 sm:p-3.5 text-xs font-bold text-emerald-800 animate-in fade-in">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span className="truncate">{profileSuccess}</span>
              </div>
            )}

            {/* Profile Error Alert */}
            {profileError && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 sm:p-3.5 text-xs font-semibold text-rose-700 animate-shake">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span className="break-words">{profileError}</span>
              </div>
            )}

            {isEditingProfile ? (
              /* Profile Edit Form */
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {lang === "gu" ? "પૂરું નામ (Full Name) *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                    />
                  </div>

                  {/* Username / Login ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {lang === "gu" ? "યુઝરનેમ / Login ID *" : "Username / Login ID *"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-amber-600">@</span>
                      <input
                        type="text"
                        required
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                        placeholder="username"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-8 pr-3.5 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === "gu" ? "આ ID વડે લોગઇન થશે (Admin panel માં પણ બદલાઈ જશે)." : "Login ID (will also sync with Admin panel)."}
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {lang === "gu" ? "મોબાઇલ નંબર (Phone Number)" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98250 12345"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-12 pr-3.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                      />
                    </div>
                  </div>

                  {/* Role (Read-only) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {lang === "gu" ? "સિસ્ટમ હોદ્દો (Role)" : "Account Role"}
                    </label>
                    <div className="rounded-xl bg-slate-100/70 border border-slate-200 py-2.5 px-3.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{roleInfo.title}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{lang === "gu" ? "કચેરી દ્વારા નિયંત્રિત" : "Head Office"}</span>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileError(null);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
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
              /* Profile Display View */
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

          {/* ── Admin Specific Stats OR Supervisor Assigned Sites ─────────── */}
          {isAdmin ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 w-full min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Building2 size={18} className="text-amber-600 shrink-0" />
                    <span className="truncate">{lang === "gu" ? "તમામ સાઇટ્સ વિહંગાવલોકન (All Projects)" : "Construction Sites & Projects"}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {lang === "gu" ? "સાઇટ ઉમેરો, સુધારો કરો અથવા સાઇટ 360° હિસાબ જુઓ." : "Add, edit, or inspect site ledgers."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onAddNewProject && (
                    <button
                      type="button"
                      onClick={onAddNewProject}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs shrink-0"
                    >
                      <Plus size={14} />
                      <span>{lang === "gu" ? "+ નવી સાઇટ" : "+ Add Site"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 w-full min-w-0">
                {projects.map(p => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 p-3.5 sm:p-4 hover:border-amber-300 transition bg-slate-50/50 flex flex-col justify-between overflow-hidden min-w-0"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{p.code}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                          {p.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 truncate">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1 text-[11px] min-w-0">
                        <span className="text-slate-500 truncate min-w-0 flex-1">Supervisor: <strong className="text-slate-800">{p.supervisorName || "—"}</strong></span>
                        <span className="font-bold text-slate-900 shrink-0">{formatINR(p.value)}</span>
                      </div>
                    </div>

                    {/* Action Buttons on each card */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2 min-w-0">
                      {onViewProject360 && (
                        <button
                          type="button"
                          onClick={() => onViewProject360(p)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition shrink-0"
                        >
                          <Eye size={12} />
                          <span>Site 360°</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        {onEditProject && (
                          <button
                            type="button"
                            onClick={() => onEditProject(p)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shrink-0"
                            title={lang === "gu" ? "સાઇટ સુધારો" : "Edit Project"}
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {onDeleteProject && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget({
                                id: p.id,
                                title: lang === "gu" ? "સાઇટ / પ્રોજેક્ટ ડિલીટ" : lang === "hi" ? "साइट / प्रोजेक्ट हटाएं" : "Delete Construction Site",
                                itemName: p.name,
                                itemDetails: `${p.code} • ${p.department} ${p.location ? `• ${p.location}` : ""}`,
                                itemAmount: formatINR(p.value),
                                itemTypeBadge: "Site / Project",
                                onConfirm: () => onDeleteProject(p.id),
                              });
                            }}
                            className="p-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 transition shrink-0"
                            title={lang === "gu" ? "સાઇટ કાઢી નાખો" : "Delete Project"}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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

                      {p.department && (
                        <p className="text-[11px] text-slate-600 mt-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 truncate">
                          Client: {p.department}
                        </p>
                      )}

                      {onViewProject360 && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onViewProject360(p)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shrink-0"
                          >
                            <Eye size={13} />
                            <span>Site 360° Ledger (હિસાબ)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Head Office Support Info */}
              <div className="rounded-2xl bg-slate-900 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 overflow-hidden">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-400 truncate">Head Office Support (મુખ્ય કચેરી સંપર્ક)</p>
                  <p className="text-xs text-slate-300 truncate">
                    {adminName}: {formattedAdminPhone}
                  </p>
                </div>
                <a
                  href={`tel:${cleanAdminPhone}`}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-black text-slate-950 transition text-center shrink-0 self-start sm:self-auto"
                >
                  Call Now
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Password Change Form & Security (5 Cols) */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-5 w-full min-w-0">
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

      {/* Animated Deletion Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        target={deleteTarget}
        lang={lang}
      />
    </div>
  );
}
