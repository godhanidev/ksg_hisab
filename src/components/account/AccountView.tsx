import React, { useState } from "react";
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Users,
  Database,
} from "lucide-react";
import { Language, Project, Role, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR, getShortRoleLabel } from "../../utils/formatters";

type AccountViewProps = {
  currentUser: UserAccount;
  projects: Project[];
  users: UserAccount[];
  lang: Language;
  onSaveNewPassword: (newPassword: string) => void;
  isCloudConnected: boolean;
  onNavigateToTab?: (tabName: string) => void;
  onOpenCloudModal?: () => void;
};

export function AccountView({
  currentUser,
  projects,
  users,
  lang,
  onSaveNewPassword,
  isCloudConnected,
  onNavigateToTab,
  onOpenCloudModal,
}: AccountViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";

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

  const getRoleInfo = (role: Role) => {
    switch (role) {
      case "admin":
        return {
          title: lang === "gu" ? "ઓનર / મુખ્ય સંચાલક (Head Office)" : lang === "hi" ? "मालिक / मुख्य प्रशासक" : "Owner / Head Office Admin",
          badge: "bg-amber-500 text-slate-950 font-black",
          description:
            lang === "gu"
              ? "તમામ સાઇટ્સ, બેંક પેમેન્ટ, યુઝર્સ, ટેક્સ ઇન્વોઇસ અને સિસ્ટમ સેટિંગ્સનું સંપૂર્ણ નિયંત્રણ."
              : "Full access across all projects, bank transfers, GST tax bills, user accounts & cloud backup.",
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

  // Projects assigned to this user
  const assignedProjectsList = isAdmin
    ? projects
    : projects.filter(p => currentUser.assignedProjects.includes(p.name));

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* ── 1. Top Profile Hero Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Avatar / Logo Box */}
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white p-1.5 shadow-2xl border-2 border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/logo.png"
                  alt="KS Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                  isCloudConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
                title={isCloudConnected ? "Cloud Active" : "Local Mode"}
              >
                <div className="h-2 w-2 rounded-full bg-white animate-ping" />
              </div>
            </div>

            {/* Name & Details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {currentUser.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${roleInfo.badge}`}>
                  {roleInfo.title}
                </span>
              </div>
              <p className="text-sm font-mono text-amber-400 font-bold">
                @{currentUser.username}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                {currentUser.phone && (
                  <a
                    href={`tel:${currentUser.phone}`}
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition"
                  >
                    <Phone size={13} className="text-amber-400" />
                    <span>+91 {currentUser.phone}</span>
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <Shield size={13} className="text-amber-400" />
                  <span>ID #{currentUser.id}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 size={13} />
                  <span>{isCloudConnected ? "Cloud Synced" : "Local Storage"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info / Cloud Button */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
            {onOpenCloudModal && (
              <button
                type="button"
                onClick={onOpenCloudModal}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition backdrop-blur"
              >
                <Database size={14} className="text-amber-400" />
                <span>{lang === "gu" ? "ક્લાઉડ ડેટા સ્ટેટસ" : "Cloud Sync Info"}</span>
              </button>
            )}
            {isAdmin && onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab("User Management")}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-2 text-xs font-black text-slate-950 transition shadow-lg"
              >
                <Users size={14} />
                <span>{lang === "gu" ? "બધા યુઝર્સ જુઓ" : "Manage All Users"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Grid Layout: Details Column + Password Column ─────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Profile & Site Details (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Account Profile Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <User size={18} className="text-amber-600" />
              <span>{lang === "gu" ? "પ્રોફાઇલ માહિતી (Account Details)" : "Account Profile Information"}</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === "gu" ? "પૂરું નામ (Full Name)" : "Full Name"}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">{currentUser.name}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === "gu" ? "યુઝરનેમ / Login ID" : "Username"}
                </p>
                <p className="text-sm font-mono font-bold text-slate-900 mt-1">@{currentUser.username}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === "gu" ? "સિસ્ટમ હોદ્દો (Role)" : "Account Role"}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">{roleInfo.title}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === "gu" ? "મોબાઇલ નંબર (Mobile)" : "Phone Number"}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {currentUser.phone ? `+91 ${currentUser.phone}` : "—"}
                </p>
              </div>
            </div>

            {/* Permissions & Scope description */}
            <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-950">
                    {lang === "gu" ? "તમારા અધિકાર અને પરવાનગી (Access Scope)" : "Permissions & Security Level"}
                  </p>
                  <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Admin Specific Stats OR Supervisor Assigned Sites ─────────── */}
          {isAdmin ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-amber-600" />
                  <span>{lang === "gu" ? "તમામ સાઇટ્સ વિહંગાવલોકન (All Projects)" : "Head Office Sites Overview"}</span>
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {projects.length} {lang === "gu" ? "સાઇટ્સ" : "Sites"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map(p => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 p-3.5 hover:border-amber-300 transition bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      <span className="truncate">{p.location}</span>
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Supervisor: <strong className="text-slate-800">{p.supervisorName || "—"}</strong></span>
                      <span className="font-bold text-slate-900">{formatINR(p.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-amber-600" />
                  <span>{lang === "gu" ? "તમને સોંપાયેલ સાઇટ્સ (Assigned Sites)" : "Your Assigned Sites"}</span>
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  {assignedProjectsList.length} {lang === "gu" ? "સાઇટ" : "Sites"}
                </span>
              </div>

              {assignedProjectsList.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center text-xs text-slate-500">
                  {lang === "gu"
                    ? "હાલમાં તમને કોઈ સાઇટ ફાળવેલ નથી. કૃપા કરીને મુખ્ય કચેરીનો સંપર્ક કરો."
                    : "No specific site assigned to this account yet. Please contact Head Office."}
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedProjectsList.map(p => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 hover:border-amber-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              {p.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={12} className="text-amber-600" />
                            <span>{p.location}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] text-slate-500">Tender Value</p>
                          <p className="text-sm font-black text-slate-900">{formatINR(p.value)}</p>
                        </div>
                      </div>

                      {p.department && (
                        <p className="text-[11px] text-slate-600 mt-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 truncate">
                          Client: {p.department}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Head Office Support Info */}
              <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-400">Head Office Support (મુખ્ય કચેરી સંપર્ક)</p>
                  <p className="text-xs text-slate-300">Kanjibhai S. Godhani: +91 98250 12345</p>
                </div>
                <a
                  href="tel:9825012345"
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3 py-1.5 text-xs font-black text-slate-950 transition shrink-0"
                >
                  Call Now
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Password Change Form & Security (5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound size={18} className="text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {lang === "gu" ? "પાસવર્ડ બદલો" : lang === "hi" ? "पासवर्ड बदलें" : "Change Password"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              {lang === "gu"
                ? "તમારા એકાઉન્ટનો નવો સુરક્ષિત પાસવર્ડ સેટ કરો."
                : "Update your login password to keep your account secure."}
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 animate-shake">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{successMsg}</span>
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
                    ? "નવો પાસવર્ડ સેટ થતાં જ ક્લાઉડ ડેટાબેઝમાં સુરક્ષિત રીતે અપડેટ થઈ જશે."
                    : "Password changes are encrypted and synchronized with Firebase Cloud immediately."}
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

          {/* System Info Box */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === "gu" ? "સિસ્ટમ સુરક્ષા" : "Security & System"}
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>App Version</span>
                <span className="font-mono font-semibold text-slate-900">v2.0 (2026)</span>
              </p>
              <p className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Database Sync</span>
                <span className="font-semibold text-emerald-600">Firestore SSL</span>
              </p>
              <p className="flex items-center justify-between py-1">
                <span>Role Isolation (RBAC)</span>
                <span className="font-semibold text-slate-900">Active</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
