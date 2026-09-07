"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  ShoppingCart,
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  CheckCircle,
  Activity,
  RefreshCw,
  Clock,
  TargetIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge as UiBadge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export function EmployeeDashboardEnhanced({ session }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/products/sales/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();
      console.log("Dashboard fetch result:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard data");
      }

      setDashboardData(result.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setError(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ---------------------------------------------------------
  // Default values
  // ---------------------------------------------------------
  const todaysSalesAmount = Number(dashboardData?.todaysSalesAmount) || 0;
  const todaysProfit = Number(dashboardData?.todaysProfit) || 0;
  const myCommission = Number(dashboardData?.myCommission) || 0;
  const monthlySales = Number(dashboardData?.monthlySales) || 0;
  const todaysTarget = Number(dashboardData?.todaysTarget) || 2000;
  const todaysSales = dashboardData?.todaysSales || [];
  const chartData = dashboardData?.chartData || [];
  const categoryPerformance = dashboardData?.categoryPerformance || [];
  const salesCount = Number(dashboardData?.salesCount) || 0;

  // ---------------------------------------------------------
  // Performance calculation
  // ---------------------------------------------------------
  const completionPercentage = useMemo(() => {
    if (todaysTarget <= 0) return 0;
    return Math.min((todaysSalesAmount / todaysTarget) * 100, 100);
  }, [todaysSalesAmount, todaysTarget]);

  const remainingTarget = Math.max(todaysTarget - todaysSalesAmount, 0);
  const isTargetAchieved = completionPercentage >= 100;

  // ---------------------------------------------------------
  // Currency formatter
  // ---------------------------------------------------------
  const formatCurrency = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
  };

  // ---------------------------------------------------------
  // Date formatter
  // ---------------------------------------------------------
  const formatTime = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------------------------------------------------------
  // Chart configuration
  // ---------------------------------------------------------
  const salesChartConfig = {
    sales: {
      label: "Revenue",
      theme: {
        light: "#3b82f6", // tailwind blue-500
        dark: "#3b82f6",  // tailwind blue-500 (good contrast)
      }
    },
    profit: {
      label: "Profit",
      theme: {
        light: "#10b981", // tailwind emerald-500
        dark: "#10b981",  // tailwind emerald-500 (good contrast)
      }
    },
  };

  // ---------------------------------------------------------
  // Performance indicators
  // ---------------------------------------------------------
  const performanceIndicators = [
    {
      title: "Sales Efficiency",
      value: `${((todaysProfit / todaysSalesAmount) * 100 || 0).toFixed(1)}%`,
      description: "Profit margin",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Avg. Transaction",
      value: formatCurrency(salesCount > 0 ? todaysSalesAmount / salesCount : 0),
      description: "Per sale",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Activity Score",
      value: `${Math.min(salesCount * 20, 100)}`,
      description: "Based on transactions",
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Time to Target",
      value: isTargetAchieved ? "Complete" : `${remainingTarget > 0 ? Math.ceil(remainingTarget / (todaysSalesAmount || 1)) : 0}h`,
      description: isTargetAchieved ? "Target achieved!" : "Estimated completion",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ];

  // ---------------------------------------------------------
  // Category colors
  // ---------------------------------------------------------
  const getCategoryColor = (category) => {
    const colors = {
      Electronics: "bg-blue-100 text-blue-700",
      Gadgets: "bg-purple-100 text-purple-700",
      Accessories: "bg-green-100 text-green-700",
      Office: "bg-orange-100 text-orange-700",
      Photocopy: "bg-cyan-100 text-cyan-700",
      Printing: "bg-pink-100 text-pink-700",
      "Khajna Payment": "bg-red-100 text-red-700",
      Namjari: "bg-yellow-100 text-yellow-700",
      DCR: "bg-indigo-100 text-indigo-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  // ---------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen space-y-8">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="h-32 rounded-2xl bg-muted/30" />

          {/* Metrics grid skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/30" />
            ))}
          </div>

          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 rounded-xl bg-muted/30" />
            <div className="h-64 rounded-xl bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error State
  // ---------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4 shadow-xl border-destructive/20 bg-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Activity className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <CardTitle>Failed to load dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </div>
          <Button onClick={fetchDashboard} className="w-full gap-2 mt-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Dashboard Content
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen space-y-8">
      {/* =====================================================
          HEADER BANNER
      ======================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-6 md:p-8 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center ring-2 ring-primary/30 shadow-lg">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Welcome back, {session?.user?.name || "Employee"}!
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Today&apos;s performance at a glance · {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <UiBadge variant="secondary" className="gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time updates
                </UiBadge>
                <UiBadge variant="secondary" className="gap-1.5">
                  <TargetIcon className="h-3.5 w-3.5" />
                  {isTargetAchieved ? "Target Achieved 🎉" : `${completionPercentage.toFixed(0)}% Complete`}
                </UiBadge>
                <UiBadge variant="secondary">
                  {salesCount} {salesCount === 1 ? "Transaction" : "Transactions"} Today
                </UiBadge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="gap-2 shadow-md hover:shadow-lg transition-all">
                <Link href="sales/add">
                  <ShoppingCart className="h-4 w-4" />
                  Record Sale
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="reports">
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          KEY METRICS GRID
      ======================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Today's Revenue",
            value: todaysSalesAmount,
            icon: DollarSign,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
            trend: "+12.4%",
            trendColor: "text-emerald-600",
          },
          {
            label: "Today's Profit",
            value: todaysProfit,
            icon: TrendingUp,
            color: "text-emerald-600 dark:text-emerald-400",
            bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
            trend: "+8.2%",
            trendColor: "text-emerald-600",
          },
          {
            label: "My Commission",
            value: myCommission,
            icon: Award,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
            trend: "+5.7%",
            trendColor: "text-emerald-600",
          },
          {
            label: "Monthly Sales",
            value: monthlySales,
            icon: Target,
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
            trend: "+15.3%",
            trendColor: "text-emerald-600",
          },
        ].map((item, idx) => (
          <Card key={idx} className="group hover:shadow-lg transition-all duration-300 border-border/60 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  {item.label}
                </CardDescription>
                <div className={cn("p-2 rounded-lg", item.bgColor)}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                {formatCurrency(item.value)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs">
                <span className={cn("font-medium", item.trendColor)}>
                  {item.trend}
                </span>
                <span className="text-muted-foreground">from yesterday</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* =====================================================
          CHARTS SECTION
      ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue & Profit Trend</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <UiBadge variant="outline">Weekly</UiBadge>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer
                config={salesChartConfig}
                className="h-72 w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-sales, #3b82f6)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-sales, #3b82f6)"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-profit, #10b981)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-profit, #10b981)"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `৳${value}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="sales"
                    type="natural"
                    fill="url(#fillSales)"
                    fillOpacity={0.4}
                    stroke="var(--color-sales, #3b82f6)"
                    strokeWidth={2}
                    stackId="a"
                  />
                  <Area
                    dataKey="profit"
                    type="natural"
                    fill="url(#fillProfit)"
                    fillOpacity={0.4}
                    stroke="var(--color-profit, #10b981)"
                    strokeWidth={2}
                    stackId="b"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center space-y-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">No chart data available</p>
                  <p className="text-xs text-muted-foreground">
                    Sales data will appear here as you make transactions
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Indicators */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Key metrics overview</CardDescription>
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily Target Progress</span>
                  <span className="font-semibold">{completionPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current: {formatCurrency(todaysSalesAmount)}</span>
                  <span className="text-muted-foreground">Target: {formatCurrency(todaysTarget)}</span>
                </div>
              </div>

              {isTargetAchieved && (
                <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Daily target achieved!</p>
                    <p className="text-xs text-emerald-600/80">Great work! Keep it up!</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {performanceIndicators.map((indicator, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", indicator.bgColor)}>
                      <indicator.icon className={cn("h-4 w-4", indicator.color)} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {indicator.title}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{indicator.value}</p>
                    <p className="text-xs text-muted-foreground">{indicator.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =====================================================
          MAIN CONTENT GRID
      ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Sales Table */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today&apos;s Sales Activity</CardTitle>
                <CardDescription>
                  {todaysSales.length} {todaysSales.length === 1 ? "transaction" : "transactions"} recorded
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="sales">
                  View All
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todaysSales.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">No sales logged today</p>
                  <p className="text-sm text-muted-foreground">
                    Start by recording your first sale
                  </p>
                </div>
                <Button asChild size="sm" className="gap-2">
                  <Link href="sales/add">
                    <ShoppingCart className="h-4 w-4" />
                    Record Sale
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {todaysSales.map((sale, index) => (
                      <tr key={sale._id || index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                          {formatTime(sale.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {sale.productName || "Unknown product"}
                          </div>
                          {sale.invoiceNumber && (
                            <div className="text-xs text-muted-foreground">
                              {sale.invoiceNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getCategoryColor(sale.categoryName))}>
                            {sale.categoryName || "General"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(sale.totalPrice ?? sale.total ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(sale.netProfit ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          {todaysSales.length > 0 && (
            <CardFooter className="border-t border-border/60 bg-muted/20">
              <div className="w-full flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total: {formatCurrency(todaysSalesAmount)}
                </span>
                <span className="text-muted-foreground">
                  Net Profit: {formatCurrency(todaysProfit)}
                </span>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Category Performance */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>This month&apos;s performance</CardDescription>
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {categoryPerformance.length === 0 ? (
              <div className="py-8 text-center space-y-4">
                <PieChart className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">No category data</p>
                  <p className="text-xs text-muted-foreground">
                    Category data appears with sales
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryPerformance.map((cat, index) => {
                  const totalSales = categoryPerformance.reduce((sum, c) => sum + c.sales, 0);
                  const percentage = totalSales > 0 ? (cat.sales / totalSales) * 100 : 0;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium">{cat.category}</span>
                        </div>
                        <span className="text-sm font-bold">{formatCurrency(cat.sales)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{cat.count} sales</span>
                          <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/20">
            <Button variant="ghost" size="sm" className="w-full gap-2" asChild>
              <Link href="reports">
                View Detailed Report
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* =====================================================
          QUICK ACTIONS
      ======================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Add New Sale",
            description: "Record a new transaction",
            icon: ShoppingCart,
            href: "sales/add",
            color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          },
          {
            title: "View Reports",
            description: "Detailed analytics",
            icon: BarChart3,
            href: "reports",
            color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            title: "Sales History",
            description: "All your transactions",
            icon: Calendar,
            href: "sales",
            color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          },
          {
            title: "Performance",
            description: "Track your progress",
            icon: TrendingUp,
            href: "reports",
            color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
        ].map((action, idx) => (
          <Link key={idx} href={action.href} className="group">
            <Card className="h-full border-border/60 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group-hover:translate-y-[-2px]">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={cn("p-3 rounded-xl", action.color)}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}