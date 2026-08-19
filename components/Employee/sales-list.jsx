"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/card";
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

// Next.js কম্পাইলার ফ্রেন্ডলি পিওর জাভাস্ক্রিপ্ট ফেচিং ফাংশন
const fetchSales = async (context) => {
  const queryKey = context.queryKey;
  const filters = queryKey[1]; // ২য় এলিমেন্ট থেকে ফিল্টার অবজেক্ট নেওয়া হলো

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

  // সার্চ টার্ম ডিবান্স করার জন্য
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // TanStack Query কল
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

  // সেফটি ফলব্যাক
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

      toast.success("Deleted");

      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen text-zinc-800 dark:text-zinc-100 py-8 transition-colors duration-200">
      {/* Professional Ambient Soft Underlays (Adaptive depth) */}
      <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-200/40 dark:bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-300/30 dark:bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="space-y-8 max-w-400 mx-auto px-4 sm:px-6 relative z-10">
        {/* Premium Enterprise Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              My Sales Ledger
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Corporate performance matrix, real-time auditing, and commission
              records.
            </p>
          </div>
          <Link href="/employee/sales/add">
            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium gap-2 transition-all active:scale-95 cursor-pointer h-9 px-4 text-xs tracking-wide rounded-lg shadow-xs">
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Add New Transaction
            </Button>
          </Link>
        </div>

        {/* Professional Corporate Glass Summary Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1 */}
          <Card className="group bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:bg-white/80 dark:hover:bg-zinc-900/40 shadow-xs">
            <div className="absolute right-3 top-3 text-zinc-300/50 dark:text-zinc-700/20">
              <DollarSign className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Total Sales Volume ({dateFilter})
              </p>
              {isLoading ? (
                <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                  ৳{summary.totalSalesAmount.toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="group bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:bg-white/80 dark:hover:bg-zinc-900/40 shadow-xs">
            <div className="absolute right-3 top-3 text-zinc-300/50 dark:text-zinc-700/20">
              <TrendingUp className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Net Operations Profit ({dateFilter})
              </p>
              {isLoading ? (
                <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                  ৳{summary.totalProfit.toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="group bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:bg-white/80 dark:hover:bg-zinc-900/40 shadow-xs">
            <div className="absolute right-3 top-3 text-zinc-300/50 dark:text-zinc-700/20">
              <Award className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Personal Earned Commission ({dateFilter})
              </p>
              {isLoading ? (
                <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text">
                  ৳{summary.totalCommission.toLocaleString()}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Professional Glass Filter Hub */}
        <div className="space-y-4 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-xl shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder="Search by product name or invoice code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 pl-9 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-700 h-9 text-xs rounded-lg transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-48 bg-white/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 h-9 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white/80 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/60 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 h-8 text-xs rounded focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  End Date
                </label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 h-8 text-xs rounded focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700"
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
                  className="w-full border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white h-8 text-xs font-medium rounded transition-colors"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Master Data Table */}
        <div className="space-y-4">
          {isError ? (
            <div className="p-8 rounded-2xl bg-card border border-border/60 text-center space-y-2 shadow-sm">
              <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Sync Timeout Error
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {error
                  ? error.message
                  : "Unable to populate data framework metrics."}
              </p>
            </div>
          ) : (
            <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="text-xs text-muted-foreground uppercase tracking-wider font-semibold hover:bg-transparent">
                    <TableHead className="h-12">Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-sm">
                  {isLoading ? (
                    // Array Generator loop mimicking active table rows seamlessly
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow
                        key={idx}
                        className="hover:bg-transparent border-b border-border/40"
                      >
                        <TableCell className="py-4">
                          <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-44 bg-muted animate-pulse rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-16 bg-muted animate-pulse rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-10 bg-muted animate-pulse rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 bg-muted animate-pulse rounded-md ml-auto" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-7 w-7 bg-muted animate-pulse rounded-md" />
                            <div className="h-7 w-7 bg-muted animate-pulse rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="p-12 text-center text-muted-foreground"
                      >
                        <p className="font-medium text-sm text-foreground mb-0.5">
                          No Audit Files Located
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Please modify system filtering metrics values.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow
                        key={sale._id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">
                          {sale.createdAt
                            ? new Date(sale.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="font-bold text-foreground font-mono">
                          {sale.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-medium max-w-60 truncate">
                          {sale.productName}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium border border-border/40">
                            {sale.categoryName}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {sale.quantity}
                        </TableCell>
                        <TableCell className="text-right font-semibold font-mono">
                          <span className="font-black text-md mr-0.5">৳</span>
                          {sale.totalPrice
                            ? sale.totalPrice.toLocaleString()
                            : 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setSelectedSale(sale)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-500/5"
                                  disabled={loadingId === sale._id}
                                >
                                  {loadingId === sale._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : (
                                    <Trash className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl border border-border bg-card max-w-sm shadow-xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-sm font-bold tracking-tight text-foreground">
                                    Confirm Records Purge
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs text-muted-foreground leading-normal">
                                    This operational event will completely
                                    eliminate the selected invoice tracking data
                                    permanently.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4 gap-1.5">
                                  <AlertDialogCancel className="h-8 rounded-lg border border-border bg-transparent text-muted-foreground hover:bg-muted font-medium text-[11px]">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(sale._id)}
                                    className="h-8 rounded-lg bg-foreground text-background hover:opacity-90 font-medium text-[11px]"
                                  >
                                    Confirm
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

              {/* Corporate Pagination Footer */}
              {sales.length > 0 && !isLoading && (
                <div className="px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 bg-muted/20">
                  <div className="text-xs text-muted-foreground">
                    Showing{" "}
                    <span className="text-foreground font-medium font-mono">
                      {Math.min(
                        (currentPage - 1) * 10 + 1,
                        pagination.totalResults,
                      )}
                    </span>{" "}
                    to{" "}
                    <span className="text-foreground font-medium font-mono">
                      {Math.min(currentPage * 10, pagination.totalResults)}
                    </span>{" "}
                    of{" "}
                    <span className="text-foreground font-medium font-mono">
                      {pagination.totalResults}
                    </span>{" "}
                    records
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-7 text-xs border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }).map(
                        (_, i) => {
                          const pageNum = i + 1;
                          if (
                            Math.abs(currentPage - pageNum) <= 1 ||
                            pageNum === 1 ||
                            pageNum === pagination.totalPages
                          ) {
                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={`h-7 w-7 p-0 font-mono text-[11px] rounded ${
                                  currentPage === pageNum
                                    ? "bg-foreground text-background hover:bg-foreground/90"
                                    : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                          return null;
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="h-7 text-xs border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-40"
                    >
                      Next <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Professional Corporate Inspection Modal */}
        {selectedSale && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in duration-200">
            <Card className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl transform scale-100 animate-in zoom-in-95 duration-150 text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Transaction Profile Inspection
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Invoice UUID: #{selectedSale.invoiceNumber}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSale(null)}
                  className="h-7 w-7 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="p-5 space-y-5">
                {/* Metas Grid */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 p-3.5 rounded-lg">
                  <div className="flex gap-2.5 items-center">
                    <Calendar className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                        Timestamp
                      </p>
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">
                        {selectedSale.createdAt
                          ? new Date(selectedSale.createdAt).toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                        Method Type
                      </p>
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium mt-0.5">
                        {selectedSale.paymentMethod || "Standard Processing"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stakeholder Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Customer Entity
                    </h3>
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/40 p-3 rounded-lg space-y-1 text-xs">
                      <p className="flex justify-between">
                        <span className="text-zinc-400 dark:text-zinc-500">
                          Title:
                        </span>{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {selectedSale.customerName || "Retail Client"}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-zinc-400 dark:text-zinc-500">
                          Contact:
                        </span>{" "}
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          {selectedSale.customerPhone || "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Account Owner
                    </h3>
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/40 p-3 rounded-lg space-y-1 text-xs">
                      <p className="flex justify-between">
                        <span className="text-zinc-400 dark:text-zinc-500">
                          Assignee:
                        </span>{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {selectedSale.sellerName || "System Agent"}
                        </span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="text-zinc-400 dark:text-zinc-500">
                          Agent ID:
                        </span>{" "}
                        <span className="font-mono text-[10px] px-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded truncate max-w-25">
                          {selectedSale.sellerId || "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Meta */}
                <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-4">
                  <div className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/40 p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                        {selectedSale.productName}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px] font-medium border border-zinc-200 dark:border-zinc-700/50">
                        {selectedSale.categoryName}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Quantity
                      </p>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        ×{selectedSale.quantity}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Balances Sheet */}
                <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-4">
                  <h3 className="text-[9px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 mb-2">
                    Ledger Financial Summary
                  </h3>
                  <div className="space-y-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/50 rounded-lg p-3.5 text-xs">
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Gross Aggregated Amount</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">
                        ৳{selectedSale.totalPrice?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Baseline Procurement Cost</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">
                        ৳{selectedSale.rawExpense?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Operating Expense Matrix</span>
                      <span className="font-mono text-zinc-500 dark:text-zinc-400">
                        - ৳{selectedSale.totalExpense?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2 text-zinc-500 dark:text-zinc-400">
                      <span>Settled Capital Payment</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 font-medium">
                        ৳{selectedSale.paidAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Outstanding Debt</span>
                      <span
                        className={`font-mono ${selectedSale.due > 0 ? "text-zinc-900 dark:text-zinc-200 font-medium" : "text-zinc-400 dark:text-zinc-500"}`}
                      >
                        ৳{selectedSale.due?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2 font-semibold text-zinc-900 dark:text-zinc-200">
                      <span>Net Ledger Margin Profit</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">
                        ৳{selectedSale.netProfit?.toLocaleString()}
                      </span>
                    </div>

                    {/* Highlighted Commission line - Clean corporate style */}
                    <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-1 bg-zinc-100/80 dark:bg-zinc-800/30 p-2.5 rounded border">
                      <span className="text-zinc-800 dark:text-zinc-300 font-semibold">
                        Allocated Account Commission Payout
                      </span>
                      <span className="font-bold text-base font-mono text-zinc-900 dark:text-zinc-50">
                        ৳{selectedSale.commission?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedSale.note && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-3">
                    <p className="text-[9px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 mb-1">
                      Audit Log Remarks
                    </p>
                    <p className="text-xs p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg leading-relaxed italic">
                      &quot;{selectedSale.note}&quot;
                    </p>
                  </div>
                )}

                <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-3">
                  <Button
                    className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 h-9 text-xs font-semibold rounded-lg transition-all"
                    onClick={() => setSelectedSale(null)}
                  >
                    Close Profile Audit
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
