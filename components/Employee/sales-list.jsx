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
  Edit2,
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
    <div className="min-h-screen text-zinc-100 py-8">
      {/* Professional Ambient Soft Underlays (Very subtle grey/slate depth, no bright colors) */}
      <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="space-y-8 max-w-400 mx-auto px-4 sm:px-6 relative z-10">
        {/* Premium Enterprise Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              My Sales Ledger
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Corporate performance matrix, real-time auditing, and commission
              records.
            </p>
          </div>
          <Link href="/employee/sales/add">
            <Button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium gap-2 transition-all active:scale-95 cursor-pointer h-9 px-4 text-xs tracking-wide rounded-lg shadow-sm">
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Add New Transaction
            </Button>
          </Link>
        </div>

        {/* Professional Corporate Glass Summary Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1 */}
          <Card className="group bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-700/60 hover:bg-zinc-900/40 shadow-sm">
            <div className="absolute right-3 top-3 text-zinc-700/20">
              <DollarSign className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Total Sales Volume ({dateFilter})
              </p>
              <p className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
                ৳{summary.totalSalesAmount.toLocaleString()}
              </p>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="group bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-700/60 hover:bg-zinc-900/40 shadow-sm">
            <div className="absolute right-3 top-3 text-zinc-700/20">
              <TrendingUp className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Net Operations Profit ({dateFilter})
              </p>
              <p className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
                ৳{summary.totalProfit.toLocaleString()}
              </p>
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="group bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-700/60 hover:bg-zinc-900/40 shadow-sm">
            <div className="absolute right-3 top-3 text-zinc-700/20">
              <Award className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Personal Earned Commission ({dateFilter})
              </p>
              <p className="text-2xl font-bold tracking-tight text-zinc-50 font-mono bg-linear-to-r from-zinc-100 to-zinc-400 bg-clip-text">
                ৳{summary.totalCommission.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Professional Glass Filter Hub */}
        <div className="space-y-4 bg-zinc-900/20 backdrop-blur-md border border-zinc-800/40 p-4 rounded-xl shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                placeholder="Search by product name or invoice code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-950/40 border-zinc-800/80 text-zinc-200 pl-9 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 h-9 text-xs rounded-lg transition-all placeholder:text-zinc-500"
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-48 bg-zinc-950/40 border-zinc-800/80 text-zinc-200 h-9 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-lg">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Modal Panel */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-zinc-950/30 border border-zinc-800/60 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-900/40 border-zinc-800 text-zinc-200 h-8 text-xs rounded focus-visible:ring-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  End Date
                </label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-900/40 border-zinc-800 text-zinc-200 h-8 text-xs rounded focus-visible:ring-zinc-700"
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
                  className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white h-8 text-xs font-medium rounded transition-colors"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Master Data Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-zinc-900/10 backdrop-blur-md rounded-xl border border-zinc-800/60">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            <p className="text-zinc-400 text-[10px] font-medium tracking-widest uppercase">
              Syncing Database Ledger...
            </p>
          </div>
        ) : isError ? (
          <Card className="p-8 rounded-xl bg-zinc-900/10 backdrop-blur-md border border-zinc-800 text-center space-y-2">
            <AlertCircle className="h-6 w-6 text-zinc-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-200">
              Sync Timeout Error
            </p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {error
                ? error.message
                : "Unable to populate data framework metrics."}
            </p>
          </Card>
        ) : sales.length > 0 ? (
          <Card className="bg-zinc-900/10 backdrop-blur-xl rounded-xl border border-zinc-800/60 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/40">
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Invoice
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Product Details
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Units
                    </th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Net Amount
                    </th>
                    <th className="px-6 py-3.5 text-center text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Options
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {sales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="hover:bg-zinc-800/20 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-3.5 text-xs text-zinc-400 whitespace-nowrap font-mono">
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
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-zinc-200 font-mono">
                        {sale.invoiceNumber}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-zinc-300 max-w-60 truncate font-medium">
                        {sale.productName}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-300 text-[10px] font-medium border border-zinc-700/40">
                          {sale.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-zinc-400 font-mono">
                        {sale.quantity}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-right font-semibold text-zinc-100 font-mono">
                        ৳
                        {sale.totalPrice ? sale.totalPrice.toLocaleString() : 0}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-all"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-all"
                                disabled={loadingId === sale._id}
                              >
                                {loadingId === sale._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                                ) : (
                                  <Trash className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl border border-zinc-800 bg-zinc-900 backdrop-blur-xl max-w-sm">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm font-bold tracking-tight text-zinc-200">
                                  Confirm Records Purge
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-zinc-400 leading-normal">
                                  This operational event will completely
                                  eliminate the selected invoice tracking data
                                  permanently.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4 gap-1.5">
                                <AlertDialogCancel className="h-8 rounded-lg border border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 font-medium text-[11px]">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(sale._id)}
                                  className="h-8 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium text-[11px]"
                                >
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Corporate Pagination Footer */}
            <div className="px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-800/50 bg-zinc-900/10">
              <div className="text-xs text-zinc-400">
                Showing{" "}
                <span className="text-zinc-200 font-medium font-mono">
                  {Math.min(
                    (currentPage - 1) * 10 + 1,
                    pagination.totalResults,
                  )}
                </span>{" "}
                to{" "}
                <span className="text-zinc-200 font-medium font-mono">
                  {Math.min(currentPage * 10, pagination.totalResults)}
                </span>{" "}
                of{" "}
                <span className="text-zinc-200 font-medium font-mono">
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
                  className="h-7 text-xs border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }).map((_, i) => {
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
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-7 w-7 p-0 font-mono text-[11px] rounded ${
                            currentPage === pageNum
                              ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-100"
                              : "border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="h-7 text-xs border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-12 rounded-xl bg-zinc-900/10 backdrop-blur-md border border-zinc-800/80 text-center max-w-md mx-auto">
            <p className="text-zinc-300 font-medium text-sm">
              No Audit Files Located
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Please modify system filtering metrics values.
            </p>
          </Card>
        )}

        {/* Professional Corporate Inspection Modal */}
        {selectedSale && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="bg-zinc-900/90 border border-zinc-800 w-full max-w-xl rounded-xl max-h-[90vh] overflow-y-auto shadow-xl transform scale-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                    Transaction Profile Inspection
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    Invoice UUID: #{selectedSale.invoiceNumber}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSale(null)}
                  className="h-7 w-7 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="p-5 space-y-5">
                {/* Metas Grid */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 border border-zinc-800/60 p-3.5 rounded-lg">
                  <div className="flex gap-2.5 items-center">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
                        Timestamp
                      </p>
                      <p className="text-xs text-zinc-200 font-mono mt-0.5">
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
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
                        Method Type
                      </p>
                      <p className="text-xs text-zinc-200 font-medium mt-0.5">
                        {selectedSale.paymentMethod || "Standard Processing"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stakeholder Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                      Customer Entity
                    </h3>
                    <div className="bg-zinc-950/20 border border-zinc-800/40 p-3 rounded-lg space-y-1 text-xs">
                      <p className="flex justify-between">
                        <span className="text-zinc-500">Title:</span>{" "}
                        <span className="font-medium text-zinc-300">
                          {selectedSale.customerName || "Retail Client"}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-zinc-500">Contact:</span>{" "}
                        <span className="font-mono text-zinc-300">
                          {selectedSale.customerPhone || "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                      Account Owner
                    </h3>
                    <div className="bg-zinc-950/20 border border-zinc-800/40 p-3 rounded-lg space-y-1 text-xs">
                      <p className="flex justify-between">
                        <span className="text-zinc-500">Assignee:</span>{" "}
                        <span className="font-medium text-zinc-300">
                          {selectedSale.sellerName || "System Agent"}
                        </span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="text-zinc-500">Agent ID:</span>{" "}
                        <span className="font-mono text-[10px] px-1 bg-zinc-800 text-zinc-300 rounded truncate max-w-25">
                          {selectedSale.sellerId || "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Meta */}
                <div className="border-t border-zinc-800/60 pt-4">
                  <div className="flex justify-between items-center bg-zinc-950/20 border border-zinc-800/40 p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        {selectedSale.productName}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px] font-medium border border-zinc-700/50">
                        {selectedSale.categoryName}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        Quantity
                      </p>
                      <p className="text-sm font-bold text-zinc-200">
                        ×{selectedSale.quantity}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Balances Sheet */}
                <div className="border-t border-zinc-800/60 pt-4">
                  <h3 className="text-[9px] font-bold tracking-wider uppercase text-zinc-400 mb-2">
                    Ledger Financial Summary
                  </h3>
                  <div className="space-y-2 bg-zinc-950/20 border border-zinc-800/50 rounded-lg p-3.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Gross Aggregated Amount</span>
                      <span className="font-mono text-zinc-200">
                        ৳{selectedSale.totalPrice?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Baseline Procurement Cost</span>
                      <span className="font-mono text-zinc-200">
                        ৳{selectedSale.rawExpense?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Operating Expense Matrix</span>
                      <span className="font-mono text-zinc-400">
                        - ৳{selectedSale.totalExpense?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-zinc-800 pt-2 text-zinc-400">
                      <span>Settled Capital Payment</span>
                      <span className="font-mono text-zinc-200 font-medium">
                        ৳{selectedSale.paidAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Outstanding Outstanding Debt</span>
                      <span
                        className={`font-mono ${selectedSale.due > 0 ? "text-zinc-200 font-medium" : "text-zinc-500"}`}
                      >
                        ৳{selectedSale.due?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-2 font-semibold text-zinc-200">
                      <span>Net Ledger Margin Net Profit</span>
                      <span className="font-mono text-zinc-100">
                        ৳{selectedSale.netProfit?.toLocaleString()}
                      </span>
                    </div>

                    {/* Highlighted Commission line - Clean luxury style, no bright colors */}
                    <div className="flex justify-between items-center border-t border-zinc-800 pt-3 mt-1 bg-zinc-800/30 p-2.5 rounded border">
                      <span className="text-zinc-300 font-semibold">
                        Allocated Account Commission Payout
                      </span>
                      <span className="font-bold text-base font-mono text-zinc-50">
                        ৳{selectedSale.commission?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedSale.note && (
                  <div className="border-t border-zinc-800/60 pt-3">
                    <p className="text-[9px] font-bold tracking-wider uppercase text-zinc-500 mb-1">
                      Audit Log Remarks
                    </p>
                    <p className="text-xs p-3 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-lg leading-relaxed italic">
                      &quot;{selectedSale.note}&quot;
                    </p>
                  </div>
                )}

                <div className="border-t border-zinc-800/60 pt-3">
                  <Button
                    className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 h-9 text-xs font-semibold rounded-lg transition-all"
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
