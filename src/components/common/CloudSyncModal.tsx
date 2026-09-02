import React, { useState } from "react";
import {
  Cloud, CloudOff, RefreshCw, Check, AlertCircle,
  Smartphone, Laptop, ArrowRight, ShieldCheck, Database, CheckCircle2
} from "lucide-react";
import { Language, Project, CashTransaction, BankPayment, GSTBill, UserAccount } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { ModalWrapper } from "./ModalWrapper";
import { FirebaseConfig, loadStoredFirebaseConfig, saveStoredFirebaseConfig, DEFAULT_FIREBASE_CONFIG } from "../../services/firebaseConfig";
import { initFirestore, ensureInitialCloudSeed } from "../../services/firestoreSync";

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
  lang,
}: CloudSyncModalProps) {
  const t = getTranslation(lang);
  const [config, setConfig] = useState<FirebaseConfig>(() => {
    return loadStoredFirebaseConfig() || DEFAULT_FIREBASE_CONFIG;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleTestAndSync = async () => {
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const db = initFirestore(config);
      if (db) {
        await ensureInitialCloudSeed();
        onConfigUpdated();
        setStatusMsg({
          text: lang === "gu"
            ? "ક્લાઉડ ડેટાબેઝ સાથે સફળતાપૂર્વક જોડાયેલ છે! તમામ ડેટા લાઈવ છે."
            : "Successfully connected to Firestore Cloud! All data is live and syncing.",
          type: "success",
        });
      } else {
        setStatusMsg({
          text: lang === "gu" ? "ક્લાઉડ સાથે કનેક્શન ન થઈ શક્યું." : "Failed to connect to Firebase.",
          type: "error",
        });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Sync error: ${err.message || err}`, type: "error" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={lang === "gu" ? "રીઅલ-ટાઇમ ક્લાઉડ સિન્ક સ્ટેટસ" : "Real-Time Cloud Database Status"}
      subtitle={
        lang === "gu"
          ? "મોબાઈલ અને લેપટોપ વચ્ચે ડેટા લાઈવ શેરિંગ"
          : "Live multi-device database sync across PC and Supervisor phones"
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
                  ? lang === "gu"
                    ? "ક્લાઉડ લાઈવ સિન્ક: ચાલુ (Google Firebase Connected)"
                    : "Cloud Live Sync: Active (Google Firebase Connected)"
                  : lang === "gu"
                    ? "લોકલ મોડ: ફક્ત આ ડિવાઇસ પર સેવ થાય છે"
                    : "Local Mode: Stored only on this device"}
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
                  ? "તમારો ડેટા Google Firestore ક્લાઉડમાં લાઈવ સ્ટોર થાય છે. કોઈપણ ફોન કે કમ્પ્યુટરમાં આ લિંક ખોલતાં જ તમામ હિસાબ આપમેળે લાઈવ દેખાશે (કોઈ મેન્યુઅલ અપલોડ કરવાની જરૂર નથી)."
                  : "Data is live in Google Firestore. Every phone or PC opening this app automatically receives the latest records with zero manual upload needed."
                : lang === "gu"
                  ? "અત્યારે ડેટા ફક્ત આ બ્રાઉઝરમાં સેવ થાય છે."
                  : "Data is stored locally."}
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

        {/* Live Multi-Device Flow Illustration */}
        <div className="rounded-2xl bg-slate-900 text-white p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {lang === "gu" ? "ઓટોમેટિક લાઈવ સિન્ક ફ્લો" : "Automatic Multi-Device Sync"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center">
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <Laptop size={22} className="mx-auto text-sky-400 mb-1.5" />
              <p className="text-xs font-bold">Admin (PC / Office)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Top-up &amp; Bank Payments</p>
            </div>

            <div className="flex flex-col items-center justify-center py-1">
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="text-[11px] font-bold">⚡ Real-time</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Google Firebase Cloud DB</p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <Smartphone size={22} className="mx-auto text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold">Rajubhai (Site Mobile)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Daily Expenses &amp; Bills</p>
            </div>
          </div>
        </div>

        {/* Cloud Project Info */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-600" />
            Connected Firebase Project
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Project ID</span>
              <span className="font-mono font-bold text-slate-800">{config.projectId}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Auth Domain</span>
              <span className="font-mono font-bold text-slate-800">{config.authDomain}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestAndSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Testing Connection..." : "Check Live Sync"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t.close}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
