import React, { useState } from "react";
import {
  Cloud, CloudOff, RefreshCw, Key, Check, AlertCircle,
  Smartphone, Laptop, ArrowRight, ShieldCheck, Database, UploadCloud, CheckCircle2
} from "lucide-react";
import { Language, Project, CashTransaction, BankPayment, GSTBill, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { ModalWrapper } from "./ModalWrapper";
import { FirebaseConfig, loadStoredFirebaseConfig, saveStoredFirebaseConfig } from "../../services/firebaseConfig";
import { initFirestore, pushAllLocalDataToCloud } from "../../services/firestoreSync";

type CloudSyncModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isCloudConnected: boolean;
  onConfigUpdated: () => void;
  projects: Project[];
  cashTransactions: CashTransaction[];
  bankPayments: BankPayment[];
  gstBills: GSTBill[];
  users: UserAccount[];
  lang: Language;
};

export function CloudSyncModal({
  isOpen,
  onClose,
  isCloudConnected,
  onConfigUpdated,
  projects,
  cashTransactions,
  bankPayments,
  gstBills,
  users,
  lang,
}: CloudSyncModalProps) {
  const t = getTranslation(lang);
  const [config, setConfig] = useState<FirebaseConfig>(() => {
    return (
      loadStoredFirebaseConfig() || {
        apiKey: "",
        authDomain: "",
        projectId: "",
        appId: "",
      }
    );
  });

  const [jsonInput, setJsonInput] = useState("");
  const [useJsonMode, setUseJsonMode] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    try {
      // Clean up common JS object copy-paste from Firebase Console
      const cleanJson = val
        .replace(/const firebaseConfig =/g, "")
        .replace(/;/g, "")
        .trim();
      
      const parsed = Function('"use strict";return (' + cleanJson + ')')();
      if (parsed.apiKey && parsed.projectId) {
        setConfig({
          apiKey: parsed.apiKey || "",
          authDomain: parsed.authDomain || "",
          projectId: parsed.projectId || "",
          storageBucket: parsed.storageBucket || "",
          messagingSenderId: parsed.messagingSenderId || "",
          appId: parsed.appId || "",
        });
        setStatusMsg({ text: "Firebase config recognized successfully!", type: "success" });
      }
    } catch {
      // Not yet valid JSON/JS
    }
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey.trim() || !config.projectId.trim()) {
      setStatusMsg({ text: "Please enter API Key and Project ID", type: "error" });
      return;
    }

    saveStoredFirebaseConfig(config);
    const db = initFirestore(config);
    if (db) {
      setStatusMsg({ text: "Connected to Firebase Cloud! Live real-time sync is now active.", type: "success" });
      onConfigUpdated();
    } else {
      setStatusMsg({ text: "Could not initialize Firebase. Please check the config keys.", type: "error" });
    }
  };

  const handleDisconnect = () => {
    if (window.confirm("Do you want to disconnect from Firebase and revert to local storage?")) {
      saveStoredFirebaseConfig(null);
      onConfigUpdated();
      setStatusMsg({ text: "Disconnected from Cloud. Now in Local Storage mode.", type: "success" });
    }
  };

  const handleUploadAllToCloud = async () => {
    setIsMigrating(true);
    setStatusMsg(null);
    try {
      const res = await pushAllLocalDataToCloud(projects, cashTransactions, bankPayments, gstBills, users);
      if (res.success) {
        setStatusMsg({
          text: `Success! ${res.count} records uploaded to Firebase Cloud! Supervisor phones can now see all entries live.`,
          type: "success",
        });
      } else {
        setStatusMsg({ text: "Failed to upload some records. Please check Firebase Firestore permissions.", type: "error" });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Upload error: ${err.message || err}`, type: "error" });
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={lang === "gu" ? "રીઅલ-ટાઇમ ક્લાઉડ સિન્ક સેટિંગ્સ" : "Real-Time Cloud Database Sync"}
      subtitle={
        lang === "gu"
          ? "મોબાઈલ અને લેપટોપ વચ્ચે ડેટા લાઈવ શેર કરવા માટે Google Firebase કનેક્ટ કરો"
          : "Connect Google Firebase to sync entries across PCs and supervisor phones live"
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Status Indicator Banner */}
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 border ${
            isCloudConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
              : "bg-amber-500/10 border-amber-500/30 text-amber-950"
          }`}
        >
          {isCloudConnected ? (
            <Database size={24} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <CloudOff size={24} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {isCloudConnected
                  ? lang === "gu" ? "ક્લાઉડ લાઈવ સિન્ક: ચાલુ (Connected)" : "Cloud Live Sync: Active (Connected)"
                  : lang === "gu" ? "લોકલ મોડ: ફક્ત આ ડિવાઇસ પર સેવ થાય છે" : "Local Mode: Stored only on this device"}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isCloudConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {isCloudConnected
                ? lang === "gu"
                  ? "તમે અથવા રાજુભાઈ જે પણ એન્ટ્રી પાડશો તે આપોઆપ બધા ફોન અને લેપટોપમાં ૧ સેકન્ડમાં લાઈવ આવી જશે."
                  : "Any entry created by Admin or Supervisor is automatically synced across all connected devices in real-time."
                : lang === "gu"
                  ? "અત્યારે ડેટા ફક્ત આ બ્રાઉઝરમાં સેવ થાય છે. રાજુભાઈના મોબાઈલમાં એન્ટ્રી લાઈવ બતાવવા માટે નીચે Firebase કી દાખલ કરો."
                  : "Data is currently stored in this browser. Add Firebase keys below to enable live phone-to-PC sync."}
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
              statusMsg.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {statusMsg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1-Click Push All Data Button if connected */}
        {isCloudConnected && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <UploadCloud size={16} className="text-blue-600" />
                  {lang === "gu" ? "દાહોદનો તમામ ડેટા ક્લાઉડમાં અપલોડ કરો" : "Push All Local Records to Cloud"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Uploads existing Cash Transactions, Bank Payments, and GST Bills to Firestore.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUploadAllToCloud}
                disabled={isMigrating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
              >
                {isMigrating ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                <span>{isMigrating ? "Uploading..." : "Upload to Cloud"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Firebase Config Form */}
        <form onSubmit={handleSaveAndConnect} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Firebase Credentials ({useJsonMode ? "Direct Config Paste" : "Form Fields"})
            </h3>
            <button
              type="button"
              onClick={() => setUseJsonMode(!useJsonMode)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              {useJsonMode ? "Switch to Fields" : "Paste full config JSON"}
            </button>
          </div>

          {useJsonMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Firebase Config object directly from Firebase Console:
              </label>
              <textarea
                rows={5}
                value={jsonInput}
                onChange={handleJsonPaste}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "ksg-hisab.firebaseapp.com",\n  projectId: "ksg-hisab",\n  appId: "1:..."\n};`}
                className="w-full font-mono text-xs rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-800 bg-slate-50"
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Key *</label>
                <input
                  type="text"
                  required
                  value={config.apiKey}
                  onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value.trim() }))}
                  placeholder="AIzaSy..."
                  className="w-full font-mono text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project ID *</label>
                <input
                  type="text"
                  required
                  value={config.projectId}
                  onChange={e => setConfig(c => ({ ...c, projectId: e.target.value.trim() }))}
                  placeholder="ksg-hisab-XXXX"
                  className="w-full font-mono text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Auth Domain</label>
                <input
                  type="text"
                  value={config.authDomain}
                  onChange={e => setConfig(c => ({ ...c, authDomain: e.target.value.trim() }))}
                  placeholder="ksg-hisab.firebaseapp.com"
                  className="w-full font-mono text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">App ID</label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={e => setConfig(c => ({ ...c, appId: e.target.value.trim() }))}
                  placeholder="1:123456789:web:abcdef"
                  className="w-full font-mono text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-slate-800"
                />
              </div>
            </div>
          )}

          {/* How to get Firebase credentials instructions */}
          <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-4 text-xs text-blue-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Key size={14} className="text-blue-700" />
              <span>
                {lang === "gu" ? "મફત Firebase પ્રોજેક્ટ કેવી રીતે બનાવવો? (૧ મિનિટ)" : "How to get free Firebase config? (1 min)"}
              </span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-blue-800/90 leading-relaxed text-[11px]">
              <li>Go to <strong>console.firebase.google.com</strong> and click <strong>Create a project</strong> (e.g. <code>ksg-hisab</code>).</li>
              <li>Under <strong>Build &gt; Firestore Database</strong>, click <strong>Create database</strong> (Select <em>Start in Test mode</em>).</li>
              <li>Under <strong>Project Settings &gt; General &gt; Your apps</strong>, click <code>&lt;/&gt;</code> (Web app) and copy the <code>firebaseConfig</code> values here!</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {isCloudConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
              >
                Disconnect Cloud
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t.close}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-md"
              >
                <Cloud size={16} />
                <span>Save &amp; Connect Cloud</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}
