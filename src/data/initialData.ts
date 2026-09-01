import { BankPayment, CashTransaction, GSTBill, Project, UserAccount } from "../types";

export const initialUsers: UserAccount[] = [
  {
    id: 1,
    username: "admin",
    password: "ksg@2026",
    name: "Kanjibhai S. Godhani (Head Office)",
    role: "admin",
    assignedProjects: [],
    phone: "9825012345"
  },
  {
    id: 4,
    username: "rajubhai",
    password: "raju@2026",
    name: "Rajubhai (Site Supervisor)",
    role: "supervisor",
    assignedProjects: ["Dahod Devgadh Baria Package 2"],
    phone: "9825198765"
  }
];

export const initialProjects: Project[] = [
  {
    id: 1,
    code: "PRJ-2026-DH02",
    name: "Dahod Devgadh Baria Package 2",
    department: "Gujarat Water Supply & Sewerage Board (GWSSB) / PWD",
    value: 15000000,
    progress: 42,
    received: 4500000,
    expense: 705446.62,
    status: "Active",
    startDate: "01/03/2026",
    targetDate: "31/03/2027",
    location: "Devgadh Baria, Dahod District",
    supervisorName: "Rajubhai",
    notes: "Site civil infrastructure, pipeline laying, masonry and foundation excavation."
  }
];

// Sample placeholder receipt image
const SAMPLE_RECEIPT_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><rect width='100%25' height='100%25' fill='%23f8fafc'/><rect x='20' y='20' width='360' height='220' rx='8' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='2'/><text x='40' y='60' font-family='sans-serif' font-size='18' font-weight='bold' fill='%230f172a'>TAX INVOICE / VOUCHER</text><text x='40' y='90' font-family='sans-serif' font-size='12' fill='%2364748b'>K.S.Godhani Construction &amp; Civil Works</text><line x1='40' y1='105' x2='360' y2='105' stroke='%23e2e8f0' stroke-width='2'/><text x='40' y='135' font-family='sans-serif' font-size='13' fill='%23334155'>Item: Material &amp; Construction Supplies</text><text x='40' y='160' font-family='sans-serif' font-size='13' fill='%23334155'>Supplier: Approved Vendor</text><text x='40' y='190' font-family='sans-serif' font-size='16' font-weight='bold' fill='%23059669'>Status: Verified On Site [OK]</text><text x='260' y='220' font-family='sans-serif' font-size='11' font-style='italic' fill='%2394a3b8'>Audited Voucher</text></svg>";

// ── 1. Site Daily Cash / Expense Transactions (Exact Excel Sheet: 'Expense ') ──
export const initialCashTransactions: CashTransaction[] = [
  {
    id: 1,
    date: "10/03/2026",
    type: "cash_in",
    details: "Cash to Rajubhai",
    amount: 25000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Office Cash Top-up",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Kanjibhai S. Godhani",
    notes: "Initial petty cash advance for site work"
  },
  {
    id: 2,
    date: "13/03/2026",
    type: "cash_in",
    details: "Cash to Rajubhai",
    amount: 50000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Office Cash Top-up",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Kanjibhai S. Godhani",
    notes: "Second cash installment for labour & site expenses"
  },
  {
    id: 3,
    date: "10/03/2026",
    type: "cash_out",
    details: "JCB Bhut Pagla",
    amount: 10000,
    project: "Dahod Devgadh Baria Package 2",
    category: "JCB / Machinery",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai",
    notes: "Foundation & boundary trench digging"
  },
  {
    id: 4,
    date: "11/03/2026",
    type: "cash_out",
    details: "MP Labour Kharchi",
    amount: 15000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Labour",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai",
    notes: "MP labour group weekly food & kharchi"
  },
  {
    id: 5,
    date: "11/03/2026",
    type: "cash_out",
    details: "JCB Ashyadi",
    amount: 4800,
    project: "Dahod Devgadh Baria Package 2",
    category: "JCB / Machinery",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai"
  },
  {
    id: 6,
    date: "12/03/2026",
    type: "cash_out",
    details: "Upad Ashyadi",
    amount: 1000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Labour Upad",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai"
  },
  {
    id: 7,
    date: "12/03/2026",
    type: "cash_out",
    details: "Tractor Ashyadi",
    amount: 1000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Tractor / Carting",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai"
  },
  {
    id: 8,
    date: "12/03/2026",
    type: "cash_out",
    details: "Chuno + Tap + Dori",
    amount: 1000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Material / Tools",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai",
    notes: "Lime powder, marking tape, and nylon dori"
  },
  {
    id: 9,
    date: "13/03/2026",
    type: "cash_out",
    details: "Extra Kharch",
    amount: 1000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Site Miscellaneous",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai"
  },
  {
    id: 10,
    date: "13/03/2026",
    type: "cash_out",
    details: "Muhrat na Redhana",
    amount: 1000,
    project: "Dahod Devgadh Baria Package 2",
    category: "Pooja & Ceremony",
    supervisorId: 4,
    supervisorName: "Rajubhai",
    paymentMode: "Cash",
    enteredBy: "Rajubhai",
    notes: "Site opening pooja sweets and prasad"
  }
];

// ── 2. Direct Office Bank Payments (Exact Excel Sheet: 'Bank Payment') ────────
export const initialBankPayments: BankPayment[] = [
  {
    id: 1,
    date: "18/03/2026",
    partyName: "Vrajesh Traders",
    amount: 184800,
    project: "Dahod Devgadh Baria Package 2",
    paymentMode: "RTGS / NEFT",
    referenceNo: "RTGS-HDFC2026031891",
    category: "Material & Spares",
    enteredBy: "Kanjibhai S. Godhani",
    notes: "Direct bank payment for site pipes & fittings"
  },
  {
    id: 2,
    date: "24/03/2026",
    partyName: "Ashish Buildcon",
    amount: 100000,
    project: "Dahod Devgadh Baria Package 2",
    paymentMode: "RTGS / NEFT",
    referenceNo: "NEFT-SBIN2026032411",
    category: "Subcontractor",
    enteredBy: "Kanjibhai S. Godhani",
    notes: "Civil excavation contract payment"
  },
  {
    id: 3,
    date: "24/03/2026",
    partyName: "Shree Vrajesh Steel Traders",
    amount: 200000,
    project: "Dahod Devgadh Baria Package 2",
    paymentMode: "RTGS / NEFT",
    referenceNo: "RTGS-HDFC2026032488",
    category: "Steel",
    enteredBy: "Kanjibhai S. Godhani",
    notes: "TMT Steel supply bank advance"
  }
];

// ── 3. GST Bills (Exact Excel Sheet: 'GST Bill') ──────────────────────────────
export const initialGSTBills: GSTBill[] = [
  {
    id: 1,
    date: "01/03/2026",
    billNo: "413",
    partyName: "Khodiyar Sales and Service",
    product: "HDPE Pipe",
    project: "Dahod Devgadh Baria Package 2",
    basicAmount: 4170.00,
    gstRate: 18,
    gstAmount: 750.60,
    totalAmount: 4920.60,
    status: "Paid",
    paymentReference: "INV-413",
    enteredBy: "Kanjibhai S. Godhani",
    attachments: [
      {
        id: "att-gst-1",
        name: "khodiyar_sales_bill413.jpg",
        dataUrl: SAMPLE_RECEIPT_IMG,
        type: "image/svg+xml",
        uploadedAt: "01/03/2026"
      }
    ]
  },
  {
    id: 2,
    date: "11/03/2026",
    billNo: "25-26/4128",
    partyName: "Shree Vrajesh Steel Traders",
    product: "Steel",
    project: "Dahod Devgadh Baria Package 2",
    basicAmount: 76818.65,
    gstRate: 18,
    gstAmount: 13827.36,
    totalAmount: 90646.01,
    status: "Paid",
    paymentReference: "INV-4128",
    enteredBy: "Kanjibhai S. Godhani",
    attachments: [
      {
        id: "att-gst-2",
        name: "vrajesh_steel_4128.jpg",
        dataUrl: SAMPLE_RECEIPT_IMG,
        type: "image/svg+xml",
        uploadedAt: "11/03/2026"
      }
    ]
  },
  {
    id: 3,
    date: "11/03/2026",
    billNo: "25-26/4130",
    partyName: "Shree Vrajesh Steel Traders",
    product: "Steel",
    project: "Dahod Devgadh Baria Package 2",
    basicAmount: 76508.48,
    gstRate: 18,
    gstAmount: 13771.53,
    totalAmount: 90280.01,
    status: "Paid",
    paymentReference: "INV-4130",
    enteredBy: "Kanjibhai S. Godhani",
    attachments: [
      {
        id: "att-gst-3",
        name: "vrajesh_steel_4130.jpg",
        dataUrl: SAMPLE_RECEIPT_IMG,
        type: "image/svg+xml",
        uploadedAt: "11/03/2026"
      }
    ]
  }
];
