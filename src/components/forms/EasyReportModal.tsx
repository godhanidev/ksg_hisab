import React, { useState } from "react";
import { ModalWrapper } from "../common/ModalWrapper";
import { DailyReport, Language, Project, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { todayStr } from "../../utils/formatters";
import { FileText, MapPin, Sun, CloudRain, Cloud, Check } from "lucide-react";

type EasyReportModalProps = {
  projects: Project[];
  defaultProject?: string;
  currentUser: UserAccount;
  lang: Language;
  onSave: (report: Omit<DailyReport, "id">) => void;
  onClose: () => void;
};

export function EasyReportModal({
  projects,
  defaultProject,
  currentUser,
  lang,
  onSave,
  onClose,
}: EasyReportModalProps) {
  const t = getTranslation(lang);

  const [selectedSite, setSelectedSite] = useState(
    defaultProject && defaultProject !== "ALL" ? defaultProject : projects[0]?.name || ""
  );
  const [date, setDate] = useState(todayStr());
  const [labourCount, setLabourCount] = useState("20");
  const [workDone, setWorkDone] = useState("");
  const [materialUsed, setMaterialUsed] = useState("");
  const [issues, setIssues] = useState("None");
  const [progress, setProgress] = useState("50");
  const [weather, setWeather] = useState<DailyReport["weather"]>("Sunny / Clear");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      alert(t.selectSiteFirst);
      return;
    }

    onSave({
      date,
      project: selectedSite,
      reportedBy: currentUser.name,
      labourCount: parseInt(labourCount) || 0,
      workDone: workDone.trim() || "Regular site work executed.",
      materialUsed: materialUsed.trim() || "As per daily plan",
      issues: issues.trim() || "None",
      progress: parseInt(progress) || 0,
      weather,
    });

    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.addReport}</h2>
          <p className="text-xs text-slate-500">Submit today daily site progress and work execution log</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
          Daily Log
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <MapPin size={14} className="text-blue-600" /> {t.siteRequired} *
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

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="text"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Total Labourers On Site</label>
            <input
              type="number"
              required
              value={labourCount}
              onChange={e => setLabourCount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={progress}
              onChange={e => setProgress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Weather Condition</label>
          <select
            value={weather}
            onChange={e => setWeather(e.target.value as any)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-slate-800"
          >
            <option value="Sunny / Clear">☀️ Sunny / Clear</option>
            <option value="Rainy / Wet">🌧️ Rainy / Wet (Work interrupted)</option>
            <option value="Cloudy">⛅ Cloudy</option>
            <option value="Extreme Heat">🔥 Extreme Heat</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Work Completed Today *</label>
          <textarea
            required
            rows={2}
            value={workDone}
            onChange={e => setWorkDone(e.target.value)}
            placeholder="e.g. Concrete pouring for dam wall section A completed. 45 Cu.M casted."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-slate-800 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Material Consumed Today</label>
          <textarea
            rows={2}
            value={materialUsed}
            onChange={e => setMaterialUsed(e.target.value)}
            placeholder="e.g. 100 bags cement, 350 cu.ft sand, 500 kg steel"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-slate-800 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Issues / Roadblocks (if any)</label>
          <input
            type="text"
            value={issues}
            onChange={e => setIssues(e.target.value)}
            placeholder="e.g. None / Rain delay of 2 hours"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-slate-800"
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
