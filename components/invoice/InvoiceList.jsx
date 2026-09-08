"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Printer,
  Download,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useInvoices, useDeleteInvoice } from "@/lib/hooks/invoices/useInvoices";
import { generateInvoicePDF } from "@/lib/invoice/pdfGenerator";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import Link from "next/link";
import { format } from "date-fns";

export default function InvoiceList({ basePath = "/admin" }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: response, isLoading } = useInvoices({
    search,
    dateFilter,
    page,
    limit: 10,
  });

  const { mutate: deleteInvoice } = useDeleteInvoice();

  const invoices = response?.data || [];
  const pagination = response?.pagination || {};
  const summary = response?.summary || {};

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    setPreviewOpen(true);
  };

  const handleDownloadPDF = async (invoice) => {
    await generateInvoicePDF(invoice);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage, generate, and track customer invoices
          </p>
        </div>
        <Link href={`${basePath}/invoices/add`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{(summary.totalAmount || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ৳{(summary.totalPaid || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ৳{(summary.totalDue || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No invoices found. Create a new invoice to get started.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div className="text-xs text-muted-foreground">
                            {inv.customerPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(inv.invoiceDate || inv.createdAt),
                        "dd MMM yyyy"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {inv.items?.length || 0} item(s)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ৳{(inv.grandTotal || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ৳{(inv.paidAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.dueAmount > 0 ? (
                        <span className="text-red-500 font-medium">
                          ৳{inv.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">৳0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View & Print"
                          onClick={() => handlePrint(inv)}
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download PDF"
                          onClick={() => handleDownloadPDF(inv)}
                        >
                          <Download className="w-4 h-4 text-green-500" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Invoice?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete invoice{" "}
                                <strong>{inv.invoiceNumber}</strong>? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteInvoice(inv._id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice View/Print Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceTemplate invoice={selectedInvoice} mode="view" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
