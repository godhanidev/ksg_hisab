// ─── Firebase Cloud Configuration & State ─────────────────────────────────────

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

const FIREBASE_CONFIG_KEY = "ksg_firebase_config_v5";

export function loadStoredFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
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
