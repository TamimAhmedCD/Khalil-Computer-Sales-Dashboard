"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarIcon,
  CircleDollarSign,
  CreditCard,
  FileText,
  Home,
  Package,
  Trash2,
  User,
  Download,
  Store,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

import { getExpense, deleteExpense } from "@/lib/services/expenses.api";

const SCOPE_CONFIG = {
  Business: { icon: Building2, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  Household: { icon: Home, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  Personal: { icon: User, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
  Other: { icon: Package, color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800" },
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExpenseDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => getExpense(id),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      router.push("/admin/expenses");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    },
  });

  const expense = data?.data;

  const formatCurrency = (amount) => `৳${(amount || 0).toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/admin/expenses">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Expenses
            </Button>
          </Link>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-destructive">Failed to load expense details</p>
            <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/admin/expenses">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Expenses
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm">Expense not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopeCfg = SCOPE_CONFIG[expense.expenseScope] || SCOPE_CONFIG.Other;
  const ScopeIcon = scopeCfg.icon;
  const isSaleExpense = expense.source === "sale";

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/expenses">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Expenses
          </Button>
        </Link>
      </div>

      {/* Main Card */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`text-[10px] gap-1 ${scopeCfg.color}`}>
                  <ScopeIcon className="h-3 w-3" />
                  {expense.expenseScope}
                </Badge>
                {isSaleExpense && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Store className="h-3 w-3" />
                    Sale Expense
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{expense.title}</CardTitle>
              <CardDescription className="mt-1">
                {expense.expenseNumber}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatCurrency(expense.amount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {expense.expenseDate ? format(new Date(expense.expenseDate), "dd MMMM yyyy") : "—"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium">{expense.categoryName || "Uncategorized"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded-md">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-medium">{expense.paymentMethod || "—"}</p>
                </div>
              </div>

              {expense.vendorName && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-background rounded-md">
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vendor / Recipient</p>
                    <p className="text-sm font-medium">{expense.vendorName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded-md">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expense Date</p>
                  <p className="text-sm font-medium">
                    {expense.expenseDate ? format(new Date(expense.expenseDate), "EEEE, dd MMMM yyyy") : "—"}
                  </p>
                </div>
              </div>

              {expense.type && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-background rounded-md">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type / Purpose</p>
                    <p className="text-sm font-medium">{expense.type}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded-md">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold text-primary">{formatCurrency(expense.amount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          {expense.note && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Note</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{expense.note}</p>
              </div>
            </>
          )}

          {/* Sale Details */}
          {isSaleExpense && expense.saleDetails && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-3">Sale Details</p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice Number</p>
                      <p className="font-medium">{expense.saleDetails.invoiceNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium">{expense.saleDetails.customerName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sale Type</p>
                      <p className="font-medium capitalize">{expense.saleDetails.saleType || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Sale Amount</p>
                      <p className="font-medium">{formatCurrency(expense.saleDetails.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Raw Expense</p>
                      <p className="font-medium">{formatCurrency(expense.saleDetails.rawExpense || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Commission</p>
                      <p className="font-medium">{formatCurrency(expense.saleDetails.commission || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Attachment */}
          {expense.attachmentUrl && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Receipt / Attachment</p>
                <img
                  src={expense.attachmentUrl}
                  alt="Attachment"
                  className="max-w-full h-auto rounded-lg border max-h-64"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Created: {expense.createdAt ? format(new Date(expense.createdAt), "dd MMM yyyy 'at' hh:mm a") : "—"}
            </p>
            <div className="flex items-center gap-2">
              {!isSaleExpense && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this expense record.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
