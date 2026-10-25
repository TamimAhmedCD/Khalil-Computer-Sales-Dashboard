"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDueDashboard } from "@/lib/hooks/dues/useDueDashboard";
import CustomerDueList from "@/components/Admin/Dues/CustomerDueList";

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const formatNumber = (value) => Number(value || 0).toLocaleString("en-BD");

export default function DueDashboard({ session }) {
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useDueDashboard();

  const [refreshLoading, setRefreshLoading] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshLoading(true);
    await refetch();
    setRefreshLoading(false);
  }, [refetch]);

  const data = dashboardData?.data || {
    totalOutstandingDue: 0,
    collectedToday: 0,
    collectedThisMonth: 0,
    customersWithDue: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-400 space-y-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Customer Due Management
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track and collect outstanding customer payments
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-fit gap-2"
            onClick={handleRefresh}
            disabled={isLoading || refreshLoading}
          >
            {isLoading || refreshLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {isError && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-destructive">
                  Failed to load dashboard
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error?.message || "An error occurred"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Outstanding Due */}
          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Outstanding Due
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-28 my-2" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(data.totalOutstandingDue)}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Across all customers
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* Collected Today */}
          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Collected Today
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-28 my-2" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.collectedToday)}
                  </p>
                )}
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Today's collection
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          {/* Collected This Month */}
          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Collected This Month
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-28 my-2" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.collectedThisMonth)}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Month-to-date
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* Customers with Due */}
          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Customers with Due
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 my-2" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {formatNumber(data.customersWithDue)}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Active accounts
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            CUSTOMER DUE LIST
        ====================================================== */}

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Customers with Outstanding Dues</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage customer payments and track due collections
              </p>
            </div>
            <CustomerDueList session={session} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
