"use client";

import { useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Printer,
  X,
  Download,
  ChevronLeft,
  User,
  Phone,
  FileText,
  Calendar,
  CreditCard,
  Wallet,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// Dynamically import the PDF generator for receipts
const generateReceiptPDF = (receiptData) => {
  import("@/lib/invoice/pdfGenerator")
    .then((module) => module.generateReceiptPDF(receiptData))
    .catch((error) => {
      console.error("Failed to load PDF generator:", error);
      alert("Could not generate PDF. Please try again.");
    });
};

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const formatDate = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CollectionReceipt({ receipt, open, onClose }) {
  const printRef = useRef(null);

  // If receipt data is passed as prop instead of receipt prop
  const receiptData = receipt || {};

  const {
    receiptNumber = "N/A",
    customerName = "Unknown",
    customerPhone = "",
    invoiceNumber = "N/A",
    collectionAmount = 0,
    paymentMethod = "Cash",
    collectionDate = new Date(),
    collectionNote = "",
    remainingDue = 0,
    collectedBy = "Unknown",
  } = receiptData;

  // ---- Print via hidden iframe (keeps app UI untouched) ----
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom-0;width:0;height:0;border:0;visibility:hidden;";

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

  .receipt-page { max-width: 210mm; margin: 0 auto; padding: 28px 32px; }

  /* ---- header ---- */
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
  .brand-name { font-size: 22px; font-weight: 800; color: #003E7E; letter-spacing: -0.5px; }
  .brand-tagline { font-size: 11px; color: #6b7280; margin-top: 1px; }
  .brand-contact { font-size: 11px; color: #6b7280; margin-top: 6px; line-height: 1.6; }

  /* ---- receipt badge ---- */
  .receipt-badge { text-align: right; }
  .receipt-badge h2 { font-size: 28px; font-weight: 800; color: #003E7E; letter-spacing: 2px; }
  .receipt-badge .receipt-num { font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px; }
  .receipt-badge .receipt-date { font-size: 12px; color: #6b7280; margin-top: 2px; }

  /* ---- info row ---- */
  .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .info-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
  .info-block .name { font-size: 16px; font-weight: 700; color: #111; }
  .info-block p { font-size: 12px; color: #4b5563; margin-top: 3px; }

  /* ---- collection details ---- */
  .collection-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .collection-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; color: #4b5563; }
  .collection-row span:last-child { font-variant-numeric: tabular-nums; }
  .collection-row.label { font-weight: 600; color: #111; }
  .collection-row.total { font-size: 16px; font-weight: 800; color: #003E7E; padding: 12px 0; border-top: 2px solid #003E7E; }
  .collection-row.remaining { font-size: 16px; font-weight: 800; color: #dc2626; padding: 12px 0; border-top: 2px solid #dc2626; }

  /* ---- payment info ---- */
  .payment-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .payment-icon { color: #0284c7; margin-right: 8px; }

  /* ---- note ---- */
  .note-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
  .note-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 700; margin-bottom: 4px; }
  .note-box p { font-size: 12px; color: #4b5563; }

  /* ---- footer ---- */
  .receipt-footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 10px; color: #9ca3af; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .receipt-page { padding: 0; }
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
  const handleDownloadPDF = () => {
    generateReceiptPDF({
      receiptNumber,
      customerName,
      customerPhone,
      invoiceNumber,
      collectionAmount,
      paymentMethod,
      collectionDate,
      remainingDue,
      collectedBy,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Collection Receipt</h2>
              <p className="text-xs text-muted-foreground">
                {receiptNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownloadPDF}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={printRef} className="overflow-y-auto p-8 bg-white">
          {/* Brand */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                Khalil Computer
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Reliable institution of technology, training and public service
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Barlekha, Moulvibazar, Bangladesh
              </p>
              <p className="text-xs text-muted-foreground">
                Phone: +880 1715 409109
              </p>
              <p className="text-xs text-muted-foreground">
                Website: khalilcomputer.com
              </p>
            </div>
            <div className="text-right min-w-[120px]">
              <h4 className="text-2xl font-bold text-primary tracking-wider">
                RECEIPT
              </h4>
              <p className="text-sm font-medium text-foreground mt-1">
                {receiptNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), "dd MMM yyyy")}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Received From
              </h4>
              <p className="text-lg font-semibold">{customerName}</p>
              {customerPhone && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {customerPhone}
                </p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Related Invoice
              </h4>
              <p className="text-sm font-medium">{invoiceNumber}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(collectionDate)}
              </p>
            </div>
          </div>

          {/* Collection Details */}
          <div className="bg-muted/40 rounded-lg p-6 mb-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Payment Details
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Collected</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(collectionAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <span className="text-sm font-medium">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-muted-foreground">Collected By</span>
                <span className="text-sm font-medium">
                  {collectedBy}
                </span>
              </div>
              {collectionNote && (
                <div className="flex justify-between items-start border-t pt-3">
                  <span className="text-sm text-muted-foreground">Note</span>
                  <span className="text-sm text-right max-w-[200px]">
                    {collectionNote}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-medium">Remaining Due</span>
                <span className={`text-lg font-bold ${remainingDue > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                  {formatCurrency(remainingDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="text-center pt-6 border-t">
            <p className="text-sm font-medium mb-2">
              Thank you for your payment!
            </p>
            <p className="text-xs text-muted-foreground">
              This is a computer-generated receipt
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Collected at: {format(new Date(collectionDate), "hh:mm a")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
