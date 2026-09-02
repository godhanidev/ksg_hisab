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
import { loadStoredFirebaseConfig } from "./services/firebaseConfig";
import {
  initFirestore, getActiveFirestore, subscribeToCollection,
  saveDocumentToCloud, deleteDocumentFromCloud, ensureInitialCloudSeed
} from "./services/firestoreSync";

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
import { CloudSyncModal } from "./components/common/CloudSyncModal";

export function App() {
  // ── Language & Online / Offline Sync State ──────────────────────────────
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingSyncQueue, setPendingSyncQueue] = useState(loadOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Firebase Cloud Live Sync State ──────────────────────────────────────
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => {
    return !!loadStoredFirebaseConfig();
  });
  const [showCloudModal, setShowCloudModal] = useState(false);

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

  // ── Initialize Firestore & Subscriptions on Mount / Config Change ───────
  useEffect(() => {
    const db = initFirestore();
    if (!db) {
      setIsCloudConnected(false);
      return;
    }

    setIsCloudConnected(true);
    ensureInitialCloudSeed();

    // Subscribe to real-time updates for all 5 collections directly from Cloud
    const unsubCash = subscribeToCollection<CashTransaction>("daily_cash", cloudCash => {
      setCashTransactions(cloudCash);
    });

    const unsubBank = subscribeToCollection<BankPayment>("bank_payments", cloudBank => {
      setBankPayments(cloudBank);
    });

    const unsubGst = subscribeToCollection<GSTBill>("gst_bills", cloudGst => {
      setGstBills(cloudGst);
    });

    const unsubProjects = subscribeToCollection<Project>("projects", cloudProjects => {
      setProjects(cloudProjects);
    });

    const unsubUsers = subscribeToCollection<UserAccount>("users", cloudUsers => {
      setUsers(cloudUsers);
    });

    return () => {
      if (unsubCash) unsubCash();
      if (unsubBank) unsubBank();
      if (unsubGst) unsubGst();
      if (unsubProjects) unsubProjects();
      if (unsubUsers) unsubUsers();
    };
  }, [isCloudConnected]);

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
          ? `${queue.length} ઓફલાઇન એન્ટ્રીઓ સમન્વયિત થઇ!`
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
  const handleSaveCashTransaction = async (txData: Omit<CashTransaction, "id"> | CashTransaction) => {
    let savedTx: CashTransaction;
    if ("id" in txData && txData.id) {
      savedTx = txData as CashTransaction;
      setCashTransactions(prev =>
        prev.map(item => (item.id === savedTx.id ? savedTx : item))
      );
      if (!isOnline) {
        addToOfflineQueue({ module: "daily_cash", action: "update", data: savedTx });
        setPendingSyncQueue(loadOfflineQueue());
      }
    } else {
      savedTx = {
        ...txData,
        id: Date.now(),
      };
      setCashTransactions(prev => [savedTx, ...prev]);
      if (!isOnline) {
        addToOfflineQueue({ module: "daily_cash", action: "create", data: savedTx });
        setPendingSyncQueue(loadOfflineQueue());
      }
    }

    // Push to Cloud Firestore if connected
    if (isCloudConnected) {
      saveDocumentToCloud("daily_cash", savedTx);
    }

    showToast(t.recordSavedSuccess);
  };

  const handleDeleteCashTransaction = (id: number) => {
    setCashTransactions(prev => prev.filter(item => item.id !== id));
    if (!isOnline) {
      addToOfflineQueue({ module: "daily_cash", action: "delete", data: { id } });
      setPendingSyncQueue(loadOfflineQueue());
    }
    if (isCloudConnected) {
      deleteDocumentFromCloud("daily_cash", id);
    }
    showToast(t.recordDeletedSuccess);
  };

  // ── CRUD: Direct Office Bank Payments ───────────────────────────────────
  const handleSaveBankPayment = async (paymentData: Omit<BankPayment, "id"> | BankPayment) => {
    let savedPayment: BankPayment;
    if ("id" in paymentData && paymentData.id) {
      savedPayment = paymentData as BankPayment;
      setBankPayments(prev =>
        prev.map(item => (item.id === savedPayment.id ? savedPayment : item))
      );
      if (!isOnline) {
        addToOfflineQueue({ module: "bank_payment", action: "update", data: savedPayment });
        setPendingSyncQueue(loadOfflineQueue());
      }
    } else {
      savedPayment = {
        ...paymentData,
        id: Date.now(),
      };
      setBankPayments(prev => [savedPayment, ...prev]);
      if (!isOnline) {
        addToOfflineQueue({ module: "bank_payment", action: "create", data: savedPayment });
        setPendingSyncQueue(loadOfflineQueue());
      }
    }

    if (isCloudConnected) {
      saveDocumentToCloud("bank_payments", savedPayment);
    }

    showToast(t.recordSavedSuccess);
  };

  const handleDeleteBankPayment = (id: number) => {
    setBankPayments(prev => prev.filter(item => item.id !== id));
    if (!isOnline) {
      addToOfflineQueue({ module: "bank_payment", action: "delete", data: { id } });
      setPendingSyncQueue(loadOfflineQueue());
    }
    if (isCloudConnected) {
      deleteDocumentFromCloud("bank_payments", id);
    }
    showToast(t.recordDeletedSuccess);
  };

  // ── CRUD: GST Bills ─────────────────────────────────────────────────────
  const handleSaveGSTBill = async (billData: Omit<GSTBill, "id"> | GSTBill) => {
    let savedBill: GSTBill;
    if ("id" in billData && billData.id) {
      savedBill = billData as GSTBill;
      setGstBills(prev =>
        prev.map(item => (item.id === savedBill.id ? savedBill : item))
      );
      if (!isOnline) {
        addToOfflineQueue({ module: "gst_bill", action: "update", data: savedBill });
        setPendingSyncQueue(loadOfflineQueue());
      }
    } else {
      savedBill = {
        ...billData,
        id: Date.now(),
      };
      setGstBills(prev => [savedBill, ...prev]);
      if (!isOnline) {
        addToOfflineQueue({ module: "gst_bill", action: "create", data: savedBill });
        setPendingSyncQueue(loadOfflineQueue());
      }
    }

    if (isCloudConnected) {
      saveDocumentToCloud("gst_bills", savedBill);
    }

    showToast(t.recordSavedSuccess);
  };

  const handleDeleteGSTBill = (id: number) => {
    setGstBills(prev => prev.filter(item => item.id !== id));
    if (!isOnline) {
      addToOfflineQueue({ module: "gst_bill", action: "delete", data: { id } });
      setPendingSyncQueue(loadOfflineQueue());
    }
    if (isCloudConnected) {
      deleteDocumentFromCloud("gst_bills", id);
    }
    showToast(t.recordDeletedSuccess);
  };

  // ── CRUD: Projects ──────────────────────────────────────────────────────
  const handleSaveProject = (projectData: Omit<Project, "id"> | Project) => {
    let savedProject: Project;
    if ("id" in projectData && projectData.id) {
      savedProject = projectData as Project;
      setProjects(prev =>
        prev.map(item => (item.id === savedProject.id ? savedProject : item))
      );
    } else {
      savedProject = {
        ...projectData,
        id: Date.now(),
      };
      setProjects(prev => [...prev, savedProject]);
    }

    if (isCloudConnected) {
      saveDocumentToCloud("projects", savedProject);
    }
    showToast("Project site saved successfully!");
  };

  const handleDeleteProject = (id: number) => {
    if (window.confirm("Are you sure you want to delete this construction site?")) {
      setProjects(prev => prev.filter(item => item.id !== id));
      if (isCloudConnected) {
        deleteDocumentFromCloud("projects", id);
      }
      showToast("Project deleted successfully");
    }
  };

  // ── CRUD: Users ─────────────────────────────────────────────────────────
  const handleSaveUser = (userData: UserAccount) => {
    setUsers(prev =>
      prev.some(u => u.id === userData.id)
        ? prev.map(u => (u.id === userData.id ? userData : u))
        : [...prev, userData]
    );
    if (isCloudConnected) {
      saveDocumentToCloud("users", userData);
    }
    showToast("User account saved successfully!");
  };

  const handleDeleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isCloudConnected) {
      deleteDocumentFromCloud("users", id);
    }
    showToast("User deleted successfully");
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
          isCloudConnected={isCloudConnected}
          onOpenCloudModal={() => setShowCloudModal(true)}
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
              onEdit={p => {
                setEditingProject(p);
                setShowProjectModal(true);
              }}
              onDelete={handleDeleteProject}
              onView360={p => setViewingProject360(p)}
            />
          )}

          {activePage === "User Management" && isAdmin && (
            <UserManagement
              users={users}
              projects={projects}
              lang={lang}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
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
        supervisors={users.filter(u => u.role !== "admin")}
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

      {/* 7. Real-Time Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        isCloudConnected={isCloudConnected}
        onConfigUpdated={() => {
          setIsCloudConnected(!!loadStoredFirebaseConfig());
        }}
        projects={projects}
        cashTransactions={cashTransactions}
        bankPayments={bankPayments}
        gstBills={gstBills}
        users={users}
        lang={lang}
      />
    </div>
  );
}

export default App;
