import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  positive?: boolean;
  color?: string;
  subValue?: string;
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  positive = true,
  color = "bg-slate-100 text-slate-700",
  subValue,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 truncate">{value}</h3>
          {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
          <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${positive ? "text-emerald-600" : "text-amber-600"}`}>
            {positive ? <TrendingUp size={14} className="shrink-0" /> : <TrendingDown size={14} className="shrink-0" />}
            <span className="truncate">{trend}</span>
          </div>
        </div>
        <div className={`rounded-xl p-3 shrink-0 ml-3 ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
