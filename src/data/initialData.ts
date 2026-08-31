// ─── Initial Construction & Civil Works Data ──────────────────────────────────

import { Bill, DailyReport, Expense, LabourWorker, Machinery, MaterialItem, Project, UserAccount } from "../types";

export const initialUsers: UserAccount[] = [
  {
    id: 1,
    username: "admin",
    password: "ksg@2026",
    name: "Kanjibhai S. Godhani (Owner)",
    role: "admin",
    assignedProjects: [],
    enabledModules: ["Dashboard", "Projects", "Income & Bills", "Expenses", "Labour", "Material & Stock", "Machinery", "Daily Reports", "Reports", "User Management", "Settings"],
    phone: "9825012345"
  },
  {
    id: 2,
    username: "supervisor1",
    password: "sup@123",
    name: "Ramesh Patel (Site Supervisor)",
    role: "supervisor",
    assignedProjects: ["Check Dam Project - Amreli"],
    enabledModules: ["Dashboard", "Projects", "Expenses", "Labour", "Material & Stock", "Machinery", "Daily Reports"],
    phone: "9879054321"
  },
  {
    id: 3,
    username: "supervisor2",
    password: "sup@456",
    name: "Suresh Desai (Site Supervisor)",
    role: "supervisor",
    assignedProjects: ["Govt Community Hall - Rajkot", "Water Pipeline & Sump - Bhavnagar"],
    enabledModules: ["Dashboard", "Projects", "Expenses", "Labour", "Material & Stock", "Daily Reports"],
    phone: "9909065432"
  },
];

export const initialProjects: Project[] = [
  {
    id: 1,
    code: "PRJ-2026-001",
    name: "Check Dam Project - Amreli",
    department: "Irrigation & Water Resources Dept, Gujarat",
    value: 12000000,
    progress: 68,
    received: 7500000,
    expense: 4850000,
    status: "Active",
    startDate: "01/03/2026",
    targetDate: "30/11/2026",
    location: "Shedubhar, Amreli District",
    supervisorName: "Ramesh Patel",
    notes: "Earthen embankment & RCC overflow crest section in progress."
  },
  {
    id: 2,
    code: "PRJ-2026-002",
    name: "Govt Community Hall - Rajkot",
    department: "Roads & Buildings (R&B) PWD, Rajkot",
    value: 20000000,
    progress: 45,
    received: 8000000,
    expense: 6150000,
    status: "Active",
    startDate: "15/01/2026",
    targetDate: "31/12/2026",
    location: "Kothariya, Rajkot",
    supervisorName: "Suresh Desai",
    notes: "Second floor RCC slab casting scheduled next week."
  },
  {
    id: 3,
    code: "PRJ-2026-003",
    name: "Water Pipeline & Sump - Bhavnagar",
    department: "Gujarat Water Supply & Sewerage Board (GWSSB)",
    value: 8500000,
    progress: 82,
    received: 6500000,
    expense: 4300000,
    status: "Active",
    startDate: "10/02/2026",
    targetDate: "15/10/2026",
    location: "Gadhada Road, Bhavnagar",
    supervisorName: "Suresh Desai",
    notes: "Hydro-testing of 4.5km DI pipeline completed successfully."
  },
  {
    id: 4,
    code: "PRJ-2026-004",
    name: "Underground Drainage Network",
    department: "Amreli Municipality",
    value: 5500000,
    progress: 25,
    received: 1500000,
    expense: 1100000,
    status: "Pending",
    startDate: "01/06/2026",
    targetDate: "31/03/2027",
    location: "Lathi Road Ward-4, Amreli",
    supervisorName: "Ramesh Patel",
    notes: "Trench excavation and RCC pipe laying underway."
  }
];

// Sample placeholder receipt image
const SAMPLE_RECEIPT_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><rect width='100%25' height='100%25' fill='%23f8fafc'/><rect x='20' y='20' width='360' height='220' rx='8' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='2'/><text x='40' y='60' font-family='sans-serif' font-size='18' font-weight='bold' fill='%230f172a'>TAX INVOICE / VOUCHER</text><text x='40' y='90' font-family='sans-serif' font-size='12' fill='%2364748b'>K.S.Godhani Construction &amp; Civil Works</text><line x1='40' y1='105' x2='360' y2='105' stroke='%23e2e8f0' stroke-width='2'/><text x='40' y='135' font-family='sans-serif' font-size='13' fill='%23334155'>Item: UltraTech Cement OPC-53 (100 Bags)</text><text x='40' y='160' font-family='sans-serif' font-size='13' fill='%23334155'>Supplier: ABC Building Materials, Amreli</text><text x='40' y='190' font-family='sans-serif' font-size='16' font-weight='bold' fill='%23059669'>Total Paid: Rs. 38,000/- (Cash)</text><text x='260' y='220' font-family='sans-serif' font-size='11' font-style='italic' fill='%2394a3b8'>Verified on Site [OK]</text></svg>";

export const initialExpenses: Expense[] = [
  {
    id: 101,
    date: "28/08/2026",
    project: "Check Dam Project - Amreli",
    category: "Material",
    subCategory: "Cement (OPC 53)",
    description: "100 Bags UltraTech Cement for spillway concrete",
    vendor: "Shree Ram Cement Agency",
    quantity: 100,
    unit: "Bags",
    unitRate: 380,
    amount: 38000,
    paymentMode: "Cash",
    billNumber: "INV-SRC-884",
    status: "Paid",
    enteredBy: "Ramesh Patel",
    attachments: [
      {
        id: "att-1",
        name: "cement_bill_28aug.jpg",
        dataUrl: SAMPLE_RECEIPT_IMG,
        type: "image/svg+xml",
        uploadedAt: "28/08/2026"
      }
    ]
  },
  {
    id: 102,
    date: "27/08/2026",
    project: "Check Dam Project - Amreli",
    category: "Machinery",
    subCategory: "Excavator (JCB)",
    description: "JCB Excavator 8 hours foundation digging",
    vendor: "Maruti Earthmovers",
    quantity: 8,
    unit: "Hours",
    unitRate: 1500,
    amount: 12000,
    paymentMode: "Cash",
    billNumber: "ME-LOG-302",
    status: "Paid",
    enteredBy: "Ramesh Patel",
    attachments: [
      {
        id: "att-2",
        name: "jcb_hours_slip.jpg",
        dataUrl: SAMPLE_RECEIPT_IMG,
        type: "image/svg+xml",
        uploadedAt: "27/08/2026"
      }
    ]
  },
  {
    id: 103,
    date: "26/08/2026",
    project: "Govt Community Hall - Rajkot",
    category: "Material",
    subCategory: "TMT Steel Bars",
    description: "5 Tons 12mm & 16mm Kamdhenu TMT Steel",
    vendor: "National Steel Traders Rajkot",
    quantity: 5000,
    unit: "Kg",
    unitRate: 64,
    amount: 320000,
    paymentMode: "Bank Transfer / RTGS",
    billNumber: "NST-GST-2026-91",
    status: "Paid",
    enteredBy: "Suresh Desai",
    attachments: [
      {
        id: "att-3",
        name: "steel_weighbridge_slip.jpg",
        dataUrl: SAMPLE_RECEIPT_IMG,
        type: "image/svg+xml",
        uploadedAt: "26/08/2026"
      }
    ]
  },
  {
    id: 104,
    date: "25/08/2026",
    project: "Govt Community Hall - Rajkot",
    category: "Labour",
    subCategory: "Mason & Helper",
    description: "Weekly labor gang payment (12 workers)",
    vendor: "Mukadam Babubhai Gang",
    quantity: 12,
    unit: "Workers",
    unitRate: 5500,
    amount: 66000,
    paymentMode: "Cash",
    billNumber: "LAB-WK-34",
    status: "Paid",
    enteredBy: "Suresh Desai"
  },
  {
    id: 105,
    date: "24/08/2026",
    project: "Water Pipeline & Sump - Bhavnagar",
    category: "Fuel",
    subCategory: "Diesel",
    description: "300 Litres Diesel for Generator & Crane",
    vendor: "HPCL Petrol Pump Gadhada",
    quantity: 300,
    unit: "Litres",
    unitRate: 92,
    amount: 27600,
    paymentMode: "UPI",
    billNumber: "HP-POS-4491",
    status: "Paid",
    enteredBy: "Suresh Desai"
  }
];

export const initialBills: Bill[] = [
  {
    id: 1,
    billNo: "RA-BILL-01/AMRELI",
    date: "10/05/2026",
    project: "Check Dam Project - Amreli",
    description: "1st Running Account Bill (Earthwork & Foundation Cleared)",
    amount: 3500000,
    received: 3500000,
    status: "Received",
    paymentReference: "SBI-TREASURY-CHQ-89912",
    tenderItemRef: "Item 1 to 4"
  },
  {
    id: 2,
    billNo: "RA-BILL-02/AMRELI",
    date: "15/07/2026",
    project: "Check Dam Project - Amreli",
    description: "2nd Running Account Bill (Masonry & Spillway Wall)",
    amount: 4500000,
    received: 4000000,
    status: "Partial",
    paymentReference: "TREASURY-NEFT-5512",
    tenderItemRef: "Item 5 to 9"
  },
  {
    id: 3,
    billNo: "RA-BILL-01/R&B-RJK",
    date: "20/06/2026",
    project: "Govt Community Hall - Rajkot",
    description: "1st Running Bill (Plinth & Ground Floor Structure)",
    amount: 8000000,
    received: 8000000,
    status: "Received",
    paymentReference: "R&B-GOVT-PAY-11029",
    tenderItemRef: "Item A1-A12"
  },
  {
    id: 4,
    billNo: "RA-BILL-01/GWSSB-BVN",
    date: "05/08/2026",
    project: "Water Pipeline & Sump - Bhavnagar",
    description: "1st Running Bill (Pipe Supply & 3km Trenching)",
    amount: 6500000,
    received: 6500000,
    status: "Received",
    paymentReference: "GWSSB-E-PAY-7782",
    tenderItemRef: "Pipe Supply Clause 3.2"
  },
  {
    id: 5,
    billNo: "RA-BILL-01/MUNI-AMR",
    date: "12/08/2026",
    project: "Underground Drainage Network",
    description: "Initial Mobilization & Pipe Laying Bill",
    amount: 1500000,
    received: 1500000,
    status: "Received",
    paymentReference: "MUNI-CHQ-4412",
    tenderItemRef: "Mobilization Clause 1"
  }
];

export const initialLabour: LabourWorker[] = [
  { id: 1, name: "Bhikhabhai Parmar", role: "Mason", project: "Check Dam Project - Amreli", phone: "9824111222", dailyWage: 850, daysWorked: 24, totalEarned: 20400, paid: 20400, status: "Active" },
  { id: 2, name: "Kanji Solanki", role: "Helper", project: "Check Dam Project - Amreli", phone: "9824222333", dailyWage: 550, daysWorked: 22, totalEarned: 12100, paid: 12100, status: "Active" },
  { id: 3, name: "Jignesh Vaghela", role: "Barbender", project: "Govt Community Hall - Rajkot", phone: "9824333444", dailyWage: 900, daysWorked: 20, totalEarned: 18000, paid: 15000, status: "Active" },
  { id: 4, name: "Manish Rathod", role: "Carpenter", project: "Govt Community Hall - Rajkot", phone: "9824444555", dailyWage: 900, daysWorked: 18, totalEarned: 16200, paid: 16200, status: "Active" },
  { id: 5, name: "Dharmesh Gohil", role: "Plumber", project: "Water Pipeline & Sump - Bhavnagar", phone: "9824555666", dailyWage: 800, daysWorked: 21, totalEarned: 16800, paid: 14000, status: "Active" }
];

export const initialMaterial: MaterialItem[] = [
  { id: 1, name: "Cement (OPC 53 Grade)", category: "Binding", unit: "Bags", quantity: 380, minStock: 100, pricePerUnit: 380, project: "Check Dam Project - Amreli", lastUpdated: "28/08/2026", supplierName: "Shree Ram Cement Agency" },
  { id: 2, name: "River Sand (Bhadar Reti)", category: "Aggregate", unit: "Brass (Cu.Ft)", quantity: 650, minStock: 200, pricePerUnit: 48, project: "Check Dam Project - Amreli", lastUpdated: "27/08/2026", supplierName: "Lathi Sand Supply" },
  { id: 3, name: "TMT Steel 12mm Fe-500D", category: "Steel", unit: "Kg", quantity: 3200, minStock: 800, pricePerUnit: 64, project: "Govt Community Hall - Rajkot", lastUpdated: "26/08/2026", supplierName: "National Steel Rajkot" },
  { id: 4, name: "Coarse Aggregate 20mm (Kapchi)", category: "Aggregate", unit: "Brass", quantity: 80, minStock: 120, pricePerUnit: 38, project: "Govt Community Hall - Rajkot", lastUpdated: "25/08/2026", supplierName: "Gondal Crusher" },
  { id: 5, name: "DI Pressure Pipes 200mm", category: "Plumbing", unit: "Meters", quantity: 180, minStock: 50, pricePerUnit: 1450, project: "Water Pipeline & Sump - Bhavnagar", lastUpdated: "24/08/2026", supplierName: "Jindal Pipes Ltd" }
];

export const initialMachinery: Machinery[] = [
  { id: 1, name: "JCB 3DX Excavator", type: "Excavator (JCB)", registrationNo: "GJ-14-AB-1290", project: "Check Dam Project - Amreli", dailyRate: 12000, daysUsed: 22, totalCost: 264000, status: "In Use", operatorName: "Haresh Bhai" },
  { id: 2, name: "Concrete Mixer (1-Bag Hydraulic)", type: "Concrete Mixer", registrationNo: "GJ-03-M-4411", project: "Govt Community Hall - Rajkot", dailyRate: 2500, daysUsed: 25, totalCost: 62500, status: "In Use", operatorName: "Pravin Bhai" },
  { id: 3, name: "Mahindra 575 DI Tractor Trolley", type: "Tractor & Trolley", registrationNo: "GJ-14-K-8923", project: "Check Dam Project - Amreli", dailyRate: 3500, daysUsed: 16, totalCost: 56000, status: "Available", operatorName: "Nilesh Bhai" },
  { id: 4, name: "High Pressure Dewatering Pump 7.5HP", type: "Water Pump", registrationNo: "PUMP-GW-09", project: "Water Pipeline & Sump - Bhavnagar", dailyRate: 1500, daysUsed: 18, totalCost: 27000, status: "In Use", operatorName: "Site Team" }
];

export const initialReports: DailyReport[] = [
  {
    id: 1,
    date: "28/08/2026",
    project: "Check Dam Project - Amreli",
    reportedBy: "Ramesh Patel",
    labourCount: 26,
    workDone: "Completed 45 cubic meters M-20 concrete pouring for main spillway body wall. Vibrator compaction executed smoothly.",
    materialUsed: "120 bags cement, 350 cu.ft sand, 420 cu.ft 20mm metal",
    issues: "None. Weather was clear and curing water available.",
    progress: 68,
    weather: "Sunny / Clear"
  },
  {
    id: 2,
    date: "27/08/2026",
    project: "Govt Community Hall - Rajkot",
    reportedBy: "Suresh Desai",
    labourCount: 22,
    workDone: "Completed shuttering and steel reinforcement binding for beam B1-B8 on 1st floor.",
    materialUsed: "850 kg TMT steel, binding wire 25 kg",
    issues: "Heavy rainfall in afternoon caused 2 hours stoppage.",
    progress: 45,
    weather: "Rainy / Wet"
  },
  {
    id: 3,
    date: "26/08/2026",
    project: "Water Pipeline & Sump - Bhavnagar",
    reportedBy: "Suresh Desai",
    labourCount: 14,
    workDone: "Excavation and alignment for 200mm pipeline along chainage 3.2km to 3.7km.",
    materialUsed: "50 meters DI pipe, rubber gaskets",
    issues: "Rocky stratum encountered at ch 3.5km, breaker attachment required.",
    progress: 82,
    weather: "Sunny / Clear"
  }
];
