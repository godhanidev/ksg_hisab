// ─── Automated Reports & Exports (Excel/CSV & Printable Audit Statement) ───────

import { BankPayment, CashTransaction, GSTBill, Project, UserAccount } from "../types";
import { formatINR } from "./formatters";


/**
 * Downloads data as a UTF-8 CSV/Excel file with BOM so Gujarati/Hindi characters open properly in Excel.
 */
export function exportToExcelCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...rows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Excel-ready Site Daily Cash Ledger (Cash In & Out)
 */
export function exportCashTransactionsExcel(transactions: CashTransaction[], projectName?: string) {
  const headers = [
    "ID",
    "Date",
    "Site / Project",
    "Type",
    "Details / Purpose",
    "Category",
    "Amount (Rs)",
    "Payment Mode",
    "Supervisor",
    "Entered By",
    "Notes"
  ];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.project,
    t.type === "cash_in" ? "Cash In (જમા)" : "Cash Out (ઉધાર)",
    t.details,
    t.category || "-",
    t.amount,
    t.paymentMode,
    t.supervisorName || "-",
    t.enteredBy,
    t.notes || "-"
  ]);
  exportToExcelCSV(`KSG_Daily_Cash_${projectName ? projectName.replace(/\s+/g, "_") : "All_Sites"}`, headers, rows);
}

/**
 * Generates an Excel-ready Direct Office Bank Payments Report
 */
export function exportBankPaymentsExcel(payments: BankPayment[], projectName?: string) {
  const headers = [
    "ID",
    "Date",
    "Site / Project",
    "Party / Supplier Name",
    "Amount (Rs)",
    "Payment Mode",
    "Reference / UTR / Cheque No",
    "Category",
    "Entered By",
    "Notes"
  ];
  const rows = payments.map(p => [
    p.id,
    p.date,
    p.project,
    p.partyName,
    p.amount,
    p.paymentMode,
    p.referenceNo || "-",
    p.category || "-",
    p.enteredBy,
    p.notes || "-"
  ]);
  exportToExcelCSV(`KSG_Bank_Payments_${projectName ? projectName.replace(/\s+/g, "_") : "All_Sites"}`, headers, rows);
}

/**
 * Generates an Excel-ready GST Tax Bills Report
 */
export function exportGSTBillsExcel(bills: GSTBill[], projectName?: string) {
  const headers = [
    "ID",
    "Date",
    "Site / Project",
    "Bill No",
    "Party / Supplier Name",
    "Product / Item",
    "Basic Amount (Rs)",
    "GST Rate (%)",
    "GST Amount (Rs)",
    "Total Amount (Rs)",
    "Status",
    "Entered By",
    "Notes"
  ];
  const rows = bills.map(b => [
    b.id,
    b.date,
    b.project,
    b.billNo,
    b.partyName,
    b.product,
    b.basicAmount,
    `${b.gstRate}%`,
    b.gstAmount,
    b.totalAmount,
    b.status,
    b.enteredBy,
    b.notes || "-"
  ]);
  exportToExcelCSV(`KSG_GST_Bills_${projectName ? projectName.replace(/\s+/g, "_") : "All_Sites"}`, headers, rows);
}

/**
 * Generates Consolidated Site Hisab Summary Excel
 */
export function exportConsolidatedSiteExcel(
  projects: Project[],
  cash: CashTransaction[],
  bank: BankPayment[],
  gst: GSTBill[]
) {
  const headers = [
    "Site Code",
    "Site / Project Name",
    "Department / Client",
    "Tender / Contract Value (Rs)",
    "Cash Given (જમા)",
    "Site Cash Spent (ઉધાર)",
    "Site Cash in Hand",
    "Bank Payments (RTGS)",
    "GST Bills Total",
    "Total Project Cost (Rs)",
    "Status"
  ];

  const rows = projects.map(p => {
    const pCash = cash.filter(c => c.project === p.name);
    const pBank = bank.filter(b => b.project === p.name);
    const pGst = gst.filter(g => g.project === p.name);

    const cashIn = pCash.filter(c => c.type === "cash_in").reduce((s, c) => s + c.amount, 0);
    const cashOut = pCash.filter(c => c.type === "cash_out").reduce((s, c) => s + c.amount, 0);
    const cashBalance = cashIn - cashOut;
    const totalBank = pBank.reduce((s, b) => s + b.amount, 0);
    const totalGst = pGst.reduce((s, g) => s + g.totalAmount, 0);
    const totalCost = cashOut + totalBank;

    return [
      p.code,
      p.name,
      p.department,
      p.value,
      cashIn,
      cashOut,
      cashBalance,
      totalBank,
      totalGst,
      totalCost,
      p.status
    ];
  });

  exportToExcelCSV("KSG_Consolidated_Project_Hisab", headers, rows);
}

/**
 * Opens a styled, formatted A4 printable PDF report ready for submission to CA / Govt Offices.
 */
export function printAuditReport({
  title,
  project,
  projects,
  cashTransactions,
  bankPayments,
  gstBills,
  dateRange,
}: {
  title: string;
  project?: Project;
  projects?: Project[];
  cashTransactions: CashTransaction[];
  bankPayments: BankPayment[];
  gstBills: GSTBill[];
  dateRange?: string;
}) {
  const totalCashIn = cashTransactions.filter(c => c.type === "cash_in").reduce((s, c) => s + c.amount, 0);
  const totalCashOut = cashTransactions.filter(c => c.type === "cash_out").reduce((s, c) => s + c.amount, 0);
  const cashInHand = totalCashIn - totalCashOut;
  const totalBank = bankPayments.reduce((s, b) => s + b.amount, 0);
  const totalGst = gstBills.reduce((s, g) => s + g.totalAmount, 0);
  const totalCost = totalCashOut + totalBank;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the printable audit report.");
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${title} - K.S.Godhani</title>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 11px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
    .company-title { font-size: 18px; font-weight: bold; color: #0f172a; margin: 0; }
    .company-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .report-badge { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
    .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center; }
    .kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .kpi-value { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 3px; }
    .kpi-cashin { color: #059669; }
    .kpi-cashout { color: #dc2626; }
    .kpi-balance { color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 5px 6px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    td { padding: 5px 6px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .section-title { font-size: 12px; font-weight: bold; margin: 14px 0 6px 0; color: #0f172a; border-left: 3px solid #0f172a; padding-left: 6px; }
    .footer-signs { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .sign-box { width: 160px; text-align: center; border-top: 1px dashed #64748b; padding-top: 6px; font-size: 9px; color: #475569; }
    .btn-bar { margin-bottom: 12px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="btn-bar no-print">
    <button onclick="window.print()" style="background:#0f172a; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold;">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()" style="background:#e2e8f0; color:#0f172a; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; margin-left:8px;">Close</button>
  </div>

  <div class="header">
    <div>
      <h1 class="company-title">K.S.GODHANI CONSTRUCTION & CIVIL WORKS</h1>
      <p class="company-sub">Govt Approved Contractor | Site Hisab & Project Accounting Statement</p>
    </div>
    <div class="report-badge">
      <div style="font-weight:bold; font-size:11px;">${title}</div>
      <div style="font-size:9px; color:#64748b; margin-top:2px;">Date: ${new Date().toLocaleDateString("en-GB")}</div>
      ${dateRange ? `<div style="font-size:9px; color:#0369a1;">Period: ${dateRange}</div>` : ""}
    </div>
  </div>

  ${project ? `
  <div style="background:#f1f5f9; padding:6px 10px; border-radius:6px; margin-bottom:10px; font-size:10px; display:flex; justify-content:space-between;">
    <div><strong>Project Site:</strong> ${project.name} (${project.code})</div>
    <div><strong>Department:</strong> ${project.department}</div>
    <div><strong>Tender Value:</strong> ${formatINR(project.value)}</div>
    <div><strong>Supervisor:</strong> ${project.supervisorName || "-"}</div>
  </div>
  ` : ""}

  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">Total Cash Given (જમા)</div>
      <div class="kpi-value kpi-cashin">${formatINR(totalCashIn)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Site Cash Expense (ઉધાર)</div>
      <div class="kpi-value kpi-cashout">${formatINR(totalCashOut)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Cash in Hand (સિલક)</div>
      <div class="kpi-value kpi-balance">${formatINR(cashInHand)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Direct Bank Payment</div>
      <div class="kpi-value">${formatINR(totalBank)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Total Project Cost</div>
      <div class="kpi-value" style="color:#0f172a;">${formatINR(totalCost)}</div>
    </div>
  </div>

  <div class="section-title">1. Site Daily Cash / Petty Expense Ledger (જમા / ઉધાર)</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Site</th>
        <th>Type</th>
        <th>Details / Purpose</th>
        <th>Category</th>
        <th class="text-right">Cash In (જમા)</th>
        <th class="text-right">Cash Out (ઉધાર)</th>
        <th>Supervisor</th>
      </tr>
    </thead>
    <tbody>
      ${cashTransactions.map(c => `
        <tr>
          <td>${c.date}</td>
          <td>${c.project}</td>
          <td><span style="color:${c.type === "cash_in" ? "#059669" : "#dc2626"}; font-weight:600;">${c.type === "cash_in" ? "જમા" : "ઉધાર"}</span></td>
          <td><strong>${c.details}</strong></td>
          <td>${c.category || "-"}</td>
          <td class="text-right" style="color:#059669;">${c.type === "cash_in" ? formatINR(c.amount) : "-"}</td>
          <td class="text-right" style="color:#dc2626;">${c.type === "cash_out" ? formatINR(c.amount) : "-"}</td>
          <td>${c.supervisorName || "-"}</td>
        </tr>
      `).join("")}
      <tr style="font-weight:bold; background:#e2e8f0;">
        <td colspan="5">TOTAL CASH SUMMARY</td>
        <td class="text-right" style="color:#059669;">${formatINR(totalCashIn)}</td>
        <td class="text-right" style="color:#dc2626;">${formatINR(totalCashOut)}</td>
        <td>Net: ${formatINR(cashInHand)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Direct Office Bank Payments (RTGS / NEFT / Cheques)</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Site</th>
        <th>Party / Vendor Name</th>
        <th>Category</th>
        <th>Mode</th>
        <th>Ref / UTR No</th>
        <th class="text-right">Amount (Rs)</th>
      </tr>
    </thead>
    <tbody>
      ${bankPayments.map(b => `
        <tr>
          <td>${b.date}</td>
          <td>${b.project}</td>
          <td><strong>${b.partyName}</strong></td>
          <td>${b.category || "-"}</td>
          <td>${b.paymentMode}</td>
          <td>${b.referenceNo || "-"}</td>
          <td class="text-right" style="font-weight:bold;">${formatINR(b.amount)}</td>
        </tr>
      `).join("")}
      <tr style="font-weight:bold; background:#e2e8f0;">
        <td colspan="6">TOTAL BANK PAYMENTS</td>
        <td class="text-right">${formatINR(totalBank)}</td>
      </tr>
    </tbody>
  </table>

  ${gstBills.length > 0 ? `
  <div class="section-title">3. GST Bills & Material Tax Invoices</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Bill No</th>
        <th>Party Name</th>
        <th>Product</th>
        <th class="text-right">Basic Amount</th>
        <th class="text-right">GST Rate</th>
        <th class="text-right">GST Amount</th>
        <th class="text-right">Total Bill</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${gstBills.map(g => `
        <tr>
          <td>${g.date}</td>
          <td><strong>${g.billNo}</strong></td>
          <td>${g.partyName}</td>
          <td>${g.product}</td>
          <td class="text-right">${formatINR(g.basicAmount)}</td>
          <td class="text-right">${g.gstRate}%</td>
          <td class="text-right">${formatINR(g.gstAmount)}</td>
          <td class="text-right" style="font-weight:bold;">${formatINR(g.totalAmount)}</td>
          <td>${g.status}</td>
        </tr>
      `).join("")}
      <tr style="font-weight:bold; background:#e2e8f0;">
        <td colspan="7">TOTAL GST INVOICES</td>
        <td class="text-right">${formatINR(totalGst)}</td>
        <td>-</td>
      </tr>
    </tbody>
  </table>
  ` : ""}

  <div class="footer-signs">
    <div class="sign-box">Site Supervisor / Engineer</div>
    <div class="sign-box">Accounts & Auditor (CA)</div>
    <div class="sign-box">Authorized Signatory (K.S.Godhani)</div>
  </div>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generates an encrypted/JSON full system snapshot backup file containing all 5 collections.
 */
export function exportFullSystemBackupJSON(data: {
  projects: Project[];
  cashTransactions: CashTransaction[];
  bankPayments: BankPayment[];
  gstBills: GSTBill[];
  users: UserAccount[];
}) {
  const payload = {
    appName: "KSG Hisab Enterprise ERP",
    version: "5.0",
    backupTimestamp: new Date().toISOString(),
    counts: {
      projects: data.projects.length,
      cashTransactions: data.cashTransactions.length,
      bankPayments: data.bankPayments.length,
      gstBills: data.gstBills.length,
      users: data.users.length,
    },
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `KSG_Hisab_FULL_BACKUP_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses uploaded backup JSON file
 */
export function parseSystemBackupJSON(jsonStr: string): {
  projects?: Project[];
  cashTransactions?: CashTransaction[];
  bankPayments?: BankPayment[];
  gstBills?: GSTBill[];
  users?: UserAccount[];
} | null {
  try {
    const parsed = JSON.parse(jsonStr);
    const content = parsed.data || parsed;
    if (
      Array.isArray(content.projects) ||
      Array.isArray(content.cashTransactions) ||
      Array.isArray(content.bankPayments) ||
      Array.isArray(content.gstBills) ||
      Array.isArray(content.users)
    ) {
      return content;
    }
    return null;
  } catch (err) {
    console.error("Failed to parse backup JSON:", err);
    return null;
  }
}

