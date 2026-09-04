"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Plus,
  Receipt,
  Search,
  Settings,
  TrendingUp,
  Trash2,
  Wallet,
  Building2,
  Home,
  User,
  Package,
  Printer,
  FileText,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  exportExpensesToExcel,
  exportExpensesToPdf,
  printExpensesReport,
} from "@/lib/reports/exportReport";

import { getExpenses, deleteExpense, createExpense, updateExpense } from "@/lib/services/expenses.api";
import { useMutation } from "@tanstack/react-query";
import { useExpenseCategories } from "@/lib/hooks/expenses/useExpenseCategories";
import { ExpenseForm } from "./ExpenseForm";

const ITEMS_PER_PAGE = 15;

// =========================================================
// HELPERS
// =========================================================

const formatCurrency = (amount) => `৳${(amount || 0).toLocaleString()}`;
const formatNumber = (num) => (num || 0).toLocaleString();

const SCOPE_CONFIG = {
  Business: { icon: Building2, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  Household: { icon: Home, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  Personal: { icon: User, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
  Other: { icon: Package, color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800" },
};

// =========================================================
// SKELETONS
// =========================================================

function KpiSkeleton() {
  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// =========================================================
// KPI CARD
// =========================================================

function KpiCard({ title, value, description, icon: Icon, iconClassName, valueClassName }) {
  return (
    <Card className="border-border/70 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${valueClassName || ""}`}>{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${iconClassName || "bg-primary/10 text-primary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function ExpenseList() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Filters - Default to "today"
  const [dateFilter, setDateFilter] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch expenses
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["expenses", { dateFilter, search: debouncedSearch, category: categoryFilter, scope: scopeFilter, page: currentPage }],
    queryFn: () => getExpenses({ dateFilter, search: debouncedSearch, category: categoryFilter, scope: scopeFilter, page: currentPage }),
    staleTime: 30000,
  });

  // Fetch categories
  const { data: categoriesData } = useExpenseCategories();
  const categories = categoriesData?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success("Expense recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setExpenseModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to record expense");
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      toast.success("Expense updated successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setEditModalOpen(false);
      setExpenseToEdit(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update expense");
    },
  });

  const handleEditClick = (expense) => {
    setExpenseToEdit(expense);
    setEditModalOpen(true);
  };


  // Data
  const expenses = data?.data?.expenses || [];
  const summary = data?.data?.summary || {};
  const pagination = data?.data?.pagination || { totalPages: 1, currentPage: 1, totalResults: 0 };

  const handleExport = async (type) => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }

    // Show loading state
    const loadingToastId = toast.loading("Preparing export...");

    try {
      // Build metadata for the report
      const DATE_LABELS = {
        today: "Today",
        yesterday: "Yesterday",
        week: "This Week",
        month: "This Month",
        "last-month": "Last Month",
        year: "This Year",
        all: "All Time",
      };

      const now = new Date();
      const meta = {
        title: "Expense Report",
        filters: [
          { label: "Period", value: DATE_LABELS[dateFilter] || "All Time" },
          { label: "Category", value: categoryFilter === "all" ? "All Categories" : (categories.find(c => c._id === categoryFilter)?.name || "All") },
          { label: "Scope", value: scopeFilter === "all" ? "All Scopes" : scopeFilter },
        ],
        generatedAt: now.toLocaleString("en-BD", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        fileBase: `khalil-expenses-${dateFilter}-${now.toISOString().slice(0, 10)}`,
      };

      // Fetch all pages for the current filters
      let allExpenses = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await getExpenses({
          dateFilter,
          search: debouncedSearch,
          category: categoryFilter,
          scope: scopeFilter,
          page,
          limit: 100
        });

        allExpenses = [...allExpenses, ...(response.data?.expenses || [])];
        totalPages = response.data?.pagination?.totalPages || 1;
        page++;
      } while(page <= totalPages);

      if (type === "excel") {
        await exportExpensesToExcel(allExpenses, summary, meta);
      } else if (type === "pdf") {
        await exportExpensesToPdf(allExpenses, summary, meta);
      } else if (type === "print") {
        printExpensesReport(allExpenses, summary, meta);
      }

      toast.dismiss(loadingToastId);
      toast.success(`Expenses exported successfully`);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error("Failed to export expenses");
      console.error("Export error:", error);
    }
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      deleteMutation.mutate(expenseToDelete._id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all expenses — shop, household, personal, and sales-related
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading || expenses.length === 0} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("print")}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => router.push("/admin/expenses/categories")} className="gap-2">
            <Settings className="h-4 w-4" />
            Categories
          </Button>
          <Button onClick={() => setExpenseModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Record Expense
          </Button>
        </div>
      </div>

      {/* ===================== FILTERS ===================== */}
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, vendor, expense number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full lg:w-40">
                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Scope Filter */}
            <Select value={scopeFilter} onValueChange={(v) => { setScopeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue placeholder="All Scopes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Household">Household</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ===================== KPIs ===================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <KpiSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Expenses"
            value={formatCurrency(summary.totalAmount || 0)}
            description="All expenses including sales"
            icon={CircleDollarSign}
          />
          <KpiCard
            title="Today"
            value={formatCurrency(summary.todayTotal || 0)}
            description="Today's expenses"
            icon={Receipt}
            iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />
          <KpiCard
            title="This Month"
            value={formatCurrency(summary.monthTotal || 0)}
            description="Current month expenses"
            icon={TrendingUp}
            iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <KpiCard
            title="Transactions"
            value={formatNumber(summary.totalTransactions || 0)}
            description="Total expense records"
            icon={Wallet}
            iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
        </div>
      )}

      {/* ===================== TABLE ===================== */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Expense Records</CardTitle>
            <span className="text-xs text-muted-foreground">
              {pagination.totalResults} record{pagination.totalResults !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-0">
          {isError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-destructive">Failed to load expenses</p>
              <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
            </div>
          ) : isLoading ? (
            <div className="p-4"><TableSkeleton /></div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">No expenses found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm || categoryFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Record your first expense to get started"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Title</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Scope</TableHead>
                    <TableHead className="text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const scopeCfg = SCOPE_CONFIG[expense.expenseScope] || SCOPE_CONFIG.Other;
                    const ScopeIcon = scopeCfg.icon;

                    return (
                      <TableRow key={expense._id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {expense.expenseDate ? format(new Date(expense.expenseDate), "dd MMM yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium line-clamp-1">{expense.title}</p>
                          {expense.vendorName && (
                            <p className="text-xs text-muted-foreground">{expense.vendorName}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {expense.categoryName || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold font-mono">
                            {formatCurrency(expense.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] gap-1 ${scopeCfg.color}`}>
                            <ScopeIcon className="h-3 w-3" />
                            {expense.expenseScope}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => router.push(`/admin/expenses/${expense._id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {expense.source !== "sale" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditClick(expense)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteClick(expense)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, pagination.totalResults)} of{" "}
                  {pagination.totalResults}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isFetching}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium">{currentPage}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{pagination.totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages || isFetching}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense record? This action cannot be undone.
              {expenseToDelete && (
                <div className="mt-2 p-3 bg-muted rounded-md flex items-center justify-between">
                  <span className="font-medium">{expenseToDelete.title}</span>
                  <span className="font-bold text-destructive">{formatCurrency(expenseToDelete.amount)}</span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExpenseForm
        mode="create"
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        onCreateExpense={createExpenseMutation.mutateAsync}
      />

      <ExpenseForm
        mode="edit"
        expense={expenseToEdit}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdateExpense={updateExpenseMutation.mutateAsync}
      />
    </div>
  );
}
