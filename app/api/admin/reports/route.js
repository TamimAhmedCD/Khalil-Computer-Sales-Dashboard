import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// CONFIG
// =========================================================

const BD_OFFSET = 6 * 60 * 60 * 1000;

// =========================================================
// DATE HELPERS
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
    // THIS WEEK
    // Saturday -> Friday
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
    // CUSTOM
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
    // ALL
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
// EXPENSE EXPRESSION
// =========================================================

function expenseExpression() {
  return {
    $ifNull: [
      "$totalExpense",
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
// REVENUE EXPRESSION
// =========================================================

function revenueExpression() {
  return {
    $ifNull: ["$totalPrice", "$total"],
  };
}

// =========================================================
// GET
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

    // =======================================================
    // 3. QUERY PARAMETERS
    // =======================================================

    const { searchParams } = new URL(request.url);

    const dateFilter = searchParams.get("dateFilter") || "today";

    const sellerId =
      searchParams.get("sellerId") || searchParams.get("employeeId") || "all";

    const categoryId = searchParams.get("categoryId") || "all";

    const paymentMethod = searchParams.get("paymentMethod") || "all";

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
    // 5. BASE QUERY
    // =======================================================

    const query = {};

    // =======================================================
    // 6. SELLER FILTER
    // =======================================================

    if (sellerId !== "all") {
      query.sellerId = sellerId;
    }

    // =======================================================
    // 7. CATEGORY FILTER
    // =======================================================

    if (categoryId !== "all") {
      if (!ObjectId.isValid(categoryId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid category ID",
          },
          { status: 400 },
        );
      }

      query.categoryId = new ObjectId(categoryId);
    }

    // =======================================================
    // 8. PAYMENT FILTER
    // =======================================================

    if (paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    // =======================================================
    // 9. DATE QUERY
    // =======================================================

    if (dateRange.start && dateRange.end) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // =======================================================
    // 10. SUMMARY
    // =======================================================

    const summaryResult = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: revenueExpression(),
            },

            totalProfit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
            },

            totalExpense: {
              $sum: expenseExpression(),
            },

            totalCommission: {
              $sum: {
                $ifNull: ["$commission", 0],
              },
            },

            totalDue: {
              $sum: {
                $ifNull: ["$due", 0],
              },
            },

            totalPaid: {
              $sum: {
                $ifNull: ["$paidAmount", 0],
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

    const summaryRaw = summaryResult[0] || {};

    const summary = {
      totalRevenue: number(summaryRaw.totalRevenue),
      totalProfit: number(summaryRaw.totalProfit),
      totalExpense: number(summaryRaw.totalExpense),
      totalCommission: number(summaryRaw.totalCommission),
      totalDue: number(summaryRaw.totalDue),
      totalPaid: number(summaryRaw.totalPaid),
      totalQuantity: number(summaryRaw.totalQuantity),
      transactionCount: number(summaryRaw.transactionCount),
    };

    // =======================================================
    // 11. PROFIT MARGIN
    // =======================================================

    const profitMargin =
      summary.totalRevenue > 0
        ? (summary.totalProfit / summary.totalRevenue) * 100
        : 0;

    // =======================================================
    // 12. SELLER PERFORMANCE
    // =======================================================

    const sellerPerformanceRaw = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: "$sellerId",

            name: {
              $first: "$sellerName",
            },

            transactions: {
              $sum: 1,
            },

            revenue: {
              $sum: revenueExpression(),
            },

            profit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
            },

            commission: {
              $sum: {
                $ifNull: ["$commission", 0],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            sellerId: "$_id",

            name: {
              $ifNull: ["$name", "Unknown Seller"],
            },

            transactions: 1,
            revenue: 1,
            profit: 1,
            commission: 1,
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },
      ])
      .toArray();

    const sellerPerformance = sellerPerformanceRaw.map((seller) => ({
      sellerId: seller.sellerId || "",
      name: seller.name || "Unknown Seller",
      transactions: number(seller.transactions),
      revenue: number(seller.revenue),
      profit: number(seller.profit),
      commission: number(seller.commission),
    }));

    // =======================================================
    // 13. CATEGORY PERFORMANCE
    // =======================================================

    const categoryPerformanceRaw = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: "$categoryId",

            name: {
              $first: "$categoryName",
            },

            transactions: {
              $sum: 1,
            },

            quantity: {
              $sum: {
                $ifNull: ["$quantity", 0],
              },
            },

            revenue: {
              $sum: revenueExpression(),
            },

            expense: {
              $sum: expenseExpression(),
            },

            profit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            categoryId: "$_id",

            name: {
              $ifNull: ["$name", "Unknown Category"],
            },

            transactions: 1,
            quantity: 1,
            revenue: 1,
            expense: 1,
            profit: 1,
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },
      ])
      .toArray();

    const categoryPerformance = categoryPerformanceRaw.map((category) => ({
      categoryId: category.categoryId ? category.categoryId.toString() : "",

      name: category.name || "Unknown Category",

      transactions: number(category.transactions),

      quantity: number(category.quantity),

      revenue: number(category.revenue),

      expense: number(category.expense),

      profit: number(category.profit),
    }));

    // =======================================================
    // 14. PAYMENT METHOD BREAKDOWN
    // =======================================================

    const paymentRaw = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: {
              $ifNull: ["$paymentMethod", "Unknown"],
            },

            amount: {
              $sum: {
                $ifNull: ["$paidAmount", 0],
              },
            },

            revenue: {
              $sum: revenueExpression(),
            },

            transactions: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,
            name: "$_id",
            amount: 1,
            revenue: 1,
            transactions: 1,
          },
        },

        {
          $sort: {
            amount: -1,
          },
        },
      ])
      .toArray();

    const totalPaymentAmount = paymentRaw.reduce(
      (sum, item) => sum + number(item.amount),
      0,
    );

    const paymentMethods = paymentRaw.map((item) => ({
      name: item.name || "Unknown",

      amount: number(item.amount),

      revenue: number(item.revenue),

      transactions: number(item.transactions),

      percentage:
        totalPaymentAmount > 0
          ? Number(
              ((number(item.amount) / totalPaymentAmount) * 100).toFixed(1),
            )
          : 0,
    }));

    // =======================================================
    // 15. REVENUE / PROFIT TREND
    // =======================================================

    const trendRaw = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Dhaka",
              },
            },

            revenue: {
              $sum: revenueExpression(),
            },

            profit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
            },

            expense: {
              $sum: expenseExpression(),
            },

            transactions: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .toArray();

    const revenueTrend = trendRaw.map((item) => ({
      date: item._id,

      label: item._id,

      revenue: number(item.revenue),

      profit: number(item.profit),

      expense: number(item.expense),

      transactions: number(item.transactions),
    }));

    // =======================================================
    // 16. TOP PRODUCTS
    // =======================================================

    const topProductsRaw = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: "$productName",

            quantity: {
              $sum: {
                $ifNull: ["$quantity", 0],
              },
            },

            revenue: {
              $sum: revenueExpression(),
            },

            profit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
            },

            transactions: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            name: {
              $ifNull: ["$_id", "Unknown Product"],
            },

            quantity: 1,
            revenue: 1,
            profit: 1,
            transactions: 1,
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },

        {
          $limit: 10,
        },
      ])
      .toArray();

    const topProducts = topProductsRaw.map((item) => ({
      name: item.name || "Unknown Product",

      quantity: number(item.quantity),

      revenue: number(item.revenue),

      profit: number(item.profit),

      transactions: number(item.transactions),
    }));

    // =======================================================
    // 17. OUTSTANDING DUES
    // =======================================================

    const outstandingDuesRaw = await salesCollection
      .find({
        ...query,

        due: {
          $gt: 0,
        },
      })
      .sort({
        due: -1,
        createdAt: -1,
      })
      .limit(10)
      .project({
        _id: 1,
        invoiceNumber: 1,
        customerName: 1,
        sellerName: 1,
        totalPrice: 1,
        total: 1,
        paidAmount: 1,
        due: 1,
        createdAt: 1,
      })
      .toArray();

    const outstandingDues = outstandingDuesRaw.map((item) => ({
      id: item._id.toString(),

      invoice: item.invoiceNumber || "",

      customer: item.customerName || "",

      seller: item.sellerName || "Unknown Seller",

      total: number(item.totalPrice ?? item.total),

      paid: number(item.paidAmount),

      due: number(item.due),

      date: item.createdAt,
    }));

    // =======================================================
    // 18. RECENT TRANSACTIONS
    // =======================================================

    const recentRaw = await salesCollection
      .find(query)
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .project({
        _id: 1,
        invoiceNumber: 1,
        productName: 1,
        sellerName: 1,
        totalPrice: 1,
        total: 1,
        createdAt: 1,
      })
      .toArray();

    const recentTransactions = recentRaw.map((item) => ({
      id: item._id.toString(),

      invoice: item.invoiceNumber || "",

      product: item.productName || "",

      seller: item.sellerName || "Unknown Seller",

      amount: number(item.totalPrice ?? item.total),

      time: item.createdAt,

      date: item.createdAt,
    }));

    // =======================================================
    // 19. SELLER OPTIONS
    // =======================================================

    const sellerOptionsRaw = await salesCollection
      .aggregate([
        {
          $match: {
            sellerId: {
              $nin: [null, ""],
            },
          },
        },

        {
          $group: {
            _id: "$sellerId",

            name: {
              $first: "$sellerName",
            },
          },
        },

        {
          $project: {
            _id: 0,

            id: "$_id",

            name: {
              $ifNull: ["$name", "Unknown Seller"],
            },
          },
        },

        {
          $sort: {
            name: 1,
          },
        },
      ])
      .toArray();

    const sellers = sellerOptionsRaw.map((item) => ({
      id: item.id || "",
      name: item.name || "Unknown Seller",
    }));

    // =======================================================
    // 20. CATEGORY OPTIONS
    // =======================================================

    const categoryOptionsRaw = await salesCollection
      .aggregate([
        {
          $match: {
            categoryId: {
              $exists: true,
              $ne: null,
            },
          },
        },

        {
          $group: {
            _id: "$categoryId",

            name: {
              $first: "$categoryName",
            },
          },
        },

        {
          $project: {
            _id: 0,

            id: "$_id",

            name: {
              $ifNull: ["$name", "Unknown Category"],
            },
          },
        },

        {
          $sort: {
            name: 1,
          },
        },
      ])
      .toArray();

    const categories = categoryOptionsRaw.map((item) => ({
      id: item.id ? item.id.toString() : "",

      name: item.name || "Unknown Category",
    }));

    // =======================================================
    // 21. PAYMENT OPTIONS
    // =======================================================

    const paymentOptionsRaw = await salesCollection.distinct("paymentMethod");

    const paymentOptions = paymentOptionsRaw.filter(Boolean).sort();

    // =======================================================
    // 22. LEADING CATEGORY
    // =======================================================

    const leadingCategory =
      categoryPerformance.length > 0 ? categoryPerformance[0] : null;

    // =======================================================
    // 23. TOP SELLER
    // =======================================================

    const topSeller =
      sellerPerformance.length > 0 ? sellerPerformance[0] : null;

    // =======================================================
    // 24. RESPONSE
    // =======================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          summary,

          profitMargin,

          revenueTrend,

          sellerPerformance,

          categoryPerformance,

          paymentMethods,

          outstandingDues,

          topProducts,

          recentTransactions,

          insights: {
            topSeller,

            leadingCategory,
          },
        },

        filters: {
          sellers,

          employees: sellers,

          categories,

          paymentMethods: paymentOptions,
        },

        meta: {
          dateFilter,

          sellerId,

          categoryId,

          paymentMethod,

          customStartDate: customStartDate || null,

          customEndDate: customEndDate || null,

          startDate: dateRange.start || null,

          endDate: dateRange.end || null,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("ADMIN REPORT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Failed to generate admin report",

        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      {
        status: 500,
      },
    );
  }
}
