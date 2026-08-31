// ─── Offline Storage & Auto-Sync Utilities ────────────────────────────────────

import { OfflineQueueItem } from "../types";

const QUEUE_KEY = "ksg_offline_queue_v3";
const LANG_KEY = "ksg_lang_v3";
const USER_KEY = "ksg_user_session_v3";

export function loadStoredCollection<T>(collectionKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`ksg_${collectionKey}_v3`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch (err) {
    console.error(`Failed to load ${collectionKey}:`, err);
    return fallback;
  }
}

export function saveStoredCollection(collectionKey: string, data: any): void {
  try {
    localStorage.setItem(`ksg_${collectionKey}_v3`, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${collectionKey}:`, err);
  }
}

export function loadStoredSession(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(user: any | null): void {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {}
}

export function loadOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: Omit<OfflineQueueItem, "id" | "timestamp">): void {
  try {
    const queue = loadOfflineQueue();
    queue.push({
      ...item,
      id: "sync_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to queue offline entry:", err);
  }
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function getStoredLanguage(): "en" | "gu" | "hi" {
  const lang = localStorage.getItem(LANG_KEY);
  if (lang === "gu" || lang === "hi" || lang === "en") return lang;
  return "en";
}

export function setStoredLanguage(lang: "en" | "gu" | "hi"): void {
  localStorage.setItem(LANG_KEY, lang);
}
