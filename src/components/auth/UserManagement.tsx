import React, { useState } from "react";
import { Shield, HardHat, Plus, Edit, Trash2, Check, Lock, User, Phone, MapPin, Briefcase } from "lucide-react";
import { Language, Project, Role, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { ModalWrapper } from "../common/ModalWrapper";

type UserManagementProps = {
  users: UserAccount[];
  projects: Project[];
  lang: Language;
  onSaveUser: (user: UserAccount) => void;
  onDeleteUser: (id: number) => void;
};

export function UserManagement({
  users,
  projects,
  lang,
  onSaveUser,
  onDeleteUser,
}: UserManagementProps) {
  const t = getTranslation(lang);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserAccount | null>(null);

  const [form, setForm] = useState<{
    username: string;
    password: string;
    name: string;
    role: Role;
    phone: string;
    assignedProjects: string[];
  }>({
    username: "",
    password: "",
    name: "",
    role: "supervisor",
    phone: "",
    assignedProjects: [],
  });

  const openAdd = () => {
    setEditUser(null);
    setForm({
      username: "",
      password: "",
      name: "",
      role: "supervisor",
      phone: "",
      assignedProjects: projects.length > 0 ? [projects[0].name] : [],
    });
    setShowModal(true);
  };

  const openEdit = (u: UserAccount) => {
    setEditUser(u);
    setForm({
      username: u.username,
      password: u.password,
      name: u.name,
      role: u.role,
      phone: u.phone || "",
      assignedProjects: [...u.assignedProjects],
    });
    setShowModal(true);
  };

  const toggleProject = (p: string) => {
    setForm(f => ({
      ...f,
      assignedProjects: f.assignedProjects.includes(p)
        ? f.assignedProjects.filter(x => x !== p)
        : [...f.assignedProjects, p],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim() || !form.name.trim()) return;

    const userToSave: UserAccount = {
      id: editUser ? editUser.id : Date.now(),
      ...form,
    };

    onSaveUser(userToSave);
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (id === 1) {
      alert("Main Owner/Admin account cannot be deleted.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      onDeleteUser(id);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "admin":
        return {
          label: "Owner / Admin",
          bg: "bg-amber-100 text-amber-800 border border-amber-200",
        };
      case "site_engineer":
        return {
          label: "Site Engineer",
          bg: "bg-blue-100 text-blue-800 border border-blue-200",
        };
      case "site_partner":
        return {
          label: "Site Partner",
          bg: "bg-purple-100 text-purple-800 border border-purple-200",
        };
      case "supervisor":
      default:
        return {
          label: "Site Supervisor",
          bg: "bg-sky-100 text-sky-800 border border-sky-200",
        };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.userManagement}</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create user accounts for Site Supervisors, Site Engineers &amp; Site Partners with assigned site permissions.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md"
        >
          <Plus size={16} />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Users List Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map(u => {
          const isAdmin = u.role === "admin";
          const badge = getRoleBadge(u.role);

          return (
            <div
              key={u.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm border border-slate-200 overflow-hidden">
                      <img
                        src="/logo.png"
                        alt="KS Logo"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Assigned Sites section */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <MapPin size={12} className="text-amber-600" />
                    Assigned Sites ({isAdmin ? "All Sites" : u.assignedProjects.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {isAdmin ? (
                      <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                        ⭐ Full Access Across All Projects
                      </span>
                    ) : u.assignedProjects.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No site assigned yet</span>
                    ) : (
                      u.assignedProjects.map(p => (
                        <span key={p} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          📍 {p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold">{badge.label}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(u)}
                    className="rounded-xl border border-slate-200 p-2 text-xs font-semibold hover:bg-slate-50 transition"
                    title="Edit User Access"
                  >
                    <Edit size={14} />
                  </button>
                  {u.id !== 1 && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="rounded-xl border border-red-200 p-2 text-xs text-red-600 hover:bg-red-50 transition"
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Form Modal */}
      {showModal && (
        <ModalWrapper
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editUser ? `Edit User: ${editUser.name}` : "Add New User Account"}
          subtitle="Configure user credentials, role &amp; site access permissions"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rajubhai or Hitesh Patel"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-slate-800"
                >
                  <option value="supervisor">Site Supervisor (સાઇટ સુપરવાઇઝર)</option>
                  <option value="site_engineer">Site Engineer (સાઇટ એન્જિનિયર)</option>
                  <option value="site_partner">Site Partner (સાઇટ પાર્ટનર)</option>
                  <option value="admin">Owner / Admin (ઓનર - Full Access to all sites)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username (Login ID) *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  placeholder="e.g. rajubhai"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono font-bold outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="e.g. raju@2026"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono font-bold outline-none focus:border-slate-800"
                />
              </div>
            </div>

            {/* Mobile / Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. 98250 12345"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
              />
            </div>

            {/* Site Isolation Section for Non-Admin roles */}
            {form.role !== "admin" && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin size={14} className="text-amber-600" />
                  Assign Construction Sites (સાઇટ ફાળવો)
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {projects.map(p => (
                    <label
                      key={p.name}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                        form.assignedProjects.includes(p.name)
                          ? "bg-amber-50 border-amber-300 font-bold text-amber-900"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedProjects.includes(p.name)}
                        onChange={() => toggleProject(p.name)}
                        className="rounded accent-slate-900"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md transition active:scale-95"
              >
                <Check size={16} />
                <span>{t.save}</span>
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
}
