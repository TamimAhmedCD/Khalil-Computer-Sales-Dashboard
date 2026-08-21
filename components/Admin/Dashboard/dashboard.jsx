"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminDashboard({ session }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  // =========================================================
  // FETCH DASHBOARD
  // =========================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard");
      }

      setDashboard(result.data);
    } catch (error) {
      console.error("Admin dashboard error:", error);

      setError(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // =========================================================
  // DEFAULT DATA
  // =========================================================

  const today = dashboard?.today || {
    revenue: 0,
    profit: 0,
    expense: 0,
    commission: 0,
    transactions: 0,
  };

  const month = dashboard?.month || {
    revenue: 0,
    profit: 0,
    expense: 0,
    commission: 0,
    transactions: 0,
  };

  const activeEmployees = dashboard?.activeEmployees || 0;

  const recentTransactions = dashboard?.recentTransactions || [];

  const employeePerformance = dashboard?.employeePerformance || [];

  const chartData = dashboard?.chartData || [];

  const expenseAnalysis = dashboard?.expenseAnalysis || [];

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(recentTransactions.length / itemsPerPage),
  );

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return recentTransactions.slice(start, start + itemsPerPage);
  }, [recentTransactions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [recentTransactions.length]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (value) => {
    return `৳${Number(value || 0).toLocaleString("en-BD")}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatChartDate = (date) => {
    if (!date) return "";

    const parsed = new Date(`${date}T00:00:00`);

    return parsed.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    });
  };

  // =========================================================
  // MAX CHART VALUE
  // =========================================================

  const maxChartValue = useMemo(() => {
    if (!chartData.length) return 1;

    return Math.max(
      ...chartData.flatMap((item) => [
        Number(item.revenue) || 0,
        Number(item.profit) || 0,
      ]),
      1,
    );
  }, [chartData]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8">
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />

              <p className="text-sm text-muted-foreground">
                Loading business overview...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8">
          <div className="flex items-center justify-center py-32">
            <Card className="w-full max-w-md border-destructive/20">
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>

                <h2 className="text-lg font-semibold">
                  Unable to Load Dashboard
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">{error}</p>

                <Button onClick={fetchDashboard} className="mt-5">
                  Try Again
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // SUMMARY CARDS
  // =========================================================

  const summaryCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(today.revenue),
      subtitle: `${today.transactions} transactions`,
      icon: DollarSign,
    },

    {
      title: "Today's Net Profit",
      value: formatCurrency(today.profit),
      subtitle: "After operating expenses",
      icon: TrendingUp,
    },

    {
      title: "Today's Expenses",
      value: formatCurrency(today.expense),
      subtitle: "Total operating cost",
      icon: TrendingDown,
    },

    {
      title: "Commission Accrued",
      value: formatCurrency(today.commission),
      subtitle: "Today's commission",
      icon: Receipt,
    },

    {
      title: "Active Employees",
      value: activeEmployees.toLocaleString(),
      subtitle: "Employees with sales",
      icon: Users,
    },

    {
      title: "Monthly Revenue",
      value: formatCurrency(month.revenue),
      subtitle: `${month.transactions} transactions this month`,
      icon: BarChart3,
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />

              <span className="text-sm font-semibold tracking-wide text-primary">
                ADMINISTRATION
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Business Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor revenue, profitability, expenses, transactions, and
              employee performance from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/sales">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Record Sale
              </Button>
            </Link>

            <Link href="/admin/reports">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* =====================================================
            BUSINESS PERFORMANCE
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Business Performance</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current financial and operational indicators.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.title} className="border-border bg-card">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {card.title}
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight">
                          {card.value}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      {card.subtitle}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            REVENUE & PROFIT
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Revenue & Profit Performance
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Monthly revenue and profitability trend.
            </p>
          </div>

          <Card className="border-border bg-card">
            <div className="p-6">
              {chartData.length === 0 ? (
                <div className="flex h-[320px] items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50" />

                    <p className="mt-3 text-sm text-muted-foreground">
                      No chart data available for this month.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Legend */}

                  <div className="mb-6 flex flex-wrap gap-5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />

                      <span className="text-sm text-muted-foreground">
                        Revenue
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                      <span className="text-sm text-muted-foreground">
                        Net Profit
                      </span>
                    </div>
                  </div>

                  {/* Chart */}

                  <div className="overflow-x-auto">
                    <div
                      className="flex min-w-[700px] items-end gap-3"
                      style={{
                        height: "320px",
                      }}
                    >
                      {chartData.map((item) => {
                        const revenue = Number(item.revenue) || 0;

                        const profit = Number(item.profit) || 0;

                        const revenueHeight = Math.max(
                          (revenue / maxChartValue) * 240,
                          revenue > 0 ? 4 : 0,
                        );

                        const profitHeight = Math.max(
                          (profit / maxChartValue) * 240,
                          profit > 0 ? 4 : 0,
                        );

                        return (
                          <div
                            key={item.date}
                            className="flex min-w-[55px] flex-1 flex-col items-center justify-end"
                          >
                            <div className="flex h-[250px] items-end gap-1">
                              <div
                                title={`Revenue: ${formatCurrency(revenue)}`}
                                className="w-5 rounded-t-sm bg-primary transition-all"
                                style={{
                                  height: `${revenueHeight}px`,
                                }}
                              />

                              <div
                                title={`Profit: ${formatCurrency(profit)}`}
                                className="w-5 rounded-t-sm bg-emerald-500 transition-all"
                                style={{
                                  height: `${profitHeight}px`,
                                }}
                              />
                            </div>

                            <span className="mt-3 whitespace-nowrap text-[11px] text-muted-foreground">
                              {formatChartDate(item.date)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </section>

        {/* =====================================================
            RECENT TRANSACTIONS
        ====================================================== */}

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Transactions</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Latest sales activity across the organization.
              </p>
            </div>

            <Link href="/admin/sales">
              <Button variant="outline" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" />
                View All Transactions
              </Button>
            </Link>
          </div>

          <Card className="overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      Invoice
                    </th>

                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      Employee
                    </th>

                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      Product
                    </th>

                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      Category
                    </th>

                    <th className="px-5 py-4 text-right font-medium text-muted-foreground">
                      Revenue
                    </th>

                    <th className="px-5 py-4 text-right font-medium text-muted-foreground">
                      Profit
                    </th>

                    <th className="px-5 py-4 text-right font-medium text-muted-foreground">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-muted-foreground"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((sale) => (
                      <tr
                        key={sale._id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-4 font-medium">
                          {sale.invoiceNumber || "-"}
                        </td>

                        <td className="px-5 py-4">
                          {sale.sellerName || "Unknown"}
                        </td>

                        <td className="px-5 py-4">{sale.productName || "-"}</td>

                        <td className="px-5 py-4">
                          <span className="rounded-md bg-muted px-2 py-1 text-xs">
                            {sale.categoryName || "Uncategorized"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-medium">
                          {formatCurrency(sale.revenue)}
                        </td>

                        <td className="px-5 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(sale.profit)}
                        </td>

                        <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                          {formatTime(sale.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}

            {recentTransactions.length > 0 && (
              <div className="flex items-center justify-between border-t px-5 py-4">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    recentTransactions.length,
                  )}
                  {" - "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    recentTransactions.length,
                  )}
                  {" of "}
                  {recentTransactions.length}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="min-w-[60px] text-center text-sm">
                    {currentPage} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage >= totalPages}
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
        </section>

        {/* =====================================================
            OPERATIONAL ANALYSIS
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Operational Analysis</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Review expenditure and workforce performance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expense Analysis */}

            <Card className="border-border">
              <div className="border-b p-6">
                <h3 className="font-semibold">Expense Analysis</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Expense distribution by category this month.
                </p>
              </div>

              <div className="p-6">
                {expenseAnalysis.length === 0 ? (
                  <div className="py-10 text-center">
                    <TrendingDown className="mx-auto h-8 w-8 text-muted-foreground/50" />

                    <p className="mt-3 text-sm text-muted-foreground">
                      No expense data available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {expenseAnalysis.map((item, index) => {
                      const expense = Number(item.expense) || 0;

                      const totalExpense = expenseAnalysis.reduce(
                        (sum, current) => sum + (Number(current.expense) || 0),
                        0,
                      );

                      const percentage =
                        totalExpense > 0 ? (expense / totalExpense) * 100 : 0;

                      return (
                        <div key={`${item.category}-${index}`}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {item.category}
                            </span>

                            <span className="text-sm font-semibold">
                              {formatCurrency(expense)}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {percentage.toFixed(1)}% of total expenses
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Employee Performance */}

            <Card className="border-border">
              <div className="flex items-center justify-between border-b p-6">
                <div>
                  <h3 className="font-semibold">Employee Performance</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Top-performing employees by revenue.
                  </p>
                </div>

                <Link href="/admin/employees">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Manage
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Rank
                      </th>

                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                        Employee
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

                  <tbody className="divide-y">
                    {employeePerformance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-muted-foreground"
                        >
                          No employee performance data available.
                        </td>
                      </tr>
                    ) : (
                      employeePerformance.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className="hover:bg-muted/30"
                        >
                          <td className="px-5 py-4">
                            <span
                              className={[
                                "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                                employee.rank === 1
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted",
                              ].join(" ")}
                            >
                              {employee.rank}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-4 w-4 text-primary" />
                              </div>

                              <span className="font-medium">
                                {employee.employeeName}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right font-medium">
                            {formatCurrency(employee.revenue)}
                          </td>

                          <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(employee.profit)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            {formatCurrency(employee.commission)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* =====================================================
            WORKFORCE MANAGEMENT
        ====================================================== */}

        <section>
          <Card className="border-border bg-card">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h3 className="font-semibold">Workforce Management</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeEmployees} employees have recorded sales in the
                    system.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/admin/employees">
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Manage Employees
                  </Button>
                </Link>

                <Link href="/admin/employees/add">
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Employee
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* =====================================================
            OPERATIONAL STATUS
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Operational Status</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current system and business activity status.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-border">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div>
                  <p className="text-sm font-medium">Today&apos;s Activity</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {today.transactions} transactions recorded
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-medium">Monthly Revenue</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(month.revenue)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>

                <div>
                  <p className="text-sm font-medium">Monthly Expenses</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(month.expense)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
