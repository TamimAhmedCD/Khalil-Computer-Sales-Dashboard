"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectGroup,
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
// CONFIG
// =========================================================

const API_URL = "/api/admin/transactions";

const ITEMS_PER_PAGE = 8;

// =========================================================
// COMPONENT
// =========================================================

export default function AdminTransactions() {
  // =========================================================
  // DATA
  // =========================================================

  const [transactions, setTransactions] = useState([]);

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalExpense: 0,
    totalCommission: 0,
    totalDue: 0,
    totalQuantity: 0,
    transactionCount: 0,
  });

  const [filterOptions, setFilterOptions] = useState({
    employees: [],
    categories: [],
    paymentMethods: [],
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: ITEMS_PER_PAGE,
    totalResults: 0,
    totalPages: 1,
  });

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [search, setSearch] = useState("");

  const [employeeFilter, setEmployeeFilter] = useState("all");

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [paymentFilter, setPaymentFilter] = useState("all");

  // IMPORTANT:
  // These values MUST match your API exactly.
  //
  // today
  // yesterday
  // week
  // month
  // last-month
  // custom
  // all
  const [dateFilter, setDateFilter] = useState("today");

  const [customStartDate, setCustomStartDate] = useState(undefined);

  const [customEndDate, setCustomEndDate] = useState(undefined);

  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // UI STATE
  // =========================================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================================================
  // FORMATTERS
  // =========================================================

  const formatCurrency = useCallback((value) => {
    return `৳${Number(value || 0).toLocaleString("en-BD")}`;
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const formatTime = useCallback((date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // =========================================================
  // DATE FORMAT FOR API
  // =========================================================

  const formatDateForAPI = useCallback((date) => {
    if (!date) return "";

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  // =========================================================
  // FETCH TRANSACTIONS
  // =========================================================

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const params = new URLSearchParams();

      // -------------------------
      // Search
      // -------------------------

      if (search.trim()) {
        params.set("search", search.trim());
      }

      // -------------------------
      // Date
      // -------------------------

      params.set("dateFilter", dateFilter);

      // -------------------------
      // Employee
      // -------------------------

      if (employeeFilter !== "all") {
        params.set("employeeId", employeeFilter);
      } else {
        params.set("employeeId", "all");
      }

      // -------------------------
      // Category
      // -------------------------

      if (categoryFilter !== "all") {
        params.set("categoryId", categoryFilter);
      } else {
        params.set("categoryId", "all");
      }

      // -------------------------
      // Payment
      // -------------------------

      if (paymentFilter !== "all") {
        params.set("paymentMethod", paymentFilter);
      } else {
        params.set("paymentMethod", "all");
      }

      // -------------------------
      // Custom Date
      // -------------------------

      if (dateFilter === "custom") {
        if (customStartDate) {
          params.set("customStartDate", formatDateForAPI(customStartDate));
        }

        if (customEndDate) {
          params.set("customEndDate", formatDateForAPI(customEndDate));
        }
      }

      // -------------------------
      // Pagination
      // -------------------------

      params.set("page", String(currentPage));

      params.set("limit", String(ITEMS_PER_PAGE));

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load transactions");
      }

      // =====================================================
      // TRANSACTIONS
      // =====================================================

      setTransactions(Array.isArray(result.data) ? result.data : []);

      // =====================================================
      // SUMMARY
      // =====================================================

      setSummary({
        totalRevenue: Number(result?.summary?.totalRevenue) || 0,
        totalProfit: Number(result?.summary?.totalProfit) || 0,
        totalExpense: Number(result?.summary?.totalExpense) || 0,
        totalCommission: Number(result?.summary?.totalCommission) || 0,
        totalDue: Number(result?.summary?.totalDue) || 0,
        totalQuantity: Number(result?.summary?.totalQuantity) || 0,
        transactionCount: Number(result?.summary?.transactionCount) || 0,
      });

      // =====================================================
      // FILTER OPTIONS
      // =====================================================

      setFilterOptions({
        employees: Array.isArray(result?.filters?.employees)
          ? result.filters.employees
          : [],

        categories: Array.isArray(result?.filters?.categories)
          ? result.filters.categories
          : [],

        paymentMethods: Array.isArray(result?.filters?.paymentMethods)
          ? result.filters.paymentMethods
          : [],
      });

      // =====================================================
      // PAGINATION
      // =====================================================

      setPagination({
        currentPage: Number(result?.pagination?.currentPage) || currentPage,

        limit: Number(result?.pagination?.limit) || ITEMS_PER_PAGE,

        totalResults: Number(result?.pagination?.totalResults) || 0,

        totalPages: Math.max(Number(result?.pagination?.totalPages) || 1, 1),
      });
    } catch (err) {
      console.error("Admin Transactions Fetch Error:", err);

      setTransactions([]);

      setError(err?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    dateFilter,
    employeeFilter,
    categoryFilter,
    paymentFilter,
    customStartDate,
    customEndDate,
    currentPage,
    formatDateForAPI,
  ]);

  // =========================================================
  // FETCH WHEN FILTERS CHANGE
  // =========================================================

  useEffect(() => {
    /*
      For custom range, don't call API until both dates
      have been selected.
    */

    if (dateFilter === "custom" && (!customStartDate || !customEndDate)) {
      setLoading(false);

      setTransactions([]);

      return;
    }

    fetchTransactions();
  }, [fetchTransactions, dateFilter, customStartDate, customEndDate]);

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
  // ACTIVE FILTER
  // =========================================================

  const hasActiveFilters = useMemo(() => {
    return (
      search.trim() !== "" ||
      employeeFilter !== "all" ||
      categoryFilter !== "all" ||
      paymentFilter !== "all" ||
      dateFilter !== "today"
    );
  }, [search, employeeFilter, categoryFilter, paymentFilter, dateFilter]);

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch("");

    setEmployeeFilter("all");

    setCategoryFilter("all");

    setPaymentFilter("all");

    setDateFilter("today");

    setCustomStartDate(undefined);

    setCustomEndDate(undefined);

    setCurrentPage(1);
  };

  // =========================================================
  // CUSTOM RANGE LABEL
  // =========================================================

  const customRangeLabel = useMemo(() => {
    if (!customStartDate && !customEndDate) {
      return "Select date range";
    }

    if (customStartDate && !customEndDate) {
      return customStartDate.toLocaleDateString("en-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    return `${customStartDate?.toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} - ${customEndDate?.toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, [customStartDate, customEndDate]);

  // =========================================================
  // PAGE RANGE
  // =========================================================

  const showingFrom =
    pagination.totalResults === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const showingTo = Math.min(
    currentPage * ITEMS_PER_PAGE,
    pagination.totalResults,
  );

  // =========================================================
  // PAGE CHANGE
  // =========================================================

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), pagination.totalPages);

    setCurrentPage(safePage);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-400 space-y-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="dashboard"
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
            onClick={fetchTransactions}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-destructive">
                  Failed to load transactions
                </p>

                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchTransactions}
                disabled={loading}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

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

                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(summary.totalRevenue)}
                </p>

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

                <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.totalProfit)}
                </p>

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

          {/* Expense */}

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(summary.totalExpense)}
                </p>

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
                  Total Commission
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(summary.totalCommission)}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Commission from matching transactions
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <Card>
          <CardContent className="space-y-5 p-5">
            {/* Header */}

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
              {/* DATE */}

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
                    {/* <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" /> */}

                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="today">Today</SelectItem>

                      <SelectItem value="yesterday">Yesterday</SelectItem>

                      <SelectItem value="week">This Week</SelectItem>

                      <SelectItem value="month">This Month</SelectItem>

                      <SelectItem value="last-month">Last Month</SelectItem>

                      <SelectItem value="custom">Custom Range</SelectItem>

                      <SelectItem value="all">All Time</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* EMPLOYEE */}

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

                    {filterOptions.employees.map((employee) => (
                      <SelectItem
                        key={String(employee.id)}
                        value={String(employee.id)}
                      >
                        {employee.name || "Unknown Employee"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CATEGORY */}

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

                    {filterOptions.categories.map((category) => (
                      <SelectItem
                        key={String(category.id)}
                        value={String(category.id)}
                      >
                        {category.name || "Unknown Category"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PAYMENT */}

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

                    {filterOptions.paymentMethods.map((method) => (
                      <SelectItem key={String(method)} value={String(method)}>
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
                  {/* START DATE */}

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

                          if (customEndDate && date && date > customEndDate) {
                            setCustomEndDate(undefined);
                          }

                          setCurrentPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* END DATE */}

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

                {customStartDate && customEndDate && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span>{customRangeLabel}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* =====================================================
            TRANSACTION TABLE
        ====================================================== */}

        <Card className="overflow-hidden">
          {/* TABLE HEADER */}

          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />

                <h2 className="font-semibold">All Transactions</h2>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {pagination.totalResults.toLocaleString("en-BD")} transaction
                {pagination.totalResults !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              Revenue:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(summary.totalRevenue)}
              </span>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />

                <p className="text-sm text-muted-foreground">
                  Loading transactions...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* TABLE */}

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
                    {transactions.length === 0 ? (
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
                              No transactions match your current search and
                              filter criteria.
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
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          {/* INVOICE */}

                          <TableCell>
                            <div>
                              <p className="font-semibold">
                                {transaction.invoiceNumber || "-"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                #{String(transaction.id || "").slice(-6)}
                              </p>
                            </div>
                          </TableCell>

                          {/* EMPLOYEE */}

                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <UserRound className="h-4 w-4 text-primary" />
                              </div>

                              <div>
                                <p className="font-medium">
                                  {transaction.employee || "Unknown Employee"}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {transaction.employeeId || "-"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* CUSTOMER */}

                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {transaction.customer || "-"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {transaction.phone || "-"}
                              </p>
                            </div>
                          </TableCell>

                          {/* PRODUCT */}

                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {transaction.product || "-"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Qty: {Number(transaction.quantity) || 0}
                              </p>
                            </div>
                          </TableCell>

                          {/* CATEGORY */}

                          <TableCell>
                            <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                              {transaction.category || "Uncategorized"}
                            </span>
                          </TableCell>

                          {/* REVENUE */}

                          <TableCell className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(transaction.revenue)}
                            </p>

                            {Number(transaction.due) > 0 && (
                              <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                Due: {formatCurrency(transaction.due)}
                              </p>
                            )}
                          </TableCell>

                          {/* PROFIT */}

                          <TableCell className="text-right">
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(transaction.profit)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Exp: {formatCurrency(transaction.expense)}
                            </p>
                          </TableCell>

                          {/* PAYMENT */}

                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                                transaction.paymentMethod === "Cash"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              {transaction.paymentMethod || "-"}
                            </span>
                          </TableCell>

                          {/* DATE */}

                          <TableCell className="text-right">
                            <p className="whitespace-nowrap font-medium">
                              {formatDate(transaction.date)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {formatTime(transaction.date)}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* =================================================
                  PAGINATION
              ================================================== */}

              {pagination.totalResults > 0 && (
                <div className="flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {showingFrom}
                    </span>
                    {" - "}
                    <span className="font-medium text-foreground">
                      {showingTo}
                    </span>
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
                      disabled={currentPage <= 1 || loading}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex h-9 min-w-25 items-center justify-center rounded-md border px-3 text-sm">
                      Page{" "}
                      <span className="mx-1 font-semibold">{currentPage}</span>{" "}
                      of {pagination.totalPages}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage >= pagination.totalPages || loading}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
