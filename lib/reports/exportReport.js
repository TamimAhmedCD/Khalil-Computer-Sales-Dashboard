// Report export engine — PDF (jsPDF), Excel (SheetJS), and Print (isolated iframe).
//
// The renderers are generic: they consume a neutral { kpis, sections } model plus
// a meta descriptor, so any report page can reuse them by supplying its own model.
// Admin and employee model builders live at the bottom of this file.
//
// Heavy libraries (jspdf, jspdf-autotable, xlsx) are imported dynamically inside
// each handler so they stay out of the initial client bundle and never run during SSR.
//
// Currency note: jsPDF's built-in fonts are WinAnsi-encoded and cannot render the
// Bengali Taka glyph (৳ / U+09F3), so the PDF uses a "Tk " prefix. HTML/print keep ৳
// (the browser renders it fine); Excel stores raw numbers so cells stay sortable.

// =========================================================
// FORMATTERS
// =========================================================

const money = (v) =>
  Number(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });
const numFmt = (v) => Number(v || 0).toLocaleString("en-BD");
const pctFmt = (v) => `${Number(v || 0).toFixed(1)}%`;

const timeFmt = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString("en-BD", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// target: "html" | "pdf"
function displayCell(value, type, target) {
  switch (type) {
    case "money":
      return `${target === "pdf" ? "Tk " : "৳"}${money(value)}`;
    case "num":
      return numFmt(value);
    case "percent":
      return pctFmt(value);
    case "time":
      return timeFmt(value);
    default:
      return value == null || value === "" ? "—" : String(value);
  }
}

// Raw values for Excel — money/num/percent stay numeric so Excel can sum & sort.
function excelValue(value, type) {
  if (type === "money" || type === "num" || type === "percent") {
    return Number(value || 0);
  }
  if (type === "time") return timeFmt(value);
  return value == null ? "" : value;
}

// =========================================================
// PRINT — render a clean, self-contained document in a hidden
// iframe and print that, so the app's sidebar/header are never
// part of the printout.
// =========================================================

function buildReportHTML(model, meta) {
  const { kpis, sections } = model;

  const kpiHTML = kpis
    .map(
      (k) => `
      <div class="kpi">
        <div class="kpi-label">${escapeHtml(k.label)}</div>
        <div class="kpi-value">${escapeHtml(displayCell(k.value, k.type, "html"))}</div>
      </div>`,
    )
    .join("");

  const sectionsHTML = sections
    .filter((sec) => sec.rows.length)
    .map((sec) => {
      const head = sec.columns
        .map(
          (c) =>
            `<th class="${c.align === "right" ? "r" : "l"}">${escapeHtml(c.header)}</th>`,
        )
        .join("");
      const body = sec.rows
        .map(
          (r) =>
            `<tr>${sec.columns
              .map(
                (c) =>
                  `<td class="${c.align === "right" ? "r" : "l"}">${escapeHtml(
                    displayCell(r[c.key], c.type, "html"),
                  )}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("");
      return `<section class="block">
        <h2>${escapeHtml(sec.title)}</h2>
        <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      </section>`;
    })
    .join("");

  const filters = (meta.filters || [])
    .map((f) => `${escapeHtml(f.label)}: ${escapeHtml(f.value)}`)
    .join(" &nbsp;•&nbsp; ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(meta.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
  .muted { color: #64748b; }
  .rpt-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .rpt-head p { margin: 0; font-size: 12px; }
  .gen { text-align: right; font-size: 11px; white-space: nowrap; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .kpi-label { font-size: 11px; color: #64748b; }
  .kpi-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .block { margin-bottom: 18px; }
  h2 { font-size: 13px; margin: 0 0 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead { display: table-header-group; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #eef2f7; }
  th { background: #f1f5f9; font-weight: 600; }
  th.l, td.l { text-align: left; }
  th.r, td.r { text-align: right; }
  tr { page-break-inside: avoid; }
  footer { margin-top: 18px; font-size: 10px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  @page { margin: 14mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <header class="rpt-head">
    <div>
      <h1>${escapeHtml(meta.title)}</h1>
      <p class="muted">${filters}</p>
    </div>
    <div class="gen muted">Generated<br /><strong>${escapeHtml(meta.generatedAt)}</strong></div>
  </header>
  <section class="kpis">${kpiHTML}</section>
  ${sectionsHTML}
  <footer>Khalil Computer — Management System</footer>
</body>
</html>`;
}

export function printModel(model, meta) {
  const html = buildReportHTML(model, meta);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  iframe.srcdoc = html;

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) {
      iframe.remove();
      return;
    }
    const cleanup = () => setTimeout(() => iframe.remove(), 500);
    win.addEventListener("afterprint", cleanup);
    // Small delay lets fonts/layout settle before the print dialog opens.
    setTimeout(() => {
      win.focus();
      win.print();
    }, 150);
    // Safety net in case afterprint never fires (some browsers).
    setTimeout(cleanup, 60000);
  };

  document.body.appendChild(iframe);
}

// =========================================================
// PDF — jsPDF + autotable → downloaded .pdf
// =========================================================

export async function exportModelToPdf(model, meta) {
  const jspdfMod = await import("jspdf");
  const jsPDF = jspdfMod.jsPDF || jspdfMod.default?.jsPDF || jspdfMod.default;
  const autoTable = (await import("jspdf-autotable")).default;

  const { kpis, sections } = model;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(meta.title, M, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  const metaLines = [
    ...(meta.filters || []).map((f) => `${f.label}: ${f.value}`),
    `Generated: ${meta.generatedAt}`,
  ];
  metaLines.forEach((line) => {
    doc.splitTextToSize(line, pageW - M * 2).forEach((wrapped) => {
      doc.text(wrapped, M, y);
      y += 14;
    });
  });
  doc.setTextColor(0);
  y += 6;

  // KPIs as label/value pairs, two per row.
  const kpiBody = [];
  for (let i = 0; i < kpis.length; i += 2) {
    const a = kpis[i];
    const b = kpis[i + 1];
    kpiBody.push([
      a.label,
      displayCell(a.value, a.type, "pdf"),
      b ? b.label : "",
      b ? displayCell(b.value, b.type, "pdf") : "",
    ]);
  }
  autoTable(doc, {
    startY: y,
    body: kpiBody,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 116, 139] },
      2: { fontStyle: "bold", textColor: [100, 116, 139] },
    },
    margin: { left: M, right: M },
  });
  y = doc.lastAutoTable.finalY + 18;

  for (const sec of sections) {
    if (!sec.rows.length) continue;
    if (y > pageH - 90) {
      doc.addPage();
      y = M;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(sec.title, M, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [sec.columns.map((c) => c.header)],
      body: sec.rows.map((r) =>
        sec.columns.map((c) => displayCell(r[c.key], c.type, "pdf")),
      ),
      columnStyles: sec.columns.reduce((acc, c, i) => {
        acc[i] = { halign: c.align };
        return acc;
      }, {}),
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      margin: { left: M, right: M },
      tableWidth: pageW - M * 2,
    });
    y = doc.lastAutoTable.finalY + 18;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Khalil Computer — Management System", M, pageH - 16);
    doc.text(`Page ${p} of ${pages}`, pageW - M, pageH - 16, { align: "right" });
  }

  doc.save(`${meta.fileBase}.pdf`);
}

// =========================================================
// EXCEL — SheetJS → downloaded .xlsx (one sheet per section)
// =========================================================

function uniqueSheetName(title, used) {
  const base =
    String(title).replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 28) || "Sheet";
  let name = base;
  let i = 2;
  while (used.has(name)) name = `${base.slice(0, 26)} ${i++}`;
  used.add(name);
  return name;
}

export async function exportModelToExcel(model, meta) {
  const mod = await import("xlsx");
  const XLSX = mod.utils ? mod : mod.default;

  const { kpis, sections } = model;
  const wb = XLSX.utils.book_new();

  const summaryAoa = [
    [meta.title],
    [],
    ...(meta.filters || []).map((f) => [f.label, f.value]),
    ["Generated", meta.generatedAt],
    [],
    ["Metric", "Value"],
    ...kpis.map((k) => [k.label, excelValue(k.value, k.type)]),
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
  summaryWs["!cols"] = [{ wch: 24 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  const used = new Set(["Summary"]);
  for (const sec of sections) {
    if (!sec.rows.length) continue;
    const header = sec.columns.map((c) =>
      c.type === "money" ? `${c.header} (Tk)` : c.header,
    );
    const body = sec.rows.map((r) =>
      sec.columns.map((c) => excelValue(r[c.key], c.type)),
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    ws["!cols"] = sec.columns.map((c) => ({ wch: c.type === "text" ? 22 : 14 }));
    XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(sec.title, used));
  }

  XLSX.writeFile(wb, `${meta.fileBase}.xlsx`);
}

// =========================================================
// ADMIN REPORT MODEL  (/api/admin/reports shape)
// =========================================================

export function buildModel(reportData, meta) {
  const s = reportData?.summary || {};

  const kpis = [
    { label: "Total Revenue", value: s.totalRevenue, type: "money" },
    { label: "Net Profit", value: s.totalProfit, type: "money" },
    { label: "Profit Margin", value: meta.profitMargin, type: "percent" },
    { label: "Total Expense", value: s.totalExpense, type: "money" },
    { label: "Commission", value: s.totalCommission, type: "money" },
    { label: "Outstanding Due", value: s.totalDue, type: "money" },
    { label: "Transactions", value: s.transactionCount, type: "num" },
    { label: "Quantity Sold", value: s.totalQuantity, type: "num" },
    {
      label: "Average Transaction",
      value: s.transactionCount ? s.totalRevenue / s.transactionCount : 0,
      type: "money",
    },
  ];

  const sections = [
    {
      title: "Revenue & Profit Trend",
      columns: [
        { header: "Period", key: "label", type: "text", align: "left" },
        { header: "Revenue", key: "revenue", type: "money", align: "right" },
        { header: "Profit", key: "profit", type: "money", align: "right" },
      ],
      rows: reportData?.revenueTrend || [],
    },
    {
      title: "Seller Performance",
      columns: [
        { header: "Seller", key: "name", type: "text", align: "left" },
        { header: "Transactions", key: "transactions", type: "num", align: "right" },
        { header: "Revenue", key: "revenue", type: "money", align: "right" },
        { header: "Profit", key: "profit", type: "money", align: "right" },
        { header: "Commission", key: "commission", type: "money", align: "right" },
      ],
      rows: reportData?.sellerPerformance || [],
    },
    {
      title: "Category Performance",
      columns: [
        { header: "Category", key: "name", type: "text", align: "left" },
        { header: "Transactions", key: "transactions", type: "num", align: "right" },
        { header: "Quantity", key: "quantity", type: "num", align: "right" },
        { header: "Revenue", key: "revenue", type: "money", align: "right" },
        { header: "Expense", key: "expense", type: "money", align: "right" },
        { header: "Profit", key: "profit", type: "money", align: "right" },
      ],
      rows: reportData?.categoryPerformance || [],
    },
    {
      title: "Payment Methods",
      columns: [
        { header: "Method", key: "name", type: "text", align: "left" },
        { header: "% of Revenue", key: "percentage", type: "percent", align: "right" },
        { header: "Amount", key: "amount", type: "money", align: "right" },
      ],
      rows: reportData?.paymentMethods || [],
    },
    {
      title: "Outstanding Dues",
      columns: [
        { header: "Invoice", key: "invoice", type: "text", align: "left" },
        { header: "Customer", key: "customer", type: "text", align: "left" },
        { header: "Seller", key: "seller", type: "text", align: "left" },
        { header: "Total", key: "total", type: "money", align: "right" },
        { header: "Paid", key: "paid", type: "money", align: "right" },
        { header: "Due", key: "due", type: "money", align: "right" },
      ],
      rows: reportData?.outstandingDues || [],
    },
    {
      title: "Top Products & Services",
      columns: [
        { header: "Product / Service", key: "name", type: "text", align: "left" },
        { header: "Quantity", key: "quantity", type: "num", align: "right" },
        { header: "Revenue", key: "revenue", type: "money", align: "right" },
        { header: "Profit", key: "profit", type: "money", align: "right" },
      ],
      rows: reportData?.topProducts || [],
    },
    {
      title: "Recent Transactions",
      columns: [
        { header: "Invoice", key: "invoice", type: "text", align: "left" },
        { header: "Product / Service", key: "product", type: "text", align: "left" },
        { header: "Seller", key: "seller", type: "text", align: "left" },
        { header: "Amount", key: "amount", type: "money", align: "right" },
        { header: "Time", key: "time", type: "time", align: "right" },
      ],
      rows: reportData?.recentTransactions || [],
    },
  ];

  return { kpis, sections };
}

export const exportReportToPdf = (reportData, meta) =>
  exportModelToPdf(buildModel(reportData, meta), meta);
export const exportReportToExcel = (reportData, meta) =>
  exportModelToExcel(buildModel(reportData, meta), meta);
export const printReport = (reportData, meta) =>
  printModel(buildModel(reportData, meta), meta);

// =========================================================
// EMPLOYEE REPORT MODEL  (/api/products/sales rows)
// =========================================================

export function buildEmployeeModel(data) {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const summary = data?.summary || {};

  const sum = (key) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0);

  const totalRevenue = Number(summary.totalSalesAmount) || sum("totalPrice");
  const totalProfit = Number(summary.totalProfit) || sum("netProfit");
  const totalCommission = Number(summary.totalCommission) || sum("commission");
  const totalQuantity = sum("quantity");
  const count = rows.length;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const kpis = [
    { label: "Total Sales", value: totalRevenue, type: "money" },
    { label: "Net Profit", value: totalProfit, type: "money" },
    { label: "Commission", value: totalCommission, type: "money" },
    { label: "Profit Margin", value: margin, type: "percent" },
    { label: "Transactions", value: count, type: "num" },
    { label: "Quantity Sold", value: totalQuantity, type: "num" },
    {
      label: "Average Sale",
      value: count ? totalRevenue / count : 0,
      type: "money",
    },
  ];

  // Group helper → aggregated array sorted by revenue.
  const groupBy = (keyFn, seed) => {
    const map = new Map();
    for (const r of rows) {
      const key = keyFn(r);
      const bucket = map.get(key) || seed(key);
      bucket.transactions += 1;
      bucket.quantity += Number(r.quantity) || 0;
      bucket.revenue += Number(r.totalPrice) || 0;
      bucket.profit += Number(r.netProfit) || 0;
      bucket.commission += Number(r.commission) || 0;
      map.set(key, bucket);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  };

  const categoryRows = groupBy(
    (r) => r.categoryName || "Uncategorized",
    (name) => ({
      name,
      transactions: 0,
      quantity: 0,
      revenue: 0,
      profit: 0,
      commission: 0,
    }),
  );

  const topProducts = groupBy(
    (r) => r.productName || "—",
    (name) => ({
      name,
      transactions: 0,
      quantity: 0,
      revenue: 0,
      profit: 0,
      commission: 0,
    }),
  ).slice(0, 10);

  const payMap = new Map();
  for (const r of rows) {
    const key = r.paymentMethod || "Unspecified";
    payMap.set(key, (payMap.get(key) || 0) + (Number(r.totalPrice) || 0));
  }
  const paymentRows = [...payMap.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const txRows = rows.map((r) => ({
    time: r.createdAt,
    invoice: r.invoiceNumber || "—",
    product: r.productName || "—",
    category: r.categoryName || "—",
    quantity: Number(r.quantity) || 0,
    price: Number(r.totalPrice) || 0,
    expense: Number(r.rawExpense) || 0,
    profit: Number(r.netProfit) || 0,
    commission: Number(r.commission) || 0,
  }));

  const sections = [
    {
      title: "Category Performance",
      columns: [
        { header: "Category", key: "name", type: "text", align: "left" },
        { header: "Transactions", key: "transactions", type: "num", align: "right" },
        { header: "Quantity", key: "quantity", type: "num", align: "right" },
        { header: "Sales", key: "revenue", type: "money", align: "right" },
        { header: "Profit", key: "profit", type: "money", align: "right" },
        { header: "Commission", key: "commission", type: "money", align: "right" },
      ],
      rows: categoryRows,
    },
    {
      title: "Payment Methods",
      columns: [
        { header: "Method", key: "name", type: "text", align: "left" },
        { header: "% of Sales", key: "percentage", type: "percent", align: "right" },
        { header: "Amount", key: "amount", type: "money", align: "right" },
      ],
      rows: paymentRows,
    },
    {
      title: "Top Products",
      columns: [
        { header: "Product", key: "name", type: "text", align: "left" },
        { header: "Quantity", key: "quantity", type: "num", align: "right" },
        { header: "Sales", key: "revenue", type: "money", align: "right" },
        { header: "Profit", key: "profit", type: "money", align: "right" },
      ],
      rows: topProducts,
    },
    {
      title: "Transactions",
      columns: [
        { header: "Date", key: "time", type: "time", align: "left" },
        { header: "Invoice", key: "invoice", type: "text", align: "left" },
        { header: "Product", key: "product", type: "text", align: "left" },
        { header: "Category", key: "category", type: "text", align: "left" },
        { header: "Qty", key: "quantity", type: "num", align: "right" },
        { header: "Price", key: "price", type: "money", align: "right" },
        { header: "Expense", key: "expense", type: "money", align: "right" },
        { header: "Profit", key: "profit", type: "money", align: "right" },
        { header: "Commission", key: "commission", type: "money", align: "right" },
      ],
      rows: txRows,
    },
  ];

  return { kpis, sections };
}

export const exportEmployeeReportToPdf = (data, meta) =>
  exportModelToPdf(buildEmployeeModel(data), meta);
export const exportEmployeeReportToExcel = (data, meta) =>
  exportModelToExcel(buildEmployeeModel(data), meta);
export const printEmployeeReport = (data, meta) =>
  printModel(buildEmployeeModel(data), meta);
