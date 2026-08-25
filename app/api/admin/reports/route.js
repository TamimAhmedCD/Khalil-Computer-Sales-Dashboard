import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// CONFIG
// =========================================================

const BD_OFFSET = 6 * 60 * 60 * 1000;

// =========================================================
// DATE HELPERS
// =========================================================

function getBDStartOfDay(dateString) {
  const date = dateString
    ? new Date(`${dateString}T00:00:00+06:00`)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getBDEndOfDay(dateString) {
  const date = dateString
    ? new Date(`${dateString}T23:59:59.999+06:00`)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getTodayBD() {
  const now = new Date();

  const bdDate = new Date(now.getTime() + BD_OFFSET);

  return {
    year: bdDate.getUTCFullYear(),
    month: bdDate.getUTCMonth(),
    day: bdDate.getUTCDate(),
  };
}

function formatBDDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

// =========================================================
// NUMBER HELPER
// =========================================================

function safeNumber(value) {
  return Number(value) || 0;
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

    const dateFilter = searchParams.get("dateFilter") || "month";

    const customStartDate = searchParams.get("customStartDate");

    const customEndDate = searchParams.get("customEndDate");

    // =======================================================
    // 4. DATE RANGE
    // =======================================================

    let startDate = null;
    let endDate = null;

    const today = getTodayBD();

    const todayString = formatBDDate(today.year, today.month, today.day);

    switch (dateFilter) {
      // -----------------------------------------------------
      // TODAY
      // -----------------------------------------------------

      case "today": {
        startDate = getBDStartOfDay(todayString);

        endDate = getBDEndOfDay(todayString);

        break;
      }

      // -----------------------------------------------------
      // YESTERDAY
      // -----------------------------------------------------

      case "yesterday": {
        const yesterday = new Date(
          Date.UTC(today.year, today.month, today.day - 1),
        );

        const yesterdayString = formatBDDate(
          yesterday.getUTCFullYear(),
          yesterday.getUTCMonth(),
          yesterday.getUTCDate(),
        );

        startDate = getBDStartOfDay(yesterdayString);

        endDate = getBDEndOfDay(yesterdayString);

        break;
      }

      // -----------------------------------------------------
      // THIS WEEK
      // Saturday -> Friday
      // -----------------------------------------------------

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

        startDate = getBDStartOfDay(startString);

        endDate = getBDEndOfDay(endString);

        break;
      }

      // -----------------------------------------------------
      // THIS MONTH
      // -----------------------------------------------------

      case "month": {
        const monthStartString = formatBDDate(today.year, today.month, 1);

        const monthEnd = new Date(Date.UTC(today.year, today.month + 1, 0));

        const monthEndString = formatBDDate(
          monthEnd.getUTCFullYear(),
          monthEnd.getUTCMonth(),
          monthEnd.getUTCDate(),
        );

        startDate = getBDStartOfDay(monthStartString);

        endDate = getBDEndOfDay(monthEndString);

        break;
      }

      // -----------------------------------------------------
      // LAST MONTH
      // -----------------------------------------------------

      case "last-month": {
        const lastMonthStart = new Date(
          Date.UTC(today.year, today.month - 1, 1),
        );

        const lastMonthEnd = new Date(Date.UTC(today.year, today.month, 0));

        const startString = formatBDDate(
          lastMonthStart.getUTCFullYear(),
          lastMonthStart.getUTCMonth(),
          lastMonthStart.getUTCDate(),
        );

        const endString = formatBDDate(
          lastMonthEnd.getUTCFullYear(),
          lastMonthEnd.getUTCMonth(),
          lastMonthEnd.getUTCDate(),
        );

        startDate = getBDStartOfDay(startString);

        endDate = getBDEndOfDay(endString);

        break;
      }

      // -----------------------------------------------------
      // CUSTOM
      // -----------------------------------------------------

      case "custom": {
        if (!customStartDate || !customEndDate) {
          return NextResponse.json(
            {
              success: false,
              message: "customStartDate and customEndDate are required",
            },
            { status: 400 },
          );
        }

        startDate = getBDStartOfDay(customStartDate);

        endDate = getBDEndOfDay(customEndDate);

        if (!startDate || !endDate) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid custom date range",
            },
            { status: 400 },
          );
        }

        if (startDate > endDate) {
          return NextResponse.json(
            {
              success: false,
              message: "Custom start date cannot be greater than end date",
            },
            { status: 400 },
          );
        }

        break;
      }

      // -----------------------------------------------------
      // ALL
      // -----------------------------------------------------

      case "all": {
        break;
      }

      // -----------------------------------------------------
      // DEFAULT
      // -----------------------------------------------------

      default: {
        startDate = getBDStartOfDay(todayString);

        endDate = getBDEndOfDay(todayString);
      }
    }

    // =======================================================
    // 5. BASE QUERY
    // =======================================================

    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // =======================================================
    // 6. OVERALL SUMMARY
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
              $sum: {
                $ifNull: ["$totalPrice", "$total"],
              },
            },

            totalExpense: {
              $sum: {
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
              },
            },

            totalProfit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
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

    const summaryData = summaryResult[0] || {};

    const totalRevenue = safeNumber(summaryData.totalRevenue);

    const totalExpense = safeNumber(summaryData.totalExpense);

    const totalProfit = safeNumber(summaryData.totalProfit);

    const totalCommission = safeNumber(summaryData.totalCommission);

    const totalDue = safeNumber(summaryData.totalDue);

    const totalPaid = safeNumber(summaryData.totalPaid);

    const totalQuantity = safeNumber(summaryData.totalQuantity);

    const transactionCount = safeNumber(summaryData.transactionCount);

    // =======================================================
    // 7. CALCULATED METRICS
    // =======================================================

    const averageTransactionValue =
      transactionCount > 0 ? totalRevenue / transactionCount : 0;

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const averageProfitPerTransaction =
      transactionCount > 0 ? totalProfit / transactionCount : 0;

    const averageCommissionPerTransaction =
      transactionCount > 0 ? totalCommission / transactionCount : 0;

    // =======================================================
    // 8. PAYMENT METHOD BREAKDOWN
    // =======================================================

    const paymentBreakdown = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: {
              $ifNull: ["$paymentMethod", "Unknown"],
            },

            transactionCount: {
              $sum: 1,
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", "$total"],
              },
            },

            paidAmount: {
              $sum: {
                $ifNull: ["$paidAmount", 0],
              },
            },

            due: {
              $sum: {
                $ifNull: ["$due", 0],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            paymentMethod: "$_id",

            transactionCount: 1,

            revenue: 1,

            paidAmount: 1,

            due: 1,
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },
      ])
      .toArray();

    // =======================================================
    // 9. CATEGORY PERFORMANCE
    // =======================================================

    const categoryPerformance = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: {
              id: "$categoryId",
              name: "$categoryName",
            },

            transactionCount: {
              $sum: 1,
            },

            quantity: {
              $sum: {
                $ifNull: ["$quantity", 0],
              },
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", "$total"],
              },
            },

            expense: {
              $sum: {
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
              },
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

            categoryId: {
              $cond: [
                {
                  $ne: ["$_id.id", null],
                },
                {
                  $toString: "$_id.id",
                },
                "",
              ],
            },

            category: {
              $ifNull: ["$_id.name", "Unknown Category"],
            },

            transactionCount: 1,

            quantity: 1,

            revenue: 1,

            expense: 1,

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

    // =======================================================
    // 10. SELLER / EMPLOYEE PERFORMANCE
    // =======================================================
    //
    // IMPORTANT:
    // Owner/Admin sales are NOT separated.
    //
    // Every seller in the sales collection is included.
    //
    // =======================================================

    const sellerPerformance = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: {
              id: "$sellerId",
              name: "$sellerName",
            },

            transactionCount: {
              $sum: 1,
            },

            quantity: {
              $sum: {
                $ifNull: ["$quantity", 0],
              },
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", "$total"],
              },
            },

            expense: {
              $sum: {
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
              },
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

            due: {
              $sum: {
                $ifNull: ["$due", 0],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            sellerId: {
              $cond: [
                {
                  $ne: ["$_id.id", null],
                },
                {
                  $toString: "$_id.id",
                },
                "",
              ],
            },

            sellerName: {
              $ifNull: ["$_id.name", "Unknown Seller"],
            },

            transactionCount: 1,

            quantity: 1,

            revenue: 1,

            expense: 1,

            profit: 1,

            commission: 1,

            due: 1,
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },
      ])
      .toArray();

    // =======================================================
    // 11. DAILY SALES TREND
    // =======================================================

    const dailySalesTrend = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $project: {
            createdAt: 1,

            revenue: {
              $ifNull: ["$totalPrice", "$total"],
            },

            expense: {
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
            },

            profit: {
              $ifNull: ["$netProfit", 0],
            },

            commission: {
              $ifNull: ["$commission", 0],
            },

            quantity: {
              $ifNull: ["$quantity", 0],
            },
          },
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
              $sum: "$revenue",
            },

            expense: {
              $sum: "$expense",
            },

            profit: {
              $sum: "$profit",
            },

            commission: {
              $sum: "$commission",
            },

            quantity: {
              $sum: "$quantity",
            },

            transactionCount: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            date: "$_id",

            revenue: 1,

            expense: 1,

            profit: 1,

            commission: 1,

            quantity: 1,

            transactionCount: 1,
          },
        },

        {
          $sort: {
            date: 1,
          },
        },
      ])
      .toArray();

    // =======================================================
    // 12. TOP PRODUCTS
    // =======================================================

    const topProducts = await salesCollection
      .aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: {
              name: "$productName",
              category: "$categoryName",
            },

            transactionCount: {
              $sum: 1,
            },

            quantity: {
              $sum: {
                $ifNull: ["$quantity", 0],
              },
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", "$total"],
              },
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

            productName: {
              $ifNull: ["$_id.name", "Unknown Product"],
            },

            category: {
              $ifNull: ["$_id.category", "Unknown Category"],
            },

            transactionCount: 1,

            quantity: 1,

            revenue: 1,

            profit: 1,
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

    // =======================================================
    // 13. RECENT TRANSACTIONS
    // =======================================================

    const recentTransactions = await salesCollection
      .find(query, {
        projection: {
          _id: 1,
          invoiceNumber: 1,
          sellerId: 1,
          sellerName: 1,
          customerName: 1,
          productName: 1,
          categoryName: 1,
          quantity: 1,
          totalPrice: 1,
          total: 1,
          netProfit: 1,
          commission: 1,
          paymentMethod: 1,
          paidAmount: 1,
          due: 1,
          createdAt: 1,
        },
      })
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .toArray();

    // =======================================================
    // 14. SERIALIZE RECENT TRANSACTIONS
    // =======================================================

    const formattedRecentTransactions = recentTransactions.map((item) => ({
      id: item._id.toString(),

      invoiceNumber: item.invoiceNumber || "",

      sellerId: item.sellerId || "",

      sellerName: item.sellerName || "Unknown Seller",

      customerName: item.customerName || "",

      productName: item.productName || "",

      categoryName: item.categoryName || "",

      quantity: safeNumber(item.quantity),

      revenue: safeNumber(item.totalPrice ?? item.total),

      profit: safeNumber(item.netProfit),

      commission: safeNumber(item.commission),

      paymentMethod: item.paymentMethod || "",

      paidAmount: safeNumber(item.paidAmount),

      due: safeNumber(item.due),

      createdAt: item.createdAt,
    }));

    // =======================================================
    // 15. FORMAT AGGREGATION DATA
    // =======================================================

    const formattedPaymentBreakdown = paymentBreakdown.map((item) => ({
      paymentMethod: item.paymentMethod || "Unknown",

      transactionCount: safeNumber(item.transactionCount),

      revenue: safeNumber(item.revenue),

      paidAmount: safeNumber(item.paidAmount),

      due: safeNumber(item.due),
    }));

    const formattedCategoryPerformance = categoryPerformance.map((item) => ({
      categoryId: item.categoryId || "",

      category: item.category || "Unknown Category",

      transactionCount: safeNumber(item.transactionCount),

      quantity: safeNumber(item.quantity),

      revenue: safeNumber(item.revenue),

      expense: safeNumber(item.expense),

      profit: safeNumber(item.profit),

      commission: safeNumber(item.commission),
    }));

    const formattedSellerPerformance = sellerPerformance.map((item) => ({
      sellerId: item.sellerId || "",

      sellerName: item.sellerName || "Unknown Seller",

      transactionCount: safeNumber(item.transactionCount),

      quantity: safeNumber(item.quantity),

      revenue: safeNumber(item.revenue),

      expense: safeNumber(item.expense),

      profit: safeNumber(item.profit),

      commission: safeNumber(item.commission),

      due: safeNumber(item.due),
    }));

    const formattedDailySalesTrend = dailySalesTrend.map((item) => ({
      date: item.date,

      revenue: safeNumber(item.revenue),

      expense: safeNumber(item.expense),

      profit: safeNumber(item.profit),

      commission: safeNumber(item.commission),

      quantity: safeNumber(item.quantity),

      transactionCount: safeNumber(item.transactionCount),
    }));

    const formattedTopProducts = topProducts.map((item) => ({
      productName: item.productName || "Unknown Product",

      category: item.category || "Unknown Category",

      transactionCount: safeNumber(item.transactionCount),

      quantity: safeNumber(item.quantity),

      revenue: safeNumber(item.revenue),

      profit: safeNumber(item.profit),
    }));

    // =======================================================
    // 16. RESPONSE
    // =======================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          dateFilter,

          dateRange: {
            start: startDate,
            end: endDate,
          },

          summary: {
            totalRevenue,

            totalExpense,

            totalProfit,

            totalCommission,

            totalDue,

            totalPaid,

            totalQuantity,

            transactionCount,

            averageTransactionValue,

            averageProfitPerTransaction,

            averageCommissionPerTransaction,

            profitMargin: Number(profitMargin.toFixed(2)),
          },

          paymentBreakdown: formattedPaymentBreakdown,

          categoryPerformance: formattedCategoryPerformance,

          sellerPerformance: formattedSellerPerformance,

          dailySalesTrend: formattedDailySalesTrend,

          topProducts: formattedTopProducts,

          recentTransactions: formattedRecentTransactions,
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

        message: "Failed to load admin report",

        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      {
        status: 500,
      },
    );
  }
}
