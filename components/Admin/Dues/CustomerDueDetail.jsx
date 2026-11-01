"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/finance";
import { Eye, CreditCard } from "lucide-react";

export default function CustomerDueDetail({ data, onCollect }) {
  const customer = data?.customer;
  const sales = data?.sales || [];
  const collections = data?.collections || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Name</p><p className="font-semibold text-sm">{customer?.name}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Phone</p><p className="font-semibold text-sm">{customer?.phone || "N/A"}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Purchase</p><p className="font-bold text-lg">{formatCurrency(customer?.totalPurchase || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Outstanding Due</p><p className="font-bold text-lg text-orange-600">{formatCurrency(customer?.outstandingDue || 0)}</p></CardContent></Card>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Invoices &amp; Remaining Dues</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Remaining</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s._id}>
                <TableCell className="font-mono text-xs">{s.invoiceNumber}</TableCell>
                <TableCell className="text-xs">{s.date ? new Date(s.date).toLocaleDateString() : "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(s.total)}</TableCell>
                <TableCell className="text-right text-emerald-600">{formatCurrency(s.paidAmount)}</TableCell>
                <TableCell className="text-right font-bold text-orange-600">{formatCurrency(s.remainingDue)}</TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => onCollect(s)}><CreditCard className="h-3 w-3 mr-1"/> Collect</Button></TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No invoices found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Collection History ({collections.length})</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Receipt #</TableHead><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
          <TableBody>
            {collections.map((c) => (
              <TableRow key={c._id}>
                <TableCell className="font-mono text-xs">{c.receiptNumber}</TableCell>
                <TableCell className="text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell><Badge variant="outline">{c.paymentMethod}</Badge></TableCell>
                <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(c.collectionAmount)}</TableCell>
              </TableRow>
            ))}
            {collections.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No collections yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
