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
  Badge,
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

  const todaysTarget = Number(dashboardData?.todaysTarget) || 2000;

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-screen space-y-8 p-6 md:p-10 animate-pulse max-w-7xl mx-auto">
        {/* Banner Skeleton */}
        <div className="h-56 rounded-2xl bg-muted/60" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-muted/40 border border-border/50"
            />
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40" />
          ))}
        </div>

        {/* Analytics Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 rounded-xl bg-muted/40" />
          <div className="h-96 rounded-xl bg-muted/40" />
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
            <h2 className="text-xl font-bold tracking-tight">
              Failed to load dashboard
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
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
    <div className="min-h-screen space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {/* =====================================================
    HEADER BANNER
====================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8 shadow-sm">
        {/* Ambient decorative background glows */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Row: User Info & Status Indicators */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/15 text-primary rounded-xl flex items-center justify-center ring-1 ring-primary/20">
                  <Zap className="h-5 w-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Welcome back, {session?.user?.name || "Employee"}!
                </h1>
              </div>

              <p className="text-muted-foreground text-sm md:text-base">
                Here&apos;s your sales overview for{" "}
                <span className="font-semibold text-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <Badge
                variant="outline"
                className="gap-1.5 py-1 px-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Systems Operational
              </Badge>

              <Badge
                variant="outline"
                className="gap-1.5 py-1 px-3 bg-primary/10 text-primary border-primary/20"
              >
                <Target className="h-3.5 w-3.5" />
                {completionPercentage >= 100 ? "Target Achieved" : "On Track"}
              </Badge>
            </div>
          </div>

          {/* Divider Line */}
          <div className="h-px w-full bg-border/50" />

          {/* Bottom Row: Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground font-medium hidden sm:block">
              Quick Shortcuts
            </p>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
              <Button
                asChild
                className="flex-1 sm:flex-initial gap-2 shadow-sm transition-transform active:scale-95"
              >
                <Link href="sales/add">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add Sale</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="flex-1 sm:flex-initial gap-2 border-border/80 hover:bg-accent"
              >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Add Expense</span>
              </Button>

              <Button
                variant="outline"
                className="flex-1 sm:flex-initial gap-2 border-border/80 hover:bg-accent"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Add Employee</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Today's Sales",
            val: todaysSalesAmount,
            icon: DollarSign,
            color: "text-blue-600 bg-blue-500/10",
          },
          {
            label: "Today's Profit",
            val: todaysProfit,
            icon: TrendingUp,
            color: "text-emerald-600 bg-emerald-500/10",
          },
          {
            label: "My Commission",
            val: myCommission,
            icon: Award,
            color: "text-purple-600 bg-purple-500/10",
          },
          {
            label: "Monthly Sales",
            val: monthlySales,
            icon: Target,
            color: "text-amber-600 bg-amber-500/10",
          },
        ].map((item, idx) => (
          <Card
            key={idx}
            className="p-5 hover:shadow-md transition-all duration-200 border-border/60"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatCurrency(item.val)}
                </p>
              </div>
              <div className={cn("p-3 rounded-xl", item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* QUICK ACTION TILES */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: "sales/add", title: "Add New Sale", icon: Plus },
          { href: "sales", title: "My Sales History", icon: TrendingUp },
          { href: "reports", title: "Today's Report", icon: Clock },
        ].map((action, idx) => (
          <Link key={idx} href={action.href} className="group">
            <Card className="p-4 flex items-center justify-center gap-3 border-border/60 group-hover:border-primary/50 group-hover:bg-accent/50 transition-all duration-200 cursor-pointer">
              <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-semibold text-sm">{action.title}</span>
            </Card>
          </Link>
        ))}
      </section>

      {/* MAIN CONTENT GRID */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Table */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-border/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Today&apos;s Sales Preview
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todaysSales.length}{" "}
                  {todaysSales.length === 1 ? "transaction" : "transactions"}{" "}
                  recorded
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="sales">View All</Link>
              </Button>
            </div>

            {todaysSales.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">No sales logged today</p>
                  <p className="text-xs text-muted-foreground">
                    Transactions will automatically stream here.
                  </p>
                </div>
                <Button size="sm" asChild className="gap-1.5">
                  <Link href="sales/add">
                    <Plus className="h-3.5 w-3.5" /> Add Sale
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-xs font-medium text-muted-foreground uppercase border-b border-border/60">
                    <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {todaysSales.map((sale, index) => {
                      const category =
                        sale.categoryName || sale.category || "General";
                      return (
                        <tr
                          key={sale._id || index}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                            {formatTime(sale.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">
                              {sale.productName || "Unknown product"}
                            </div>
                            {sale.invoiceNumber && (
                              <div className="text-[11px] text-muted-foreground">
                                {sale.invoiceNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                getCategoryColor(category),
                              )}
                            >
                              {category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatCurrency(sale.totalPrice ?? sale.total ?? 0)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(sale.netProfit ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Target Progress */}
        <Card className="p-6 border-border/60 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-base font-semibold">Performance Target</h2>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target Goal</span>
                <span className="font-bold">
                  {formatCurrency(todaysTarget)}
                </span>
              </div>
              <Progress
                value={Math.min(completionPercentage, 100)}
                className="h-2.5"
              />
              <p className="text-xs text-right text-muted-foreground font-medium">
                {completionPercentage.toFixed(1)}% Achieved
              </p>
            </div>

            <div className="pt-4 border-t border-border/60 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Current Progress
                </span>
                <span className="text-base font-semibold">
                  {formatCurrency(todaysSalesAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Remaining</span>
                <span className="text-base font-semibold">
                  {formatCurrency(Math.max(0, remainingTarget))}
                </span>
              </div>

              {remainingTarget <= 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-medium text-center">
                  🎉 Daily target completed!
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* RECENT ACTIVITY */}
      <Card className="border-border/60 shadow-sm">
        <div className="p-6 border-b border-border/60">
          <h2 className="text-base font-semibold">Recent Activity Log</h2>
        </div>
        <div className="divide-y divide-border/40">
          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No recent logs recorded.
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 px-6 flex items-center gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.product}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
