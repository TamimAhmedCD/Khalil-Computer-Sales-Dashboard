import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    // =========================================================
    // 🔐 1. AUTHENTICATION
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
    // 🗄️ 2. DATABASE
    // =========================================================

    const client = await clientPromise;
    const db = client.db("products");

    const salesCollection = db.collection("sales");

    // =========================================================
    // 📅 3. DATE RANGES
    // =========================================================

    const now = new Date();

    // -------------------------
    // Today
    // -------------------------

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // -------------------------
    // Current Month
    // -------------------------

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    endOfMonth.setHours(23, 59, 59, 999);

    // =========================================================
    // 📊 4. BUSINESS SUMMARY
    // =========================================================

    const summaryResult = await salesCollection
      .aggregate([
        {
          $facet: {
            // -----------------------------------------------
            // TODAY
            // -----------------------------------------------

            today: [
              {
                $match: {
                  createdAt: {
                    $gte: startOfToday,
                    $lte: endOfToday,
                  },
                },
              },
              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: {
                      $ifNull: ["$totalPrice", 0],
                    },
                  },

                  profit: {
                    $sum: {
                      $ifNull: ["$netProfit", 0],
                    },
                  },

                  expense: {
                    $sum: {
                      $ifNull: ["$totalExpense", 0],
                    },
                  },

                  commission: {
                    $sum: {
                      $ifNull: ["$commission", 0],
                    },
                  },

                  transactions: {
                    $sum: 1,
                  },
                },
              },
            ],

            // -----------------------------------------------
            // MONTH
            // -----------------------------------------------

            month: [
              {
                $match: {
                  createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth,
                  },
                },
              },
              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: {
                      $ifNull: ["$totalPrice", 0],
                    },
                  },

                  profit: {
                    $sum: {
                      $ifNull: ["$netProfit", 0],
                    },
                  },

                  expense: {
                    $sum: {
                      $ifNull: ["$totalExpense", 0],
                    },
                  },

                  commission: {
                    $sum: {
                      $ifNull: ["$commission", 0],
                    },
                  },

                  transactions: {
                    $sum: 1,
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const summary = summaryResult[0] || {};

    const today = summary.today?.[0] || {};
    const month = summary.month?.[0] || {};

    // =========================================================
    // 👥 5. ACTIVE EMPLOYEES
    // =========================================================

    /*
      We count unique sellers from sales.

      If later you have an employees/users collection,
      we can replace this with a proper active employee count.
    */

    const employeeResult = await salesCollection
      .aggregate([
        {
          $group: {
            _id: "$sellerId",
          },
        },
        {
          $count: "total",
        },
      ])
      .toArray();

    const activeEmployees = employeeResult[0]?.total || 0;

    // =========================================================
    // 🧾 6. RECENT TRANSACTIONS
    // =========================================================

    const recentTransactions = await salesCollection
      .find(
        {},
        {
          projection: {
            _id: 1,
            invoiceNumber: 1,

            sellerId: 1,
            sellerName: 1,

            productName: 1,
            categoryName: 1,

            quantity: 1,

            totalPrice: 1,
            total: 1,

            rawExpense: 1,
            totalExpense: 1,

            netProfit: 1,
            commission: 1,

            paymentMethod: 1,
            paidAmount: 1,
            due: 1,

            createdAt: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // =========================================================
    // 👤 7. EMPLOYEE PERFORMANCE
    // =========================================================

    const employeePerformance = await salesCollection
      .aggregate([
        {
          $match: {
            sellerId: {
              $exists: true,
              $ne: null,
            },
          },
        },

        {
          $group: {
            _id: "$sellerId",

            employeeName: {
              $first: "$sellerName",
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", 0],
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

            transactions: {
              $sum: 1,
            },
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

    // =========================================================
    // 📈 8. REVENUE & PROFIT CHART
    // =========================================================

    const chartData = await salesCollection
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", 0],
              },
            },

            profit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
            },

            expense: {
              $sum: {
                $ifNull: ["$totalExpense", 0],
              },
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

    // =========================================================
    // 💸 9. EXPENSE ANALYSIS
    // =========================================================

    const expenseAnalysis = await salesCollection
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          },
        },

        {
          $group: {
            _id: "$categoryName",

            expense: {
              $sum: {
                $ifNull: ["$totalExpense", 0],
              },
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", 0],
              },
            },
          },
        },

        {
          $sort: {
            expense: -1,
          },
        },

        {
          $limit: 10,
        },
      ])
      .toArray();

    // =========================================================
    // 🔄 10. FORMAT RECENT TRANSACTIONS
    // =========================================================

    const formattedTransactions = recentTransactions.map((sale) => ({
      _id: sale._id.toString(),

      invoiceNumber: sale.invoiceNumber || "",

      sellerId: sale.sellerId || "",

      sellerName: sale.sellerName || "Unknown",

      productName: sale.productName || "",

      categoryName: sale.categoryName || "",

      quantity: Number(sale.quantity) || 0,

      revenue: Number(sale.totalPrice) || 0,

      total: Number(sale.total) || 0,

      expense: Number(sale.totalExpense) || 0,

      profit: Number(sale.netProfit) || 0,

      commission: Number(sale.commission) || 0,

      paymentMethod: sale.paymentMethod || "",

      paidAmount: Number(sale.paidAmount) || 0,

      due: Number(sale.due) || 0,

      createdAt: sale.createdAt,
    }));

    // =========================================================
    // 👤 11. FORMAT EMPLOYEE PERFORMANCE
    // =========================================================

    const formattedEmployees = employeePerformance.map((employee, index) => ({
      rank: index + 1,

      employeeId: employee._id || "",

      employeeName: employee.employeeName || "Unknown",

      revenue: Number(employee.revenue) || 0,

      profit: Number(employee.profit) || 0,

      commission: Number(employee.commission) || 0,

      transactions: Number(employee.transactions) || 0,
    }));

    // =========================================================
    // 📊 12. FORMAT CHART DATA
    // =========================================================

    const formattedChartData = chartData.map((item) => ({
      date: item._id,

      revenue: Number(item.revenue) || 0,

      profit: Number(item.profit) || 0,

      expense: Number(item.expense) || 0,
    }));

    // =========================================================
    // 💸 13. FORMAT EXPENSE DATA
    // =========================================================

    const formattedExpenseData = expenseAnalysis.map((item) => ({
      category: item._id || "Uncategorized",

      expense: Number(item.expense) || 0,

      revenue: Number(item.revenue) || 0,
    }));

    // =========================================================
    // 🎯 14. RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          // -----------------------------------------------
          // TODAY
          // -----------------------------------------------

          today: {
            revenue: Number(today.revenue) || 0,

            profit: Number(today.profit) || 0,

            expense: Number(today.expense) || 0,

            commission: Number(today.commission) || 0,

            transactions: Number(today.transactions) || 0,
          },

          // -----------------------------------------------
          // MONTH
          // -----------------------------------------------

          month: {
            revenue: Number(month.revenue) || 0,

            profit: Number(month.profit) || 0,

            expense: Number(month.expense) || 0,

            commission: Number(month.commission) || 0,

            transactions: Number(month.transactions) || 0,
          },

          // -----------------------------------------------
          // EMPLOYEES
          // -----------------------------------------------

          activeEmployees,

          // -----------------------------------------------
          // CHART
          // -----------------------------------------------

          chartData: formattedChartData,

          // -----------------------------------------------
          // RECENT TRANSACTIONS
          // -----------------------------------------------

          recentTransactions: formattedTransactions,

          // -----------------------------------------------
          // EMPLOYEE PERFORMANCE
          // -----------------------------------------------

          employeePerformance: formattedEmployees,

          // -----------------------------------------------
          // EXPENSE ANALYSIS
          // -----------------------------------------------

          expenseAnalysis: formattedExpenseData,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Dashboard API Error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Failed to load admin dashboard",

        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
