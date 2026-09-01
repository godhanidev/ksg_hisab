import React from "react";
import { Language } from "../../types";
import { getTranslation } from "../../i18n/translations";

export function StatusBadge({ status, lang = "en" }: { status: string; lang?: Language }) {
  const t = getTranslation(lang) as any;

  const getLabel = (s: string) => {
    switch (s) {
      case "Active": return lang === "gu" ? "કાર્યરત" : lang === "hi" ? "सक्रिय" : "Active";
      case "Completed": return lang === "gu" ? "પૂર્ણ" : lang === "hi" ? "पूर्ण" : "Completed";
      case "Pending": return t.pending || "Pending";
      case "On Hold": return lang === "gu" ? "સ્થગિત" : lang === "hi" ? "रोका हुआ" : "On Hold";
      case "Paid": return t.paid || "Paid";
      case "Partial": return t.partial || "Partial";
      default: return s;
    }
  };

  const getStyle = (s: string) => {
    switch (s) {
      case "Active":
      case "Paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Completed":
      case "Partial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "On Hold":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${getStyle(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {getLabel(status)}
    </span>
  );
}
