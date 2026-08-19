"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  TrendingUp,
  DollarSign,
  Award,
  Target,
  Clock,
  Activity,
  ShoppingCart,
  CheckCircle,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function EmployeeDashboard({ session }) {
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

  const todaysTarget = Number(dashboardData?.todaysTarget) || 50000;

  const todaysSales = dashboardData?.todaysSales || [];

  // ---------------------------------------------------------
  // Performance calculation
  // ---------------------------------------------------------

  const completionPercentage = useMemo(() => {
    if (todaysTarget <= 0) return 0;

    return (todaysSalesAmount / todaysTarget) * 100;
  }, [todaysSalesAmount, todaysTarget]);

  const remainingTarget = Math.max(todaysTarget - todaysSalesAmount, 0);

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

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------------------------------------------------------
  // Relative time
  // ---------------------------------------------------------

  const getRelativeTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const diff = Date.now() - parsedDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return parsedDate.toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ---------------------------------------------------------
  // Category colors
  // ---------------------------------------------------------

  const getCategoryColor = (category) => {
    const colors = {
      Electronics: "bg-blue-100 text-blue-700",
      Gadgets: "bg-purple-100 text-purple-700",
      Accessories: "bg-green-100 text-green-700",
      Office: "bg-orange-100 text-orange-700",
      Photocopy: "bg-blue-100 text-blue-700",
      Printing: "bg-purple-100 text-purple-700",
      "Khajna Payment": "bg-green-100 text-green-700",
      Namjari: "bg-orange-100 text-orange-700",
      DCR: "bg-red-100 text-red-700",
    };

    return colors[category] || "bg-gray-100 text-gray-700";
  };

  // ---------------------------------------------------------
  // Activity icon
  // ---------------------------------------------------------

  const getActivityIcon = (type) => {
    const iconClasses = "h-4 w-4";

    switch (type) {
      case "sale":
        return <Plus className={iconClasses} />;

      case "completed":
        return <CheckCircle className={iconClasses} />;

      default:
        return <Activity className={iconClasses} />;
    }
  };

  // ---------------------------------------------------------
  // Recent activities
  // Generated from latest sales
  // ---------------------------------------------------------

  const recentActivities = useMemo(() => {
    return todaysSales.slice(0, 5).map((sale) => ({
      id: sale._id || sale.invoiceNumber,
      action: "Completed sale",
      product: sale.productName || "Unknown product",
      time: getRelativeTime(sale.createdAt),
      icon: "completed",
    }));
  }, [todaysSales]);

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="space-y-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="h-64 rounded-xl bg-muted" />

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="h-32 bg-card border border-border" />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>

          {/* Main */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-80 rounded-lg bg-muted" />
            <div className="h-80 rounded-lg bg-muted" />
          </div>

          {/* Activity */}
          <div className="h-72 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Activity className="h-6 w-6 text-red-600" />
          </div>

          <h2 className="text-lg font-semibold mb-2">
            Failed to load dashboard
          </h2>

          <p className="text-sm text-muted-foreground mb-6">{error}</p>

          <Button onClick={fetchDashboard} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          className={cn(
            "relative overflow-hidden rounded-xl p-8 md:p-10",
            "border border-border shadow-lg",
            "bg-linear-to-r from-primary/10 via-primary/5 to-transparent",
            "before:absolute before:-right-20 before:-top-20",
            "before:h-40 before:w-40 before:bg-primary/5",
            "before:rounded-full",
            "after:absolute after:-left-20 after:-bottom-20",
            "after:h-40 after:w-40 after:bg-primary/5",
            "after:rounded-full",
          )}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Welcome back, {session?.user?.name || "Employee"}!
                </h1>
              </div>

              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-4">
                You&apos;re all set to manage your sales operations. Here&apos;s
                your dashboard overview for{" "}
                <span className="font-semibold text-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />

                  <span className="text-sm text-foreground">
                    All systems operational
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />

                  <span className="text-sm text-foreground">
                    {completionPercentage >= 100
                      ? "Target achieved"
                      : "On track with targets"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}

            <div className="flex gap-2 flex-wrap md:flex-col lg:flex-row justify-start md:justify-end">
              <Link href="sales/add">
                <Button className="bg-primary cursor-pointer hover:bg-primary/90 text-primary-foreground gap-2 whitespace-nowrap">
                  <ShoppingCart className="h-4 w-4" />
                  Add Sale
                </Button>
              </Link>

              <Button
                variant="outline"
                className="border-border text-foreground gap-2 whitespace-nowrap hover:bg-accent"
              >
                <DollarSign className="h-4 w-4" />
                Add Expense
              </Button>

              <Button
                variant="outline"
                className="border-border text-foreground gap-2 whitespace-nowrap hover:bg-accent"
              >
                <Users className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Sales */}

          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Today&apos;s Sales Amount
                </p>

                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(todaysSalesAmount)}
                </p>
              </div>

              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Today's Profit */}

          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Today&apos;s Profit
                </p>

                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(todaysProfit)}
                </p>
              </div>

              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Commission */}

          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  My Commission
                </p>

                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(myCommission)}
                </p>
              </div>

              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Monthly Sales */}

          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Monthly Sales
                </p>

                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(monthlySales)}
                </p>
              </div>

              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="sales/add"
            className="flex flex-col items-center justify-center gap-3 bg-card border border-border hover:bg-muted rounded-lg cursor-pointer"
          >
            <Button className="h-auto flex flex-col items-center justify-center bg-transparent text-foreground cursor-pointer">
              <Plus className="h-6 w-6" />
              <span className="font-semibold">Add New Sale</span>
            </Button>
          </Link>

          <Link
            href="sales"
            className="flex flex-col items-center justify-center gap-3 bg-card border border-border hover:bg-muted rounded-lg cursor-pointer"
          >
            <Button className="h-auto flex flex-col items-center justify-center bg-transparent text-foreground cursor-pointer">
              <TrendingUp className="h-6 w-6" />
              <span className="font-semibold">My Sales</span>
            </Button>
          </Link>

          <Link
            href="reports"
            className="flex flex-col items-center justify-center gap-3 bg-card border border-border hover:bg-muted rounded-lg cursor-pointer"
          >
            <Button className="h-auto flex flex-col items-center justify-center bg-transparent gap-3 p-6 text-foreground cursor-pointer">
              <Clock className="h-6 w-6" />
              <span className="font-semibold">Today&apos;s Report</span>
            </Button>
          </Link>
        </div>

        {/* =====================================================
            SALES + PERFORMANCE
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Today's Sales */}

          <div className="lg:col-span-2">
            <Card className="bg-card border border-border rounded-lg shadow-sm">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Today&apos;s Sales Preview
                  </h2>

                  <p className="text-sm text-muted-foreground mt-1">
                    {todaysSales.length} sale
                    {todaysSales.length !== 1 ? "s" : ""} today
                  </p>
                </div>

                <Link href="sales">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                {todaysSales.length === 0 ? (
                  <div className="py-16 text-center">
                    <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />

                    <p className="font-medium text-foreground">
                      No sales today
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      Your sales will appear here.
                    </p>

                    <Link href="sales/add">
                      <Button className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />
                        Add Sale
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                          Time
                        </th>

                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                          Product Name
                        </th>

                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                          Category
                        </th>

                        <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                          Sale Amount
                        </th>

                        <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                          Profit
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {todaysSales.map((sale, index) => {
                        const category =
                          sale.categoryName || sale.category || "Unknown";

                        const saleAmount = Number(
                          sale.totalPrice ?? sale.total ?? 0,
                        );

                        const profit = Number(sale.netProfit ?? 0);

                        return (
                          <tr
                            key={sale._id || sale.invoiceNumber || index}
                            className="border-b border-border hover:bg-muted/20"
                          >
                            <td className="px-6 py-4 text-foreground whitespace-nowrap">
                              {formatTime(sale.createdAt)}
                            </td>

                            <td className="px-6 py-4 text-foreground">
                              <div className="font-medium">
                                {sale.productName || "Unknown product"}
                              </div>

                              {sale.invoiceNumber && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {sale.invoiceNumber}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  "inline-block px-3 py-1 rounded-full",
                                  "text-xs font-medium",
                                  getCategoryColor(category),
                                )}
                              >
                                {category}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right text-foreground font-medium whitespace-nowrap">
                              {formatCurrency(saleAmount)}
                            </td>

                            <td className="px-6 py-4 text-right text-foreground font-medium whitespace-nowrap">
                              {formatCurrency(profit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>

          {/* Performance */}

          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Today&apos;s Performance
            </h2>

            <div className="space-y-6">
              {/* Target */}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Target
                  </span>

                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(todaysTarget)}
                  </span>
                </div>

                <Progress
                  value={Math.min(completionPercentage, 100)}
                  className="h-2"
                />

                <p className="text-xs text-muted-foreground mt-2">
                  {completionPercentage.toFixed(1)}% completed
                </p>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                {/* Current Sales */}

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Current Sales
                  </p>

                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(todaysSalesAmount)}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {completionPercentage.toFixed(1)}% of target
                  </p>
                </div>

                {/* Remaining Target */}

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Remaining Target
                  </p>

                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(remainingTarget)}
                  </p>

                  {remainingTarget <= 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      🎉 Target achieved!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* =====================================================
            RECENT ACTIVITY
        ====================================================== */}

        <Card className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Latest sales activity
              </p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {recentActivities.length === 0 ? (
              <div className="p-10 text-center">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />

                <p className="text-sm font-medium">No recent activity</p>

                <p className="text-xs text-muted-foreground mt-1">
                  Your latest sales activity will appear here.
                </p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-6 flex items-center gap-4 hover:bg-muted/20"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getActivityIcon(activity.icon)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.product}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
