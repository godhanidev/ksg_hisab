import React, { useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, Building2, MapPin, Download } from "lucide-react";
import { Language, Project, UserAccount } from "../../types";
import { formatINR } from "../../utils/formatters";
import { getTranslation } from "../../i18n/translations";
import { exportConsolidatedSiteExcel } from "../../utils/exportUtils";

type ProjectsViewProps = {
  projects: Project[];
  allProjects: Project[];
  currentUser: UserAccount;
  lang: Language;
  onAddNew: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
  onView360: (project: Project) => void;
};

export function ProjectsView({
  projects,
  allProjects,
  currentUser,
  lang,
  onAddNew,
  onEdit,
  onDelete,
  onView360,
}: ProjectsViewProps) {
  const t = getTranslation(lang);
  const isAdmin = currentUser.role === "admin";
  const [search, setSearch] = useState("");

  const filtered = projects.filter(p => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase()) ||
      (p.supervisorName && p.supervisorName.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.projects} ({projects.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAdmin
              ? "Manage all government civil contracts and construction sites."
              : "Your assigned project sites (Click Site 360° to inspect ledger)."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => exportConsolidatedSiteExcel(projects, [], [], [])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <Download size={15} />
              <span>{t.exportExcel}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md"
            >
              <Plus size={16} />
              <span>{t.addProject}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-2 bg-slate-50/50">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${t.search} (name, code, department, supervisor)...`}
            className="w-full bg-transparent text-xs sm:text-sm outline-none"
          />
        </div>
      </div>

      {/* Projects Grid / Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Site / Project</th>
                <th className="px-6 py-4">Govt Department</th>
                <th className="px-6 py-4">Tender Value</th>
                <th className="px-6 py-4">Supervisor</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4">
                    <p
                      className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                      onClick={() => onView360(p)}
                    >
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.code}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{p.department}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatINR(p.value)}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{p.supervisorName || "-"}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onView360(p)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                      >
                        <Eye size={13} /> Site 360°
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => onEdit(p)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title={t.edit}
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => onDelete(p.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                          title={t.delete}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
