"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Badge,
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
// DEMO DATA
// =========================================================

const demoTransactions = [
  {
    id: "1",
    invoiceNumber: "INV-2026-5201",
    employee: "Md Khalil Uddin",
    employeeId: "EMP-001",
    customer: "Delara Begum",
    phone: "01715409109",
    product: "Photocopy",
    category: "Photocopy",
    quantity: 50,
    revenue: 250,
    expense: 0,
    profit: 250,
    commission: 25,
    paymentMethod: "Cash",
    paidAmount: 250,
    due: 0,
    date: "2026-08-23T14:35:00",
  },

  {
    id: "2",
    invoiceNumber: "INV-2026-5200",
    employee: "Rahim Ahmed",
    employeeId: "EMP-002",
    customer: "Abdul Karim",
    phone: "01812345678",
    product: "Online Application",
    category: "DCR",
    quantity: 1,
    revenue: 800,
    expense: 100,
    profit: 700,
    commission: 80,
    paymentMethod: "Cash",
    paidAmount: 800,
    due: 0,
    date: "2026-08-23T13:48:00",
  },

  {
    id: "3",
    invoiceNumber: "INV-2026-5199",
    employee: "Nusrat Jahan",
    employeeId: "EMP-003",
    customer: "Mizanur Rahman",
    phone: "01912345678",
    product: "Namjari Application",
    category: "Namjari",
    quantity: 1,
    revenue: 1500,
    expense: 300,
    profit: 1200,
    commission: 150,
    paymentMethod: "bKash",
    paidAmount: 1000,
    due: 500,
    date: "2026-08-23T12:22:00",
  },

  {
    id: "4",
    invoiceNumber: "INV-2026-5198",
    employee: "Md Khalil Uddin",
    employeeId: "EMP-001",
    customer: "Sakina Begum",
    phone: "01612345678",
    product: "Khatian Application",
    category: "Khatian Application",
    quantity: 1,
    revenue: 1200,
    expense: 200,
    profit: 1000,
    commission: 120,
    paymentMethod: "Cash",
    paidAmount: 1200,
    due: 0,
    date: "2026-08-23T11:16:00",
  },

  {
    id: "5",
    invoiceNumber: "INV-2026-5197",
    employee: "Sabbir Hossain",
    employeeId: "EMP-004",
    customer: "Jamal Uddin",
    phone: "01512345678",
    product: "Printing",
    category: "Printing",
    quantity: 25,
    revenue: 500,
    expense: 150,
    profit: 350,
    commission: 50,
    paymentMethod: "Cash",
    paidAmount: 500,
    due: 0,
    date: "2026-08-23T10:45:00",
  },

  {
    id: "6",
    invoiceNumber: "INV-2026-5196",
    employee: "Rahim Ahmed",
    employeeId: "EMP-002",
    customer: "Rashed Mia",
    phone: "01798765432",
    product: "Khajna Payment",
    category: "Khajna Payment",
    quantity: 1,
    revenue: 900,
    expense: 100,
    profit: 800,
    commission: 90,
    paymentMethod: "Nagad",
    paidAmount: 900,
    due: 0,
    date: "2026-08-23T10:12:00",
  },

  {
    id: "7",
    invoiceNumber: "INV-2026-5195",
    employee: "Nusrat Jahan",
    employeeId: "EMP-003",
    customer: "Farhana Akter",
    phone: "01898765432",
    product: "Document Scan",
    category: "Scanning",
    quantity: 15,
    revenue: 300,
    expense: 50,
    profit: 250,
    commission: 30,
    paymentMethod: "Cash",
    paidAmount: 300,
    due: 0,
    date: "2026-08-22T17:20:00",
  },

  {
    id: "8",
    invoiceNumber: "INV-2026-5194",
    employee: "Sabbir Hossain",
    employeeId: "EMP-004",
    customer: "Habib Ahmed",
    phone: "01987654321",
    product: "Graphic Design",
    category: "Design",
    quantity: 1,
    revenue: 2000,
    expense: 400,
    profit: 1600,
    commission: 200,
    paymentMethod: "bKash",
    paidAmount: 2000,
    due: 0,
    date: "2026-08-22T16:45:00",
  },

  {
    id: "9",
    invoiceNumber: "INV-2026-5193",
    employee: "Md Khalil Uddin",
    employeeId: "EMP-001",
    customer: "Ruhul Amin",
    phone: "01711112222",
    product: "Photocopy",
    category: "Photocopy",
    quantity: 100,
    revenue: 500,
    expense: 0,
    profit: 500,
    commission: 50,
    paymentMethod: "Cash",
    paidAmount: 500,
    due: 0,
    date: "2026-08-22T15:10:00",
  },

  {
    id: "10",
    invoiceNumber: "INV-2026-5192",
    employee: "Rahim Ahmed",
    employeeId: "EMP-002",
    customer: "Morshed Alam",
    phone: "01698761234",
    product: "Miss Case",
    category: "Miss Case",
    quantity: 1,
    revenue: 2500,
    expense: 500,
    profit: 2000,
    commission: 250,
    paymentMethod: "Cash",
    paidAmount: 2000,
    due: 500,
    date: "2026-08-22T13:25:00",
  },

  {
    id: "11",
    invoiceNumber: "INV-2026-5191",
    employee: "Nusrat Jahan",
    employeeId: "EMP-003",
    customer: "Nasima Begum",
    phone: "01787654321",
    product: "Printing",
    category: "Printing",
    quantity: 40,
    revenue: 800,
    expense: 200,
    profit: 600,
    commission: 80,
    paymentMethod: "Cash",
    paidAmount: 800,
    due: 0,
    date: "2026-08-22T12:40:00",
  },

  {
    id: "12",
    invoiceNumber: "INV-2026-5190",
    employee: "Sabbir Hossain",
    employeeId: "EMP-004",
    customer: "Al Amin",
    phone: "01876543210",
    product: "Online Registration",
    category: "Registration",
    quantity: 1,
    revenue: 700,
    expense: 100,
    profit: 600,
    commission: 70,
    paymentMethod: "Nagad",
    paidAmount: 700,
    due: 0,
    date: "2026-08-21T16:30:00",
  },
];

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

  const [dateFilter, setDateFilter] = useState("all");

  const [customStartDate, setCustomStartDate] = useState();

  const [customEndDate, setCustomEndDate] = useState();

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const employees = useMemo(() => {
    return [
      ...new Map(
        demoTransactions.map((item) => [
          item.employeeId,
          {
            id: item.employeeId,
            name: item.employee,
          },
        ]),
      ).values(),
    ];
  }, []);

  const categories = useMemo(() => {
    return [...new Set(demoTransactions.map((item) => item.category))];
  }, []);

  const paymentMethods = useMemo(() => {
    return [...new Set(demoTransactions.map((item) => item.paymentMethod))];
  }, []);

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const startOfDay = (date) => {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
  };

  const endOfDay = (date) => {
    const result = new Date(date);

    result.setHours(23, 59, 59, 999);

    return result;
  };

  const getDateRange = () => {
    const now = new Date();

    if (dateFilter === "this-month") {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: endOfDay(now),
      };
    }

    if (dateFilter === "last-month") {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      };
    }

    if (dateFilter === "custom" && customStartDate && customEndDate) {
      return {
        start: startOfDay(customStartDate),
        end: endOfDay(customEndDate),
      };
    }

    return null;
  };

  // =========================================================
  // FILTER DATA
  // =========================================================

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const dateRange = getDateRange();

    return demoTransactions.filter((transaction) => {
      // -------------------------
      // Search
      // -------------------------

      const matchesSearch =
        !normalizedSearch ||
        transaction.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
        transaction.customer.toLowerCase().includes(normalizedSearch) ||
        transaction.phone.toLowerCase().includes(normalizedSearch) ||
        transaction.product.toLowerCase().includes(normalizedSearch) ||
        transaction.employee.toLowerCase().includes(normalizedSearch);

      // -------------------------
      // Employee
      // -------------------------

      const matchesEmployee =
        employeeFilter === "all" || transaction.employeeId === employeeFilter;

      // -------------------------
      // Category
      // -------------------------

      const matchesCategory =
        categoryFilter === "all" || transaction.category === categoryFilter;

      // -------------------------
      // Payment
      // -------------------------

      const matchesPayment =
        paymentFilter === "all" || transaction.paymentMethod === paymentFilter;

      // -------------------------
      // Date
      // -------------------------

      let matchesDate = true;

      if (dateRange) {
        const transactionDate = new Date(transaction.date);

        matchesDate =
          transactionDate >= dateRange.start &&
          transactionDate <= dateRange.end;
      }

      return (
        matchesSearch &&
        matchesEmployee &&
        matchesCategory &&
        matchesPayment &&
        matchesDate
      );
    });
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
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        acc.revenue += transaction.revenue;
        acc.profit += transaction.profit;
        acc.expense += transaction.expense;
        acc.commission += transaction.commission;

        return acc;
      },
      {
        revenue: 0,
        profit: 0,
        expense: 0,
        commission: 0,
      },
    );
  }, [filteredTransactions]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / itemsPerPage),
  );

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch("");
    setEmployeeFilter("all");
    setCategoryFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    employeeFilter !== "all" ||
    categoryFilter !== "all" ||
    paymentFilter !== "all" ||
    dateFilter !== "all";

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (value) => {
    return `৳${Number(value || 0).toLocaleString("en-BD")}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCustomRange = () => {
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
  };

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

          <Button variant="outline" className="w-fit gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(summary.revenue)}
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

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.profit)}
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

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(summary.expense)}
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

          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Transactions
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {filteredTransactions.length.toLocaleString()}
                </p>

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
            {/* Filter Header */}

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
                    setCurrentPage(1);
                  }}
                  placeholder="Search invoice, customer, phone, product or employee..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Other Filters */}

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
                    <SelectItem value="all">All Time</SelectItem>

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
                      <SelectItem key={employee.id} value={employee.id}>
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
                      <SelectItem key={category} value={category}>
                        {category}
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
                  {/* Start Date */}

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

                  {/* End Date */}

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

                    <span>{formatCustomRange()}</span>
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
          {/* Table Header */}

          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />

                <h2 className="font-semibold">All Transactions</h2>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {filteredTransactions.length.toLocaleString()} transaction
                {filteredTransactions.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              Revenue:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(summary.revenue)}
              </span>
            </div>
          </div>

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
                {paginatedTransactions.length === 0 ? (
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
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      {/* Invoice */}

                      <TableCell>
                        <div>
                          <p className="font-semibold">
                            {transaction.invoiceNumber}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            #{transaction.id.padStart(4, "0")}
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
                            <p className="font-medium">
                              {transaction.employee}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {transaction.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}

                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.customer}</p>

                          <p className="text-xs text-muted-foreground">
                            {transaction.phone}
                          </p>
                        </div>
                      </TableCell>

                      {/* Product */}

                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.product}</p>

                          <p className="text-xs text-muted-foreground">
                            Qty: {transaction.quantity}
                          </p>
                        </div>
                      </TableCell>

                      {/* Category */}

                      <TableCell>
                        <Badge variant="secondary">
                          {transaction.category}
                        </Badge>
                      </TableCell>

                      {/* Revenue */}

                      <TableCell className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(transaction.revenue)}
                        </p>

                        {transaction.due > 0 && (
                          <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                            Due: {formatCurrency(transaction.due)}
                          </p>
                        )}
                      </TableCell>

                      {/* Profit */}

                      <TableCell className="text-right">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(transaction.profit)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Exp: {formatCurrency(transaction.expense)}
                        </p>
                      </TableCell>

                      {/* Payment */}

                      <TableCell className="text-center">
                        <Badge
                          variant={
                            transaction.paymentMethod === "Cash"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.paymentMethod}
                        </Badge>
                      </TableCell>

                      {/* Date */}

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

          {filteredTransactions.length > 0 && (
            <div className="flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    filteredTransactions.length,
                  )}
                </span>
                {" - "}
                <span className="font-medium text-foreground">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredTransactions.length,
                  )}
                </span>
                {" of "}
                <span className="font-medium text-foreground">
                  {filteredTransactions.length}
                </span>{" "}
                transactions
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex h-9 min-w-[80px] items-center justify-center rounded-md border px-3 text-sm">
                  Page <span className="mx-1 font-semibold">{currentPage}</span>
                  of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
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
