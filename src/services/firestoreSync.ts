// ─── Real-Time Firestore Cloud Synchronizer ───────────────────────────────────

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  initializeFirestore, getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot,
  Firestore, Unsubscribe, getDocs, persistentLocalCache, persistentMultipleTabManager
} from "firebase/firestore";
import { FirebaseConfig, loadStoredFirebaseConfig, DEFAULT_FIREBASE_CONFIG } from "./firebaseConfig";
import { BankPayment, CashTransaction, GSTBill, Project, UserAccount } from "../types";
import {
  initialProjects, initialCashTransactions, initialBankPayments,
  initialGSTBills, initialUsers
} from "../data/initialData";

let firestoreInstance: Firestore | null = null;
let firebaseAppInstance: FirebaseApp | null = null;

export function initFirestore(customConfig?: FirebaseConfig | null): Firestore | null {
  const config = customConfig || loadStoredFirebaseConfig() || DEFAULT_FIREBASE_CONFIG;
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (!firebaseAppInstance) {
      const apps = getApps();
      if (apps.length > 0) {
        firebaseAppInstance = apps[0];
      } else {
        firebaseAppInstance = initializeApp(config);
      }
    }

    // Try initializing Firestore with persistent multi-tab local cache
    try {
      firestoreInstance = initializeFirestore(firebaseAppInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Fallback if already initialized
      firestoreInstance = getFirestore(firebaseAppInstance);
    }

    return firestoreInstance;
  } catch (err) {
    console.error("Error initializing Firestore:", err);
    return null;
  }
}

export function getActiveFirestore(): Firestore | null {
  if (!firestoreInstance) {
    firestoreInstance = initFirestore();
  }
  return firestoreInstance;
}


// ── Sanitize Data for Firestore (Remove undefined values that cause setDoc to fail) ──
function cleanForFirestore<T>(data: T): Record<string, any> {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

// ── Real-Time Sync Subscriptions ──────────────────────────────────────────────

export function subscribeToCollection<T extends { id: number }>(
  collectionName: "daily_cash" | "bank_payments" | "gst_bills" | "projects" | "users",
  onData: (items: T[]) => void,
  onError?: (err: any) => void
): Unsubscribe | null {
  const db = getActiveFirestore();
  if (!db) return null;

  try {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      snapshot => {
        const items: T[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as T);
        });
        // Sort items by id descending
        items.sort((a, b) => b.id - a.id);
        onData(items);
      },
      err => {
        console.error(`Firestore sync error on ${collectionName}:`, err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error(`Failed to subscribe to ${collectionName}:`, err);
    return null;
  }
}

// ── Cloud CRUD Operations ─────────────────────────────────────────────────────

export async function saveDocumentToCloud<T extends { id: number }>(
  collectionName: "daily_cash" | "bank_payments" | "gst_bills" | "projects" | "users",
  data: T
): Promise<boolean> {
  const db = getActiveFirestore();
  if (!db) return false;

  try {
    const cleaned = cleanForFirestore(data);
    const docRef = doc(db, collectionName, String(data.id));
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error(`Error saving document to ${collectionName}:`, err);
    return false;
  }
}

export async function deleteDocumentFromCloud(
  collectionName: "daily_cash" | "bank_payments" | "gst_bills" | "projects" | "users",
  id: number
): Promise<boolean> {
  const db = getActiveFirestore();
  if (!db) return false;

  try {
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Error deleting document from ${collectionName}:`, err);
    return false;
  }
}

// ── Safe One-Time Initial Seed (Runs ONLY if Cloud Collections are Completely Empty) ──

export async function ensureInitialCloudSeed(): Promise<void> {
  const db = getActiveFirestore();
  if (!db) return;

  try {
    // Check if cloud already has daily_cash or projects
    const checkSnap = await getDocs(collection(db, "projects"));
    if (checkSnap.size > 0) {
      // Cloud already has data - NEVER overwrite!
      return;
    }

    console.log("Firestore cloud is empty, seeding initial Dahod project and records...");
    for (const p of initialProjects) {
      await saveDocumentToCloud("projects", p);
    }
    for (const c of initialCashTransactions) {
      await saveDocumentToCloud("daily_cash", c);
    }
    for (const b of initialBankPayments) {
      await saveDocumentToCloud("bank_payments", b);
    }
    for (const g of initialGSTBills) {
      await saveDocumentToCloud("gst_bills", g);
    }
    for (const u of initialUsers) {
      await saveDocumentToCloud("users", u);
    }
  } catch (err) {
    console.error("Error checking/seeding initial Firestore cloud data:", err);
  }
}
