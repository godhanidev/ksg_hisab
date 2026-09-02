import React, { useState, useEffect } from "react";
import { Building2, Check, AlertCircle, MapPin, User, Calendar, DollarSign } from "lucide-react";
import { Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { formatINR } from "../../utils/formatters";
import { ModalWrapper } from "../common/ModalWrapper";

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, "id"> | Project) => void;
  editingProject?: Project | null;
  supervisors: UserAccount[];
  lang: Language;
};

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  editingProject,
  supervisors,
  lang,
}: ProjectModalProps) {
  const t = getTranslation(lang);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Gujarat Water Supply & Sewerage Board (GWSSB)");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Project["status"]>("Active");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [location, setLocation] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingProject) {
      setCode(editingProject.code);
      setName(editingProject.name);
      setDepartment(editingProject.department);
      setValue(String(editingProject.value));
      setStatus(editingProject.status);
      setStartDate(editingProject.startDate || "");
      setTargetDate(editingProject.targetDate || "");
      setLocation(editingProject.location || "");
      setSupervisorName(editingProject.supervisorName || "");
      setNotes(editingProject.notes || "");
    } else {
      setCode(`PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setName("");
      setDepartment("Gujarat Water Supply & Sewerage Board (GWSSB)");
      setValue("");
      setStatus("Active");
      setStartDate("01/03/2026");
      setTargetDate("31/12/2026");
      setLocation("");
      setSupervisorName(supervisors.length > 0 ? supervisors[0].name : "Rajubhai");
      setNotes("");
    }
    setErrorMsg(null);
  }, [editingProject, isOpen, supervisors]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);

    if (!name.trim()) {
      setErrorMsg("Please enter site / project name");
      return;
    }
    if (isNaN(numValue) || numValue <= 0) {
      setErrorMsg("Please enter a valid tender value");
      return;
    }

    const payload = {
      ...(editingProject ? { id: editingProject.id } : {}),
      code: code.trim(),
      name: name.trim(),
      department: department.trim(),
      value: numValue,
      progress: 0,
      received: editingProject ? editingProject.received : 0,
      expense: editingProject ? editingProject.expense : 0,
      status,
      startDate,
      targetDate,
      location: location.trim() || undefined,
      supervisorName: supervisorName || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(payload as any);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editingProject ? `Edit Site: ${editingProject.name}` : t.addProject}
      subtitle="Register new government contract / civil works construction site"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Site Name & Code */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Site / Project Name *
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Site Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-mono text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
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

        {/* Assigned Supervisor & Status */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned Site Supervisor
            </label>
            <select
              value={supervisorName}
              onChange={e => setSupervisorName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="Rajubhai">Rajubhai</option>
              <option value="Ramesh Patel">Ramesh Patel</option>
              <option value="Suresh Desai">Suresh Desai</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="Active">Active (કાર્યરત)</option>
              <option value="Completed">Completed (પૂર્ણ)</option>
              <option value="Pending">Pending (બાકી)</option>
              <option value="On Hold">On Hold (સ્થગિત)</option>
            </select>
          </div>
        </div>

        {/* Location / Site Address */}
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Site Description / Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Pipeline laying, foundation, masonry work details"
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
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
