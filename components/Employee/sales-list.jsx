"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  AlertCircle,
  Award,
  Receipt,
  Package,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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
} from "../ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

const fetchSales = async (context) => {
  const queryKey = context.queryKey;
  const filters = queryKey[1];

  const searchTerm = filters.searchTerm;
  const dateFilter = filters.dateFilter;
  const customStartDate = filters.customStartDate;
  const customEndDate = filters.customEndDate;
  const currentPage = filters.currentPage;

  const params = new URLSearchParams();
  if (searchTerm) params.append("search", searchTerm);
  if (dateFilter) params.append("dateFilter", dateFilter);
  if (dateFilter === "custom" && customStartDate && customEndDate) {
    params.append("customStartDate", customStartDate);
    params.append("customEndDate", customEndDate);
  }
  params.append("page", currentPage.toString());

  const response = await axios.get("/api/products/sales?" + params.toString());
  return response.data;
};

export function SalesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [currentPage, setCurrentPage] = useState(1);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // TanStack Query call
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "sales",
      {
        searchTerm: debouncedSearch,
        dateFilter: dateFilter,
        customStartDate: customStartDate,
        customEndDate: customEndDate,
        currentPage: currentPage,
      },
    ],
    queryFn: fetchSales,
  });

  // Safety fallback
  const sales = (data && data.data) || [];
  const summary = (data && data.summary) || {
    totalSalesAmount: 0,
    totalProfit: 0,
    totalCommission: 0,
  };
  const pagination = (data && data.pagination) || {
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [loadingId, setLoadingId] = useState(null);

  const handleDelete = async (id) => {
    try {
      setLoadingId(id);
      await axios.delete(`/api/products/sales/${id}`);
      toast.success("Sale deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Sales Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your sales performance, commission, and transaction records.
          </p>
        </div>
        <Link href="/employee/sales/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Transaction
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Sales Volume ({dateFilter})
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  ৳{summary.totalSalesAmount.toLocaleString()}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Gross revenue</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Net Operations Profit ({dateFilter})
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  ৳{summary.totalProfit.toLocaleString()}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">After expenses</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Personal Earned Commission ({dateFilter})
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  ৳{summary.totalCommission.toLocaleString()}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Your earnings</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product name or invoice code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Panel */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted/30 border rounded-lg">
              <div className="space-y-2">
                <label className="text-xs font-medium">Start Date</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">End Date</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFilter("today");
                    setCustomStartDate("");
                    setCustomEndDate("");
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Table */}
      <div className="space-y-4">
        {isError ? (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-destructive">Failed to load sales</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error ? error.message : "Could not fetch sales data."}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading sales data...</p>
              </div>
            </CardContent>
          </Card>
        ) : sales.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No sales found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm || dateFilter !== "today"
                    ? "No sales match your current filters."
                    : "No sales recorded yet."}
                </p>
              </div>
              <Link href="/employee/sales/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first sale
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs uppercase tracking-wider font-semibold">
                    <TableHead>Date</TableHead>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id} className="hover:bg-muted/10">
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {sale.createdAt
                          ? new Date(sale.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium max-w-60 truncate">
                        <div className="flex items-center gap-1.5">
                          {sale.items && sale.items.length > 1 ? (
                            <>
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span>{sale.items.length} items</span>
                            </>
                          ) : (
                            sale.productName || (sale.items?.[0]?.productName || "")
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-medium border">
                          {sale.categoryName}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {sale.items && sale.items.length > 1
                          ? sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
                          : sale.quantity || 0}
                      </TableCell>
                      <TableCell className="text-right font-semibold font-mono">
                        ৳{sale.totalPrice ? sale.totalPrice.toLocaleString() : 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedSale(sale)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Link href={`/employee/invoices/add?saleId=${sale._id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Generate Invoice"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={loadingId === sale._id}
                                title="Delete Sale"
                              >
                                {loadingId === sale._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <Trash className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove{" "}
                                  <strong>{sale.items && sale.items.length > 1 ? `${sale.items.length} items` : sale.productName}</strong>{" "}
                                  from your sales records.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(sale._id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {sales.length > 0 && (
              <div className="px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * 10 + 1, pagination.totalResults)}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, pagination.totalResults)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.totalResults}</span> records
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {selectedSale && (
            <>
              <div className="flex-none border-b px-6 py-4">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4 pr-6">
                    <div className="min-w-0">
                      <DialogTitle className="truncate text-lg">
                        Transaction Details
                      </DialogTitle>
                      <DialogDescription className="mt-0.5">
                        Invoice: #{selectedSale.invoiceNumber}
                      </DialogDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedSale(null)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  {/* Metas Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 border rounded-lg p-4">
                    <div className="flex gap-2.5 items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Timestamp
                        </p>
                        <p className="text-sm font-mono mt-0.5">
                          {selectedSale.createdAt
                            ? new Date(selectedSale.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-center">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Payment Method
                        </p>
                        <p className="text-sm font-medium mt-0.5">
                          {selectedSale.paymentMethod || "Standard"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium">Customer</h3>
                      <div className="bg-muted/30 border rounded-lg p-3 space-y-1 text-sm">
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{selectedSale.customerName || "Retail Client"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-mono">{selectedSale.customerPhone || "—"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium">Seller</h3>
                      <div className="bg-muted/30 border rounded-lg p-3 space-y-1 text-sm">
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{selectedSale.sellerName || "System"}</span>
                        </p>
                        <p className="flex justify-between items-center">
                          <span className="text-muted-foreground">ID:</span>
                          <span className="font-mono text-xs px-1 bg-muted rounded truncate max-w-24">
                            {selectedSale.sellerId || "—"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="border-t pt-4">
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold">Items ({selectedSale.items.length})</p>
                          <span className="inline-block px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-medium border">
                            {selectedSale.items[0].categoryName || selectedSale.categoryName || "Multiple"}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {selectedSale.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-muted/30 border rounded-lg p-2.5 text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {item.saleType === "product" || item.itemType === "product" ? (
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <Wrench className="h-3 w-3 text-muted-foreground" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.saleType === "product" || item.itemType === "product"
                                      ? `${Number(item.quantity)} pcs × ৳${item.unitPrice?.toLocaleString() || 0}`
                                      : `৳${item.totalPrice?.toLocaleString() || 0}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-dashed pt-2 mt-2">
                          <p className="text-sm text-muted-foreground">
                            Total Quantity:{" "}
                            <span className="font-mono font-medium">
                              {selectedSale.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-muted/30 border rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold">{selectedSale.productName}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-medium border">
                            {selectedSale.categoryName}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <p className="text-xs font-medium text-muted-foreground">
                            Quantity
                          </p>
                          <p className="text-sm font-bold">×{selectedSale.quantity}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Financial Summary</h3>
                    <div className="space-y-2 bg-muted/30 border rounded-lg p-4 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Gross Amount</span>
                        <span className="font-mono">৳{selectedSale.totalPrice?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Procurement Cost</span>
                        <span className="font-mono">৳{selectedSale.rawExpense?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Expenses</span>
                        <span className="font-mono">- ৳{selectedSale.totalExpense?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed pt-2 text-muted-foreground">
                        <span>Paid Amount</span>
                        <span className="font-mono font-medium">৳{selectedSale.paidAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Due Amount</span>
                        <span className={`font-mono ${selectedSale.due > 0 ? "font-medium" : "text-muted-foreground"}`}>
                          ৳{selectedSale.due?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-semibold">
                        <span>Net Profit</span>
                        <span className="font-mono">৳{selectedSale.netProfit?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-3 mt-1 bg-muted/50 p-3 rounded border">
                        <span className="font-semibold">Commission</span>
                        <span className="font-bold text-base font-mono">৳{selectedSale.commission?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedSale.note && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Notes
                      </p>
                      <p className="text-sm p-3 bg-muted/30 border rounded-lg leading-relaxed italic">
                        "{selectedSale.note}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
