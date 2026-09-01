// ─── Firebase Cloud Configuration & State ─────────────────────────────────────

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
};

// ── Built-in KSG Hisab Firebase Project Configuration ─────────────────────────
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyBDmGrVsePTEq5Th97LztruxkJMmAlnrsk",
  authDomain: "ksg-hisab.firebaseapp.com",
  projectId: "ksg-hisab",
  storageBucket: "ksg-hisab.firebasestorage.app",
  messagingSenderId: "926454224627",
  appId: "1:926454224627:web:8e8901cabe9fa0b842c986",
  measurementId: "G-MW02855QXY"
};

const FIREBASE_CONFIG_KEY = "ksg_firebase_config_v5";

export function loadStoredFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (!raw) return DEFAULT_FIREBASE_CONFIG;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

export function saveStoredFirebaseConfig(config: FirebaseConfig | null): void {
  try {
    if (!config) {
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
    } else {
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (err) {
    console.error("Failed to save Firebase config:", err);
  }
}
