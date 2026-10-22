import React, { useState, useEffect } from "react";
import { Building2, Check, AlertCircle, MapPin, User, DollarSign, Users } from "lucide-react";
import { Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, "id"> | Project, assignedUserIds?: number[]) => void;
  editingProject?: Project | null;
  supervisors: UserAccount[];
  users?: UserAccount[];
  lang: Language;
};

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  editingProject,
  supervisors,
  users = [],
  lang,
}: ProjectModalProps) {
  const t = getTranslation(lang);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Gujarat Water Supply & Sewerage Board (GWSSB)");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [location, setLocation] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const candidateUsers = users && users.length > 0 ? users : supervisors;

  useEffect(() => {
    if (editingProject) {
      setCode(editingProject.code);
      setName(editingProject.name);
      setDepartment(editingProject.department);
      setValue(String(editingProject.value));
      setStartDate(editingProject.startDate || "");
      setTargetDate(editingProject.targetDate || "");
      setLocation(editingProject.location || "");
      setSupervisorName(editingProject.supervisorName || "");

      // Pre-select users currently assigned to this project
      const preselected = candidateUsers
        .filter(u => u.role !== "admin" && u.assignedProjects && u.assignedProjects.includes(editingProject.name))
        .map(u => u.id);
      setSelectedUserIds(preselected);
    } else {
      setCode(`PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setName("");
      setDepartment("Gujarat Water Supply & Sewerage Board (GWSSB)");
      setValue("");
      setStartDate("01/03/2026");
      setTargetDate("31/12/2026");
      setLocation("");
      setSupervisorName("");
      setSelectedUserIds([]);
    }
    setErrorMsg(null);
  }, [editingProject, isOpen, candidateUsers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);

    if (!name.trim()) {
      setErrorMsg(lang === "gu" ? "કૃપા કરીને સાઇટ / પ્રોજેક્ટનું નામ લખો" : "Please enter site / project name");
      return;
    }
    if (isNaN(numValue) || numValue <= 0) {
      setErrorMsg(lang === "gu" ? "કૃપા કરીને માન્ય ટેન્ડર રકમ દાખલ કરો" : "Please enter a valid tender value");
      return;
    }

    const payload = {
      ...(editingProject ? { id: editingProject.id } : {}),
      code: code.trim() || `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      department: department.trim(),
      value: numValue,
      progress: editingProject ? editingProject.progress : 0,
      received: editingProject ? editingProject.received : 0,
      expense: editingProject ? editingProject.expense : 0,
      status: editingProject ? editingProject.status : "Active",
      startDate,
      targetDate,
      location: location.trim() || undefined,
      supervisorName: supervisorName.trim() || undefined,
      notes: editingProject?.notes,
    };

    onSave(payload as any, selectedUserIds);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editingProject ? `Edit Site: ${editingProject.name}` : t.addProject}
      subtitle={
        lang === "gu"
          ? "નવી બાંધકામ સાઇટ નોંધણી અને તેના માટે ટીમ સભ્યો ફાળવો"
          : "Register new government contract / civil works construction site"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Site / Project Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Site / Project Name (સાઇટનું નામ) *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Dahod Devgadh Baria Package 2"
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Department & Tender Value */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Govt Department / Client *
            </label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tender / Contract Value (₹) *
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
                value={value}
                onChange={e => setValue(e.target.value)}
                required
                placeholder="15000000"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            {parseFloat(value) > 0 && (
              <p className="mt-1 text-[11px] font-bold text-emerald-600">
                {formatINR(parseFloat(value))}
              </p>
            )}
          </div>
        </div>

        {/* Assigned Site In-charge & Location */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Main In-charge / Supervisor (મુખ્ય ઇન-ચાર્જ)
            </label>
            <input
              type="text"
              list="supervisor-suggestions"
              value={supervisorName}
              onChange={e => setSupervisorName(e.target.value)}
              placeholder="e.g. Rajubhai or Engineer Name"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <datalist id="supervisor-suggestions">
              {candidateUsers.map(s => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location / Site Address
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Devgadh Baria, Dahod District"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* ── 🌟 NEW: Assign Team Members Directly on Site Creation ── */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users size={15} className="text-amber-600" />
              <span>
                {lang === "gu"
                  ? "આ સાઇટ માટે સભ્યો પસંદ કરો (પાર્ટનર, એન્જિનિયર, સુપરવાઇઝર):"
                  : "Assign Team Members to this Site:"}
              </span>
            </label>
            <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-md">
              {selectedUserIds.length} {lang === "gu" ? "સભ્યો પસંદ" : "Selected"}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            {lang === "gu"
              ? "આ સાઇટમાં જે સભ્યો સિલેક્ટ કરશો ફક્ત તેમના નામ જ સાઇટ રોકડ જમા, ખર્ચ અને આંતરિક ટ્રાન્સફરમાં આવશે."
              : "Only members checked here will appear in Cash In, Expenses, and Internal Transfers for this site."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
            {candidateUsers
              .filter(u => u.role !== "admin")
              .map(u => {
                const isChecked = selectedUserIds.includes(u.id);
                const roleBadge =
                  u.role === "site_partner"
                    ? { label: lang === "gu" ? "સાઇટ પાર્ટનર" : "Site Partner", color: "text-purple-700 bg-purple-50" }
                    : u.role === "site_engineer"
                    ? { label: lang === "gu" ? "સાઇટ એન્જિનિયર" : "Site Engineer", color: "text-blue-700 bg-blue-50" }
                    : { label: lang === "gu" ? "સાઇટ સુપરવાઇઝર" : "Site Supervisor", color: "text-sky-700 bg-sky-50" };

                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition ${
                      isChecked
                        ? "bg-amber-50/80 border-amber-300 font-bold text-amber-950 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedUserIds(prev =>
                          prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                        );
                      }}
                      className="rounded accent-slate-900"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">{u.name}</p>
                      <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </div>
                  </label>
                );
              })}
          </div>
        </div>

        {/* Action Buttons */}
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
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95"
          >
            <Check size={16} />
            <span>{t.save}</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
