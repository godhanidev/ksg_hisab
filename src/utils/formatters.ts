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
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${d}/${m}/${y}`; // DD/MM/YYYY
};

export const formatDate = (d: Date | string): string => {
  if (!d) return todayStr();
  if (typeof d === "string") return d;
  return d.toLocaleDateString("en-GB");
};

// Convert "DD/MM/YYYY" to "YYYY-MM-DD" for standard HTML5 <input type="date" />
export const toInputDateFormat = (dStr: string): string => {
  if (!dStr) {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }
  if (dStr.includes("-") && dStr.split("-")[0].length === 4) {
    return dStr;
  }
  const parts = dStr.split("/");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split("T")[0];
};

// Convert "YYYY-MM-DD" from <input type="date" /> back to "DD/MM/YYYY"
export const fromInputDateFormat = (val: string): string => {
  if (!val) return todayStr();
  if (val.includes("/")) return val;
  const parts = val.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  return val;
};

// Return full localized label for User Roles (Admin, Site Partner, Site Engineer, Supervisor)
export const getUserRoleLabel = (role: string, lang: string = "en"): string => {
  switch (role) {
    case "admin":
      return lang === "gu" ? "એડમિન / ઓનર" : lang === "hi" ? "एडमिन / ओनर" : "Admin (Head Office)";
    case "site_partner":
      return lang === "gu" ? "સાઇટ પાર્ટનર" : lang === "hi" ? "साइट पार्टनर" : "Site Partner";
    case "site_engineer":
      return lang === "gu" ? "સાઇટ એન્જિનિયર" : lang === "hi" ? "साइट इंजीनियर" : "Site Engineer";
    case "supervisor":
    default:
      return lang === "gu" ? "સાઇટ સુપરવાઇઝર" : lang === "hi" ? "साइट सुपरवाइजर" : "Site Supervisor";
  }
};

// Return short English display label for header and chips
export const getShortRoleLabel = (role: string): string => {
  switch (role) {
    case "admin":
      return "Owner / Admin";
    case "site_partner":
      return "Site Partner";
    case "site_engineer":
      return "Site Engineer";
    case "supervisor":
    default:
      return "Site Supervisor";
  }
};
