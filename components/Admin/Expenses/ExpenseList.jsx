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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

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

// Export to CSV
const exportToCSV = (expenses, summary, dateFilter) => {
  const headers = [
    "Date",
    "Expense No.",
    "Title",
    "Category",
    "Amount",
    "Scope",
    "Payment Method",
    "Vendor/Recipient",
    "Type",
    "Source",
    "Note",
  ];

  const rows = expenses.map((exp) => [
    exp.expenseDate ? format(new Date(exp.expenseDate), "yyyy-MM-dd") : "",
    exp.expenseNumber || "",
    exp.title || "",
    exp.categoryName || "",
    exp.amount || 0,
    exp.expenseScope || "",
    exp.paymentMethod || "",
    exp.vendorName || "",
    exp.type || "",
    exp.source === "sale" ? "Sale" : "Manual",
    exp.note || "",
  ]);

  // Add summary at the top
  const summaryRows = [
    ["Expense Report"],
    [`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`],
    [`Filter: ${dateFilter}`],
    [""],
    ["Summary"],
    [`Total Expenses: ৳${(summary.totalAmount || 0).toLocaleString()}`],
    [`Total Transactions: ${summary.totalTransactions || 0}`],
    [`Today's Total: ৳${(summary.todayTotal || 0).toLocaleString()}`],
    [`Month Total: ৳${(summary.monthTotal || 0).toLocaleString()}`],
    [""],
    [""],
  ];

  const csvContent = [
    ...summaryRows.map((row) => row.join(",")),
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        const cellStr = String(cell).replace(/"/g, '""');
        return cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")
          ? `"${cellStr}"`
          : cellStr;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `expenses_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to Excel
const exportToExcel = (expenses, summary, dateFilter) => {
  const data = expenses.map((exp) => ({
    Date: exp.expenseDate ? format(new Date(exp.expenseDate), "yyyy-MM-dd") : "",
    "Expense No.": exp.expenseNumber || "",
    Title: exp.title || "",
    Category: exp.categoryName || "",
    Amount: exp.amount || 0,
    Scope: exp.expenseScope || "",
    "Payment Method": exp.paymentMethod || "",
    "Vendor/Recipient": exp.vendorName || "",
    Type: exp.type || "",
    Source: exp.source === "sale" ? "Sale" : "Manual",
    Note: exp.note || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");

  // Add summary sheet
  const summaryData = [
    { Metric: "Total Expenses", Value: `৳${(summary.totalAmount || 0).toLocaleString()}` },
    { Metric: "Total Transactions", Value: summary.totalTransactions || 0 },
    { Metric: "Today's Total", Value: `৳${(summary.todayTotal || 0).toLocaleString()}` },
    { Metric: "Month Total", Value: `৳${(summary.monthTotal || 0).toLocaleString()}` },
    { Metric: "Filter Applied", Value: dateFilter },
    { Metric: "Generated On", Value: format(new Date(), "yyyy-MM-dd HH:mm:ss") },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  XLSX.writeFile(wb, `expenses_${format(new Date(), "yyyy-MM-dd_HHmmss")}.xlsx`);
};

// Export to PDF
const exportToPDF = (expenses, summary, dateFilter) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Expense Report", 14, 22);

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, 14, 32);
  doc.text(`Filter: ${dateFilter}`, 14, 38);

  // Summary box
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Summary", 14, 50);
  doc.setFontSize(10);
  doc.text(`Total Expenses: ৳${(summary.totalAmount || 0).toLocaleString()}`, 14, 58);
  doc.text(`Total Transactions: ${summary.totalTransactions || 0}`, 14, 64);
  doc.text(`Today's Total: ৳${(summary.todayTotal || 0).toLocaleString()}`, 14, 70);
  doc.text(`Month Total: ৳${(summary.monthTotal || 0).toLocaleString()}`, 14, 76);

  // Table
  const tableData = expenses.map((exp) => [
    exp.expenseDate ? format(new Date(exp.expenseDate), "dd MMM yyyy") : "",
    exp.expenseNumber || "",
    (exp.title || "").substring(0, 25),
    exp.categoryName || "",
    `৳${(exp.amount || 0).toLocaleString()}`,
    exp.expenseScope || "",
    exp.source === "sale" ? "Sale" : "Manual",
  ]);

  doc.autoTable({
    head: [["Date", "Expense No.", "Title", "Category", "Amount", "Scope", "Source"]],
    body: tableData,
    startY: 85,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { cellWidth: 28 },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 20 },
      6: { cellWidth: 18 },
    },
  });

  doc.save(`expenses_${format(new Date(), "yyyy-MM-dd_HHmmss")}.pdf`);
};

// Print
const printExpenses = (expenses, summary, dateFilter) => {
  const printWindow = window.open("", "_blank");
  const tableRows = expenses
    .map(
      (exp) => `
      <tr>
        <td>${exp.expenseDate ? format(new Date(exp.expenseDate), "dd MMM yyyy") : ""}</td>
        <td>${exp.expenseNumber || ""}</td>
        <td>${exp.title || ""}</td>
        <td>${exp.categoryName || ""}</td>
        <td style="text-align: right;">৳${(exp.amount || 0).toLocaleString()}</td>
        <td>${exp.expenseScope || ""}</td>
        <td>${exp.source === "sale" ? "Sale" : "Manual"}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Expense Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; margin-bottom: 5px; }
        .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .summary p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #428bca; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { margin-top: 30px; font-size: 11px; color: #666; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>Expense Report</h1>
      <p style="color: #666;">Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")} | Filter: ${dateFilter}</p>

      <div class="summary">
        <p><strong>Total Expenses:</strong> ৳${(summary.totalAmount || 0).toLocaleString()}</p>
        <p><strong>Total Transactions:</strong> ${summary.totalTransactions || 0}</p>
        <p><strong>Today's Total:</strong> ৳${(summary.todayTotal || 0).toLocaleString()}</p>
        <p><strong>Month Total:</strong> ৳${(summary.monthTotal || 0).toLocaleString()}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Expense No.</th>
            <th>Title</th>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
            <th>Scope</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        <p>Khalil Computer Management System</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

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

  const handleExport = (type) => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    try {
      if (type === "csv") {
        exportToCSV(expenses, summary, dateFilter);
      } else if (type === "excel") {
        exportToExcel(expenses, summary, dateFilter);
      } else if (type === "pdf") {
        exportToPDF(expenses, summary, dateFilter);
      } else if (type === "print") {
        printExpenses(expenses, summary, dateFilter);
      }
      toast.success(`Expenses exported successfully`);
    } catch (error) {
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
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
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
                    <TableHead className="text-xs font-semibold">Expense No.</TableHead>
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
                        <TableCell className="text-xs font-mono">{expense.expenseNumber || "—"}</TableCell>
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
