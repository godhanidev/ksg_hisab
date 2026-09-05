import React, { useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, Building2, MapPin, Download, AlertCircle } from "lucide-react";
import { Language, Project, UserAccount } from "../../types";
import { formatINR } from "../../utils/formatters";
import { getTranslation } from "../../i18n/translations";
import { exportConsolidatedSiteExcel } from "../../utils/exportUtils";
import { DeleteConfirmModal, DeleteTargetInfo } from "../common/DeleteConfirmModal";

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
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);

  const filtered = projects.filter(p => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase()) ||
      (p.supervisorName && p.supervisorName.toLowerCase().includes(search.toLowerCase())) ||
      (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 truncate">
            <Building2 className="text-amber-500 shrink-0" size={24} />
            <span className="truncate">{t.projects} ({projects.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? (lang === "gu" ? "તમામ બાંધકામ સાઇટ્સનું સંચાલન, સુધારો અને હિસાબ." : "Manage all government civil contracts and construction sites.")
              : (lang === "gu" ? "તમને સોંપાયેલ સાઇટ્સ (સાઇટ 360° હિસાબ જોવા માટે ક્લિક કરો)." : "Your assigned project sites (Click Site 360° to inspect ledger).")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {isAdmin && (
            <button
              onClick={() => exportConsolidatedSiteExcel(projects, [], [], [])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <Download size={15} />
              <span className="hidden sm:inline">{t.exportExcel}</span>
              <span className="sm:hidden">Excel</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md active:scale-95"
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
            placeholder={`${t.search} (name, code, department, supervisor, location)...`}
            className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Building2 size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t.noRecordsFound}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? "Try searching with different keywords." : "No project sites available."}
          </p>
          {isAdmin && !search && (
            <button
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <Plus size={14} />
              <span>{t.addProject}</span>
            </button>
          )}
        </div>
      )}

      {/* ── 1. Mobile Cards View (Visible on < md) ── */}
      {filtered.length > 0 && (
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 md:hidden">
          {filtered.map(p => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-amber-300 transition flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3
                      className="font-bold text-slate-900 text-sm hover:text-blue-600 transition cursor-pointer line-clamp-1"
                      onClick={() => onView360(p)}
                    >
                      {p.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.code}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                    {p.status || "Running"}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-slate-600">
                  {p.department && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 truncate">
                      <span className="font-semibold text-slate-700">Dept:</span> {p.department}
                    </p>
                  )}
                  {p.location && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin size={11} className="text-amber-500 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </p>
                  )}
                </div>

                {/* Supervisor & Value */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400">Supervisor</p>
                    <p className="font-bold text-slate-800 text-[11px]">{p.supervisorName || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Tender Value</p>
                    <p className="font-bold text-slate-900 text-xs">{formatINR(p.value)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onView360(p)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                >
                  <Eye size={13} />
                  <span>Site 360°</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
                      title={t.edit}
                    >
                      <Pencil size={14} />
                    </button>
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
                          onConfirm: () => onDelete(p.id),
                        });
                      }}
                      className="p-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title={t.delete}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 2. Desktop Table View (Visible on >= md) ── */}
      {filtered.length > 0 && (
        <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Site / Project</th>
                  <th className="px-6 py-4">Govt Department</th>
                  <th className="px-6 py-4">Tender Value</th>
                  <th className="px-6 py-4">Site In-charge</th>
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
                      {p.location && (
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={10} className="text-slate-400" />
                          <span>{p.location}</span>
                        </p>
                      )}
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
                            onClick={() => {
                              setDeleteTarget({
                                id: p.id,
                                title: lang === "gu" ? "સાઇટ / પ્રોજેક્ટ ડિલીટ" : lang === "hi" ? "साइट / प्रोजेक्ट हटाएं" : "Delete Construction Site",
                                itemName: p.name,
                                itemDetails: `${p.code} • ${p.department} ${p.location ? `• ${p.location}` : ""}`,
                                itemAmount: formatINR(p.value),
                                itemTypeBadge: "Site / Project",
                                onConfirm: () => onDelete(p.id),
                              });
                            }}
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
      )}

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
