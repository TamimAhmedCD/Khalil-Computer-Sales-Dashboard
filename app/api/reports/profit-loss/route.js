import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

const BD_OFFSET = 6 * 60 * 60 * 1000;

// =========================================================
// DATE HELPERS (Bangladesh timezone: UTC+6)
// =========================================================

function getBDToday() {
  const now = new Date();
  const bd = new Date(now.getTime() + BD_OFFSET);
  return {
    year: bd.getUTCFullYear(),
    month: bd.getUTCMonth(),
    day: bd.getUTCDate(),
  };
}

function formatBDDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function getBDStartOfDay(dateString) {
  const date = new Date(`${dateString}T00:00:00+06:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function getBDEndOfDay(dateString) {
  const date = new Date(`${dateString}T23:59:59.999+06:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function getDateRange(dateFilter, customStartDate, customEndDate) {
  const today = getBDToday();
  const todayString = formatBDDate(today.year, today.month, today.day);

  switch (dateFilter) {
    // -------------------------------------------------------
    // TODAY
    // -------------------------------------------------------

    case "today": {
      return {
        start: getBDStartOfDay(todayString),
        end: getBDEndOfDay(todayString),
      };
    }

    // -------------------------------------------------------
    // YESTERDAY
    // -------------------------------------------------------

    case "yesterday": {
      const yesterday = new Date(
        Date.UTC(today.year, today.month, today.day - 1),
      );

      const dateString = formatBDDate(
        yesterday.getUTCFullYear(),
        yesterday.getUTCMonth(),
        yesterday.getUTCDate(),
      );

      return {
        start: getBDStartOfDay(dateString),
        end: getBDEndOfDay(dateString),
      };
    }

    // -------------------------------------------------------
    // THIS WEEK (Saturday -> Friday)
    // -------------------------------------------------------

    case "week": {
      const current = new Date(Date.UTC(today.year, today.month, today.day));

      const dayOfWeek = current.getUTCDay();

      const daysSinceSaturday = (dayOfWeek + 1) % 7;

      const weekStart = new Date(current);

      weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceSaturday);

      const weekEnd = new Date(weekStart);

      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

      const startString = formatBDDate(
        weekStart.getUTCFullYear(),
        weekStart.getUTCMonth(),
        weekStart.getUTCDate(),
      );

      const endString = formatBDDate(
        weekEnd.getUTCFullYear(),
        weekEnd.getUTCMonth(),
        weekEnd.getUTCDate(),
      );

      return {
        start: getBDStartOfDay(startString),
        end: getBDEndOfDay(endString),
      };
    }

    // -------------------------------------------------------
    // THIS MONTH
    // -------------------------------------------------------

    case "month": {
      const startString = formatBDDate(today.year, today.month, 1);

      const monthEnd = new Date(Date.UTC(today.year, today.month + 1, 0));

      const endString = formatBDDate(
        monthEnd.getUTCFullYear(),
        monthEnd.getUTCMonth(),
        monthEnd.getUTCDate(),
      );

      return {
        start: getBDStartOfDay(startString),
        end: getBDEndOfDay(endString),
      };
    }

    // -------------------------------------------------------
    // LAST MONTH
    // -------------------------------------------------------

    case "last-month": {
      const start = new Date(Date.UTC(today.year, today.month - 1, 1));

      const end = new Date(Date.UTC(today.year, today.month, 0));

      const startString = formatBDDate(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate(),
      );

      const endString = formatBDDate(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate(),
      );

      return {
        start: getBDStartOfDay(startString),
        end: getBDEndOfDay(endString),
      };
    }

    // -------------------------------------------------------
    // THIS YEAR
    // -------------------------------------------------------

    case "year": {
      const startString = formatBDDate(today.year, 0, 1);

      const endString = formatBDDate(today.year, 11, 31);

      return {
        start: getBDStartOfDay(startString),
        end: getBDEndOfDay(endString),
      };
    }

    // -------------------------------------------------------
    // CUSTOM DATE RANGE
    // -------------------------------------------------------

    case "custom": {
      if (!customStartDate || !customEndDate) {
        return {
          error: "customStartDate and customEndDate are required",
        };
      }

      const start = getBDStartOfDay(customStartDate);
      const end = getBDEndOfDay(customEndDate);

      if (!start || !end) {
        return {
          error: "Invalid custom date range",
        };
      }

      if (start > end) {
        return {
          error: "Custom start date cannot be greater than end date",
        };
      }

      return {
        start,
        end,
      };
    }

    // -------------------------------------------------------
    // ALL TIME
    // -------------------------------------------------------

    case "all":
      return {
        start: null,
        end: null,
      };

    // -------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------

    default:
      return {
        start: getBDStartOfDay(todayString),
        end: getBDEndOfDay(todayString),
      };
  }
}

// =========================================================
// NUMBER HELPER
// =========================================================

function number(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

// =========================================================
// EXPENSE SCOPE EXPRESSION
// =========================================================

function expenseExpression() {
  return {
    $ifNull: [
      "$amount",
      {
        $ifNull: [
          "$rawExpense",
          {
            $ifNull: ["$expenseCost", 0],
          },
        ],
      },
    ],
  };
}

// =========================================================
// REVENUE / SALES EXPRESSION
// =========================================================

function revenueExpression() {
  return {
    $ifNull: ["$totalPrice", "$total"],
  };
}

// =========================================================
// PROFIT CALCULATION EXPRESSION
// =========================================================

function profitExpression() {
  return {
    $subtract: [
      {
        $ifNull: ["$totalPrice", "$total"],
      },
      {
        $add: [
          {
            $ifNull: ["$salesDiscount", 0],
          },
          {
            $ifNull: ["$salesRefund", 0],
          },
        ],
      },
    ],
  };
}

// =========================================================
// GET ROUTE - Profit & Loss Report
// =========================================================

export async function GET(request) {
  try {
    // =======================================================
    // 1. AUTHENTICATION
    // =======================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    // =======================================================
    // 2. DATABASE
    // =======================================================

    const client = await clientPromise;
    const db = client.db("products");

    const salesCollection = db.collection("sales");
    const expensesCollection = db.collection("expenses");

    // =======================================================
    // 3. QUERY PARAMETERS
    // =======================================================

    const { searchParams } = new URL(request.url);

    const dateFilter = searchParams.get("dateFilter") || "today";

    const sellerId =
      searchParams.get("sellerId") || searchParams.get("employeeId") || "all";

    const expenseScope =
      searchParams.get("expenseScope") || "all";

    const customStartDate = searchParams.get("customStartDate");

    const customEndDate = searchParams.get("customEndDate");

    // =======================================================
    // 4. DATE RANGE
    // =======================================================

    const dateRange = getDateRange(dateFilter, customStartDate, customEndDate);

    if (dateRange.error) {
      return NextResponse.json(
        {
          success: false,
          message: dateRange.error,
        },
        { status: 400 },
      );
    }

    // =======================================================
    // 5. BASE QUERIES
    // =======================================================

    const salesQuery = {};

    const expenseQuery = {};

    // Seller filter
    if (sellerId !== "all") {
      salesQuery.sellerId = sellerId;
    }

    // Expense scope filter
    if (expenseScope !== "all") {
      expenseQuery.expenseScope = expenseScope;
    }

    // Date filter
    if (dateRange.start && dateRange.end) {
      salesQuery.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };

      expenseQuery.expenseDate = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // =======================================================
    // 6. AGGREGATION - SUMMARY METRICS
    // =======================================================

    // Get sales summary
    const salesSummaryResult = await salesCollection
      .aggregate([
        {
          $match: salesQuery,
        },

        {
          $group: {
            _id: null,

            totalSalesRevenue: {
              $sum: revenueExpression(),
            },

            totalDirectCost: {
              $sum: {
                $ifNull: ["$directCost", 0],
              },
            },

            totalSalesDiscount: {
              $sum: {
                $ifNull: ["$salesDiscount", 0],
              },
            },

            totalSalesRefund: {
              $sum: {
                $ifNull: ["$salesRefund", 0],
              },
            },

            totalQuantity: {
              $sum: {
                $ifNull: ["$quantity", 0],
              },
            },

            transactionCount: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();

    const salesRaw = salesSummaryResult[0] || {};

    const totalSalesRevenue = number(salesRaw.totalSalesRevenue);
    const totalDirectCost = number(salesRaw.totalDirectCost);
    const totalSalesDiscount = number(salesRaw.totalSalesDiscount);
    const totalSalesRefund = number(salesRaw.totalSalesRefund);
    const netSalesRevenue = totalSalesRevenue - totalSalesDiscount - totalSalesRefund;
    const totalQuantity = number(salesRaw.totalQuantity);
    const transactionCount = number(salesRaw.transactionCount);

    // Get expenses summary
    const expensesSummaryResult = await expensesCollection
      .aggregate([
        {
          $match: expenseQuery,
        },

        {
          $group: {
            _id: null,

            totalExpenses: {
              $sum: expenseExpression(),
            },

            totalRawExpense: {
              $sum: {
                $ifNull: ["$rawExpense", 0],
              },
            },

            expenseCount: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();

    const expensesRaw = expensesSummaryResult[0] || {};

    const totalExpenses = number(expensesRaw.totalExpenses);
    const totalRawExpense = number(expensesRaw.totalRawExpense);
    const expenseCount = number(expensesRaw.expenseCount);

    // Calculate profit metrics
    const grossProfit = netSalesRevenue - totalDirectCost;
    const netProfitOrLoss = grossProfit - totalExpenses;

    // Get customer dues (outstanding) - this is NOT counted as profit/loss
    // but shown for reference
    const duesResult = await db.collection("dueCollections")
      .aggregate([
        {
          $match: {
            ...(dateRange.start && dateRange.end
              ? {
                  createdAt: {
                    $gte: dateRange.start,
                    $lte: dateRange.end,
                  },
                }
              : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalDue: {
              $sum: {
                $ifNull: ["$amount", 0],
              },
            },
            collectedDue: {
              $sum: {
                $ifNull: ["$collectedAmount", 0],
              },
            },
            dueCount: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();

    const duesRaw = duesResult[0] || {};

    const totalOutstandingDue = number(duesRaw.totalDue);
    const collectedDue = number(duesRaw.collectedDue);
    const dueCount = number(duesRaw.dueCount);

    // Get expense categories for filter
    const categories = await db
      .collection("expenseCategories")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Get recent sales transactions for the table
    const recentSales = await salesCollection
      .find(salesQuery)
      .project({
        invoiceNumber: 1,
        productName: 1,
        customerName: 1,
        totalPrice: 1,
        total: 1,
        directCost: 1,
        netProfit: 1,
        salesDiscount: 1,
        salesRefund: 1,
        createdAt: 1,
        sellerName: 1,
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get recent expenses for the table
    const recentExpenses = await expensesCollection
      .find(expenseQuery)
      .sort({ expenseDate: -1 })
      .limit(10)
      .toArray();

    // Get seller filter options
    const sellers = await salesCollection
      .aggregate([
        { $group: { _id: "$sellerName" } },
        { $project: { _id: 0, name: "$_id" } },
      ])
      .toArray();
    const sellerNames = sellers.map((s) => s.name || s._id).filter(Boolean);

    // Get product categories for filter
    const productCategories = await db
      .collection("productCategories")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        // Summary metrics
        totalSalesRevenue,
        totalDirectCost,
        netSalesRevenue,
        grossProfit,
        totalExpenses,
        netProfitOrLoss,

        // Detail metrics
        totalSalesDiscount,
        totalSalesRefund,
        totalQuantity,
        transactionCount,
        expenseCount,

        // Dues reference (NOT counted as profit)
        totalOutstandingDue,
        collectedDue,
        dueCount,

        // Filters
        categories,
        sellers,
        productCategories,

        // Date info
        dateFilter,
        sellerId: sellerId !== "all" ? sellerId : null,

        // Recent transactions
        recentSales: recentSales.map((s) => ({
          _id: s._id,
          date: s.createdAt
            ? new Date(s.createdAt).toLocaleDateString("en-BD", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          invoiceNumber: s.invoiceNumber || `SALE-${s._id.toString().slice(-6)}`,
          customer: s.customerName || "Walk-in",
          revenue: s.totalPrice || s.total || 0,
          directCost: s.directCost || 0,
          grossProfit: (s.totalPrice || s.total || 0) - (s.directCost || 0),
          netProfit: s.netProfit !== undefined ? s.netProfit : ((s.totalPrice || s.total || 0) - (s.directCost || 0)),
          seller: s.sellerName || "-",
        })),

        recentExpenses: recentExpenses.map((e) => ({
          _id: e._id,
          date: e.expenseDate
            ? new Date(e.expenseDate).toLocaleDateString("en-BD", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          expenseNumber: e.expenseNumber || `#${e._id.toString().slice(-6)}`,
          title: e.title || "Expense",
          category: e.categoryName || e.expenseScope || "General",
          scope: e.expenseScope || "all",
          amount: e.amount || e.rawExpense || 0,
        })),
      },
    });
  } catch (error) {
    console.error("GET PROFIT-LOSS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profit & loss report",
      },
      { status: 500 }
    );
  }
}