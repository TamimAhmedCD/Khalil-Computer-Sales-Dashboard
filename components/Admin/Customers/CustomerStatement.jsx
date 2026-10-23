"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Printer,
  X,
  Download,
  Calendar,
  FileText,
  DollarSign,
  Receipt,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const formatDate = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CustomerStatement({ customer, open, onClose, startDate, endDate }) {
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch statement data
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customerStatement", customer?.customerPhone, startDate, endDate],
    queryFn: async () => {
      if (!customer?.customerPhone) throw new Error("No customer phone");

      const params = new URLSearchParams();
      params.append("phone", customer.customerPhone);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/admin/customers/statement?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch statement");
      }
      return response.json();
    },
    enabled: open && !!customer?.customerPhone,
    staleTime: 30000,
  });

  const statement = data?.data || {
    customerName: "",
    customerPhone: "",
    startDate: "",
    endDate: "",
    activities: [],
    summary: {
      totalPurchase: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    },
  };

  // If only customer is passed (from CustomerDetail), prompt for date range
  useEffect(() => {
    if (open && !startDate && !endDate && customer?.customerPhone) {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setShowReceipt(true);
    }
  }, [open, customer, startDate, endDate]);

  const handlePrint = () => {
    const el = document.getElementById("statement-content");
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

  .statement-page { max-width: 210mm; margin: 0 auto; padding: 28px 32px; }

  /* ---- header ---- */
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
  .brand-name { font-size: 22px; font-weight: 800; color: #003E7E; letter-spacing: -0.5px; }
  .brand-tagline { font-size: 11px; color: #6b7280; margin-top: 1px; }
  .brand-contact { font-size: 11px; color: #6b7280; margin-top: 6px; line-height: 1.6; }

  /* ---- statement badge ---- */
  .statement-badge { text-align: right; }
  .statement-badge h2 { font-size: 28px; font-weight: 800; color: #003E7E; letter-spacing: 2px; }
  .statement-badge .statement-num { font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px; }
  .statement-badge .statement-date { font-size: 12px; color: #6b7280; margin-top: 2px; }

  /* ---- customer info ---- */
  .customer-info { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .customer-info h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
  .customer-info .name { font-size: 16px; font-weight: 700; color: #111; }
  .customer-info p { font-size: 12px; color: #4b5563; margin-top: 3px; }

  /* ---- date range ---- */
  .date-range { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .date-range h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #0284c7; font-weight: 700; margin-bottom: 8px; }
  .date-range .range { font-size: 14px; color: #1e40af; }

  /* ---- summary ---- */
  .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; color: #4b5563; }
  .summary-row span:last-child { font-variant-numeric: tabular-nums; }
  .summary-row.label { font-weight: 600; color: #111; }
  .summary-row.total { font-size: 16px; font-weight: 800; color: #003E7E; padding: 12px 0; border-top: 2px solid #003E7E; }
  .summary-row.outstanding { font-size: 16px; font-weight: 800; color: #dc2626; padding: 12px 0; border-top: 2px solid #dc2626; }

  /* ---- activity table ---- */
  .activity-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .activity-table th { text-align: left; padding: 10px; background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  .activity-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  .activity-table tr:last-child td { border-bottom: none; }
  .activity-table .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .activity-table .type { font-weight: 600; }
  .activity-table .type.sale { color: #003E7E; }
  .activity-table .type.collection { color: #059669; }

  /* ---- footer ---- */
  .statement-footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 10px; color: #9ca3af; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .statement-page { padding: 0; }
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

  if (showReceipt && !data && !isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Customer Statement</h2>
                <p className="text-xs text-muted-foreground">
                  {customer?.customerPhone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-8 bg-white text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">Please Select Date Range</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please select a start and end date to generate the customer statement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Customer Statement</h2>
              <p className="text-xs text-muted-foreground">
                {customer?.customerPhone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statement Content */}
        <div id="statement-content" className="overflow-y-auto p-8 bg-white">
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
            </div>
            <div className="text-right min-w-[120px]">
              <h4 className="text-2xl font-bold text-primary tracking-wider">
                STATEMENT
              </h4>
              <p className="text-sm font-medium text-foreground mt-1">
                {format(new Date(), "dd MMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Period: {statement.startDate} to {statement.endDate}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-muted/40 rounded-lg p-6 mb-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Customer Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Customer Name</p>
                <p className="mt-1 font-semibold">{statement.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="mt-1 font-semibold">{statement.customerPhone}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">Statement Period</p>
              <p className="mt-1 font-medium">
                {formatDateShort(statement.startDate || "N/A")} - {formatDateShort(statement.endDate || "N/A")}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/40 rounded-lg p-6 mb-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Purchases</span>
                <span className="text-lg font-bold">{formatCurrency(statement.summary.totalPurchase)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Payments</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(statement.summary.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-medium">Outstanding Balance</span>
                <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(statement.summary.totalOutstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <h4 className="text-sm font-bold mb-4">
            Transaction History ({statement.activities.length})
          </h4>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Invoice / Receipt</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {statement.activities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions in this period
                    </td>
                  </tr>
                ) : (
                  statement.activities.map((activity, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        {formatDateShort(activity.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${activity.type === "sale" ? "text-primary" : "text-emerald-600"}`}>
                          {activity.type === "sale" ? "Sale" : "Payment"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {activity.type === "sale"
                          ? activity.invoiceNumber
                          : activity.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(activity.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Statement Footer */}
          <div className="text-center pt-6 border-t mt-8">
            <p className="text-sm font-medium mb-2">
              Thank you for your business!
            </p>
            <p className="text-xs text-muted-foreground">
              This is a computer-generated statement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
