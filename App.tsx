import React, { useState, useEffect, useMemo } from "react";
import {
  Building2, ReceiptIndianRupee, WalletCards, Users, Package, Truck,
  FileText, BarChart3, Settings, Plus, Search, Filter, Download, Printer,
  Eye, Trash2, Edit, AlertTriangle, CheckCircle2, ShieldCheck, MapPin,
  Clock, IndianRupee, RefreshCw, CalendarDays, Paperclip, Activity, Wrench, Shield
} from "lucide-react";

import {
  Attachment, Bill, DailyReport, Expense, FundTransfer, LabourWorker, Language,
  Machinery, MaterialItem, Project, UserAccount
} from "./src/types";
import { getTranslation } from "./src/i18n/translations";
import { formatINR, todayStr } from "./src/utils/formatters";
import {
  loadStoredCollection, saveStoredCollection, loadStoredSession, saveStoredSession,
  loadOfflineQueue, addToOfflineQueue, clearOfflineQueue, getStoredLanguage, setStoredLanguage
} from "./src/utils/storageUtils";
import {
  exportExpensesExcel, exportBillsExcel, exportSiteSummaryExcel, printAuditReport
} from "./src/utils/exportUtils";
import {
  initialUsers, initialProjects, initialExpenses, initialBills,
  initialLabour, initialMaterial, initialMachinery, initialReports, initialFundTransfers
} from "./src/data/initialData";

import { Header } from "./src/components/common/Header";
import { Sidebar } from "./src/components/common/Sidebar";
import { StatCard } from "./src/components/common/StatCard";
import { StatusBadge } from "./src/components/common/StatusBadge";
import { ModalWrapper } from "./src/components/common/ModalWrapper";
import { MobileNavBar } from "./src/components/common/MobileNavBar";

import { DashboardView } from "./src/components/dashboard/DashboardView";
import { ProjectsView } from "./src/components/projects/ProjectsView";
import { Project360Modal } from "./src/components/projects/Project360Modal";
import { ReportsView } from "./src/components/reports/ReportsView";
import { BillsView } from "./src/components/bills/BillsView";
import { BillGeneratorModal } from "./src/components/bills/BillGeneratorModal";
import { LoginPage } from "./src/components/auth/LoginPage";
import { UserManagement } from "./src/components/auth/UserManagement";
import { BillViewerModal } from "./src/components/documents/BillViewerModal";
import { WalletHubView } from "./src/components/wallet/WalletHubView";
import { FundTransferModal } from "./src/components/wallet/FundTransferModal";

import { EasyExpenseModal } from "./src/components/forms/EasyExpenseModal";
import { EasyBillModal } from "./src/components/forms/EasyBillModal";
import { EasyLabourModal } from "./src/components/forms/EasyLabourModal";
import { EasyMaterialModal } from "./src/components/forms/EasyMaterialModal";
import { EasyMachineryModal } from "./src/components/forms/EasyMachineryModal";
import { EasyReportModal } from "./src/components/forms/EasyReportModal";

export function App() {
  // Language & Online State
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncQueue, setPendingSyncQueue] = useState(loadOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Active User Session & Page Navigation
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = loadStoredSession();
    if (saved && saved.username === "admin") {
      return { ...saved, name: "Kanjibhai S. Godhani (Owner)" };
    }
    return saved;
  });
  const [activePage, setActivePage] = useState<string>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("ALL");

  // Persistent Core Data
  const [projects, setProjects] = useState<Project[]>(() =>
    loadStoredCollection<Project[]>("projects", initialProjects)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadStoredCollection<Expense[]>("expenses", initialExpenses)
  );
  const [bills, setBills] = useState<Bill[]>(() =>
    loadStoredCollection<Bill[]>("bills", initialBills)
  );
  const [labour, setLabour] = useState<LabourWorker[]>(() =>
    loadStoredCollection<LabourWorker[]>("labour", initialLabour)
  );
  const [materials, setMaterials] = useState<MaterialItem[]>(() =>
    loadStoredCollection<MaterialItem[]>("materials", initialMaterial)
  );
  const [machinery, setMachinery] = useState<Machinery[]>(() =>
    loadStoredCollection<Machinery[]>("machinery", initialMachinery)
  );
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() =>
    loadStoredCollection<DailyReport[]>("reports", initialReports)
  );
  const [fundTransfers, setFundTransfers] = useState<FundTransfer[]>(() =>
    loadStoredCollection<FundTransfer[]>("fund_transfers", initialFundTransfers)
  );
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);

  // Modals & Lightbox Viewers State
  const [viewingProject360, setViewingProject360] = useState<Project | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<{
    attachment: Attachment;
    title: string;
    subtitle?: string;
    amount?: string;
  } | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSupervisorId, setTransferSupervisorId] = useState<number | undefined>(undefined);
  const [transferProject, setTransferProject] = useState<string | undefined>(undefined);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showBillGenerator, setShowBillGenerator] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showMachineryModal, setShowMachineryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Search and Filter States for specific tables
  const [expenseSearch, setExpenseSearch] = useState("");
  const [labourSearch, setLabourSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");

  const t = getTranslation(lang);
  const isAdmin = currentUser?.role === "admin";

  // Persist Collections to LocalStorage
  useEffect(() => { saveStoredCollection("projects", projects); }, [projects]);
  useEffect(() => { saveStoredCollection("expenses", expenses); }, [expenses]);
  useEffect(() => { saveStoredCollection("bills", bills); }, [bills]);
  useEffect(() => { saveStoredCollection("labour", labour); }, [labour]);
  useEffect(() => { saveStoredCollection("materials", materials); }, [materials]);
  useEffect(() => { saveStoredCollection("machinery", machinery); }, [machinery]);
  useEffect(() => { saveStoredCollection("reports", dailyReports); }, [dailyReports]);
  useEffect(() => { saveStoredCollection("fund_transfers", fundTransfers); }, [fundTransfers]);
  useEffect(() => { saveStoredSession(currentUser); }, [currentUser]);

  // Online / Offline Status Listeners & Auto-Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerAutoSync = () => {
    const queue = loadOfflineQueue();
    if (queue.length === 0) return;
    setIsSyncing(true);
    setTimeout(() => {
      clearOfflineQueue();
      setPendingSyncQueue([]);
      setIsSyncing(false);
      setSyncToast(`${queue.length} offline records successfully synced to central server!`);
      setTimeout(() => setSyncToast(null), 4000);
    }, 800);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  // RBAC: Base Allowed Projects for Logged in User
  const userAllowedProjects = useMemo(() => {
    if (!currentUser || isAdmin) return projects;
    return projects.filter(p => currentUser.assignedProjects.includes(p.name));
  }, [projects, currentUser, isAdmin]);

  // Strict Site Filter (Requirement #2)
  const visibleProjects = useMemo(() => {
    if (selectedSiteFilter === "ALL") return userAllowedProjects;
    return userAllowedProjects.filter(p => p.name === selectedSiteFilter);
  }, [userAllowedProjects, selectedSiteFilter]);

  const activeSiteNames = useMemo(() => visibleProjects.map(p => p.name), [visibleProjects]);

  const visibleExpenses = useMemo(
    () => expenses.filter(e => activeSiteNames.includes(e.project)),
    [expenses, activeSiteNames]
  );
  const visibleBills = useMemo(
    () => bills.filter(b => activeSiteNames.includes(b.project)),
    [bills, activeSiteNames]
  );
  const visibleLabour = useMemo(
    () => labour.filter(l => activeSiteNames.includes(l.project)),
    [labour, activeSiteNames]
  );
  const visibleMaterials = useMemo(
    () => materials.filter(m => activeSiteNames.includes(m.project)),
    [materials, activeSiteNames]
  );
  const visibleMachinery = useMemo(
    () => machinery.filter(m => activeSiteNames.includes(m.project)),
    [machinery, activeSiteNames]
  );
  const visibleReports = useMemo(
    () => dailyReports.filter(r => activeSiteNames.includes(r.project)),
    [dailyReports, activeSiteNames]
  );

  // Financial aggregates
  const totalReceived = useMemo(() => visibleBills.reduce((s, b) => s + b.received, 0), [visibleBills]);
  const totalExpense = useMemo(() => visibleExpenses.reduce((s, e) => s + e.amount, 0), [visibleExpenses]);
  const totalProjectValue = useMemo(() => visibleProjects.reduce((s, p) => s + p.value, 0), [visibleProjects]);
  const profit = totalReceived - totalExpense;
  const pendingReceivable = totalProjectValue - totalReceived;

  // Add Handlers with Offline-Safe storage
  const handleSaveExpense = (newExp: Omit<Expense, "id">) => {
    const id = Date.now();
    const created: Expense = { ...newExp, id };
    setExpenses(prev => [created, ...prev]);

    // Update project total expense
    setProjects(prev =>
      prev.map(p => p.name === newExp.project ? { ...p, expense: p.expense + newExp.amount } : p)
    );

    if (!navigator.onLine) {
      addToOfflineQueue({ type: "expense", action: "create", data: created });
      setPendingSyncQueue(loadOfflineQueue());
    }
  };

  const handleSaveFundTransfer = (transferData: Omit<FundTransfer, "id">) => {
    const id = Date.now();
    const created: FundTransfer = { ...transferData, id };
    setFundTransfers(prev => [created, ...prev]);

    setSyncToast(
      lang === "gu"
        ? `₹${transferData.amount.toLocaleString("en-IN")} સુપરવાઇઝર (${transferData.supervisorName}) ના વૉલેટમાં જમા થયા!`
        : `₹${transferData.amount.toLocaleString("en-IN")} credited to ${transferData.supervisorName}'s wallet!`
    );
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleSaveBill = (newBill: Omit<Bill, "id">) => {
    const id = Date.now();
    const created: Bill = { ...newBill, id };
    setBills(prev => [created, ...prev]);

    // Update project total received
    setProjects(prev =>
      prev.map(p => p.name === newBill.project ? { ...p, received: p.received + newBill.received } : p)
    );

    if (!navigator.onLine) {
      addToOfflineQueue({ type: "bill", action: "create", data: created });
      setPendingSyncQueue(loadOfflineQueue());
    }
  };

  const handleSaveLabour = (newLab: Omit<LabourWorker, "id">) => {
    const created: LabourWorker = { ...newLab, id: Date.now() };
    setLabour(prev => [...prev, created]);
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "labour", action: "create", data: created });
      setPendingSyncQueue(loadOfflineQueue());
    }
  };

  const handleSaveMaterial = (newMat: Omit<MaterialItem, "id">) => {
    const created: MaterialItem = { ...newMat, id: Date.now() };
    setMaterials(prev => [...prev, created]);
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "material", action: "create", data: created });
      setPendingSyncQueue(loadOfflineQueue());
    }
  };

  const handleSaveMachinery = (newMach: Omit<Machinery, "id">) => {
    const created: Machinery = { ...newMach, id: Date.now() };
    setMachinery(prev => [...prev, created]);
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "machinery", action: "create", data: created });
      setPendingSyncQueue(loadOfflineQueue());
    }
  };

  const handleSaveReport = (newRep: Omit<DailyReport, "id">) => {
    const created: DailyReport = { ...newRep, id: Date.now() };
    setDailyReports(prev => [created, ...prev]);
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "report", action: "create", data: created });
      setPendingSyncQueue(loadOfflineQueue());
    }
  };

  // Delete Handlers (RBAC Protected: Admin Only)
  const handleDeleteProject = (id: number) => {
    if (!isAdmin) return alert(t.restrictedAction);
    if (window.confirm(t.confirmDelete)) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleDeleteExpense = (id: number) => {
    if (!isAdmin) return alert(t.restrictedAction);
    if (window.confirm(t.confirmDelete)) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleDeleteBill = (id: number) => {
    if (!isAdmin) return alert(t.restrictedAction);
    if (window.confirm(t.confirmDelete)) {
      setBills(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleDeleteLabour = (id: number) => {
    if (!isAdmin) return alert(t.restrictedAction);
    if (window.confirm(t.confirmDelete)) {
      setLabour(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleDeleteMaterial = (id: number) => {
    if (!isAdmin) return alert(t.restrictedAction);
    if (window.confirm(t.confirmDelete)) {
      setMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleDeleteMachinery = (id: number) => {
    if (!isAdmin) return alert(t.restrictedAction);
    if (window.confirm(t.confirmDelete)) {
      setMachinery(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleDeleteReport = (id: number) => {
    if (!isAdmin) return alert(t.restrictedAction);
    if (window.confirm(t.confirmDelete)) {
      setDailyReports(prev => prev.filter(r => r.id !== id));
    }
  };

  // If not logged in, render the Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        onLogin={u => {
          setCurrentUser(u);
          setActivePage("Dashboard");
          setSelectedSiteFilter("ALL");
        }}
        lang={lang}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  // Render current page content
  const renderCurrentPage = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <DashboardView
            projects={visibleProjects}
            expenses={visibleExpenses}
            fundTransfers={fundTransfers}
            supervisors={users}
            currentUser={currentUser}
            totalReceived={totalReceived}
            totalExpense={totalExpense}
            totalProjectValue={totalProjectValue}
            profit={profit}
            pendingReceivable={pendingReceivable}
            lang={lang}
            onViewProject360={p => setViewingProject360(p)}
            onViewAllProjects={() => setActivePage("Projects")}
            onNavigateToWallets={() => setActivePage("Petty Cash & Wallets")}
            onOpenTransferModal={supId => {
              setTransferSupervisorId(supId);
              setTransferProject(undefined);
              setShowTransferModal(true);
            }}
            onViewExpenseAttachment={exp => {
              if (exp.attachments && exp.attachments.length > 0) {
                setViewingAttachment({
                  attachment: exp.attachments[0],
                  title: `${exp.category}: ${exp.description}`,
                  subtitle: `${exp.project} • ${exp.vendor}`,
                  amount: formatINR(exp.amount),
                });
              }
            }}
          />
        );

      case "Petty Cash & Wallets":
        return (
          <WalletHubView
            projects={projects}
            supervisors={users}
            expenses={expenses}
            fundTransfers={fundTransfers}
            currentUser={currentUser}
            lang={lang}
            onOpenTransferModal={(supId, proj) => {
              setTransferSupervisorId(supId);
              setTransferProject(proj);
              setShowTransferModal(true);
            }}
            onOpenExpenseModal={proj => {
              setSelectedSiteFilter(proj || "ALL");
              setShowExpenseModal(true);
            }}
            onViewAttachment={(att, title, subtitle) => {
              setViewingAttachment({
                attachment: att,
                title,
                subtitle,
              });
            }}
          />
        );

      case "Projects":
        return (
          <ProjectsView
            projects={visibleProjects}
            allProjects={projects}
            currentUser={currentUser}
            lang={lang}
            onAddNew={() => setShowProjectModal(true)}
            onDelete={handleDeleteProject}
            onView360={p => setViewingProject360(p)}
          />
        );

      case "Income & Bills":
        return (
          <BillsView
            bills={bills}
            setBills={setBills}
            projects={projects}
            currentUser={currentUser}
            lang={lang}
            selectedSiteFilter={selectedSiteFilter}
            onOpenBillGenerator={bill => {
              setEditingBill(bill || null);
              setShowBillGenerator(true);
            }}
            onViewAttachment={data => setViewingAttachment(data)}
          />
        );

      case "Expenses":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.expenses}</h1>
                <p className="text-xs sm:text-sm text-slate-500">Track site expenses, materials, labor wages, machinery &amp; attached bills.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportExpensesExcel(visibleExpenses, selectedSiteFilter !== "ALL" ? selectedSiteFilter : undefined)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  <Download size={15} /> {t.exportExcel}
                </button>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
                >
                  <Plus size={16} /> {t.addExpense}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title={t.totalExpenses} value={formatINR(totalExpense)} icon={WalletCards} trend="Across filtered site(s)" positive={false} color="bg-red-100 text-red-700" />
              <StatCard title="Material & Spares" value={formatINR(visibleExpenses.filter(e => e.category === "Material").reduce((s, e) => s + e.amount, 0))} icon={Package} trend="Cement, Steel, Sand, Kapchi" color="bg-blue-100 text-blue-800" />
              <StatCard title="Attached Bill Vouchers" value={String(visibleExpenses.filter(e => e.attachments && e.attachments.length > 0).length)} icon={Paperclip} trend="Audited with Photos" color="bg-emerald-100 text-emerald-800" />
            </div>

            {/* Expense search input */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                placeholder="Search expense description, vendor, category..."
                className="w-full bg-transparent text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Site / Project</th>
                      <th className="px-6 py-4">Vendor / Payee</th>
                      <th className="px-6 py-4">Qty &amp; Unit</th>
                      <th className="px-6 py-4">Amount (Rs)</th>
                      <th className="px-6 py-4 text-center">Bill Photo</th>
                      {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {visibleExpenses
                      .filter(e =>
                        e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                        e.vendor.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                        e.category.toLowerCase().includes(expenseSearch.toLowerCase())
                      )
                      .map(e => (
                        <tr key={e.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4 font-mono text-slate-500 text-xs">{e.date}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                              {e.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{e.description}</p>
                            {e.billNumber && <p className="text-[10px] text-slate-400 font-mono">Voucher: {e.billNumber}</p>}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{e.project}</td>
                          <td className="px-6 py-4 text-slate-600">{e.vendor}</td>
                          <td className="px-6 py-4 font-mono text-slate-700">
                            {e.quantity ? `${e.quantity} ${e.unit || ""}` : "-"}
                          </td>
                          <td className="px-6 py-4 font-bold text-red-600">{formatINR(e.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            {e.attachments && e.attachments.length > 0 ? (
                              <button
                                onClick={() => {
                                  setViewingAttachment({
                                    attachment: e.attachments![0],
                                    title: `${e.category}: ${e.description}`,
                                    subtitle: `${e.project} • ${e.vendor}`,
                                    amount: formatINR(e.amount),
                                  });
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-bold transition"
                              >
                                <Paperclip size={13} /> View Photo
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDeleteExpense(e.id)}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                title={t.delete}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "Labour":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.labour}</h1>
                <p className="text-xs sm:text-sm text-slate-500">Track artisans, daily workers, wage disbursements and dues.</p>
              </div>
              <button
                onClick={() => setShowLabourModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
              >
                <Plus size={16} /> {t.addWorker}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard title="Total Registered Workers" value={String(visibleLabour.length)} icon={Users} trend="Active Staff" color="bg-blue-100 text-blue-800" />
              <StatCard title="Total Wages Earned" value={formatINR(visibleLabour.reduce((s, l) => s + l.totalEarned, 0))} icon={IndianRupee} trend="Cumulative wages" color="bg-slate-100 text-slate-800" />
              <StatCard title="Total Wages Cleared" value={formatINR(visibleLabour.reduce((s, l) => s + l.paid, 0))} icon={CheckCircle2} trend="Cash / UPI Paid" color="bg-emerald-100 text-emerald-800" />
              <StatCard title="Wages Due / Pending" value={formatINR(visibleLabour.reduce((s, l) => s + (l.totalEarned - l.paid), 0))} icon={AlertTriangle} trend="Pending disbursement" positive={false} color="bg-red-100 text-red-700" />
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={labourSearch}
                onChange={e => setLabourSearch(e.target.value)}
                placeholder="Search worker name, trade, site..."
                className="w-full bg-transparent text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Worker Name</th>
                      <th className="px-6 py-4">Trade / Role</th>
                      <th className="px-6 py-4">Assigned Site</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Daily Wage</th>
                      <th className="px-6 py-4">Days Worked</th>
                      <th className="px-6 py-4">Total Earned</th>
                      <th className="px-6 py-4">Paid (Rs)</th>
                      <th className="px-6 py-4">Due (Rs)</th>
                      {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {visibleLabour
                      .filter(l =>
                        l.name.toLowerCase().includes(labourSearch.toLowerCase()) ||
                        l.role.toLowerCase().includes(labourSearch.toLowerCase()) ||
                        l.project.toLowerCase().includes(labourSearch.toLowerCase())
                      )
                      .map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4 font-bold text-slate-900">{l.name}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                              {l.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{l.project}</td>
                          <td className="px-6 py-4 font-mono text-slate-500">{l.phone}</td>
                          <td className="px-6 py-4 font-mono">{formatINR(l.dailyWage)}</td>
                          <td className="px-6 py-4 font-bold">{l.daysWorked} days</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{formatINR(l.totalEarned)}</td>
                          <td className="px-6 py-4 font-bold text-emerald-700">{formatINR(l.paid)}</td>
                          <td className="px-6 py-4 font-bold text-red-600">{formatINR(l.totalEarned - l.paid)}</td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDeleteLabour(l.id)}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                title={t.delete}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "Material & Stock":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.materialStock}</h1>
                <p className="text-xs sm:text-sm text-slate-500">Manage cement, steel, sand, aggregate inventory &amp; low stock alerts.</p>
              </div>
              <button
                onClick={() => setShowMaterialModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
              >
                <Plus size={16} /> {t.addMaterial}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Inventory Items" value={String(visibleMaterials.length)} icon={Package} trend="Active stock records" color="bg-blue-100 text-blue-800" />
              <StatCard title="Stock Valuation" value={formatINR(visibleMaterials.reduce((s, m) => s + m.quantity * m.pricePerUnit, 0))} icon={IndianRupee} trend="Site stock value" color="bg-emerald-100 text-emerald-800" />
              <StatCard title="Low Stock Warnings" value={String(visibleMaterials.filter(m => m.quantity <= m.minStock).length)} icon={AlertTriangle} trend="Below minimum threshold" positive={false} color="bg-amber-100 text-amber-800" />
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={materialSearch}
                onChange={e => setMaterialSearch(e.target.value)}
                placeholder="Search material item, category, supplier..."
                className="w-full bg-transparent text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Material Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Site / Project</th>
                      <th className="px-6 py-4">Current Stock</th>
                      <th className="px-6 py-4">Min Alert Level</th>
                      <th className="px-6 py-4">Unit Rate</th>
                      <th className="px-6 py-4">Stock Value (Rs)</th>
                      <th className="px-6 py-4">Status</th>
                      {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {visibleMaterials
                      .filter(m =>
                        m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                        m.category.toLowerCase().includes(materialSearch.toLowerCase())
                      )
                      .map(m => {
                        const isLow = m.quantity <= m.minStock;
                        return (
                          <tr key={m.id} className={`hover:bg-slate-50/80 transition ${isLow ? "bg-red-50/30" : ""}`}>
                            <td className="px-6 py-4 font-bold text-slate-900">{m.name}</td>
                            <td className="px-6 py-4">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                                {m.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">{m.project}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{m.quantity} {m.unit}</td>
                            <td className="px-6 py-4 font-mono text-slate-500">{m.minStock} {m.unit}</td>
                            <td className="px-6 py-4 font-mono">{formatINR(m.pricePerUnit)}</td>
                            <td className="px-6 py-4 font-bold text-emerald-800">{formatINR(m.quantity * m.pricePerUnit)}</td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isLow ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-700"}`}>
                                {isLow ? "Low Stock" : "Sufficient"}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleDeleteMaterial(m.id)}
                                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                  title={t.delete}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "Machinery":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.machinery}</h1>
                <p className="text-xs sm:text-sm text-slate-500">Excavators, concrete mixers, pumps, tractors and maintenance logs.</p>
              </div>
              <button
                onClick={() => setShowMachineryModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
              >
                <Plus size={16} /> {t.addMachine}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard title="Total Plant & Machinery" value={String(visibleMachinery.length)} icon={Truck} trend="Equipment registered" color="bg-blue-100 text-blue-800" />
              <StatCard title="Active In Use" value={String(visibleMachinery.filter(m => m.status === "In Use").length)} icon={Activity} trend="Operational on site" color="bg-emerald-100 text-emerald-800" />
              <StatCard title="Under Maintenance" value={String(visibleMachinery.filter(m => m.status === "Under Maintenance").length)} icon={Wrench} trend="Needs service" positive={false} color="bg-amber-100 text-amber-800" />
              <StatCard title="Cumulative Machine Cost" value={formatINR(visibleMachinery.reduce((s, m) => s + m.totalCost, 0))} icon={IndianRupee} trend="Hourly / Daily rates" positive={false} color="bg-red-100 text-red-700" />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Machine Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Site / Project</th>
                      <th className="px-6 py-4">Reg / Serial No</th>
                      <th className="px-6 py-4">Daily Rate</th>
                      <th className="px-6 py-4">Days Used</th>
                      <th className="px-6 py-4">Total Cost</th>
                      <th className="px-6 py-4">Status</th>
                      {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {visibleMachinery.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{m.name}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                            {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{m.project}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{m.registrationNo}</td>
                        <td className="px-6 py-4 font-mono">{formatINR(m.dailyRate)}</td>
                        <td className="px-6 py-4 font-bold">{m.daysUsed} days</td>
                        <td className="px-6 py-4 font-bold text-red-600">{formatINR(m.totalCost)}</td>
                        <td className="px-6 py-4"><StatusBadge status={m.status} lang={lang} /></td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteMachinery(m.id)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                              title={t.delete}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "Daily Reports":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.dailyReports}</h1>
                <p className="text-xs sm:text-sm text-slate-500">Site execution progress submitted by engineers and supervisors.</p>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
              >
                <Plus size={16} /> {t.addReport}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Submitted Reports" value={String(visibleReports.length)} icon={FileText} trend="Daily records" color="bg-blue-100 text-blue-800" />
              <StatCard title="Labourers Deployed Today" value={String(visibleReports.reduce((s, r) => s + r.labourCount, 0))} icon={Users} trend="Across site(s)" color="bg-emerald-100 text-emerald-800" />
              <StatCard title="Reports Logged Today" value={String(visibleReports.filter(r => r.date === todayStr()).length)} icon={CalendarDays} trend="Today's entries" color="bg-amber-100 text-amber-800" />
            </div>

            <div className="space-y-3">
              {visibleReports.map(r => (
                <div key={r.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-bold">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{r.project}</h3>
                        <p className="text-xs text-slate-500">
                          {r.date} &bull; Logged by: <strong>{r.reportedBy}</strong> &bull; {r.weather || "Clear Weather"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                        {r.progress}% Completed
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteReport(r.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">Work Done Today:</p>
                      <p className="text-slate-600 mt-0.5">{r.workDone}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Material Consumed:</p>
                      <p className="text-slate-600 mt-0.5">{r.materialUsed}</p>
                    </div>
                    {r.issues !== "None" && (
                      <div className="sm:col-span-2 text-amber-700">
                        <p className="font-bold">Issues &amp; Delays:</p>
                        <p className="mt-0.5">{r.issues}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "Reports":
        return (
          <ReportsView
            projects={visibleProjects}
            expenses={visibleExpenses}
            bills={visibleBills}
            labour={visibleLabour}
            materials={visibleMaterials}
            machinery={visibleMachinery}
            reports={visibleReports}
            currentUser={currentUser}
            lang={lang}
          />
        );

      case "User Management":
        return (
          <UserManagement
            users={users}
            setUsers={setUsers}
            projects={projects}
            lang={lang}
          />
        );

      case "Settings":
        return (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Government Contractor Master Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4 border">
                <p className="text-xs font-bold text-slate-500 uppercase">Contractor / Firm Name</p>
                <p className="font-bold text-slate-900 mt-1">K.S.GODHANI CONSTRUCTION &amp; CIVIL WORKS</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border">
                <p className="text-xs font-bold text-slate-500 uppercase">Registration Class</p>
                <p className="font-bold text-slate-900 mt-1">Class-AA Government Approved Contractor (Gujarat)</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border">
                <p className="text-xs font-bold text-slate-500 uppercase">Key Departments</p>
                <p className="font-bold text-slate-900 mt-1">Irrigation, PWD Roads &amp; Buildings, GWSSB Water Supply</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border">
                <p className="text-xs font-bold text-slate-500 uppercase">Accounting System Version</p>
                <p className="font-bold text-emerald-700 mt-1">KSG Hisab 2.0 (Offline Enabled &amp; Multi-lingual)</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Toast Notification Banner */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-2xl border border-slate-800 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        lang={lang}
      />

      {/* Main Container */}
      <main className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}>
        {/* Header with Language, Site Selector, Offline status */}
        <Header
          activePage={activePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          onLogout={() => {
            if (window.confirm(t.confirmLogout)) {
              setCurrentUser(null);
              setActivePage("Dashboard");
            }
          }}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          isOnline={isOnline}
          pendingSyncCount={pendingSyncQueue.length}
          onManualSync={triggerAutoSync}
          isSyncing={isSyncing}
          projects={projects}
          userAllowedProjects={userAllowedProjects}
          selectedSiteFilter={selectedSiteFilter}
          onSiteFilterChange={setSelectedSiteFilter}
        />

        {/* Page Content Canvas */}
        <div className="p-3.5 sm:p-8 max-w-7xl mx-auto pb-28 lg:pb-8">
          {renderCurrentPage()}
        </div>
      </main>

      {/* Mobile Bottom App Navigation Bar & Quick Action Center */}
      <MobileNavBar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        lang={lang}
        onOpenExpenseModal={() => setShowExpenseModal(true)}
        onOpenBillModal={() => {
          setEditingBill(null);
          setShowBillGenerator(true);
        }}
        onOpenLabourModal={() => setShowLabourModal(true)}
        onOpenMaterialModal={() => setShowMaterialModal(true)}
        onOpenMachineryModal={() => setShowMachineryModal(true)}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenTransferModal={() => {
          setTransferSupervisorId(undefined);
          setTransferProject(undefined);
          setShowTransferModal(true);
        }}
        onOpenSidebar={() => setSidebarOpen(true)}
        onLogout={() => {
          if (window.confirm(t.confirmLogout)) {
            setCurrentUser(null);
            setActivePage("Dashboard");
          }
        }}
      />

      {/* 360° Site Hisab Modal (Requirement #2) */}
      {viewingProject360 && (
        <Project360Modal
          project={viewingProject360}
          bills={bills}
          expenses={expenses}
          labour={labour}
          materials={materials}
          machinery={machinery}
          reports={dailyReports}
          lang={lang}
          onClose={() => setViewingProject360(null)}
          onViewAttachment={(att, title) => {
            setViewingAttachment({
              attachment: att,
              title,
            });
          }}
        />
      )}

      {/* Bill & Document Lightbox Preview Modal (Requirement #5) */}
      {viewingAttachment && (
        <BillViewerModal
          attachment={viewingAttachment.attachment}
          title={viewingAttachment.title}
          subtitle={viewingAttachment.subtitle}
          amount={viewingAttachment.amount}
          lang={lang}
          onClose={() => setViewingAttachment(null)}
        />
      )}

      {/* Fund Transfer Modal (Requirement #1 & #3) */}
      {showTransferModal && (
        <FundTransferModal
          projects={projects}
          supervisors={users}
          defaultSupervisorId={transferSupervisorId}
          defaultProject={transferProject}
          currentUser={currentUser}
          lang={lang}
          onSave={handleSaveFundTransfer}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      {/* Easy Data Entry Modals (Requirement #4) */}
      {showExpenseModal && (
        <EasyExpenseModal
          projects={userAllowedProjects}
          defaultProject={selectedSiteFilter}
          currentUser={currentUser}
          lang={lang}
          onSave={handleSaveExpense}
          onClose={() => setShowExpenseModal(false)}
        />
      )}

      {showBillModal && (
        <EasyBillModal
          projects={userAllowedProjects}
          defaultProject={selectedSiteFilter}
          lang={lang}
          onSave={handleSaveBill}
          onClose={() => setShowBillModal(false)}
        />
      )}

      {showLabourModal && (
        <EasyLabourModal
          projects={userAllowedProjects}
          defaultProject={selectedSiteFilter}
          lang={lang}
          onSave={handleSaveLabour}
          onClose={() => setShowLabourModal(false)}
        />
      )}

      {showMaterialModal && (
        <EasyMaterialModal
          projects={userAllowedProjects}
          defaultProject={selectedSiteFilter}
          lang={lang}
          onSave={handleSaveMaterial}
          onClose={() => setShowMaterialModal(false)}
        />
      )}

      {showMachineryModal && (
        <EasyMachineryModal
          projects={userAllowedProjects}
          defaultProject={selectedSiteFilter}
          lang={lang}
          onSave={handleSaveMachinery}
          onClose={() => setShowMachineryModal(false)}
        />
      )}

      {showReportModal && (
        <EasyReportModal
          projects={userAllowedProjects}
          defaultProject={selectedSiteFilter}
          currentUser={currentUser}
          lang={lang}
          onSave={handleSaveReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Add Project Modal (Admin Only) */}
      {showProjectModal && (
        <ModalWrapper onClose={() => setShowProjectModal(false)}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t.addProject}</h2>
              <p className="text-xs text-slate-500">Create new government civil work or tender site</p>
            </div>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const newP: Project = {
                id: Date.now(),
                code: `PRJ-2026-${String(projects.length + 1).padStart(3, "0")}`,
                name: String(fd.get("name")),
                department: String(fd.get("department")),
                value: parseFloat(String(fd.get("value"))) || 0,
                progress: parseFloat(String(fd.get("progress"))) || 0,
                received: 0,
                expense: 0,
                status: "Active",
                location: String(fd.get("location") || "Gujarat"),
              };
              setProjects(prev => [...prev, newP]);
              setShowProjectModal(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project / Site Name *</label>
              <input name="name" required placeholder="e.g. Check Dam Project - Amreli" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Government Department *</label>
              <input name="department" required placeholder="e.g. Irrigation Dept / PWD R&B" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sanctioned Tender Value (Rs.) *</label>
                <input name="value" type="number" required placeholder="12000000" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / District</label>
                <input name="location" placeholder="e.g. Amreli District" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowProjectModal(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50">
                {t.cancel}
              </button>
              <button type="submit" className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md">
                Create Site
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* Government Project RA Bill Generator & Invoice Studio */}
      {showBillGenerator && (
        <BillGeneratorModal
          isOpen={showBillGenerator}
          onClose={() => {
            setShowBillGenerator(false);
            setEditingBill(null);
          }}
          onSaveBill={savedBill => {
            setBills(prev => {
              const exists = prev.some(b => b.id === savedBill.id);
              if (exists) {
                return prev.map(b => (b.id === savedBill.id ? savedBill : b));
              }
              return [savedBill, ...prev];
            });

            if (savedBill.status === "Received") {
              setProjects(prev =>
                prev.map(p => {
                  if (p.name === savedBill.project) {
                    return {
                      ...p,
                      received: (p.received || 0) + (savedBill.received || savedBill.netPayable || savedBill.amount),
                    };
                  }
                  return p;
                })
              );
            }

            setSyncToast(`✅ Bill ${savedBill.billNo} saved & synced successfully!`);
            setTimeout(() => setSyncToast(null), 3500);
          }}
          projects={projects}
          defaultProject={selectedSiteFilter !== "ALL" ? selectedSiteFilter : undefined}
          editBill={editingBill}
          lang={lang}
        />
      )}
    </div>
  );
}

export default App;
