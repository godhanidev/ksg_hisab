// ─── Automated Reports & Exports (Excel/CSV & Printable Audit Statement) ───────

import { Bill, DailyReport, Expense, LabourWorker, Machinery, MaterialItem, Project } from "../types";
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
 * Generates an Excel-ready Expense Ledger
 */
export function exportExpensesExcel(expenses: Expense[], projectName?: string) {
  const headers = ["ID", "Date", "Project Site", "Category", "Sub-Category", "Description", "Vendor / Receiver", "Quantity", "Unit", "Rate (Rs)", "Total Amount (Rs)", "Payment Mode", "Bill / Voucher No", "Status"];
  const rows = expenses.map(e => [
    e.id,
    e.date,
    e.project,
    e.category,
    e.subCategory || "-",
    e.description,
    e.vendor,
    e.quantity || 1,
    e.unit || "-",
    e.unitRate || e.amount,
    e.amount,
    e.paymentMode || "Cash",
    e.billNumber || "-",
    e.status
  ]);
  exportToExcelCSV(`KSG_Expenses_${projectName ? projectName.replace(/\s+/g, "_") : "All_Sites"}`, headers, rows);
}

/**
 * Generates an Excel-ready Govt Bills & Payments Report
 */
export function exportBillsExcel(bills: Bill[], projectName?: string) {
  const headers = ["ID", "Bill No", "Date", "Project Site", "Description", "Total Bill Amount (Rs)", "Received Amount (Rs)", "Pending Amount (Rs)", "Status"];
  const rows = bills.map(b => [
    b.id,
    b.billNo,
    b.date,
    b.project,
    b.description,
    b.amount,
    b.received,
    b.amount - b.received,
    b.status
  ]);
  exportToExcelCSV(`KSG_Govt_Bills_${projectName ? projectName.replace(/\s+/g, "_") : "All_Sites"}`, headers, rows);
}

/**
 * Generates Full Site P&L Summary Excel
 */
export function exportSiteSummaryExcel(projects: Project[], expenses: Expense[], bills: Bill[]) {
  const headers = ["Site Code", "Project Name", "Govt Department", "Contract Value (Rs)", "Cleared Govt Payment (Rs)", "Total Expenses (Rs)", "Net Profit / Margin (Rs)", "Profit %", "Progress %", "Status"];
  const rows = projects.map(p => {
    const profit = p.received - p.expense;
    const profitPct = p.received > 0 ? ((profit / p.received) * 100).toFixed(1) + "%" : "0%";
    return [
      p.code,
      p.name,
      p.department,
      p.value,
      p.received,
      p.expense,
      profit,
      profitPct,
      `${p.progress}%`,
      p.status
    ];
  });
  exportToExcelCSV("KSG_Project_Summary_PL", headers, rows);
}

/**
 * Opens a styled, formatted A4 printable PDF report ready for submission to CA / Govt Offices.
 */
export function printAuditReport({
  title,
  project,
  projects,
  expenses,
  bills,
  labour,
  materials,
  machinery,
  dateRange,
}: {
  title: string;
  project?: Project;
  projects?: Project[];
  expenses: Expense[];
  bills: Bill[];
  labour: LabourWorker[];
  materials?: MaterialItem[];
  machinery?: Machinery[];
  reports?: DailyReport[];
  dateRange?: string;
}) {
  const totalReceived = project ? project.received : bills.reduce((s, b) => s + b.received, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBilled = bills.reduce((s, b) => s + b.amount, 0);
  const netProfit = totalReceived - totalExpense;

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
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 12px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .company-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
    .company-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .report-badge { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
    .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .kpi-value { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px; }
    .kpi-profit { color: #059669; }
    .kpi-expense { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .section-title { font-size: 13px; font-weight: bold; margin: 16px 0 8px 0; color: #0f172a; border-left: 4px solid #0f172a; padding-left: 8px; }
    .footer-signs { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .sign-box { width: 180px; text-align: center; border-top: 1px dashed #64748b; padding-top: 8px; font-size: 10px; color: #475569; }
    .btn-bar { margin-bottom: 15px; }
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
      <p class="company-sub">Government Approved Contractor | PWD, Irrigation & Water Resources Works</p>
      <p class="company-sub">Official Financial & Site Accounting Audit Report</p>
    </div>
    <div class="report-badge">
      <div style="font-weight:bold; font-size:12px;">${title}</div>
      <div style="font-size:10px; color:#64748b; margin-top:2px;">Generated: ${new Date().toLocaleDateString("en-GB")}</div>
      ${dateRange ? `<div style="font-size:10px; color:#0369a1;">Period: ${dateRange}</div>` : ""}
    </div>
  </div>

  ${project ? `
  <div style="background:#f1f5f9; padding:8px 12px; border-radius:6px; margin-bottom:12px; font-size:11px; display:flex; justify-content:space-between;">
    <div><strong>Project Site:</strong> ${project.name} (${project.code})</div>
    <div><strong>Department:</strong> ${project.department}</div>
    <div><strong>Contract Value:</strong> ${formatINR(project.value)}</div>
    <div><strong>Work Progress:</strong> ${project.progress}%</div>
  </div>
  ` : ""}

  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">${project ? "Contract Budget" : "Total Contract Value"}</div>
      <div class="kpi-value">${formatINR(project ? project.value : (projects?.reduce((s, p) => s + p.value, 0) || 0))}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Cleared Govt Payment</div>
      <div class="kpi-value kpi-profit">${formatINR(totalReceived)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Total Site Expenses</div>
      <div class="kpi-value kpi-expense">${formatINR(totalExpense)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Net Balance / Surplus</div>
      <div class="kpi-value ${netProfit >= 0 ? "kpi-profit" : "kpi-expense"}">${formatINR(netProfit)}</div>
    </div>
  </div>

  <div class="section-title">1. Government Running Bills & Cleared Receipts</div>
  <table>
    <thead>
      <tr>
        <th>Bill No</th>
        <th>Date</th>
        <th>Project Site</th>
        <th>Description</th>
        <th class="text-right">Bill Amount</th>
        <th class="text-right">Cleared Amount</th>
        <th class="text-right">Pending</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${bills.map(b => `
        <tr>
          <td><strong>${b.billNo}</strong></td>
          <td>${b.date}</td>
          <td>${b.project}</td>
          <td>${b.description}</td>
          <td class="text-right">${formatINR(b.amount)}</td>
          <td class="text-right" style="color:#059669; font-weight:bold;">${formatINR(b.received)}</td>
          <td class="text-right" style="color:#d97706;">${formatINR(b.amount - b.received)}</td>
          <td>${b.status}</td>
        </tr>
      `).join("")}
      <tr style="font-weight:bold; background:#e2e8f0;">
        <td colspan="4">TOTAL</td>
        <td class="text-right">${formatINR(totalBilled)}</td>
        <td class="text-right" style="color:#059669;">${formatINR(totalReceived)}</td>
        <td class="text-right" style="color:#d97706;">${formatINR(totalBilled - totalReceived)}</td>
        <td>-</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Itemized Site Expenses (Materials, Machinery, Fuel, Subcontractors)</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Site</th>
        <th>Category</th>
        <th>Description</th>
        <th>Vendor / Payee</th>
        <th>Qty & Unit</th>
        <th class="text-right">Amount (Rs)</th>
        <th>Mode</th>
        <th>Voucher #</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.slice(0, 30).map(e => `
        <tr>
          <td>${e.date}</td>
          <td>${e.project}</td>
          <td><strong>${e.category}</strong>${e.subCategory ? ` (${e.subCategory})` : ""}</td>
          <td>${e.description}</td>
          <td>${e.vendor}</td>
          <td>${e.quantity ? `${e.quantity} ${e.unit || ""}` : "-"}</td>
          <td class="text-right" style="font-weight:bold;">${formatINR(e.amount)}</td>
          <td>${e.paymentMode || "Cash"}</td>
          <td>${e.billNumber || "-"}</td>
        </tr>
      `).join("")}
      <tr style="font-weight:bold; background:#e2e8f0;">
        <td colspan="6">TOTAL EXPENSES</td>
        <td class="text-right" style="color:#dc2626;">${formatINR(totalExpense)}</td>
        <td colspan="2">-</td>
      </tr>
    </tbody>
  </table>

  ${labour.length > 0 ? `
  <div class="section-title">3. Labour & Worker Ledger Summary</div>
  <table>
    <thead>
      <tr>
        <th>Worker Name</th>
        <th>Role</th>
        <th>Project Site</th>
        <th>Wage/Day</th>
        <th>Days Worked</th>
        <th class="text-right">Total Earned</th>
        <th class="text-right">Paid</th>
        <th class="text-right">Due / Payable</th>
      </tr>
    </thead>
    <tbody>
      ${labour.map(l => `
        <tr>
          <td><strong>${l.name}</strong></td>
          <td>${l.role}</td>
          <td>${l.project}</td>
          <td>${formatINR(l.dailyWage)}</td>
          <td>${l.daysWorked} days</td>
          <td class="text-right">${formatINR(l.totalEarned)}</td>
          <td class="text-right" style="color:#059669;">${formatINR(l.paid)}</td>
          <td class="text-right" style="color:#dc2626; font-weight:bold;">${formatINR(l.totalEarned - l.paid)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  <div class="footer-signs">
    <div class="sign-box">Prepared By (Site Engineer / Supervisor)</div>
    <div class="sign-box">Audited By (Chartered Accountant)</div>
    <div class="sign-box">Authorized Signatory (K.S.Godhani)</div>
  </div>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
