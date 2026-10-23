"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Phone,
  User,
  DollarSign,
  Calendar,
  Receipt as ReceiptIcon,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerDueDetail } from "@/lib/services/dues.api";
import CollectDueModal from "@/components/Admin/Dues/CollectDueModal";

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

export default function CustomerDueDetail({ customer, open, onOpenChange }) {
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customerDueDetail", customer?.customerPhone],
    queryFn: () => getCustomerDueDetail(customer.customerPhone),
    enabled: open && !!customer?.customerPhone,
  });

  const detail = data?.data || {
    customerName: "",
    customerPhone: "",
    totalPurchase: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    sales: [],
    collections: [],
  };

  const queryClient = useQueryClient();

  const handleCollectForSale = (sale) => {
    setSelectedSale(sale);
    setCollectModalOpen(true);
  };

  const handleCollectSuccess = useCallback(async () => {
    setCollectModalOpen(false);
    setSelectedSale(null);

    // Invalidate this customer's detail and parent list
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["customerDueDetail", customer?.customerPhone] }),
      queryClient.invalidateQueries({ queryKey: ["dueCustomers"] }),
      queryClient.invalidateQueries({ queryKey: ["dueDashboard"] }),
    ]);
  }, [customer?.customerPhone, queryClient]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Due Details
            </SheetTitle>
            <SheetDescription>
              View complete due and payment history
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="mt-6 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : isError ? (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="mt-4 font-semibold">Failed to load details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {error?.message || "An error occurred"}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Customer Summary */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Customer Information
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {detail.customerName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {detail.customerPhone}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      detail.totalOutstanding > 0 ? "destructive" : "default"
                    }
                    className="text-xs"
                  >
                    {detail.totalOutstanding > 0 ? "Has Due" : "Paid"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Purchase</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrency(detail.totalPurchase)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(detail.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="mt-1 text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(detail.totalOutstanding)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales List */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Sales & Invoices</h3>
                  <Badge variant="secondary">{detail.sales.length} total</Badge>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.sales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                              No sales found
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
                            <TableCell className="text-right font-semibold">
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
                              {sale.remainingDue > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => handleCollectForSale(sale)}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Collect
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Collection History */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Collection History</h3>
                  <Badge variant="secondary">
                    {detail.collections.length} payment(s)
                  </Badge>
                </div>

                {detail.collections.length === 0 ? (
                  <div className="rounded-lg border p-8 text-center">
                    <ReceiptIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No collections yet
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
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Collect Due Modal */}
      {selectedSale && (
        <CollectDueModal
          customer={customer}
          sale={selectedSale}
          open={collectModalOpen}
          onOpenChange={setCollectModalOpen}
          onSuccess={handleCollectSuccess}
        />
      )}
    </>
  );
}
