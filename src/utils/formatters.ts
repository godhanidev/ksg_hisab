// ─── Formatters & Date Utilities ─────────────────────────────────────────────

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-IN").format(num || 0);
};

export const todayStr = (): string => {
  return new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY
};

export const formatDate = (d: Date | string): string => {
  if (!d) return todayStr();
  if (typeof d === "string") return d;
  return d.toLocaleDateString("en-GB");
};
