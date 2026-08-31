import React from "react";
import { Language } from "../../types";
import { getTranslation } from "../../i18n/translations";

export function StatusBadge({ status, lang = "en" }: { status: string; lang?: Language }) {
  const t = getTranslation(lang);

  const getLabel = (s: string) => {
    switch (s) {
      case "Active": return t.active;
      case "Completed": return t.completed;
      case "Pending": return t.pending;
      case "On Hold": return t.onHold;
      case "Paid": return t.paid;
      case "Received": return t.received;
      case "Partial": return t.partial;
      case "In Use": return t.inUse;
      case "Available": return t.available;
      case "Under Maintenance": return t.underMaintenance;
      default: return s;
    }
  };

  const getStyle = (s: string) => {
    switch (s) {
      case "Active":
      case "Paid":
      case "Received":
      case "In Use":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Completed":
      case "Partial":
      case "Available":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "On Hold":
      case "Under Maintenance":
        return "bg-orange-100 text-orange-800 border-orange-200";
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
