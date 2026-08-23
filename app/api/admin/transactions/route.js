import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    // =========================================================
    // 1. AUTHENTICATION
    // =========================================================

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

    // =========================================================
    // 2. DATABASE
    // =========================================================

    const client = await clientPromise;
    const db = client.db("products");

    const salesCollection = db.collection("sales");

    // =========================================================
    // 3. QUERY PARAMETERS
    // =========================================================

    const { searchParams } = new URL(request.url);

    const dateFilter = searchParams.get("dateFilter") || "today";

    const search = searchParams.get("search")?.trim() || "";

    const employeeId = searchParams.get("employeeId")?.trim() || "";

    const categoryId = searchParams.get("categoryId")?.trim() || "";

    const customStartDate = searchParams.get("startDate");

    const customEndDate = searchParams.get("endDate");

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      100,
    );

    const skip = (page - 1) * limit;

    // =========================================================
    // 4. DATE RANGE
    // =========================================================

    const now = new Date();

    let startDate;
    let endDate;

    switch (dateFilter) {
      // -------------------------------------------------------
      // TODAY
      // -------------------------------------------------------

      case "today": {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        break;
      }

      // -------------------------------------------------------
      // YESTERDAY
      // -------------------------------------------------------

      case "yesterday": {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        break;
      }

      // -------------------------------------------------------
      // THIS WEEK
      // Sunday → Today
      // -------------------------------------------------------

      case "week": {
        startDate = new Date(now);

        startDate.setDate(startDate.getDate() - startDate.getDay());

        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        break;
      }

      // -------------------------------------------------------
      // THIS MONTH
      // -------------------------------------------------------

      case "month": {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);

        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );

        break;
      }

      // -------------------------------------------------------
      // LAST MONTH
      // -------------------------------------------------------

      case "lastMonth": {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );

        break;
      }

      // -------------------------------------------------------
      // CUSTOM
      // -------------------------------------------------------

      case "custom": {
        if (!customStartDate || !customEndDate) {
          return NextResponse.json(
            {
              success: false,
              message: "Start date and end date are required for custom range",
            },
            { status: 400 },
          );
        }

        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);

        if (
          Number.isNaN(startDate.getTime()) ||
          Number.isNaN(endDate.getTime())
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid custom date range",
            },
            { status: 400 },
          );
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        break;
      }

      // -------------------------------------------------------
      // INVALID FILTER
      // -------------------------------------------------------

      default: {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid date filter",
          },
          { status: 400 },
        );
      }
    }

    // =========================================================
    // 5. VALIDATE DATE RANGE
    // =========================================================

    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date cannot be greater than end date",
        },
        { status: 400 },
      );
    }

    // =========================================================
    // 6. BUILD QUERY
    // =========================================================

    const query = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // =========================================================
    // 7. EMPLOYEE FILTER
    // =========================================================

    if (employeeId) {
      query.sellerId = employeeId;
    }

    // =========================================================
    // 8. CATEGORY FILTER
    // =========================================================

    if (categoryId) {
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

    // =========================================================
    // 9. SEARCH
    // =========================================================

    if (search) {
      query.$or = [
        {
          invoiceNumber: {
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
          sellerName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // =========================================================
    // 10. FETCH TRANSACTIONS + SUMMARY IN PARALLEL
    // =========================================================

    const [transactions, totalResults, summaryData] = await Promise.all([
      salesCollection
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

            paidAmount: 1,
            due: 1,

            paymentMethod: 1,
            note: 1,

            createdAt: 1,
          },
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .toArray(),

      salesCollection.countDocuments(query),

      salesCollection
        .aggregate([
          {
            $match: query,
          },

          {
            $group: {
              _id: null,

              totalRevenue: {
                $sum: {
                  $ifNull: ["$totalPrice", 0],
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

              totalExpense: {
                $sum: {
                  $ifNull: ["$totalExpense", 0],
                },
              },

              totalPaid: {
                $sum: {
                  $ifNull: ["$paidAmount", 0],
                },
              },

              totalDue: {
                $sum: {
                  $ifNull: ["$due", 0],
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
        .toArray(),
    ]);

    // =========================================================
    // 11. SUMMARY
    // =========================================================

    const summary = summaryData[0] || {
      totalRevenue: 0,
      totalProfit: 0,
      totalCommission: 0,
      totalExpense: 0,
      totalPaid: 0,
      totalDue: 0,
      totalQuantity: 0,
      transactionCount: 0,
    };

    // =========================================================
    // 12. SERIALIZE MONGODB DATA
    // =========================================================

    const formattedTransactions = transactions.map((transaction) => ({
      _id: transaction._id.toString(),

      invoiceNumber: transaction.invoiceNumber || "",

      sellerId: transaction.sellerId || "",

      sellerName: transaction.sellerName || "Unknown",

      customerName: transaction.customerName || "",

      customerPhone: transaction.customerPhone || "",

      productName: transaction.productName || "",

      categoryId: transaction.categoryId
        ? transaction.categoryId.toString()
        : "",

      categoryName: transaction.categoryName || "",

      quantity: Number(transaction.quantity) || 0,

      totalPrice: Number(transaction.totalPrice) || 0,

      total: Number(transaction.total) || 0,

      rawExpense:
        Number(transaction.rawExpense) || Number(transaction.expenseCost) || 0,

      totalExpense: Number(transaction.totalExpense) || 0,

      netProfit: Number(transaction.netProfit) || 0,

      commission: Number(transaction.commission) || 0,

      paidAmount: Number(transaction.paidAmount) || 0,

      due: Number(transaction.due) || 0,

      paymentMethod: transaction.paymentMethod || "",

      note: transaction.note || "",

      createdAt: transaction.createdAt,
    }));

    // =========================================================
    // 13. PAGINATION
    // =========================================================

    const totalPages = Math.ceil(totalResults / limit);

    // =========================================================
    // 14. RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        data: formattedTransactions,

        pagination: {
          totalResults,
          totalPages,
          currentPage: page,
          limit,

          hasNextPage: page < totalPages,

          hasPreviousPage: page > 1,
        },

        summary: {
          totalRevenue: Number(summary.totalRevenue) || 0,

          totalProfit: Number(summary.totalProfit) || 0,

          totalCommission: Number(summary.totalCommission) || 0,

          totalExpense: Number(summary.totalExpense) || 0,

          totalPaid: Number(summary.totalPaid) || 0,

          totalDue: Number(summary.totalDue) || 0,

          totalQuantity: Number(summary.totalQuantity) || 0,

          transactionCount: Number(summary.transactionCount) || 0,
        },

        filters: {
          dateFilter,
          startDate,
          endDate,
          search,
          employeeId,
          categoryId,
        },
      },
      {
        status: 200,
      },
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
      {
        status: 500,
      },
    );
  }
}
