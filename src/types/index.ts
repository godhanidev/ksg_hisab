// ─── KSG Hisab Type Definitions (3 Core Modules Architecture) ─────────────────

export type Language = "en" | "gu" | "hi";

export type Role = "admin" | "supervisor" | "site_engineer" | "site_partner" | "user";

export type UserAccount = {
  id: number;
  username: string;
  password: string;
  name: string;
  role: Role;
  assignedProjects: string[]; // empty = all (admin), specific names for supervisors
  phone?: string;
  currentSessionId?: string; // Unique session token for enforcing single active device login
  lastLoginAt?: string;      // ISO timestamp of last login
  lastDevice?: string;       // Device description e.g. "Mobile Device" or "Desktop / PC"
};

export type Attachment = {
  id: string;
  name: string;
  dataUrl: string; // base64 image or document
  type: string;
  sizeBytes?: number;
  uploadedAt: string;
};

export type Project = {
  id: number;
  code: string;
  name: string;
  department: string;
  value: number;
  progress: number;
  received: number;
  expense: number;
  status: "Active" | "Pending" | "Completed" | "On Hold";
  startDate?: string;
  targetDate?: string;
  location?: string;
  supervisorName?: string;
  notes?: string;
};

// ── 1. Site Daily Cash / Expense (Petty Cash & Supervisor Wallet) ─────────────
export type CashTransactionType = "cash_in" | "cash_out";

export type CashTransaction = {
  id: number;
  date: string;
  type: CashTransactionType; // "cash_in" = જમા (Office to Supervisor), "cash_out" = ઉધાર / ખર્ચ (Site Expense)
  details: string;           // e.g. "Cash to Rajubhai" or "JCB Bhut Pagla", "MP Labour Kharchi"
  amount: number;            // Amount in INR
  project: string;
  category?: string;         // e.g. "JCB", "Labour", "Tractor", "Material", "Pooja", "Other"
  supervisorId?: number;
  supervisorName?: string;
  paymentMode: "Cash" | "UPI" | "Cheque";
  voucherNo?: string;
  attachments?: Attachment[];
  enteredBy: string;
  notes?: string;
};

// ── 2. Direct Office Bank Payment (Bank RTGS / Transfers to Parties) ─────────
export type BankPayment = {
  id: number;
  date: string;
  partyName: string;         // e.g. "Vrajesh Traders", "Ashish Buildcon", "Shree Vrajesh Steel"
  amount: number;            // Amount in INR
  project: string;
  paymentMode: "RTGS / NEFT" | "Cheque" | "Net Banking" | "Direct Transfer";
  referenceNo?: string;      // UTR or Cheque No
  category?: string;         // e.g. "Material", "Subcontractor", "Steel", "Transport"
  attachments?: Attachment[];
  enteredBy: string;
  notes?: string;
};

// ── 3. GST Bills (Tax Invoices with Auto Calculations) ────────────────────────
export type GSTBill = {
  id: number;
  date: string;
  billNo: string;            // e.g. "413", "25-26/4128"
  partyName: string;         // e.g. "Khodiyar Sales", "Shree Vrajesh Steel Traders"
  product: string;           // e.g. "HDPE Pipe", "Steel", "Cement"
  project: string;
  basicAmount: number;       // Base amount before tax
  gstRate: number;           // GST % (e.g. 18, 5, 12, 28)
  gstAmount: number;         // Auto-calculated: basicAmount * (gstRate / 100)
  totalAmount: number;       // Auto-calculated: basicAmount + gstAmount
  status: "Paid" | "Pending" | "Partial";
  paymentReference?: string;
  attachments?: Attachment[];
  notes?: string;
  enteredBy: string;
};

// ── Offline Sync Queue ────────────────────────────────────────────────────────
export type OfflineQueueItem = {
  id: string;
  module: "daily_cash" | "bank_payment" | "gst_bill" | "project";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: number;
};


