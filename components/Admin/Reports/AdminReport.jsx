"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Landmark,
  Package,
  Printer,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  exportReportToExcel,
  exportReportToPdf,
  printReport,
} from "@/lib/reports/exportReport";

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

// =========================================================
// DEMO DATA
// =========================================================

// =========================================================
// HELPERS
// =========================================================

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const formatNumber = (value) => Number(value || 0).toLocaleString("en-BD");

// Human-readable labels for the date filter, echoed onto exported reports.
const DATE_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
  "last-month": "Last Month",
  custom: "Custom Range",
};

// =========================================================
// KPI CARD
// =========================================================

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "bg-primary/10 text-primary",
  valueClassName = "",
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            <p
              className={`mt-2 text-2xl font-bold tracking-tight ${valueClassName}`}
            >
              {value}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================
// BAR
// =========================================================

function PerformanceBar({ value, max, className = "" }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full bg-primary transition-all ${className}`}
        style={{
          width: `${Math.max(Math.min(percentage, 100), 2)}%`,
        }}
      />
    </div>
  );
}

// =========================================================
// PAGE
// =========================================================

export default function AdminReport() {
  const API_URL = "/api/admin/reports";

  const [dateFilter, setDateFilter] = useState("month");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [customStartDate, setCustomStartDate] = useState();
  const [customEndDate, setCustomEndDate] = useState();

  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalExpense: 0,
      totalProfit: 0,
      totalCommission: 0,
      totalDue: 0,
      totalPaid: 0,
      transactionCount: 0,
      totalQuantity: 0,
    },
    profitMargin: 0,
    revenueTrend: [],
    sellerPerformance: [],
    categoryPerformance: [],
    paymentMethods: [],
    outstandingDues: [],
    topProducts: [],
    recentTransactions: [],
    insights: {
      topSeller: null,
      leadingCategory: null,
    },
  });

  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(
    async (signal) => {
      try {
        // Custom range is only sent when both dates exist.
        if (dateFilter === "custom" && (!customStartDate || !customEndDate)) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("dateFilter", dateFilter);
        params.set("sellerId", sellerFilter);
        params.set("categoryId", categoryFilter);
        params.set("paymentMethod", paymentFilter);

        if (dateFilter === "custom") {
          params.set(
            "customStartDate",
            customStartDate.toISOString().split("T")[0],
          );
          params.set(
            "customEndDate",
            customEndDate.toISOString().split("T")[0],
          );
        }

        const response = await fetch(`${API_URL}?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load report");
        }

        setReportData({
          summary: {
            totalRevenue: 0,
            totalExpense: 0,
            totalProfit: 0,
            totalCommission: 0,
            totalDue: 0,
            totalPaid: 0,
            transactionCount: 0,
            totalQuantity: 0,
            ...(result.data?.summary || {}),
          },
          profitMargin: Number(result.data?.profitMargin) || 0,
          revenueTrend: result.data?.revenueTrend || [],
          sellerPerformance: result.data?.sellerPerformance || [],
          categoryPerformance: result.data?.categoryPerformance || [],
          paymentMethods: result.data?.paymentMethods || [],
          outstandingDues: result.data?.outstandingDues || [],
          topProducts: result.data?.topProducts || [],
          recentTransactions: result.data?.recentTransactions || [],
          insights: result.data?.insights || {
            topSeller: null,
            leadingCategory: null,
          },
        });

        setSellers(result.filters?.sellers || result.filters?.employees || []);
        setCategories(result.filters?.categories || []);
        setPaymentOptions(result.filters?.paymentMethods || []);
      } catch (err) {
        if (err?.name === "AbortError") return;

        console.error("Admin report fetch error:", err);
        setError(err?.message || "Failed to load report");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      dateFilter,
      sellerFilter,
      categoryFilter,
      paymentFilter,
      customStartDate,
      customEndDate,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchReport(controller.signal);

    return () => controller.abort();
  }, [fetchReport]);

  const summary = reportData.summary;

  const profitMargin =
    Number(reportData.profitMargin) ||
    (summary.totalRevenue > 0
      ? (summary.totalProfit / summary.totalRevenue) * 100
      : 0);

  const maxRevenue = Math.max(
    0,
    ...reportData.revenueTrend.map((item) => Number(item.revenue) || 0),
  );

  const maxSellerRevenue = Math.max(
    0,
    ...reportData.sellerPerformance.map((item) => Number(item.revenue) || 0),
  );

  const maxCategoryRevenue = Math.max(
    0,
    ...reportData.categoryPerformance.map((item) => Number(item.revenue) || 0),
  );

  const resetFilters = () => {
    setDateFilter("month");
    setSellerFilter("all");
    setCategoryFilter("all");
    setPaymentFilter("all");
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
  };

  const formatReportTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Resolve the current filter selection into readable labels + file naming
  // that get stamped onto every exported report.
  const buildMeta = () => {
    const fmtDate = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-BD", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";

    let periodLabel = DATE_LABELS[dateFilter] || "This Month";
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      periodLabel = `${fmtDate(customStartDate)} – ${fmtDate(customEndDate)}`;
    }

    const sellerLabel =
      sellerFilter === "all"
        ? "All Sellers"
        : sellers.find((s) => String(s.id) === String(sellerFilter))?.name ||
          "—";

    const categoryLabel =
      categoryFilter === "all"
        ? "All Categories"
        : categories.find((c) => String(c.id) === String(categoryFilter))
            ?.name || "—";

    const paymentLabel =
      paymentFilter === "all" ? "All Methods" : paymentFilter;

    const now = new Date();

    return {
      title: "Reports & Analytics",
      filters: [
        { label: "Period", value: periodLabel },
        { label: "Seller", value: sellerLabel },
        { label: "Category", value: categoryLabel },
        { label: "Payment", value: paymentLabel },
      ],
      profitMargin,
      generatedAt: now.toLocaleString("en-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      fileBase: `khalil-report-${dateFilter}-${now.toISOString().slice(0, 10)}`,
    };
  };

  const runExport = async (kind) => {
    if (loading || exporting) return;

    setExporting(true);
    try {
      const meta = buildMeta();

      if (kind === "pdf") {
        await exportReportToPdf(reportData, meta);
        toast.success("PDF report downloaded");
      } else if (kind === "excel") {
        await exportReportToExcel(reportData, meta);
        toast.success("Excel report downloaded");
      } else if (kind === "print") {
        printReport(reportData, meta);
      }
    } catch (err) {
      console.error("Report export failed:", err);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Reports & Analytics
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor business performance, profitability, and sales
                  activity.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={loading || exporting}
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Exporting…" : "Export Report"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Export report</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => runExport("pdf")}
                >
                  <FileText className="h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => runExport("excel")}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Excel
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => runExport("print")}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <Card className="border-border/70 shadow-sm">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />

                  <h2 className="font-semibold">Report Filters</h2>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Select a reporting period and refine the report.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="w-fit"
              >
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reporting Period
                </label>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className={"w-full"}>
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>

                    <SelectItem value="yesterday">Yesterday</SelectItem>

                    <SelectItem value="week">This Week</SelectItem>

                    <SelectItem value="month">This Month</SelectItem>

                    <SelectItem value="last-month">Last Month</SelectItem>

                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SELLER */}

              <div>
                <label className="mb-2 block text-sm font-medium">Seller</label>

                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger className="w-full">
                    <UserRound className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All Sellers" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Sellers</SelectItem>

                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
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
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full">
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>

                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-full">
                    <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>

                    {paymentOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CUSTOM DATE */}

            {dateFilter === "custom" && (
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-medium">
                  Custom Reporting Period
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
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
                        onSelect={setCustomStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
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
                        onSelect={setCustomEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-sm text-muted-foreground">Loading report...</div>
        )}

        {/* =====================================================
            KPI SECTION
        ====================================================== */}

        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Business Overview</h2>

            <p className="text-sm text-muted-foreground">
              Key financial and operational indicators for the selected period.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
              description="Total sales generated"
              icon={CircleDollarSign}
            />

            <KpiCard
              title="Net Profit"
              value={formatCurrency(summary.totalProfit)}
              description={`${profitMargin.toFixed(1)}% profit margin`}
              icon={TrendingUp}
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />

            <KpiCard
              title="Total Expense"
              value={formatCurrency(summary.totalExpense)}
              description="Business operating costs"
              icon={ArrowDownRight}
              iconClassName="bg-orange-500/10 text-orange-600 dark:text-orange-400"
            />

            <KpiCard
              title="Commission"
              value={formatCurrency(summary.totalCommission)}
              description="Seller commission generated"
              icon={Wallet}
              iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />

            <KpiCard
              title="Outstanding Due"
              value={formatCurrency(summary.totalDue)}
              description="Uncollected customer balance"
              icon={Landmark}
              iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              valueClassName="text-amber-600 dark:text-amber-400"
            />

            <KpiCard
              title="Transactions"
              value={formatNumber(summary.transactionCount)}
              description="Completed sales records"
              icon={Receipt}
              iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />

            <KpiCard
              title="Quantity Sold"
              value={formatNumber(summary.totalQuantity)}
              description="Total items or services"
              icon={ShoppingBag}
              iconClassName="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
            />

            <KpiCard
              title="Average Transaction"
              value={formatCurrency(
                summary.transactionCount
                  ? summary.totalRevenue / summary.transactionCount
                  : 0,
              )}
              description="Average revenue per sale"
              icon={BarChart3}
              iconClassName="bg-pink-500/10 text-pink-600 dark:text-pink-400"
            />
          </div>
        </div>

        {/* =====================================================
            REVENUE TREND
        ====================================================== */}

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  Revenue & Profit Trend
                </CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Compare revenue generation and profitability across the
                  selected period.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Revenue
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Profit
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex h-80 items-end gap-3 overflow-x-auto px-2 pb-8 pt-5">
              {reportData.revenueTrend.map((item) => {
                const revenueHeight = (item.revenue / maxRevenue) * 100;

                const profitHeight = (item.profit / maxRevenue) * 100;

                return (
                  <div
                    key={item.label}
                    className="flex min-w-17.5 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="flex h-62.5 w-full max-w-18 items-end justify-center gap-1">
                      <div
                        className="w-5 rounded-t-md bg-primary transition-all"
                        style={{
                          height: `${revenueHeight}%`,
                        }}
                        title={`Revenue: ${formatCurrency(item.revenue)}`}
                      />

                      <div
                        className="w-5 rounded-t-md bg-emerald-500 transition-all"
                        style={{
                          height: `${profitHeight}%`,
                        }}
                        title={`Profit: ${formatCurrency(item.profit)}`}
                      />
                    </div>

                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
            REVENUE + PROFITABILITY
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Breakdown */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Revenue Breakdown</CardTitle>

              <p className="text-xs text-muted-foreground">
                Collection status for the selected reporting period.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>

                  <p className="mt-1 text-3xl font-bold">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                </div>

                <Badge variant="secondary">
                  {formatNumber(summary.transactionCount)} transactions
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Collected</span>

                    <span className="font-medium">
                      {formatCurrency(summary.totalRevenue - summary.totalDue)}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${
                          summary.totalRevenue
                            ? ((summary.totalRevenue - summary.totalDue) /
                                summary.totalRevenue) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Outstanding</span>

                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {formatCurrency(summary.totalDue)}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${
                          summary.totalRevenue
                            ? (summary.totalDue / summary.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Collected</p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(summary.totalRevenue - summary.totalDue)}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Outstanding</p>

                  <p className="mt-1 text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(summary.totalDue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profitability */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Profitability</CardTitle>

              <p className="text-xs text-muted-foreground">
                Financial performance after business expenses.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-xl border bg-muted/20 p-5">
                <p className="text-sm text-muted-foreground">Net Profit</p>

                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.totalProfit)}
                  </p>

                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="h-4 w-4" />
                    {profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">Revenue</p>

                  <p className="mt-1 font-semibold">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">Expenses</p>

                  <p className="mt-1 font-semibold">
                    {formatCurrency(summary.totalExpense)}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profit Margin</span>

                  <span className="font-semibold">
                    {profitMargin.toFixed(2)}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(profitMargin, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            SELLER PERFORMANCE
        ====================================================== */}

        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Seller Performance</CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Compare sales performance across all sellers.
                </p>
              </div>

              <Badge variant="secondary">
                {reportData.sellerPerformance.length} sellers
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/30">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Seller
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Transactions
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Revenue
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Profit
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Commission
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reportData.sellerPerformance.map((seller, index) => (
                    <tr key={seller.name} className="border-b last:border-0">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserRound className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="font-medium">{seller.name}</p>

                            {index === 0 && (
                              <Badge
                                variant="secondary"
                                className="mt-1 text-[10px]"
                              >
                                Top Performer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-medium">
                        {formatNumber(seller.transactions)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold">
                        {formatCurrency(seller.revenue)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(seller.profit)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(seller.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
            CATEGORY + PAYMENT
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Category */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Category Performance</CardTitle>

              <p className="text-xs text-muted-foreground">
                Revenue and profitability by business category.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              {reportData.categoryPerformance.map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{category.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {category.transactions} transactions ·{" "}
                        {category.quantity} quantity
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(category.revenue)}
                    </p>
                  </div>

                  <PerformanceBar
                    value={category.revenue}
                    max={maxCategoryRevenue}
                  />

                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Expense: {formatCurrency(category.expense)}</span>

                    <span className="text-emerald-600 dark:text-emerald-400">
                      Profit: {formatCurrency(category.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Payment Method Breakdown
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                Revenue distribution by payment method.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              {reportData.paymentMethods.map((method) => (
                <div key={method.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>

                      <div>
                        <p className="font-medium">{method.name}</p>

                        <p className="text-xs text-muted-foreground">
                          {method.percentage}% of revenue
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(method.amount)}
                    </p>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${method.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total collected through payment methods
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(
                      reportData.paymentMethods.reduce(
                        (sum, item) => sum + item.amount,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            DUES
        ====================================================== */}

        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Outstanding Dues</CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Customer balances that are still pending collection.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {formatCurrency(summary.totalDue)} outstanding
                </Badge>

                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/30">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Invoice
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Seller
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Total
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Paid
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Due
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reportData.outstandingDues.map((item) => (
                    <tr key={item.invoice} className="border-b last:border-0">
                      <td className="px-5 py-4 font-semibold">
                        {item.invoice}
                      </td>

                      <td className="px-5 py-4">{item.customer}</td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {item.seller}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(item.total)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(item.paid)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(item.due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
            TOP PRODUCTS + INSIGHTS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Products */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Top Products & Services
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                Highest-performing products based on revenue.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {reportData.topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center gap-4 rounded-xl border p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatNumber(product.quantity)} sold
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(product.revenue)}
                    </p>

                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Profit {formatCurrency(product.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Insights */}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Business Insights</CardTitle>

              <p className="text-xs text-muted-foreground">
                Quick indicators from the current reporting period.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-emerald-500/5 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div>
                    <p className="font-medium">Strong profitability</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      The business generated a{" "}
                      <span className="font-medium text-foreground">
                        {profitMargin.toFixed(1)}%
                      </span>{" "}
                      net profit margin during this period.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-primary/5 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>

                  <div>
                    <p className="font-medium">Leading category</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {reportData.insights.leadingCategory?.name || "—"}
                      </span>{" "}
                      generated the highest category revenue at{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(
                          reportData.insights.leadingCategory?.revenue || 0,
                        )}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-violet-500/5 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <UserRound className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>

                  <div>
                    <p className="font-medium">Top seller</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {reportData.insights.topSeller?.name || "—"}
                      </span>{" "}
                      generated{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(
                          reportData.insights.topSeller?.revenue || 0,
                        )}
                      </span>{" "}
                      in revenue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-amber-500/5 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Landmark className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>

                  <div>
                    <p className="font-medium">Outstanding receivables</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      There is currently{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(summary.totalDue)}
                      </span>{" "}
                      in pending customer payments.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            RECENT TRANSACTIONS
        ====================================================== */}

        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Recent Transactions</CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Latest business activity from the selected reporting period.
                </p>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/transactions">View All Transactions</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/30">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Invoice
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Product / Service
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Seller
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reportData.recentTransactions.map((transaction) => (
                    <tr
                      key={transaction.invoice}
                      className="border-b last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />

                          <span className="font-semibold">
                            {transaction.invoice}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">{transaction.product}</td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {transaction.seller}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold">
                        {formatCurrency(transaction.amount)}
                      </td>

                      <td className="px-5 py-4 text-right text-muted-foreground">
                        {formatReportTime(transaction.time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
