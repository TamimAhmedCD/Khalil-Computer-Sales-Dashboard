"use client";

import { useState, useMemo } from "react";
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
  RefreshCw,
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

const DATE_OPTIONS = [
  { id: "today", name: DATE_LABELS.today },
  { id: "yesterday", name: DATE_LABELS.yesterday },
  { id: "week", name: DATE_LABELS.week },
  { id: "month", name: DATE_LABELS.month },
  { id: "last-month", name: DATE_LABELS["last-month"] },
  { id: "year", name: "This Year" },
  { id: "all", name: "All Time" },
  { id: "custom", name: DATE_LABELS.custom },
];

export default function ProfitLossPage() {
  const [dateFilter, setDateFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [scope, setScope] = useState("all");

  const { data, isLoading, isError, error, refetch } = usePnLReport({
    dateFilter,
    scope,
    customStartDate: dateFilter === "custom" ? customStart : undefined,
    customEndDate: dateFilter === "custom" ? customEnd : undefined,
  });

  // Read from API response correctly
  const reportData = data?.data || {};
  const summary = reportData.summary || reportData || {};

  // Also support direct top-level keys if API ever flattens
  const s = {
    netSalesRevenue: summary.netSalesRevenue ?? reportData.netSalesRevenue ?? 0,
    totalDirectCost: summary.totalDirectCost ?? reportData.totalDirectCost ?? 0,
    grossProfit: summary.grossProfit ?? reportData.grossProfit ?? 0,
    totalExpenses: summary.totalExpenses ?? reportData.totalExpenses ?? 0,
    netProfitOrLoss: summary.netProfitOrLoss ?? reportData.netProfitOrLoss ?? 0,
    totalOutstandingDue: summary.totalOutstandingDue ?? reportData.totalOutstandingDue ?? 0,
    collectedDue: summary.collectedDue ?? reportData.collectedDue ?? 0,
    profitMargin: summary.profitMargin ?? (reportData.grossProfit && reportData.netSalesRevenue ? ((reportData.grossProfit / reportData.netSalesRevenue) * 100) : 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
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
              onChange={(v) => {
                setDateFilter(v);
                if (v !== "custom") {
                  setCustomStart("");
                  setCustomEnd("");
                }
              }}
              options={DATE_OPTIONS}
              searchable={false}
              placeholder="Select period"
            />

            {dateFilter === "custom" && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">End</label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => refetch()}
                  disabled={!customStart || !customEnd}
                >
                  Apply
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Period:</span>
              <Badge variant="secondary" className="text-xs font-medium">
                {DATE_OPTIONS.find((o) => o.id === dateFilter)?.name || dateFilter}
              </Badge>
              {dateFilter === "custom" && customStart && customEnd && (
                <span className="truncate max-w-[120px]">
                  {customStart} → {customEnd}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="px-6 py-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : null}

      {/* Error */}
      {isError ? (
        <div className="px-6 py-4 flex flex-col items-center justify-center text-center">
          <CircleDollarSign className="h-10 w-10 text-destructive" />
          <p className="mt-2 font-semibold">Failed to load report</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message || error?.toString() || "Unknown error"}
          </p>
        </div>
      ) : null}

      {/* Main Content */}
      {!isLoading && !isError && data && (
        <>
          {/* KPI Cards */}
          <div className="px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Net Sales Revenue</p>
                  <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(s.netSalesRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground">After discounts & refunds</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-orange-500/10" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Direct Cost (COGS)</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(s.totalDirectCost)}</p>
                  <p className="text-[10px] text-muted-foreground">Product direct costs</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500/10" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Gross Profit</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.grossProfit)}</p>
                  <p className="text-[10px] text-muted-foreground">Before general expenses</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/10" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Net Profit / Loss</p>
                  <p className={`mt-1 text-2xl font-bold ${s.netProfitOrLoss >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(s.netProfitOrLoss)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{(s.profitMargin || 0).toFixed(1)}% margin</p>
                </div>
                <Wallet className="h-8 w-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
          </div>

          {/* Dues + Expenses + Total cards row */}
          <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-50">Total Expenses (General)</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-200">{formatCurrency(s.totalExpenses)}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300">Business expenses only</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-50">Total Sales Revenue (Gross)</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-200">{formatCurrency(reportData.totalSalesRevenue ?? 0)}</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-300">Before discounts / refunds</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className="text-xs font-semibold text-red-900 dark:text-red-50">Outstanding Customer Dues (Reference)</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-200">{formatCurrency(s.totalOutstandingDue)}</p>
                  <p className="text-[10px] text-red-700 dark:text-red-300">Not counted in profit; collected: {formatCurrency(s.collectedDue)}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-white/60 dark:bg-black/20">Reference</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Dues Reference Note */}
          <div className="px-6 pb-4">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="flex items-start justify-between p-4 gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-50">Outstanding Customer Dues (Reference — Not Profit)</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">This is customer credit / amounts due from sales. It is NOT part of Net Sales Revenue or profit calculations. Cash collected from dues is already included in sales revenue.</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-50">{formatCurrency(s.totalOutstandingDue)}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Collected: {formatCurrency(s.collectedDue)}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Records: {reportData.dueCount ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="px-6 pb-4 space-y-6">
            {/* Recent Sales */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    Recent Sales Transactions
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1">
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                  </div>
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
                    <TableHead className="text-right">Seller</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData.recentSales || []).slice(0, 10).map((sItem) => (
                    <TableRow key={sItem._id}>
                      <TableCell className="font-medium">{sItem.date}</TableCell>
                      <TableCell>{sItem.invoiceNumber}</TableCell>
                      <TableCell>{sItem.customer}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sItem.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sItem.directCost)}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(sItem.grossProfit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{sItem.seller || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {(reportData.recentSales || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">No sales records for this period.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Recent Expenses */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Recent Expenses by Category
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Expense #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category / Scope</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData.recentExpenses || []).map((e) => (
                    <TableRow key={e._id}>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.expenseNumber}</TableCell>
                      <TableCell>{e.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px]">{e.category || "General"}</Badge>
                          <Badge variant="outline" className="text-[10px]">{e.scope || "all"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-destructive font-medium">{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {(reportData.recentExpenses || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No expenses for this period.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* P&L Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>P&amp;L Summary</CardTitle>
              </CardHeader>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Total Sales Revenue (Gross)</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totalSalesRevenue ?? 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">(-) Discounts & Refunds</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency((reportData.totalSalesDiscount || 0) + (reportData.totalSalesRefund || 0))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Net Sales Revenue</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(s.netSalesRevenue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">(-) Direct Cost (COGS)</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.totalDirectCost)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Gross Profit</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(s.grossProfit)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">(-) General Business Expenses</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.totalExpenses)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/40">
                    <TableCell className="font-bold">Net Profit / Loss</TableCell>
                    <TableCell className={`text-right font-bold ${s.netProfitOrLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(s.netProfitOrLoss)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Print */}
          <div className="px-6 pb-6 flex justify-end">
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
