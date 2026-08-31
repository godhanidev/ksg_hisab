import React, { useState } from "react";
import { ModalWrapper } from "../common/ModalWrapper";
import { LabourWorker, Language, Project } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { Users, MapPin, Check } from "lucide-react";

type EasyLabourModalProps = {
  projects: Project[];
  defaultProject?: string;
  lang: Language;
  onSave: (worker: Omit<LabourWorker, "id">) => void;
  onClose: () => void;
};

export function EasyLabourModal({
  projects,
  defaultProject,
  lang,
  onSave,
  onClose,
}: EasyLabourModalProps) {
  const t = getTranslation(lang);

  const [selectedSite, setSelectedSite] = useState(
    defaultProject && defaultProject !== "ALL" ? defaultProject : projects[0]?.name || ""
  );
  const [name, setName] = useState("");
  const [role, setRole] = useState<LabourWorker["role"]>("Mason");
  const [phone, setPhone] = useState("");
  const [dailyWage, setDailyWage] = useState("800");
  const [daysWorked, setDaysWorked] = useState("0");
  const [paid, setPaid] = useState("0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      alert(t.selectSiteFirst);
      return;
    }

    const wage = parseFloat(dailyWage) || 0;
    const days = parseFloat(daysWorked) || 0;
    const paidAmt = parseFloat(paid) || 0;

    onSave({
      name: name.trim(),
      role,
      project: selectedSite,
      phone: phone.trim() || "N/A",
      dailyWage: wage,
      daysWorked: days,
      totalEarned: wage * days,
      paid: paidAmt,
      status: "Active",
    });

    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.addWorker}</h2>
          <p className="text-xs text-slate-500">Register new labour, artisan or supervisor wage</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          Labour
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <MapPin size={14} className="text-emerald-600" /> {t.siteRequired} *
          </label>
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-800 transition"
          >
            {projects.map(p => (
              <option key={p.id} value={p.name}>🏗️ {p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Worker / Mukadam Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Bhikhabhai Parmar"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Trade *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-slate-800"
            >
              <option value="Mason">Mason (Kadiyo / Karigar)</option>
              <option value="Helper">Helper (Majdoor / Shramik)</option>
              <option value="Carpenter">Carpenter (Shuttering Mistri)</option>
              <option value="Barbender">Barbender (Steel Fitter)</option>
              <option value="Welder">Welder &amp; Fabricator</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Supervisor">Site Supervisor / Mukadam</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Wage (Rs.) *</label>
            <input
              type="number"
              required
              value={dailyWage}
              onChange={e => setDailyWage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Days Worked</label>
            <input
              type="number"
              value={daysWorked}
              onChange={e => setDaysWorked(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
          >
            <Check size={16} />
            {t.save}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
