"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/finance";

export default function CollectionReceipt({ receiptData, onPrint }) {
  const componentRef = useRef();

  return (
    <div className="space-y-4">
      <div ref={componentRef} className="p-6 bg-white text-black border rounded-xl shadow-sm max-w-md mx-auto print:shadow-none print:border-none">
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-xl font-bold tracking-tight">KHALIL COMPUTERS</h2>
          <p className="text-xs text-gray-500">Computer &amp; Technology Solutions</p>
          <p className="text-xs text-gray-500 mt-1">Due Collection Receipt</p>
        </div>

        <div className="flex justify-between items-center text-xs mb-4 text-gray-600">
          <div>
            <span className="font-semibold">Receipt #:</span> {receiptData?.receiptNumber}
          </div>
          <div>
            <span className="font-semibold">Date:</span> {receiptData?.collectionDate ? new Date(receiptData.collectionDate).toLocaleString() : new Date().toLocaleString()}
          </div>
        </div>

        <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Customer Name:</span>
            <span className="font-semibold">{receiptData?.sale?.customerName || "Walk-in"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer Phone:</span>
            <span>{receiptData?.sale?.customerPhone || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice Ref:</span>
            <span className="font-mono">{receiptData?.sale?.invoiceNumber || receiptData?.invoiceNumber || "N/A"}</span>
          </div>
        </div>

        <div className="border-t border-b py-3 my-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Collection Amount:</span>
            <span className="font-bold text-emerald-600 text-base">{formatCurrency(receiptData?.collectionAmount)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Payment Method:</span>
            <span className="font-medium">{receiptData?.paymentMethod || "Cash"}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Remaining Due:</span>
            <span className="font-bold text-orange-600">{formatCurrency(receiptData?.sale?.due || 0)}</span>
          </div>
        </div>

        {receiptData?.note && (
          <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
            <span className="font-semibold">Note:</span> {receiptData.note}
          </div>
        )}

        <div className="flex justify-between items-center text-[10px] text-gray-400 pt-4 border-t">
          <span>Received By: {receiptData?.collectedBy || "Admin"}</span>
          <span>Thank you for your business!</span>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button onClick={onPrint} className="gap-2 bg-primary text-primary-foreground">
          <Printer className="h-4 w-4" /> Print Receipt
        </Button>
      </div>
    </div>
  );
}
