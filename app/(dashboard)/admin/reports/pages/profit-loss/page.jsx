"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Filter,
  Landmark,
  Printer,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { usePnLReport } from "@/lib/hooks/reports/use-pnl-report";
import {
  formatCurrency,
  formatNumber,
  DATE_LABELS,
} from "@/lib/utils/finance";

const SCOPE_OPTIONS = [
  { id: "all", name: "All Expenses" },
  { id: "Business", name: "Business Only" },
  { id: "Household", name: "Household Only" },
  { id: "Personal", name: "Personal Only" },
];

export default function ProfitLossPage() {
  const [dateFilter, setDateFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [scope, setScope] = useState("all");
  const { data, isLoading, isError, error, refetch } = usePnLReport({
    dateFilter,
    scope,
  });

  const summary = data?.data?.summary || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <Card className="w-fit">
            <CardContent className="flex items-center gap-2 p-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Profit &amp; Loss Report</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <CustomSelect
              value={dateFilter}
              onChange={(v) => setDateFilter(v)}
              options={[
                { id: "today", name: DATE_LABELS.today },
                { id: "yesterday", name: DATE_LABELS.yesterday },
                { id: "week", name: DATE_LABELS.week },
                { id: "month", name: DATE_LABELS.month },
                { id: "last-month", name: DATE_LABELS["last-month"] },
                { id: "year", name: "This Year" },
                { id: "custom", name: DATE_LABELS.custom },
              ]}
              searchable={false}
              placeholder="Select period"
            />

            {dateFilter === "custom" && (
              <div className="space-y-2">
                <Input
                  type="date"
                  placeholder="Start date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-[180px]"
                />
                <Input
                  type="date"
                  placeholder="End date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-[180px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomRange(customStart, customEnd)}
                >
                  Apply Range
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4" />
              Expense Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <CustomSelect
              value={scope}
              onChange={(v) => setScope(v)}
              options={SCOPE_OPTIONS}
              searchable={false}
              placeholder="All expenses"
            />
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="px-6 py-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : null}

      {/* Error State */}
      {isError ? (
        <div className="px-6 py-4 flex flex-col items-center justify-center text-center">
          <CircleDollarSign className="h-10 w-10 text-destructive" />
          <p className="mt-2 font-semibold">Failed to load report</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message || error?.toString() || "An unknown error occurred."}
          </p>
        </div>
      ) : null}

      {/* Main Content */}
      {!isLoading && !isError && data && (
        <>
          {/* KPI Cards */}
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Net Sales Revenue
                  </p>
                  <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(summary.netSalesRevenue)}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-orange-500/10" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Direct Cost (COGS)
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(summary.totalDirectCost)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500/10" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Gross Profit
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.grossProfit)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/10" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Net Profit / Loss
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      summary.netProfitOrLoss >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(summary.netProfitOrLoss)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(summary.profitMargin || 0).toFixed(1)}% margin
                  </p>
                </div>
                <Wallet className="h-8 w-8" />
              </CardContent>
            </Card>
          </div>

          {/* Dues Reference Note */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="flex items-start justify-between p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-50">
                  Outstanding Customer Dues (Reference)
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Note: This is not part of Net Sales Revenue or profit calculations.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-50">
                  {formatCurrency(summary.totalOutstandingDue)}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Collected: {formatCurrency(summary.collectedDue)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sales & Direct Costs Table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Recent Sales Transactions
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Direct Cost</TableHead>
                  <TableHead className="text-right">Gross Profit</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.recentSales?.slice(0, 10).map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.date}</TableCell>
                    <TableCell>{s.invoiceNumber}</TableCell>
                    <TableCell>{s.customer}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.directCost)}</TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.grossProfit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(s.netProfit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Expenses Table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Recent Expenses by Category
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Expense</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.recentExpenses?.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>{e.expenseNumber}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatCurrency(e.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Print Button */}
          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <Link href="/print/pnl">
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}