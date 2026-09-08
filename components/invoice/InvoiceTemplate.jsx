"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useRef } from "react";
import { format } from "date-fns";
import { generateInvoicePDF } from "@/lib/invoice/pdfGenerator";

// =========================================================
// Invoice Template — Professional A4 Print-Ready Layout
// =========================================================

export default function InvoiceTemplate({ invoice, mode = "view" }) {
  const printRef = useRef(null);

  if (!invoice) return null;

  const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt);
  const subtotal = Number(invoice.subtotal) || 0;
  const totalDiscount = Number(invoice.totalDiscount) || 0;
  const grandTotal = Number(invoice.grandTotal) || 0;
  const paidAmount = Number(invoice.paidAmount) || 0;
  const dueAmount = Number(invoice.dueAmount) || 0;
  const items = invoice.items || [];

  // ---- Print via hidden iframe (keeps app UI untouched) ----
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";

    iframe.onload = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return iframe.remove();

      doc.open();
      doc.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; }

  .invoice-page { max-width: 210mm; margin: 0 auto; padding: 28px 32px; }

  /* ---- header ---- */
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #2563eb; margin-bottom: 24px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-logo { width: 52px; height: 52px; border-radius: 10px; object-fit: contain; }
  .brand-name { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
  .brand-tagline { font-size: 11px; color: #6b7280; margin-top: 1px; }
  .brand-contact { font-size: 11px; color: #6b7280; margin-top: 6px; line-height: 1.6; }

  .inv-badge { text-align: right; }
  .inv-badge h2 { font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: 2px; }
  .inv-badge .inv-num { font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px; }
  .inv-badge .inv-date { font-size: 12px; color: #6b7280; margin-top: 2px; }

  /* ---- info row ---- */
  .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
  .info-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
  .info-block .name { font-size: 16px; font-weight: 700; color: #111; }
  .info-block p { font-size: 12px; color: #4b5563; margin-top: 3px; }

  /* ---- items table ---- */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .items-table thead th { background: #1e293b; color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 12px; text-align: left; }
  .items-table thead th:nth-child(n+3) { text-align: right; }
  .items-table tbody td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #374151; }
  .items-table tbody td:nth-child(n+3) { text-align: right; font-variant-numeric: tabular-nums; }
  .items-table tbody tr:nth-child(even) { background: #f9fafb; }
  .items-table tbody td.item-name { font-weight: 600; color: #111; }
  .items-table tbody td.item-desc { color: #6b7280; font-size: 11px; }
  .items-table tfoot td { padding: 0; }

  /* ---- serial number column ---- */
  .items-table thead th:first-child,
  .items-table tbody td:first-child { text-align: center; width: 36px; }

  /* ---- totals block ---- */
  .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .totals-box { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #4b5563; }
  .totals-row span:last-child { font-variant-numeric: tabular-nums; }
  .totals-row.discount span:last-child { color: #dc2626; }
  .totals-sep { border-top: 1px solid #d1d5db; margin: 4px 0; }
  .totals-row.grand { font-size: 16px; font-weight: 800; color: #111; padding: 10px 0 6px; }
  .totals-row.paid span:last-child { color: #16a34a; font-weight: 600; }
  .totals-row.due span:last-child { color: #dc2626; font-weight: 700; }
  .totals-row.due.clear span:last-child { color: #16a34a; }

  /* ---- payment & notes ---- */
  .payment-method { display: inline-block; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 20px; }
  .notes-block { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
  .notes-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 700; margin-bottom: 4px; }
  .notes-block p { font-size: 12px; color: #4b5563; }

  /* ---- status stamp ---- */
  .status-stamp { text-align: center; margin: 20px 0; }
  .stamp { display: inline-block; padding: 6px 24px; border: 2px solid; border-radius: 6px; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
  .stamp.paid { border-color: #16a34a; color: #16a34a; }
  .stamp.due  { border-color: #dc2626; color: #dc2626; }

  /* ---- footer ---- */
  .inv-footer { border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .invoice-page { padding: 0; }
  }
</style>
</head><body>${el.innerHTML}</body></html>`);
      doc.close();

      const win = iframe.contentWindow;
      const cleanup = () => setTimeout(() => iframe.remove(), 500);
      win.addEventListener("afterprint", cleanup);
      setTimeout(() => { win.focus(); win.print(); }, 200);
      setTimeout(cleanup, 60_000);
    };

    document.body.appendChild(iframe);
  };

  // ---- PDF download ----
  const handleDownloadPDF = () => generateInvoicePDF(invoice);

  // ---- money formatter ----
  const tk = (v) => `৳${Number(v || 0).toLocaleString("en-BD")}`;

  // ---- The actual invoice markup (used for both screen + print) ----
  const invoiceMarkup = (
    <div ref={printRef}>
      <div className="invoice-page" style={{ maxWidth: "210mm", margin: "0 auto", padding: "28px 32px", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: "#1a1a1a", fontSize: "13px", lineHeight: 1.5 }}>

        {/* ==================== HEADER ==================== */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20, borderBottom: "2px solid #2563eb", marginBottom: 24 }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Logo */}
            <img
              src="/logo.svg"
              alt="Khalil Computer"
              style={{ width: 52, height: 52, borderRadius: 10, objectFit: "contain" }}
            />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.5px" }}>
                Khalil Computer
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                Computer Sales &amp; Service Center
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, lineHeight: 1.6 }}>
                Barlekha, Moulvibazar, Bangladesh<br />
                Phone: +880 1715 409109<br />
                Email: info@khalilcomputer.com
              </div>
            </div>
          </div>

          {/* Invoice badge */}
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", letterSpacing: 2, margin: 0 }}>
              INVOICE
            </h2>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {format(invoiceDate, "dd MMM yyyy · hh:mm a")}
            </div>
          </div>
        </div>

        {/* ==================== INFO ROW ==================== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          {/* Bill To */}
          <div>
            <h4 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: "#9ca3af", fontWeight: 700, marginBottom: 8 }}>
              Bill To
            </h4>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
              {invoice.customerName || "—"}
            </div>
            {invoice.customerPhone && (
              <p style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>
                Phone: {invoice.customerPhone}
              </p>
            )}
            {invoice.customerAddress && (
              <p style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>
                Address: {invoice.customerAddress}
              </p>
            )}
          </div>

          {/* Invoice Meta */}
          <div style={{ textAlign: "right" }}>
            <h4 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: "#9ca3af", fontWeight: 700, marginBottom: 8 }}>
              Invoice Details
            </h4>
            <p style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>
              <strong>Invoice No:</strong> {invoice.invoiceNumber}
            </p>
            <p style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>
              <strong>Date:</strong> {format(invoiceDate, "dd MMM yyyy")}
            </p>
            <p style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>
              <strong>Created By:</strong> {invoice.createdBy || "N/A"}
            </p>
          </div>
        </div>

        {/* ==================== ITEMS TABLE ==================== */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr>
              <th style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px", textAlign: "center", width: 36 }}>
                #
              </th>
              <th style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px", textAlign: "left" }}>
                Item / Service
              </th>
              <th style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px", textAlign: "left" }}>
                Description
              </th>
              <th style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px", textAlign: "right" }}>
                Qty
              </th>
              <th style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px", textAlign: "right" }}>
                Unit Price
              </th>
              <th style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px", textAlign: "right" }}>
                Discount
              </th>
              <th style={{ background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px", textAlign: "right" }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? "#f9fafb" : "transparent" }}>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                  {i + 1}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12, fontWeight: 600, color: "#111" }}>
                  {item.name}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 11, color: "#6b7280" }}>
                  {item.description || "—"}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#374151", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {item.quantity} {item.unit || "pcs"}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#374151", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {tk(item.unitPrice)}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12, color: item.discount > 0 ? "#dc2626" : "#9ca3af", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {item.discount > 0 ? `-${tk(item.discount)}` : "—"}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12, fontWeight: 600, color: "#111", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {tk(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ==================== TOTALS ==================== */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
          <div style={{ width: 260 }}>
            {/* Subtotal */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#4b5563" }}>
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{tk(subtotal)}</span>
            </div>

            {/* Discount */}
            {totalDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#4b5563" }}>
                <span>Discount</span>
                <span style={{ color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>-{tk(totalDiscount)}</span>
              </div>
            )}

            {/* Separator */}
            <div style={{ borderTop: "1px solid #d1d5db", margin: "4px 0" }} />

            {/* Grand Total */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 6px", fontSize: 16, fontWeight: 800, color: "#111" }}>
              <span>Grand Total</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{tk(grandTotal)}</span>
            </div>

            {/* Paid */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#4b5563" }}>
              <span>Paid Amount</span>
              <span style={{ color: "#16a34a", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{tk(paidAmount)}</span>
            </div>

            {/* Due */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#4b5563" }}>
              <span>Due Amount</span>
              <span style={{ color: dueAmount > 0 ? "#dc2626" : "#16a34a", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {dueAmount > 0 ? tk(dueAmount) : `${tk(0)} (Paid)`}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== PAYMENT METHOD ==================== */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ display: "inline-block", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#475569" }}>
            Payment: {invoice.paymentMethod || "Cash"}
          </span>
        </div>

        {/* ==================== NOTES ==================== */}
        {invoice.notes && (
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
            <h4 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#9ca3af", fontWeight: 700, marginBottom: 4 }}>
              Notes
            </h4>
            <p style={{ fontSize: 12, color: "#4b5563" }}>{invoice.notes}</p>
          </div>
        )}

        {/* ==================== STATUS STAMP ==================== */}
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <span style={{
            display: "inline-block",
            padding: "6px 24px",
            border: `2px solid ${dueAmount === 0 ? "#16a34a" : "#dc2626"}`,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: dueAmount === 0 ? "#16a34a" : "#dc2626",
          }}>
            {dueAmount === 0 ? "PAID IN FULL" : `DUE: ${tk(dueAmount)}`}
          </span>
        </div>

        {/* ==================== FOOTER ==================== */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
          <div>
            <p>Thank you for your business!</p>
            <p>Terms &amp; Conditions apply</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p>Khalil Computer Management System</p>
            <p>{format(new Date(), "dd MMM yyyy · hh:mm a")}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== VIEW WRAPPER ====================
  if (mode === "view") {
    return (
      <div className="space-y-0 rounded-xl overflow-hidden border border-border shadow-lg bg-white dark:bg-zinc-950">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
          <div>
            <h3 className="text-sm font-bold text-foreground">{invoice.invoiceNumber}</h3>
            <p className="text-xs text-muted-foreground">{format(invoiceDate, "dd MMM yyyy · hh:mm a")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownloadPDF}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="overflow-x-auto bg-white">
          {invoiceMarkup}
        </div>
      </div>
    );
  }

  return invoiceMarkup;
}
