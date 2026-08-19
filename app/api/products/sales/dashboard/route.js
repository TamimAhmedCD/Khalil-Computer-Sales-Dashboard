import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    // =========================================================
    // 🔐 1. Authentication
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

    const userId = session.user.id;

    // =========================================================
    // 🗄️ 2. Database
    // =========================================================

    const client = await clientPromise;
    const db = client.db("products");

    const salesCollection = db.collection("sales");

    // =========================================================
    // 📅 3. Date Range
    // =========================================================

    const now = new Date();

    // Today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Current Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    endOfMonth.setHours(23, 59, 59, 999);

    // =========================================================
    // 🎯 4. Today's Target
    // =========================================================

    // আপাতত static target
    // পরে database থেকে employee target আনতে পারবে
    const todaysTarget = 2000;

    // =========================================================
    // 📊 5. Today's Sales + Summary
    // =========================================================

    const todaysSales = await salesCollection
      .find(
        {
          sellerId: userId,
          createdAt: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        },
        {
          projection: {
            _id: 1,
            invoiceNumber: 1,
            productName: 1,
            categoryName: 1,
            totalPrice: 1,
            total: 1,
            netProfit: 1,
            commission: 1,
            quantity: 1,
            createdAt: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // =========================================================
    // 📈 6. Today's Summary
    // =========================================================

    const todaySummary = await salesCollection
      .aggregate([
        {
          $match: {
            sellerId: userId,
            createdAt: {
              $gte: startOfToday,
              $lte: endOfToday,
            },
          },
        },
        {
          $group: {
            _id: null,

            todaysSalesAmount: {
              $sum: {
                $ifNull: ["$totalPrice", 0],
              },
            },

            todaysProfit: {
              $sum: {
                $ifNull: ["$netProfit", 0],
              },
            },

            myCommission: {
              $sum: {
                $ifNull: ["$commission", 0],
              },
            },

            salesCount: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();

    // =========================================================
    // 📅 7. Monthly Sales
    // =========================================================

    const monthlySummary = await salesCollection
      .aggregate([
        {
          $match: {
            sellerId: userId,
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          },
        },
        {
          $group: {
            _id: null,

            monthlySales: {
              $sum: {
                $ifNull: ["$totalPrice", 0],
              },
            },
          },
        },
      ])
      .toArray();

    // =========================================================
    // 🧮 8. Summary Values
    // =========================================================

    const todayData = todaySummary[0] || {};

    const monthlyData = monthlySummary[0] || {};

    const todaysSalesAmount = Number(todayData.todaysSalesAmount) || 0;

    const todaysProfit = Number(todayData.todaysProfit) || 0;

    const myCommission = Number(todayData.myCommission) || 0;

    const monthlySales = Number(monthlyData.monthlySales) || 0;

    const salesCount = Number(todayData.salesCount) || 0;

    // =========================================================
    // 🔄 9. Serialize MongoDB Data
    // =========================================================

    const formattedSales = todaysSales.map((sale) => ({
      _id: sale._id.toString(),

      invoiceNumber: sale.invoiceNumber || "",

      productName: sale.productName || "",

      categoryName: sale.categoryName || "",

      totalPrice: Number(sale.totalPrice) || 0,

      total: Number(sale.total) || 0,

      netProfit: Number(sale.netProfit) || 0,

      commission: Number(sale.commission) || 0,

      quantity: Number(sale.quantity) || 0,

      createdAt: sale.createdAt,
    }));

    // =========================================================
    // ✅ 10. Response
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          todaysSalesAmount,
          todaysProfit,
          myCommission,
          monthlySales,
          todaysTarget,

          salesCount,

          todaysSales: formattedSales,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Dashboard API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
