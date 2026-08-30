"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  Printer,
  Receipt,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  exportEmployeeReportToExcel,
  exportEmployeeReportToPdf,
  printEmployeeReport,
} from "@/lib/reports/exportReport";

// =========================================================
// HELPERS
// =========================================================

const PAYMENT_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

const DATE_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
  custom: "Custom Range",
};

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const formatNumber = (value) => Number(value || 0).toLocaleString("en-BD");

// Compact axis labels — ৳12,500 → 12.5k — so the Y axis stays narrow.
const compactMoney = (value) => {
  const n = Number(value) || 0;
  return Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;
};

// The sales API returns 10 rows per page, so walk every page for the current
// filter to get a complete set (used by charts and exports). Bounded for safety.
async function fetchAllSalesPages(paramsObj, { maxPages = 200 } = {}) {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  let summary = { totalSalesAmount: 0, totalProfit: 0, totalCommission: 0 };

  do {
    const params = new URLSearchParams({ ...paramsObj, page: String(page) });
    const res = await fetch(`/api/products/sales?${params.toString()}`, {
      cache: "no-store",
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json?.message || "Failed to load sales");
    }

    rows.push(...(json.data || []));
    if (json.summary) summary = json.summary;
    totalPages = json.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages && page <= maxPages);

  return { rows, summary };
}

// =========================================================
// PRESENTATIONAL PIECES
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
            <p className={`mt-2 text-2xl font-bold tracking-tight ${valueClassName}`}>
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

function PerformanceBar({ value, max }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.max(Math.min(percentage, 100), 2)}%` }}
      />
    </div>
  );
}

// Dark-safe tooltip for the money time-series charts.
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-sm font-semibold"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-semibold" style={{ color: slice.payload?.fill }}>
        {slice.name}
      </p>
      <p className="text-sm text-muted-foreground">{formatCurrency(slice.value)}</p>
    </div>
  );
}

// Shared recharts axis/grid props matching the dashboard convention.
const gridProps = {
  strokeDasharray: "3 3",
  vertical: false,
  stroke: "currentColor",
  className: "text-slate-200 dark:text-zinc-800",
};
const axisTick = { fill: "#94a3b8", fontSize: 11 };

// Placeholders shown while the first data set / chart data loads.
function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/70 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-1 h-3 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =========================================================
// PAGE
// =========================================================

export function Reports() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    totalSalesAmount: 0,
    totalProfit: 0,
    totalCommission: 0,
  });
  const [pagination, setPagination] = useState({
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [dateFilter, setDateFilter] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Charts always show the last 7 days across all pages of that range.
  const { data: chartRawData = [], isLoading: chartLoading } = useQuery({
    queryKey: ["employeeSalesChart"],
    queryFn: async () => (await fetchAllSalesPages({ dateFilter: "week" })).rows,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products/categories");
      return data?.data || [];
    },
  });

  // Paginated table + summary for the active filters (debounced).
  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("dateFilter", dateFilter);
        if (searchTerm) params.set("search", searchTerm);
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (dateFilter === "custom" && customStartDate && customEndDate) {
          params.set("customStartDate", customStartDate);
          params.set("customEndDate", customEndDate);
        }

        const res = await fetch(`/api/products/sales?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await res.json();

        if (result.success) {
          setSales(result.data || []);
          setSummary(
            result.summary || {
              totalSalesAmount: 0,
              totalProfit: 0,
              totalCommission: 0,
            },
          );
          setPagination(
            result.pagination || {
              totalResults: 0,
              totalPages: 1,
              currentPage: 1,
            },
          );
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Sales fetch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setFirstLoad(false);
        }
      }
    };

    const debounce = setTimeout(run, 300);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [
    currentPage,
    dateFilter,
    searchTerm,
    categoryFilter,
    customStartDate,
    customEndDate,
  ]);

  const handleFilterChange = (type, value) => {
    if (type === "date") {
      setDateFilter(value);
      if (value !== "custom") {
        setCustomStartDate("");
        setCustomEndDate("");
      }
    }
    if (type === "search") setSearchTerm(value);
    if (type === "category") setCategoryFilter(value);
    setCurrentPage(1);
  };

  // Last-7-days series for the trend charts.
  const chartSalesData = useMemo(() => {
    const dailyMap = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      dailyMap[key] = {
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        sales: 0,
        profit: 0,
        commission: 0,
      };
    }

    chartRawData.forEach((item) => {
      const dateObj = new Date(item.createdAt || item.date);
      if (Number.isNaN(dateObj.getTime())) return;
      dateObj.setHours(0, 0, 0, 0);
      const key = dateObj.toISOString().split("T")[0];
      if (dailyMap[key]) {
        dailyMap[key].sales += Number(item.totalPrice) || 0;
        dailyMap[key].profit += Number(item.netProfit) || 0;
        dailyMap[key].commission += Number(item.commission) || 0;
      }
    });

    return Object.values(dailyMap);
  }, [chartRawData]);

  const paymentBreakdown = useMemo(() => {
    const methods = {};
    chartRawData.forEach((item) => {
      const key = item.paymentMethod || "Unspecified";
      methods[key] = (methods[key] || 0) + (Number(item.totalPrice) || 0);
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [chartRawData]);

  const topProducts = useMemo(() => {
    const productMap = {};
    chartRawData.forEach((item) => {
      const name = item.productName || "—";
      if (!productMap[name]) productMap[name] = { name, quantity: 0, sales: 0 };
      productMap[name].quantity += Number(item.quantity) || 0;
      productMap[name].sales += Number(item.totalPrice) || 0;
    });
    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [chartRawData]);

  const maxProductSales = topProducts[0]?.sales || 0;

  // Resolve the active filters into labels stamped onto exports.
  const buildMeta = () => {
    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-BD", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";

    let periodLabel = DATE_LABELS[dateFilter] || "Today";
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      periodLabel = `${fmt(customStartDate)} – ${fmt(customEndDate)}`;
    }

    const categoryLabel =
      categoryFilter === "all"
        ? "All Categories"
        : categories.find((c) => String(c._id) === String(categoryFilter))
            ?.name || "—";

    const filters = [
      { label: "Period", value: periodLabel },
      { label: "Category", value: categoryLabel },
    ];
    if (searchTerm) filters.push({ label: "Search", value: searchTerm });

    const now = new Date();
    return {
      title: "Sales Report",
      filters,
      generatedAt: now.toLocaleString("en-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      fileBase: `khalil-my-sales-${dateFilter}-${now.toISOString().slice(0, 10)}`,
    };
  };

  const runExport = async (kind) => {
    if (exporting) return;
    setExporting(true);
    try {
      const params = { dateFilter };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (dateFilter === "custom" && customStartDate && customEndDate) {
        params.customStartDate = customStartDate;
        params.customEndDate = customEndDate;
      }

      const { rows, summary: fullSummary } = await fetchAllSalesPages(params);

      if (!rows.length) {
        toast.error("No sales to export for the selected filters.");
        return;
      }

      const meta = buildMeta();
      const data = { rows, summary: fullSummary };

      if (kind === "pdf") {
        await exportEmployeeReportToPdf(data, meta);
        toast.success("PDF report downloaded");
      } else if (kind === "excel") {
        await exportEmployeeReportToExcel(data, meta);
        toast.success("Excel report downloaded");
      } else if (kind === "print") {
        printEmployeeReport(data, meta);
      }
    } catch (err) {
      console.error("Report export failed:", err);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your sales, profit, and commission.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={dateFilter}
            onValueChange={(val) => handleFilterChange("date", val)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={exporting}>
                <Download className="h-4 w-4" />
                {exporting ? "Exporting…" : "Export"}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Export report</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onClick={() => runExport("pdf")}>
                <FileText className="h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => runExport("excel")}>
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onClick={() => runExport("print")}>
                <Printer className="h-4 w-4" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ===================== CUSTOM RANGE ===================== */}
      {dateFilter === "custom" && (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-wrap items-end gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Start date
              </label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                End date
              </label>
              <Input
                type="date"
                value={customEndDate}
                min={customStartDate || undefined}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-44"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== KPIs ===================== */}
      {firstLoad ? (
        <KpiGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Sales"
          value={formatCurrency(summary.totalSalesAmount)}
          description="Revenue for the selected period"
          icon={CircleDollarSign}
        />
        <KpiCard
          title="Net Profit"
          value={formatCurrency(summary.totalProfit)}
          description="After expenses and commission"
          icon={TrendingUp}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          title="Commission"
          value={formatCurrency(summary.totalCommission)}
          description="Your earned commission"
          icon={Wallet}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          title="Transactions"
          value={formatNumber(pagination.totalResults)}
          description="Sales records in this period"
          icon={Receipt}
          iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        </div>
      )}

      {/* ===================== CHARTS ===================== */}
      {chartLoading ? (
        <ChartGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sales overview</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartSalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="empSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={44} tickFormatter={compactMoney} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" strokeWidth={2} fill="url(#empSalesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Profit overview</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartSalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={44} tickFormatter={compactMoney} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.15)" }} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Commission overview</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartSalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={44} tickFormatter={compactMoney} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment breakdown */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Payment breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            {paymentBreakdown.length ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {paymentBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No payment data for the last 7 days.
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* ===================== TOP PRODUCTS ===================== */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Top selling products</CardTitle>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {chartLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          ) : topProducts.length ? (
            topProducts.map((product) => (
              <div key={product.name}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="truncate text-sm font-medium">{product.name}</span>
                  <div className="flex shrink-0 items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{formatNumber(product.quantity)} sold</span>
                    <span className="font-semibold">{formatCurrency(product.sales)}</span>
                  </div>
                </div>
                <PerformanceBar value={product.sales} max={maxProductSales} />
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sales in the last 7 days.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ===================== FILTERS ===================== */}
      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice or product"
                value={searchTerm}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <Select
              disabled={loadingCategories}
              value={categoryFilter}
              onValueChange={(val) => handleFilterChange("category", val)}
            >
              <SelectTrigger className="w-full">
                <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ===================== TRANSACTIONS ===================== */}
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Transactions</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Your sales for the selected filters.
              </p>
            </div>
            <Badge variant="secondary">
              {formatNumber(pagination.totalResults)} records
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Expense</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j} className="py-4">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sales.length ? (
                sales.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="max-w-45 truncate font-medium" title={item.productName}>
                      {item.productName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {item.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{formatNumber(item.quantity)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.rawExpense)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.netProfit)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-violet-600 dark:text-violet-400">
                      {formatCurrency(item.commission)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No sales found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                }
                disabled={currentPage >= pagination.totalPages || loading}
                className="gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
