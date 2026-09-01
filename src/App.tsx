import React, { useState, useEffect, useMemo } from "react";
import {
  Attachment, BankPayment, CashTransaction, CashTransactionType,
  GSTBill, Language, Project, UserAccount
} from "./types";
import { getTranslation } from "./i18n/translations";
import { formatINR, todayStr } from "./utils/formatters";
import {
  loadStoredCollection, saveStoredCollection, loadStoredSession, saveStoredSession,
  loadOfflineQueue, addToOfflineQueue, clearOfflineQueue, getStoredLanguage, setStoredLanguage
} from "./utils/storageUtils";
import {
  initialUsers, initialProjects, initialCashTransactions,
  initialBankPayments, initialGSTBills
} from "./data/initialData";

import { Header } from "./components/common/Header";
import { Sidebar } from "./components/common/Sidebar";
import { MobileNavBar } from "./components/common/MobileNavBar";
import { LoginPage } from "./components/auth/LoginPage";
import { UserManagement } from "./components/auth/UserManagement";
import { DashboardView } from "./components/dashboard/DashboardView";
import { DailyCashView } from "./components/cash/DailyCashView";
import { BankPaymentsView } from "./components/bank/BankPaymentsView";
import { GSTBillsView } from "./components/gst/GSTBillsView";
import { ProjectsView } from "./components/projects/ProjectsView";
import { Project360Modal } from "./components/projects/Project360Modal";
import { ProjectModal } from "./components/projects/ProjectModal";
import { CashTransactionModal } from "./components/forms/CashTransactionModal";
import { BankPaymentModal } from "./components/forms/BankPaymentModal";
import { GSTBillModal } from "./components/forms/GSTBillModal";
import { BillViewerModal } from "./components/documents/BillViewerModal";

export function App() {
  // ── Language & Online / Offline Sync State ──────────────────────────────
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingSyncQueue, setPendingSyncQueue] = useState(loadOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── User Session & Navigation State ─────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = loadStoredSession();
    if (saved && saved.username === "admin") {
      return { ...saved, name: "Kanjibhai S. Godhani (Head Office)" };
    }
    return saved;
  });

  const [activePage, setActivePage] = useState<string>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("ALL");

  // ── 3 Core Collections + Projects + Users ───────────────────────────────
  const [projects, setProjects] = useState<Project[]>(() =>
    loadStoredCollection<Project[]>("projects", initialProjects)
  );
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() =>
    loadStoredCollection<CashTransaction[]>("daily_cash", initialCashTransactions)
  );
  const [bankPayments, setBankPayments] = useState<BankPayment[]>(() =>
    loadStoredCollection<BankPayment[]>("bank_payments", initialBankPayments)
  );
  const [gstBills, setGstBills] = useState<GSTBill[]>(() =>
    loadStoredCollection<GSTBill[]>("gst_bills", initialGSTBills)
  );
  const [users, setUsers] = useState<UserAccount[]>(() =>
    loadStoredCollection<UserAccount[]>("users", initialUsers)
  );

  // ── Modals & Viewers State ──────────────────────────────────────────────
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<CashTransactionType>("cash_out");
  const [editingCashTx, setEditingCashTx] = useState<CashTransaction | null>(null);

  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBankPayment, setEditingBankPayment] = useState<BankPayment | null>(null);

  const [showGstModal, setShowGstModal] = useState(false);
  const [editingGstBill, setEditingGstBill] = useState<GSTBill | null>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [viewingProject360, setViewingProject360] = useState<Project | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<{
    attachment: Attachment;
    title: string;
    subtitle?: string;
    amount?: string;
  } | null>(null);

  const t = getTranslation(lang);
  const isAdmin = currentUser?.role === "admin";

  // ── Persist Collections to LocalStorage ─────────────────────────────────
  useEffect(() => { saveStoredCollection("projects", projects); }, [projects]);
  useEffect(() => { saveStoredCollection("daily_cash", cashTransactions); }, [cashTransactions]);
  useEffect(() => { saveStoredCollection("bank_payments", bankPayments); }, [bankPayments]);
  useEffect(() => { saveStoredCollection("gst_bills", gstBills); }, [gstBills]);
  useEffect(() => { saveStoredCollection("users", users); }, [users]);
  useEffect(() => { saveStoredSession(currentUser); }, [currentUser]);

  // ── Online / Offline Event Listeners ────────────────────────────────────
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
      showToast(
        lang === "gu"
          ? `${queue.length} ઓફલાઇન એન્ટ્રીઓ સફળતાપૂર્વક સમન્વયિત થઇ!`
          : `Synced ${queue.length} offline entries successfully!`
      );
    }, 800);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  const handleLogout = () => {
    if (window.confirm(t.confirmLogout)) {
      setCurrentUser(null);
      saveStoredSession(null);
    }
  };

  // ── CRUD: Site Daily Cash ───────────────────────────────────────────────
  const handleSaveCashTransaction = (txData: Omit<CashTransaction, "id"> | CashTransaction) => {
    if ("id" in txData && txData.id) {
      // Edit existing
      setCashTransactions(prev =>
        prev.map(item => (item.id === txData.id ? (txData as CashTransaction) : item))
      );
      if (!isOnline) {
        addToOfflineQueue({ module: "daily_cash", action: "update", data: txData });
        setPendingSyncQueue(loadOfflineQueue());
      }
    } else {
      // Create new
      const newTx: CashTransaction = {
        ...txData,
        id: Date.now(),
      };
      setCashTransactions(prev => [newTx, ...prev]);
      if (!isOnline) {
        addToOfflineQueue({ module: "daily_cash", action: "create", data: newTx });
        setPendingSyncQueue(loadOfflineQueue());
      }
    }
    showToast(t.recordSavedSuccess);
  };

  const handleDeleteCashTransaction = (id: number) => {
    setCashTransactions(prev => prev.filter(item => item.id !== id));
    if (!isOnline) {
      addToOfflineQueue({ module: "daily_cash", action: "delete", data: { id } });
      setPendingSyncQueue(loadOfflineQueue());
    }
    showToast(t.recordDeletedSuccess);
  };

  // ── CRUD: Direct Office Bank Payments ───────────────────────────────────
  const handleSaveBankPayment = (paymentData: Omit<BankPayment, "id"> | BankPayment) => {
    if ("id" in paymentData && paymentData.id) {
      setBankPayments(prev =>
        prev.map(item => (item.id === paymentData.id ? (paymentData as BankPayment) : item))
      );
      if (!isOnline) {
        addToOfflineQueue({ module: "bank_payment", action: "update", data: paymentData });
        setPendingSyncQueue(loadOfflineQueue());
      }
    } else {
      const newPayment: BankPayment = {
        ...paymentData,
        id: Date.now(),
      };
      setBankPayments(prev => [newPayment, ...prev]);
      if (!isOnline) {
        addToOfflineQueue({ module: "bank_payment", action: "create", data: newPayment });
        setPendingSyncQueue(loadOfflineQueue());
      }
    }
    showToast(t.recordSavedSuccess);
  };

  const handleDeleteBankPayment = (id: number) => {
    setBankPayments(prev => prev.filter(item => item.id !== id));
    if (!isOnline) {
      addToOfflineQueue({ module: "bank_payment", action: "delete", data: { id } });
      setPendingSyncQueue(loadOfflineQueue());
    }
    showToast(t.recordDeletedSuccess);
  };

  // ── CRUD: GST Bills ─────────────────────────────────────────────────────
  const handleSaveGSTBill = (billData: Omit<GSTBill, "id"> | GSTBill) => {
    if ("id" in billData && billData.id) {
      setGstBills(prev =>
        prev.map(item => (item.id === billData.id ? (billData as GSTBill) : item))
      );
      if (!isOnline) {
        addToOfflineQueue({ module: "gst_bill", action: "update", data: billData });
        setPendingSyncQueue(loadOfflineQueue());
      }
    } else {
      const newBill: GSTBill = {
        ...billData,
        id: Date.now(),
      };
      setGstBills(prev => [newBill, ...prev]);
      if (!isOnline) {
        addToOfflineQueue({ module: "gst_bill", action: "create", data: newBill });
        setPendingSyncQueue(loadOfflineQueue());
      }
    }
    showToast(t.recordSavedSuccess);
  };

  const handleDeleteGSTBill = (id: number) => {
    setGstBills(prev => prev.filter(item => item.id !== id));
    if (!isOnline) {
      addToOfflineQueue({ module: "gst_bill", action: "delete", data: { id } });
      setPendingSyncQueue(loadOfflineQueue());
    }
    showToast(t.recordDeletedSuccess);
  };

  // ── CRUD: Projects ──────────────────────────────────────────────────────
  const handleSaveProject = (projectData: Omit<Project, "id"> | Project) => {
    if ("id" in projectData && projectData.id) {
      setProjects(prev =>
        prev.map(item => (item.id === projectData.id ? (projectData as Project) : item))
      );
    } else {
      const newProject: Project = {
        ...projectData,
        id: Date.now(),
      };
      setProjects(prev => [...prev, newProject]);
    }
    showToast("Project site saved successfully!");
  };

  const handleDeleteProject = (id: number) => {
    if (window.confirm("Are you sure you want to delete this construction site?")) {
      setProjects(prev => prev.filter(item => item.id !== id));
      showToast("Project deleted successfully");
    }
  };

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        onLogin={user => setCurrentUser(user)}
        lang={lang}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  // Filter projects for supervisor
  const userAllowedProjects = isAdmin
    ? projects
    : projects.filter(p => currentUser.assignedProjects.includes(p.name));

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* ── Toast Notification Pill ──────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-slate-950 text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        lang={lang}
      />

      {/* ── Main Layout Wrapper ──────────────────────────────────────────── */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:pl-72" : "lg:pl-20"
        }`}
      >
        {/* Top Sticky Header */}
        <Header
          activePage={activePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          onLogout={handleLogout}
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

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === "Dashboard" && (
            <DashboardView
              projects={projects}
              cashTransactions={cashTransactions}
              bankPayments={bankPayments}
              gstBills={gstBills}
              currentUser={currentUser}
              selectedSiteFilter={selectedSiteFilter}
              setSelectedSiteFilter={setSelectedSiteFilter}
              lang={lang}
              onAddCashIn={() => {
                setEditingCashTx(null);
                setCashModalType("cash_in");
                setShowCashModal(true);
              }}
              onAddCashOut={() => {
                setEditingCashTx(null);
                setCashModalType("cash_out");
                setShowCashModal(true);
              }}
              onAddBankPayment={() => {
                setEditingBankPayment(null);
                setShowBankModal(true);
              }}
              onAddGstBill={() => {
                setEditingGstBill(null);
                setShowGstModal(true);
              }}
              onNavigateToTab={tab => setActivePage(tab)}
              onViewAttachment={data => setViewingAttachment(data)}
              onViewProject360={p => setViewingProject360(p)}
            />
          )}

          {activePage === "Site Daily Cash" && (
            <DailyCashView
              transactions={cashTransactions}
              onAddCashIn={() => {
                setEditingCashTx(null);
                setCashModalType("cash_in");
                setShowCashModal(true);
              }}
              onAddCashOut={() => {
                setEditingCashTx(null);
                setCashModalType("cash_out");
                setShowCashModal(true);
              }}
              onEditTransaction={tx => {
                setEditingCashTx(tx);
                setCashModalType(tx.type);
                setShowCashModal(true);
              }}
              onDeleteTransaction={handleDeleteCashTransaction}
              onViewAttachment={data => setViewingAttachment(data)}
              projects={userAllowedProjects}
              selectedSiteFilter={selectedSiteFilter}
              setSelectedSiteFilter={setSelectedSiteFilter}
              currentUser={currentUser}
              lang={lang}
            />
          )}

          {activePage === "Bank Payments" && (
            <BankPaymentsView
              payments={bankPayments}
              onAddPayment={() => {
                setEditingBankPayment(null);
                setShowBankModal(true);
              }}
              onEditPayment={p => {
                setEditingBankPayment(p);
                setShowBankModal(true);
              }}
              onDeletePayment={handleDeleteBankPayment}
              onViewAttachment={data => setViewingAttachment(data)}
              projects={userAllowedProjects}
              selectedSiteFilter={selectedSiteFilter}
              setSelectedSiteFilter={setSelectedSiteFilter}
              currentUser={currentUser}
              lang={lang}
            />
          )}

          {activePage === "GST Bills" && (
            <GSTBillsView
              bills={gstBills}
              onAddBill={() => {
                setEditingGstBill(null);
                setShowGstModal(true);
              }}
              onEditBill={b => {
                setEditingGstBill(b);
                setShowGstModal(true);
              }}
              onDeleteBill={handleDeleteGSTBill}
              onViewAttachment={data => setViewingAttachment(data)}
              projects={userAllowedProjects}
              selectedSiteFilter={selectedSiteFilter}
              setSelectedSiteFilter={setSelectedSiteFilter}
              currentUser={currentUser}
              lang={lang}
            />
          )}

          {activePage === "Projects" && (
            <ProjectsView
              projects={userAllowedProjects}
              allProjects={projects}
              currentUser={currentUser}
              lang={lang}
              onAddNew={() => {
                setEditingProject(null);
                setShowProjectModal(true);
              }}
              onDelete={handleDeleteProject}
              onView360={p => setViewingProject360(p)}
            />
          )}

          {activePage === "User Management" && isAdmin && (
            <UserManagement
              users={users}
              setUsers={setUsers}
              projects={projects}
              lang={lang}
            />
          )}
        </main>

        {/* ── Mobile Bottom Navigation Bar ───────────────────────────────── */}
        <MobileNavBar
          activePage={activePage}
          setActivePage={setActivePage}
          currentUser={currentUser}
          lang={lang}
          onOpenCashInModal={() => {
            setEditingCashTx(null);
            setCashModalType("cash_in");
            setShowCashModal(true);
          }}
          onOpenCashOutModal={() => {
            setEditingCashTx(null);
            setCashModalType("cash_out");
            setShowCashModal(true);
          }}
          onOpenBankPaymentModal={() => {
            setEditingBankPayment(null);
            setShowBankModal(true);
          }}
          onOpenGstBillModal={() => {
            setEditingGstBill(null);
            setShowGstModal(true);
          }}
          onLogout={handleLogout}
        />
      </div>

      {/* ── Modals & Lightboxes ──────────────────────────────────────────── */}
      {/* 1. Cash Transaction Modal (જમા & ઉધાર) */}
      <CashTransactionModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        onSave={handleSaveCashTransaction}
        editingTransaction={editingCashTx}
        defaultType={cashModalType}
        projects={userAllowedProjects}
        currentUser={currentUser}
        lang={lang}
      />

      {/* 2. Direct Bank Payment Modal */}
      <BankPaymentModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSave={handleSaveBankPayment}
        editingPayment={editingBankPayment}
        projects={userAllowedProjects}
        currentUser={currentUser}
        lang={lang}
      />

      {/* 3. GST Bill Modal */}
      <GSTBillModal
        isOpen={showGstModal}
        onClose={() => setShowGstModal(false)}
        onSave={handleSaveGSTBill}
        editingBill={editingGstBill}
        projects={userAllowedProjects}
        currentUser={currentUser}
        lang={lang}
      />

      {/* 4. Project Site Modal */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSave={handleSaveProject}
        editingProject={editingProject}
        supervisors={users.filter(u => u.role === "supervisor")}
        lang={lang}
      />

      {/* 5. 360 Site Hisab Modal */}
      {viewingProject360 && (
        <Project360Modal
          project={viewingProject360}
          cashTransactions={cashTransactions}
          bankPayments={bankPayments}
          gstBills={gstBills}
          lang={lang}
          onClose={() => setViewingProject360(null)}
          onViewAttachment={data => setViewingAttachment(data)}
        />
      )}

      {/* 6. Lightbox Bill / Receipt Photo Viewer */}
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
    </div>
  );
}

export default App;
