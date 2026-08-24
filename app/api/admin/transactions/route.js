import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// HELPERS
// =========================================================

const BD_OFFSET = 6 * 60 * 60 * 1000;

// Bangladesh date -> UTC start
function getBDStartOfDay(dateString) {
  const date = dateString
    ? new Date(`${dateString}T00:00:00+06:00`)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// Bangladesh date -> UTC end
function getBDEndOfDay(dateString) {
  const date = dateString
    ? new Date(`${dateString}T23:59:59.999+06:00`)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// Get today's date in Bangladesh
function getTodayBD() {
  const now = new Date();

  const bdDate = new Date(now.getTime() + BD_OFFSET);

  return {
    year: bdDate.getUTCFullYear(),
    month: bdDate.getUTCMonth(),
    day: bdDate.getUTCDate(),
  };
}

// Create YYYY-MM-DD
function formatBDDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

// =========================================================
// GET
// =========================================================

export async function GET(request) {
  try {
    // =======================================================
    // 1. AUTH
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

    const search = searchParams.get("search")?.trim() || "";

    const dateFilter = searchParams.get("dateFilter") || "today";

    const employeeId = searchParams.get("employeeId") || "all";

    const categoryId = searchParams.get("categoryId") || "all";

    const paymentMethod = searchParams.get("paymentMethod") || "all";

    const customStartDate = searchParams.get("customStartDate");

    const customEndDate = searchParams.get("customEndDate");

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      100,
    );

    const skip = (page - 1) * limit;

    // =======================================================
    // 4. BASE QUERY
    // =======================================================

    const query = {};

    // =======================================================
    // 5. EMPLOYEE FILTER
    // =======================================================

    if (employeeId !== "all") {
      query.sellerId = employeeId;
    }

    // =======================================================
    // 6. CATEGORY FILTER
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
    // 7. PAYMENT FILTER
    // =======================================================

    if (paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    // =======================================================
    // 8. SEARCH
    // =======================================================

    if (search) {
      query.$or = [
        {
          invoiceNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          customerPhone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          productName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          sellerName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // =======================================================
    // 9. DATE FILTER
    //
    // Frontend values:
    //
    // today
    // yesterday
    // week
    // month
    // last-month
    // custom
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
      // Bangladesh week
      // -----------------------------------------------------

      case "week": {
        const current = new Date(Date.UTC(today.year, today.month, today.day));

        const dayOfWeek = current.getUTCDay();

        // JS:
        // Sunday = 0
        // Monday = 1
        // ...
        // Friday = 5
        // Saturday = 6

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

      case "all":
        break;

      default:
        startDate = getBDStartOfDay(todayString);
        endDate = getBDEndOfDay(todayString);
    }

    // =======================================================
    // 10. ADD DATE QUERY
    // =======================================================

    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // =======================================================
    // 11. TOTAL COUNT
    // =======================================================

    const totalResults = await salesCollection.countDocuments(query);

    // =======================================================
    // 12. TRANSACTIONS
    // =======================================================

    const transactions = await salesCollection
      .find(query, {
        projection: {
          _id: 1,
          invoiceNumber: 1,

          sellerId: 1,
          sellerName: 1,

          customerName: 1,
          customerPhone: 1,

          productName: 1,

          categoryId: 1,
          categoryName: 1,

          quantity: 1,

          totalPrice: 1,
          total: 1,

          rawExpense: 1,
          expenseCost: 1,
          totalExpense: 1,

          netProfit: 1,
          commission: 1,

          paymentMethod: 1,
          paidAmount: 1,
          due: 1,

          note: 1,

          createdAt: 1,
        },
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    // =======================================================
    // 13. SUMMARY
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

    const summary = summaryResult[0] || {
      totalRevenue: 0,
      totalProfit: 0,
      totalCommission: 0,
      totalDue: 0,
      totalExpense: 0,
      totalQuantity: 0,
      transactionCount: 0,
    };

    // =======================================================
    // 14. DYNAMIC EMPLOYEE OPTIONS
    // =======================================================

    const employeeOptions = await salesCollection
      .aggregate([
        {
          $match: {},
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
          $match: {
            _id: {
              $nin: [null, ""],
            },
          },
        },

        {
          $project: {
            _id: 0,
            id: "$_id",
            name: {
              $ifNull: ["$name", "Unknown Employee"],
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

    // =======================================================
    // 15. DYNAMIC CATEGORY OPTIONS
    // =======================================================

    const categoryOptions = await salesCollection
      .aggregate([
        {
          $match: {
            categoryId: {
              $exists: true,
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

    // =======================================================
    // 16. PAYMENT METHODS
    // =======================================================

    const paymentOptions = await salesCollection.distinct("paymentMethod");

    // =======================================================
    // 17. SERIALIZE DATA
    // =======================================================

    const formattedTransactions = transactions.map((item) => ({
      id: item._id.toString(),

      invoiceNumber: item.invoiceNumber || "",

      employeeId: item.sellerId || "",

      employee: item.sellerName || "Unknown Employee",

      customer: item.customerName || "",

      phone: item.customerPhone || "",

      product: item.productName || "",

      categoryId: item.categoryId ? item.categoryId.toString() : "",

      category: item.categoryName || "",

      quantity: Number(item.quantity) || 0,

      revenue: Number(item.totalPrice ?? item.total) || 0,

      expense:
        Number(item.totalExpense ?? item.rawExpense ?? item.expenseCost ?? 0) ||
        0,

      profit: Number(item.netProfit) || 0,

      commission: Number(item.commission) || 0,

      paymentMethod: item.paymentMethod || "",

      paidAmount: Number(item.paidAmount) || 0,

      due: Number(item.due) || 0,

      date: item.createdAt,

      note: item.note || "",
    }));

    // =======================================================
    // 18. RESPONSE
    // =======================================================

    return NextResponse.json(
      {
        success: true,

        data: formattedTransactions,

        summary: {
          totalRevenue: Number(summary.totalRevenue) || 0,

          totalProfit: Number(summary.totalProfit) || 0,

          totalExpense: Number(summary.totalExpense) || 0,

          totalCommission: Number(summary.totalCommission) || 0,

          totalDue: Number(summary.totalDue) || 0,

          totalQuantity: Number(summary.totalQuantity) || 0,

          transactionCount: Number(summary.transactionCount) || 0,
        },

        filters: {
          employees: employeeOptions.map((item) => ({
            id: item.id,
            name: item.name,
          })),

          categories: categoryOptions.map((item) => ({
            id: item.id?.toString(),
            name: item.name,
          })),

          paymentMethods: paymentOptions.filter(Boolean).sort(),
        },

        pagination: {
          currentPage: page,

          limit,

          totalResults,

          totalPages: Math.max(1, Math.ceil(totalResults / limit)),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("ADMIN TRANSACTIONS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Failed to load transactions",

        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
