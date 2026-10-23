"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Phone,
  User,
  DollarSign,
  Calendar,
  Receipt,
  FileText,
  Download,
  Mail,
  MapPin,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function CustomerDetail({ customer, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showStatement, setShowStatement] = useState(false);
  const [statementDateRange, setStatementDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Fetch full customer detail when tab changes
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customerDetail", customer?.customerPhone],
    queryFn: async () => {
      if (!customer?.customerPhone) throw new Error("No customer phone");
      const response = await fetch(`/api/admin/customers/${encodeURIComponent(customer.customerPhone)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch customer details");
      }
      return response.json();
    },
    enabled: !!customer?.customerPhone,
    staleTime: 30000,
  });

  const detail = data?.data || {
    customerName: "",
    customerPhone: "",
    totalPurchase: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    salesCount: 0,
    sales: [],
    collections: [],
  };

  const handlePrintStatement = () => {
    if (!statementDateRange.startDate || !statementDateRange.endDate) {
      toast.warning("Please select a date range");
      return;
    }
    toast.info("Statement generation coming soon");
  };

  const getStatusBadge = (outstanding) => {
    if (outstanding === 0) {
      return <Badge variant="outline" className="text-emerald-600 border-emerald-200">Paid</Badge>;
    }
    if (outstanding > 0 && outstanding < 1000) {
      return <Badge variant="secondary" className="text-orange-600 bg-orange-50">Small Due</Badge>;
    }
    return <Badge variant="destructive" className="bg-red-50">Has Due</Badge>;
  };

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <FileText className="h-5 w-5 text-destructive" />
        </div>
        <h3 className="mt-4 font-semibold">Failed to load details</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message || "An error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Customer Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{detail.customerName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {detail.customerPhone}
                </div>
                {detail.salesCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {detail.salesCount} invoice{detail.salesCount !== 1 && "s"}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              {getStatusBadge(detail.totalOutstanding)}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t">
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Purchase
            </p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(detail.totalPurchase)}</p>
          </div>
          <div className="text-center border-l">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Paid
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(detail.totalPaid)}
            </p>
          </div>
          <div className="text-center border-l">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding
            </p>
            <p className="mt-1 text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(detail.totalOutstanding)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales & Invoices</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Customer Name</p>
                  <p className="mt-1 font-semibold">{detail.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Phone</p>
                  <p className="mt-1 font-semibold">{detail.customerPhone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">First Transaction</p>
                  <p className="mt-1 font-semibold">{formatDate(detail.sales[0]?.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Last Transaction</p>
                  <p className="mt-1 font-semibold">{formatDate(detail.sales[detail.sales.length - 1]?.date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Statement */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Start Date</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={statementDateRange.startDate}
                    onChange={(e) =>
                      setStatementDateRange({ ...statementDateRange, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">End Date</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={statementDateRange.endDate}
                    onChange={(e) =>
                      setStatementDateRange({ ...statementDateRange, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button onClick={handlePrintStatement} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate Statement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales & Invoices ({detail.sales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            No sales found for this customer
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.sales.map((sale) => (
                        <TableRow key={sale.saleId}>
                          <TableCell className="font-medium">
                            {sale.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(sale.date)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(sale.totalPrice)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(sale.paidAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                sale.remainingDue > 0
                                  ? "font-bold text-orange-600 dark:text-orange-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }
                            >
                              {formatCurrency(sale.remainingDue)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={sale.remainingDue > 0 ? "text-orange-600" : ""}>
                              {sale.remainingDue === 0 ? "Paid" : "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection History ({detail.collections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.collections.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No collections recorded
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.collections.map((collection) => (
                    <div
                      key={collection.collectionId}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {formatCurrency(collection.collectionAmount)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {collection.paymentMethod}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Receipt: {collection.receiptNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Invoice: {collection.invoiceNumber}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{formatDateTime(collection.createdAt)}</p>
                          <p className="mt-1">By: {collection.collectedBy}</p>
                        </div>
                      </div>
                      {collection.note && (
                        <p className="mt-2 text-xs text-muted-foreground border-t pt-2">
                          Note: {collection.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
