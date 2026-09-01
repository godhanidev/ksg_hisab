// ─── Real-Time Firestore Cloud Synchronizer ───────────────────────────────────

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot,
  Firestore, Unsubscribe
} from "firebase/firestore";
import { FirebaseConfig, loadStoredFirebaseConfig } from "./firebaseConfig";
import { BankPayment, CashTransaction, GSTBill, Project, UserAccount } from "../types";

let firestoreInstance: Firestore | null = null;
let firebaseAppInstance: FirebaseApp | null = null;

export function initFirestore(customConfig?: FirebaseConfig | null): Firestore | null {
  const config = customConfig || loadStoredFirebaseConfig();
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
    firestoreInstance = getFirestore(firebaseAppInstance);
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
        // Sort items by date or id descending
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
    const docRef = doc(db, collectionName, String(data.id));
    await setDoc(docRef, data, { merge: true });
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

// ── 1-Click Initial Cloud Migration ───────────────────────────────────────────

export async function pushAllLocalDataToCloud(
  projects: Project[],
  cashTransactions: CashTransaction[],
  bankPayments: BankPayment[],
  gstBills: GSTBill[],
  users: UserAccount[]
): Promise<{ success: boolean; count: number }> {
  const db = getActiveFirestore();
  if (!db) return { success: false, count: 0 };

  let count = 0;
  try {
    for (const p of projects) {
      await saveDocumentToCloud("projects", p);
      count++;
    }
    for (const c of cashTransactions) {
      await saveDocumentToCloud("daily_cash", c);
      count++;
    }
    for (const b of bankPayments) {
      await saveDocumentToCloud("bank_payments", b);
      count++;
    }
    for (const g of gstBills) {
      await saveDocumentToCloud("gst_bills", g);
      count++;
    }
    for (const u of users) {
      await saveDocumentToCloud("users", u);
      count++;
    }
    return { success: true, count };
  } catch (err) {
    console.error("Failed to migrate data to cloud:", err);
    return { success: false, count };
  }
}
