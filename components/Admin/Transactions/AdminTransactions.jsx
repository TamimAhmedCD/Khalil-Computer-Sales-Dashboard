"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileText,
  Filter,
  Receipt,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar } from "@/components/ui/calendar";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =========================================================
// CONSTANTS
// =========================================================

const API_URL = "/api/admin/transactions";

const ITEMS_PER_PAGE = 10;

// =========================================================
// COMPONENT
// =========================================================

export default function AdminTransactions() {
  // =========================================================
  // STATE
  // =========================================================

  const [search, setSearch] = useState("");

  const [employeeFilter, setEmployeeFilter] = useState("all");

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [paymentFilter, setPaymentFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("today");

  const [customStartDate, setCustomStartDate] = useState();

  const [customEndDate, setCustomEndDate] = useState();

  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // API DATA
  // =========================================================

  const [transactions, setTransactions] = useState([]);

  const [summary, setSummary] = useState({
    revenue: 0,
    profit: 0,
    expense: 0,
    commission: 0,
    transactionCount: 0,
  });

  const [pagination, setPagination] = useState({
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const [employees, setEmployees] = useState([]);

  const [categories, setCategories] = useState([]);

  const [paymentMethods, setPaymentMethods] = useState([]);

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================================================
  // FETCH TRANSACTIONS
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        // Search
        if (search.trim()) {
          params.set("search", search.trim());
        }

        // Employee
        if (employeeFilter !== "all") {
          params.set("employee", employeeFilter);
        }

        // Category
        if (categoryFilter !== "all") {
          params.set("category", categoryFilter);
        }

        // Payment
        if (paymentFilter !== "all") {
          params.set("paymentMethod", paymentFilter);
        }

        // Date filter
        params.set("dateFilter", dateFilter);

        // Custom dates
        if (dateFilter === "custom") {
          if (customStartDate) {
            params.set("customStartDate", formatDateForAPI(customStartDate));
          }

          if (customEndDate) {
            params.set("customEndDate", formatDateForAPI(customEndDate));
          }
        }

        // Pagination
        params.set("page", String(currentPage));

        params.set("limit", String(ITEMS_PER_PAGE));

        const response = await fetch(`${API_URL}?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load transactions");
        }

        if (cancelled) return;

        // =====================================================
        // TRANSACTIONS
        // =====================================================

        setTransactions(Array.isArray(result.data) ? result.data : []);

        // =====================================================
        // SUMMARY
        // =====================================================

        const summaryData = result.summary || {};

        setSummary({
          revenue:
            Number(
              summaryData.revenue ??
                summaryData.totalRevenue ??
                summaryData.totalSalesAmount ??
                0,
            ) || 0,

          profit:
            Number(summaryData.profit ?? summaryData.totalProfit ?? 0) || 0,

          expense:
            Number(
              summaryData.expense ??
                summaryData.totalExpense ??
                summaryData.totalExpenses ??
                0,
            ) || 0,

          commission:
            Number(
              summaryData.commission ?? summaryData.totalCommission ?? 0,
            ) || 0,

          transactionCount:
            Number(
              summaryData.transactionCount ??
                summaryData.totalTransactions ??
                result.pagination?.totalResults ??
                0,
            ) || 0,
        });

        // =====================================================
        // PAGINATION
        // =====================================================

        setPagination({
          totalResults: Number(result.pagination?.totalResults) || 0,

          totalPages: Number(result.pagination?.totalPages) || 1,

          currentPage: Number(result.pagination?.currentPage) || currentPage,
        });

        // =====================================================
        // FILTER OPTIONS
        // =====================================================

        const filterData = result.filters || {};

        if (Array.isArray(filterData.employees)) {
          setEmployees(filterData.employees);
        }

        if (Array.isArray(filterData.categories)) {
          setCategories(filterData.categories);
        }

        if (Array.isArray(filterData.paymentMethods)) {
          setPaymentMethods(filterData.paymentMethods);
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Transactions API Error:", err);

        if (!cancelled) {
          setError(err.message || "Failed to load transactions");

          setTransactions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    search,
    employeeFilter,
    categoryFilter,
    paymentFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    currentPage,
  ]);

  // =========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    employeeFilter,
    categoryFilter,
    paymentFilter,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // =========================================================
  // HELPERS
  // =========================================================

  function formatDateForAPI(date) {
    if (!date) return "";

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatCurrency(value) {
    return `৳${Number(value || 0).toLocaleString("en-BD")}`;
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =========================================================
  // ACTIVE FILTERS
  // =========================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    employeeFilter !== "all" ||
    categoryFilter !== "all" ||
    paymentFilter !== "all" ||
    dateFilter !== "today";

  // =========================================================
  // CUSTOM DATE LABEL
  // =========================================================

  const customDateLabel = useMemo(() => {
    if (!customStartDate && !customEndDate) {
      return "Select date range";
    }

    if (customStartDate && !customEndDate) {
      return customStartDate.toLocaleDateString("en-BD");
    }

    if (customStartDate && customEndDate) {
      return `${customStartDate.toLocaleDateString(
        "en-BD",
      )} - ${customEndDate.toLocaleDateString("en-BD")}`;
    }

    return "Select date range";
  }, [customStartDate, customEndDate]);

  // =========================================================
  // RESET FILTERS
  // =========================================================

  function resetFilters() {
    setSearch("");
    setEmployeeFilter("all");
    setCategoryFilter("all");
    setPaymentFilter("all");

    setDateFilter("today");

    setCustomStartDate(undefined);
    setCustomEndDate(undefined);

    setCurrentPage(1);
  }

  // =========================================================
  // PAGE NAVIGATION
  // =========================================================

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(page - 1, 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(page + 1, pagination.totalPages));
  }

  // =========================================================
  // PAGE RANGE
  // =========================================================

  const showingFrom =
    pagination.totalResults === 0
      ? 0
      : (pagination.currentPage - 1) * ITEMS_PER_PAGE + 1;

  const showingTo =
    pagination.totalResults === 0
      ? 0
      : Math.min(
          pagination.currentPage * ITEMS_PER_PAGE,
          pagination.totalResults,
        );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] space-y-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Transactions
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Review and manage all sales activity across the organization.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-fit gap-2"
            disabled
            title="Export can be connected to a dedicated export API"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Revenue */}

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>

                {loading ? (
                  <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="mt-2 text-2xl font-bold">
                    {formatCurrency(summary.revenue)}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  Based on current filters
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CircleDollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Profit */}

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </p>

                {loading ? (
                  <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.profit)}
                  </p>
                )}

                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Net business profit
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>

                {loading ? (
                  <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="mt-2 text-2xl font-bold">
                    {formatCurrency(summary.expense)}
                  </p>
                )}

                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Operating expenses
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Transactions
                </p>

                {loading ? (
                  <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="mt-2 text-2xl font-bold">
                    {pagination.totalResults.toLocaleString()}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  Matching current filters
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />

                <div>
                  <h2 className="font-semibold">Transaction Filters</h2>

                  <p className="text-xs text-muted-foreground">
                    Search and refine transaction records.
                  </p>
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="w-fit gap-2"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Search */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Search Transactions
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder="Search invoice, customer, phone, product or employee..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Date Range
                </label>

                <Select
                  value={dateFilter}
                  onValueChange={(value) => {
                    setDateFilter(value);
                    setCurrentPage(1);

                    if (value !== "custom") {
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />

                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>

                    <SelectItem value="yesterday">Yesterday</SelectItem>

                    <SelectItem value="this-week">This Week</SelectItem>

                    <SelectItem value="this-month">This Month</SelectItem>

                    <SelectItem value="last-month">Last Month</SelectItem>

                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Employee
                </label>

                <Select
                  value={employeeFilter}
                  onValueChange={(value) => {
                    setEmployeeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <UserRound className="mr-2 h-4 w-4 text-muted-foreground" />

                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>

                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>

                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />

                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>

                    {categories.map((category) => (
                      <SelectItem
                        key={category.id || category}
                        value={String(category.id || category)}
                      >
                        {category.name || category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Payment Method
                </label>

                <Select
                  value={paymentFilter}
                  onValueChange={(value) => {
                    setPaymentFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />

                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>

                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* =================================================
                CUSTOM DATE RANGE
            ================================================== */}

            {dateFilter === "custom" && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium">Custom Date Range</p>

                  <p className="text-xs text-muted-foreground">
                    Select the start and end date for your report.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Start */}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />

                        {customStartDate
                          ? customStartDate.toLocaleDateString("en-BD", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Start date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date);
                          setCurrentPage(1);

                          if (customEndDate && date && date > customEndDate) {
                            setCustomEndDate(undefined);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* End */}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />

                        {customEndDate
                          ? customEndDate.toLocaleDateString("en-BD", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "End date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        disabled={(date) =>
                          customStartDate ? date < customStartDate : false
                        }
                        onSelect={(date) => {
                          setCustomEndDate(date);
                          setCurrentPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {(customStartDate || customEndDate) && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span>{customDateLabel}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />

                <h2 className="font-semibold">All Transactions</h2>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {pagination.totalResults.toLocaleString()} transaction
                {pagination.totalResults !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              Revenue:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(summary.revenue)}
              </span>
            </div>
          </div>

          {/* Error */}

          {error && (
            <div className="border-b bg-destructive/5 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-destructive">
                    Unable to load transactions
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError("");
                    setCurrentPage((page) => page);
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Table */}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>

                  <TableHead>Employee</TableHead>

                  <TableHead>Customer</TableHead>

                  <TableHead>Product</TableHead>

                  <TableHead>Category</TableHead>

                  <TableHead className="text-right">Revenue</TableHead>

                  <TableHead className="text-right">Profit</TableHead>

                  <TableHead className="text-center">Payment</TableHead>

                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 9 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-5 w-full max-w-[140px] animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Receipt className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <h3 className="mt-4 font-semibold">
                          No transactions found
                        </h3>

                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                          No transactions match your current search and filter
                          criteria.
                        </p>

                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                            className="mt-4"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => {
                    const id =
                      transaction.id ||
                      transaction._id ||
                      transaction.invoiceNumber;

                    const employeeName =
                      transaction.employee ||
                      transaction.employeeName ||
                      transaction.sellerName ||
                      "Unknown";

                    const employeeId =
                      transaction.employeeId || transaction.sellerId || "-";

                    const customer =
                      transaction.customer || transaction.customerName || "-";

                    const phone =
                      transaction.phone || transaction.customerPhone || "";

                    const product =
                      transaction.product || transaction.productName || "-";

                    const category =
                      transaction.category || transaction.categoryName || "-";

                    const revenue =
                      transaction.revenue ??
                      transaction.totalPrice ??
                      transaction.total ??
                      0;

                    const expense =
                      transaction.expense ??
                      transaction.rawExpense ??
                      transaction.expenseCost ??
                      0;

                    const profit =
                      transaction.profit ?? transaction.netProfit ?? 0;

                    const commission = transaction.commission ?? 0;

                    const due = transaction.due ?? 0;

                    const paymentMethod = transaction.paymentMethod || "-";

                    const quantity = transaction.quantity ?? 0;

                    const createdAt = transaction.date || transaction.createdAt;

                    return (
                      <TableRow key={id}>
                        {/* Invoice */}

                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {transaction.invoiceNumber || "-"}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              #{String(id).slice(-4).padStart(4, "0")}
                            </p>
                          </div>
                        </TableCell>

                        {/* Employee */}

                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <UserRound className="h-4 w-4 text-primary" />
                            </div>

                            <div>
                              <p className="font-medium">{employeeName}</p>

                              <p className="text-xs text-muted-foreground">
                                {employeeId}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Customer */}

                        <TableCell>
                          <div>
                            <p className="font-medium">{customer}</p>

                            {phone && (
                              <p className="text-xs text-muted-foreground">
                                {phone}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Product */}

                        <TableCell>
                          <div>
                            <p className="font-medium">{product}</p>

                            <p className="text-xs text-muted-foreground">
                              Qty: {quantity}
                            </p>
                          </div>
                        </TableCell>

                        {/* Category */}

                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                            {category}
                          </span>
                        </TableCell>

                        {/* Revenue */}

                        <TableCell className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(revenue)}
                          </p>

                          {due > 0 && (
                            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                              Due: {formatCurrency(due)}
                            </p>
                          )}
                        </TableCell>

                        {/* Profit */}

                        <TableCell className="text-right">
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(profit)}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Exp: {formatCurrency(expense)}
                          </p>
                        </TableCell>

                        {/* Payment */}

                        <TableCell className="text-center">
                          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                            {paymentMethod}
                          </span>
                        </TableCell>

                        {/* Date */}

                        <TableCell className="text-right">
                          <p className="whitespace-nowrap font-medium">
                            {formatDate(createdAt)}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatTime(createdAt)}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================== */}

          {!loading && pagination.totalResults > 0 && (
            <div className="flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {showingFrom}
                </span>
                {" - "}
                <span className="font-medium text-foreground">{showingTo}</span>
                {" of "}
                <span className="font-medium text-foreground">
                  {pagination.totalResults}
                </span>{" "}
                transactions
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={pagination.currentPage <= 1 || loading}
                  onClick={goToPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex h-9 min-w-[90px] items-center justify-center rounded-md border px-3 text-sm">
                  Page{" "}
                  <span className="mx-1 font-semibold">
                    {pagination.currentPage}
                  </span>
                  of {pagination.totalPages}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={
                    pagination.currentPage >= pagination.totalPages || loading
                  }
                  onClick={goToNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
