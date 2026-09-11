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
  ShoppingCart,
  CreditCard,
  Calendar,
  Package,
  ShieldCheck,
  PieChart,
  Activity,
  Database,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminDashboardV2({ session }) {
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
      <div className="min-h-screen text-zinc-800 dark:text-zinc-100 py-8">
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Professional Ambient Soft Underlays */}
          <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-200/40 dark:bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-300/30 dark:bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500 dark:text-zinc-400" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
      <div className="min-h-screen text-zinc-800 dark:text-zinc-100 py-8">
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Professional Ambient Soft Underlays */}
          <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-200/40 dark:bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-300/30 dark:bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex items-center justify-center py-32">
            <Card className="w-full max-w-md bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 rounded-xl shadow-lg">
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>

                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Unable to Load Dashboard
                </h2>

                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{error}</p>

                <Button
                  onClick={fetchDashboard}
                  className="mt-5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium h-9 px-4 text-sm rounded-lg"
                >
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
  // SUMMARY CARDS - Enhanced Glassmorphism Style
  // =========================================================

  const summaryCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(today.revenue),
      subtitle: `${today.transactions} transactions`,
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500",
    },
    {
      title: "Today's Net Profit",
      value: formatCurrency(today.profit),
      subtitle: "After operating expenses",
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500",
    },
    {
      title: "Today's Expenses",
      value: formatCurrency(today.expense),
      subtitle: "Total operating cost",
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500",
    },
    {
      title: "Commission Accrued",
      value: formatCurrency(today.commission),
      subtitle: "Today's commission",
      icon: Receipt,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500",
    },
    {
      title: "Active Employees",
      value: activeEmployees.toLocaleString(),
      subtitle: "Employees with sales",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(month.revenue),
      subtitle: `${month.transactions} transactions this month`,
      icon: BarChart3,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500",
    },
  ];

  // =========================================================
  // SIMPLIFIED EXPENSE ANALYSIS (Smaller Section)
  // =========================================================

  const simplifiedExpenseAnalysis = expenseAnalysis.slice(0, 3); // Show only top 3

  return (
    <div className="min-h-screen text-zinc-800 dark:text-zinc-100 py-8">
      {/* Professional Ambient Soft Underlays */}
      <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-200/40 dark:bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-300/30 dark:bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* =====================================================
            ENTERPRISE HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                ADMIN PORTAL
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              Business Command Center
            </h1>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Monitor revenue, profitability, expenses, and team performance
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/sales/add">
              <Button className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium gap-2 transition-all active:scale-95 cursor-pointer h-9 px-4 text-xs tracking-wide rounded-lg shadow-xs">
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                Record Sale
              </Button>
            </Link>

            <Link href="/admin/reports">
              <Button
                variant="outline"
                className="border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white gap-2 font-medium h-9 px-4 text-xs rounded-lg"
              >
                <FileText className="h-3.5 w-3.5" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* =====================================================
            PERFORMANCE SUMMARY CARDS (Glassmorphism)
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className={cn(
                  "relative overflow-hidden group p-6 rounded-xl transition-all duration-300",
                  "hover:-translate-y-1 hover:shadow-xl",
                  "bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs"
                )}
              >
                {/* Subtle background glow */}
                <div
                  className={cn(
                    "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                    card.bg
                  )}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {card.title}
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                      {card.value}
                    </h2>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {card.subtitle}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300",
                      "group-hover:rotate-[10deg] group-hover:scale-110",
                      "bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700",
                      card.color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* =====================================================
            FINANCIAL CHARTS SECTION
        ====================================================== */}

        <section>
          <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Revenue & Profit Performance
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Monthly revenue and profitability trend
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Profit</span>
                </div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    No chart data available
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex min-w-[700px] items-end gap-4 h-64">
                  {chartData.map((item, index) => {
                    const revenue = Number(item.revenue) || 0;
                    const profit = Number(item.profit) || 0;

                    const revenueHeight = Math.max(
                      (revenue / maxChartValue) * 200,
                      revenue > 0 ? 4 : 0
                    );
                    const profitHeight = Math.max(
                      (profit / maxChartValue) * 200,
                      profit > 0 ? 4 : 0
                    );

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="flex items-end gap-1.5 h-[200px] w-full">
                          <div
                            className="w-1/2 rounded-t bg-blue-500/80 transition-all duration-300 hover:opacity-90"
                            style={{ height: `${revenueHeight}px` }}
                            title={`Revenue: ${formatCurrency(revenue)}`}
                          />
                          <div
                            className="w-1/2 rounded-t bg-emerald-500/80 transition-all duration-300 hover:opacity-90"
                            style={{ height: `${profitHeight}px` }}
                            title={`Profit: ${formatCurrency(profit)}`}
                          />
                        </div>
                        <span className="mt-3 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                          {formatChartDate(item.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* =====================================================
            OPERATIONAL DASHBOARD (Two Column Layout)
        ====================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECENT TRANSACTIONS */}
          <section>
            <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800/50 p-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Recent Transactions
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Latest sales activity
                  </p>
                </div>
                <Link href="/admin/sales">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    View All
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                {paginatedTransactions.length === 0 ? (
                  <div className="py-10 text-center">
                    <ShoppingCart className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                      No transactions found
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className="border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          Invoice
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/30">
                      {paginatedTransactions.map((sale, index) => (
                        <tr
                          key={index}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-zinc-900 dark:text-zinc-200">
                              {sale.invoiceNumber || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                              <span className="text-xs text-zinc-700 dark:text-zinc-300">
                                {sale.sellerName || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                            {formatCurrency(sale.totalPrice || sale.revenue || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-zinc-500 dark:text-zinc-400">
                            {formatTime(sale.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {recentTransactions.length > 0 && (
                  <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/50 px-4 py-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, recentTransactions.length)}-
                      {Math.min(currentPage * itemsPerPage, recentTransactions.length)} of{" "}
                      {recentTransactions.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 mx-2">
                        {currentPage}/{totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* SIMPLIFIED EXPENSE ANALYSIS (Smaller Section) */}
          <section>
            <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 p-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Expense Analysis
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Top expense categories
                  </p>
                </div>
                <PieChart className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              </div>

              <div className="p-6">
                {simplifiedExpenseAnalysis.length === 0 ? (
                  <div className="py-10 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                      No expense data available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {simplifiedExpenseAnalysis.map((item, index) => {
                      const expense = Number(item.expense) || 0;
                      const totalExpense = expenseAnalysis.reduce(
                        (sum, current) => sum + (Number(current.expense) || 0),
                        0
                      );
                      const percentage = totalExpense > 0 ? (expense / totalExpense) * 100 : 0;

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {item.category}
                            </span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                              {formatCurrency(expense)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {percentage.toFixed(1)}% of total expenses
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </section>
        </div>

        {/* =====================================================
            EMPLOYEE PERFORMANCE
        ====================================================== */}

        <section>
          <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800/50 p-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Top Employee Performance
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Best performers by revenue
                </p>
              </div>
              <Link href="/admin/employees">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-1"
                >
                  View All <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              {employeePerformance.length === 0 ? (
                <div className="py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    No employee data available
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Revenue
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Commission
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/30">
                    {employeePerformance.slice(0, 5).map((employee, index) => (
                      <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                        <td className="px-4 py-3">
                          <div
                            className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                              employee.rank === 1
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            )}
                          >
                            {employee.rank}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <Users className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {employee.employeeName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                          {formatCurrency(employee.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          {formatCurrency(employee.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </section>

        {/* =====================================================
            OPERATIONAL STATUS FOOTER
        ====================================================== */}

        <section>
          <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Today's Activity
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {today.transactions} transactions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Monthly Revenue
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {formatCurrency(month.revenue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Monthly Expenses
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {formatCurrency(month.expense)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}