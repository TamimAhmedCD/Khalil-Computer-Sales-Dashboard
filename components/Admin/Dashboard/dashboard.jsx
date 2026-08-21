"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Target,
  Plus,
  Receipt,
  UserPlus,
  FileText,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

import { SummaryGrid } from "./SummaryCards";
import DashboardCharts from "./DashboardCharts";
import RecentSalesTable from "./RecentSalesTable";
import TopEmployeesTable from "./TopEmployeesTable";
import ExpenseOverview from "./ExpenseOverview";
import NotificationSection from "./NotificationSection";

export function AdminDashboard({ session }) {
  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // DEMO DATA
  // =========================================================
  // এগুলো পরে Admin Dashboard API থেকে আসবে.
  // UI structure এখন থেকেই final রাখা হচ্ছে.

  const itemsPerPage = 5;

  const todaysSales = 28000;
  const todaysProfit = 8400;
  const todaysExpense = 2500;
  const totalCommission = 76000;
  const totalEmployees = 15;
  const netProfit = 125000;

  // =========================================================
  // CHART DATA
  // =========================================================

  const salesData = [
    {
      date: "Apr 06",
      sales: 15000,
      profit: 4500,
    },
    {
      date: "Apr 07",
      sales: 18000,
      profit: 5400,
    },
    {
      date: "Apr 08",
      sales: 12000,
      profit: 3600,
    },
    {
      date: "Apr 09",
      sales: 22000,
      profit: 6600,
    },
    {
      date: "Apr 10",
      sales: 19000,
      profit: 5700,
    },
    {
      date: "Apr 11",
      sales: 25000,
      profit: 7500,
    },
    {
      date: "Apr 12",
      sales: 28000,
      profit: 8400,
    },
  ];

  const profitData = [
    {
      date: "Apr 01",
      profit: 8000,
    },
    {
      date: "Apr 05",
      profit: 12000,
    },
    {
      date: "Apr 08",
      profit: 15000,
    },
    {
      date: "Apr 12",
      profit: 18000,
    },
    {
      date: "Apr 15",
      profit: 14000,
    },
    {
      date: "Apr 19",
      profit: 16000,
    },
    {
      date: "Apr 22",
      profit: 20000,
    },
    {
      date: "Apr 26",
      profit: 22000,
    },
    {
      date: "Apr 30",
      profit: 25000,
    },
  ];

  // =========================================================
  // RECENT TRANSACTIONS
  // =========================================================

  const recentSales = [
    {
      id: 1,
      time: "10:30 AM",
      employee: "Rahul Kumar",
      product: "Premium Plan",
      category: "Electronics",
      amount: 15000,
      profit: 4500,
    },
    {
      id: 2,
      time: "11:15 AM",
      employee: "Priya Singh",
      product: "Basic Plan",
      category: "Software",
      amount: 8500,
      profit: 1700,
    },
    {
      id: 3,
      time: "12:00 PM",
      employee: "Amit Patel",
      product: "Enterprise Plan",
      category: "Services",
      amount: 45000,
      profit: 9000,
    },
    {
      id: 4,
      time: "01:45 PM",
      employee: "Neha Sharma",
      product: "Pro Plan",
      category: "Electronics",
      amount: 28000,
      profit: 8400,
    },
    {
      id: 5,
      time: "02:30 PM",
      employee: "Rajesh Verma",
      product: "Standard Plan",
      category: "Software",
      amount: 18000,
      profit: 3600,
    },
    {
      id: 6,
      time: "03:15 PM",
      employee: "Deepika Nair",
      product: "Premium Plan",
      category: "Services",
      amount: 35000,
      profit: 7000,
    },
    {
      id: 7,
      time: "04:00 PM",
      employee: "Vikram Singh",
      product: "Basic Plan",
      category: "Electronics",
      amount: 12000,
      profit: 3600,
    },
    {
      id: 8,
      time: "04:45 PM",
      employee: "Anjali Desai",
      product: "Enterprise Plan",
      category: "Software",
      amount: 52000,
      profit: 10400,
    },
    {
      id: 9,
      time: "05:30 PM",
      employee: "Suresh Kumar",
      product: "Pro Plan",
      category: "Services",
      amount: 32000,
      profit: 6400,
    },
    {
      id: 10,
      time: "06:15 PM",
      employee: "Divya Reddy",
      product: "Premium Plan",
      category: "Electronics",
      amount: 25000,
      profit: 7500,
    },
  ];

  // =========================================================
  // EMPLOYEE PERFORMANCE
  // =========================================================

  const topEmployees = [
    {
      id: 1,
      name: "Rahul Kumar",
      sales: 425000,
      profit: 102000,
      commission: 15300,
    },
    {
      id: 2,
      name: "Priya Singh",
      sales: 385000,
      profit: 92400,
      commission: 13860,
    },
    {
      id: 3,
      name: "Amit Patel",
      sales: 468000,
      profit: 112320,
      commission: 16848,
    },
    {
      id: 4,
      name: "Neha Sharma",
      sales: 392000,
      profit: 94080,
      commission: 14112,
    },
    {
      id: 5,
      name: "Rajesh Verma",
      sales: 351000,
      profit: 84240,
      commission: 12636,
    },
  ];

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(recentSales.length / itemsPerPage);

  const paginatedSales = recentSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8">
        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />

              <span className="text-sm font-semibold text-primary">
                ADMINISTRATION
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Business Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor revenue, profitability, expenses, and employee performance
              from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/sales">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Record Sale
              </Button>
            </Link>

            <Link href="/admin/reports">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* =====================================================
            BUSINESS SUMMARY
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Business Performance
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Current financial and operational indicators.
            </p>
          </div>

          <SummaryGrid
            todaysSales={todaysSales}
            todaysProfit={todaysProfit}
            todaysExpense={todaysExpense}
            totalCommission={totalCommission}
            totalEmployees={totalEmployees}
            netProfit={netProfit}
          />
        </section>

        {/* =====================================================
            REVENUE & PROFIT PERFORMANCE
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Revenue & Profit Performance
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Review sales and profitability trends over time.
            </p>
          </div>

          <DashboardCharts salesData={salesData} profitData={profitData} />
        </section>

        {/* =====================================================
            RECENT TRANSACTIONS
        ====================================================== */}

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent Transactions
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Latest sales activity across the organization.
              </p>
            </div>

            <Link href="/admin/sales">
              <Button variant="outline" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" />
                View All Transactions
              </Button>
            </Link>
          </div>

          <RecentSalesTable
            paginatedSales={paginatedSales}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            recentSales={recentSales}
          />
        </section>

        {/* =====================================================
            EXPENSE & EMPLOYEE PERFORMANCE
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Operational Analysis
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Review expenditure and workforce performance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ExpenseOverview />

            <div>
              <TopEmployeesTable topEmployees={topEmployees} />
            </div>
          </div>
        </section>

        {/* =====================================================
            EMPLOYEE MANAGEMENT
        ====================================================== */}

        <section>
          <Card className="border-border bg-card">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">
                    Workforce Management
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {totalEmployees} active employees are currently registered
                    in the system.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/admin/employees">
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Manage Employees
                  </Button>
                </Link>

                <Link href="/admin/employees/add">
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Employee
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* =====================================================
            OPERATIONAL ALERTS
        ====================================================== */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Operational Alerts
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Important notifications requiring administrative attention.
            </p>
          </div>

          <NotificationSection />
        </section>
      </div>
    </div>
  );
}
