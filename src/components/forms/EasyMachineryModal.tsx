import React, { useState } from "react";
import { ModalWrapper } from "../common/ModalWrapper";
import { Language, Machinery, Project } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { Truck, MapPin, Check } from "lucide-react";

type EasyMachineryModalProps = {
  projects: Project[];
  defaultProject?: string;
  lang: Language;
  onSave: (machinery: Omit<Machinery, "id">) => void;
  onClose: () => void;
};

export function EasyMachineryModal({
  projects,
  defaultProject,
  lang,
  onSave,
  onClose,
}: EasyMachineryModalProps) {
  const t = getTranslation(lang);

  const [selectedSite, setSelectedSite] = useState(
    defaultProject && defaultProject !== "ALL" ? defaultProject : projects[0]?.name || ""
  );
  const [name, setName] = useState("");
  const [type, setType] = useState<Machinery["type"]>("Excavator (JCB)");
  const [registrationNo, setRegistrationNo] = useState("");
  const [dailyRate, setDailyRate] = useState("5000");
  const [daysUsed, setDaysUsed] = useState("1");
  const [status, setStatus] = useState<Machinery["status"]>("In Use");
  const [operatorName, setOperatorName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      alert(t.selectSiteFirst);
      return;
    }

    const rate = parseFloat(dailyRate) || 0;
    const days = parseFloat(daysUsed) || 0;

    onSave({
      name: name.trim(),
      type,
      registrationNo: registrationNo.trim() || "N/A",
      project: selectedSite,
      dailyRate: rate,
      daysUsed: days,
      totalCost: rate * days,
      status,
      operatorName: operatorName.trim() || undefined,
    });

    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.addMachine}</h2>
          <p className="text-xs text-slate-500">Track equipment rates, operator &amp; days used</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
          Machinery
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <MapPin size={14} className="text-amber-600" /> {t.siteRequired} *
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Machine / Equipment Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. JCB 3DX Excavator / Concrete Mixer"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Machinery Type *</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-slate-800"
            >
              <option value="Excavator (JCB)">Excavator (JCB / Poclain)</option>
              <option value="Concrete Mixer">Concrete Mixer (Hydraulic / Manual)</option>
              <option value="Tractor & Trolley">Tractor &amp; Trolley</option>
              <option value="Vibrator / Compactor">Vibrator / Plate Compactor</option>
              <option value="Water Pump">Dewatering Pump</option>
              <option value="Crane">Hydraulic Crane / Hydra</option>
              <option value="Generator">Silent Diesel Generator</option>
              <option value="Dumper">Dumper / Tipper</option>
              <option value="Other">Other Equipment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registration / Serial No</label>
            <input
              type="text"
              value={registrationNo}
              onChange={e => setRegistrationNo(e.target.value)}
              placeholder="e.g. GJ-14-AB-1290"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Daily / Shift Rate (Rs.) *</label>
            <input
              type="number"
              required
              value={dailyRate}
              onChange={e => setDailyRate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Days Used</label>
            <input
              type="number"
              value={daysUsed}
              onChange={e => setDaysUsed(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold outline-none focus:border-slate-800"
            >
              <option value="In Use">In Use (Active)</option>
              <option value="Available">Available (Idle)</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Operator / Driver Name</label>
          <input
            type="text"
            value={operatorName}
            onChange={e => setOperatorName(e.target.value)}
            placeholder="e.g. Haresh Bhai (Operator)"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
          />
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
