// ─── KSG Hisab Type Definitions ───────────────────────────────────────────────

export type Language = "en" | "gu" | "hi";

export type Role = "admin" | "supervisor" | "user";

export type UserAccount = {
  id: number;
  username: string;
  password: string;
  name: string;
  role: Role;
  assignedProjects: string[]; // empty = all (admin), specific names for supervisors
  enabledModules: string[];   // which sidebar items user can see
  phone?: string;
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

export type ExpenseCategory =
  | "Material"
  | "Labour"
  | "Machinery"
  | "Fuel"
  | "Transport"
  | "Subcontractor"
  | "Govt Royalty & Fees"
  | "Food & Refreshment"
  | "Site Maintenance"
  | "Other";

export type Expense = {
  id: number;
  date: string;
  description: string;
  project: string;
  category: ExpenseCategory;
  subCategory?: string;
  vendor: string;
  quantity?: number;
  unit?: string;
  unitRate?: number;
  amount: number;
  paymentMode: "Cash" | "Bank Transfer / RTGS" | "Cheque" | "UPI" | "Credit / Udhar";
  status: "Paid" | "Pending";
  billNumber?: string;
  attachments?: Attachment[];
  enteredBy?: string;
  syncedOffline?: boolean;
};

export type BillLineItem = {
  id: string;
  itemNo: string; // e.g. "Item 1", "SOR-14.2"
  description: string; // Description of work / measurement
  unit: string; // "Cu.M", "Sq.M", "R.M", "MT", "Nos", "LS", "Bags"
  quantity: number;
  rate: number;
  amount: number;
};

export type BillDeductions = {
  securityDepositPercent: number; // e.g. 5%
  securityDepositAmount: number;
  tdsPercent: number; // e.g. 2%
  tdsAmount: number;
  gstTdsPercent: number; // e.g. 2%
  gstTdsAmount: number;
  labourCessPercent: number; // e.g. 1%
  labourCessAmount: number;
  royaltyOrPenalty: number;
  otherDeduction: number;
  totalDeductions: number;
};

export type Bill = {
  id: number;
  billNo: string; // e.g. "KSG/RA-01/2026-27"
  billType?: "RA Bill" | "Final Bill" | "Advance Bill" | "Tax Invoice" | "Material Supply Bill" | "Subcontractor Bill";
  raBillNo?: string; // e.g. "1st R.A. Bill"
  date: string;
  project: string;
  department?: string; // e.g. "Irrigation Dept"
  workOrderNo?: string; // Tender / Work Order No
  mbBookNo?: string; // Measurement Book reference
  description: string;
  items?: BillLineItem[];
  grossAmount?: number;
  gstPercent?: number; // 18%
  gstAmount?: number;
  deductions?: BillDeductions;
  netPayable?: number;
  amount: number; // Total billed / gross
  received: number; // Cleared from Govt Treasury
  status: "Received" | "Partial" | "Pending";
  paymentReference?: string;
  tenderItemRef?: string;
  attachments?: Attachment[];
  syncedOffline?: boolean;
  notes?: string;
};

export type LabourWorker = {
  id: number;
  name: string;
  role: "Mason" | "Carpenter" | "Helper" | "Barbender" | "Welder" | "Electrician" | "Plumber" | "Supervisor";
  project: string;
  phone: string;
  dailyWage: number;
  daysWorked: number;
  totalEarned: number;
  paid: number;
  status: "Active" | "Inactive";
};

export type MaterialCategory = "Binding" | "Steel" | "Aggregate" | "Masonry" | "Plumbing" | "Electrical" | "Finishing" | "Other";

export type MaterialItem = {
  id: number;
  name: string;
  category: MaterialCategory;
  unit: string;
  quantity: number;
  minStock: number;
  pricePerUnit: number;
  project: string;
  lastUpdated: string;
  supplierName?: string;
};

export type Machinery = {
  id: number;
  name: string;
  type: "Excavator (JCB)" | "Concrete Mixer" | "Tractor & Trolley" | "Vibrator / Compactor" | "Water Pump" | "Crane" | "Generator" | "Dumper" | "Other";
  registrationNo: string;
  project: string;
  dailyRate: number;
  daysUsed: number;
  totalCost: number;
  status: "In Use" | "Available" | "Under Maintenance";
  operatorName?: string;
};

export type DailyReport = {
  id: number;
  date: string;
  project: string;
  reportedBy: string;
  labourCount: number;
  workDone: string;
  materialUsed: string;
  issues: string;
  progress: number;
  weather?: "Sunny / Clear" | "Rainy / Wet" | "Cloudy" | "Extreme Heat";
  attachments?: Attachment[];
  syncedOffline?: boolean;
};

export type OfflineQueueItem = {
  id: string;
  type: "expense" | "bill" | "labour" | "material" | "machinery" | "report";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: number;
};
